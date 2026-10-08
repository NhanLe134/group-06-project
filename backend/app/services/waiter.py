from datetime import UTC, datetime

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.errors import ApiError
from app.models import Ban, ChiTietPhieu, NguoiDung, PhieuBan, ThucDon
from app.schemas.waiter import WaiterItemOut, WaiterTableOut


def format_price(price: int) -> str:
    return f"{price:,}đ".replace(",", ".")


def format_time_elapsed(start_time: datetime) -> str:
    if not start_time:
        return ""
    # Ensure start_time has timezone info for correct calculation
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=UTC)
    now = datetime.now(UTC)
    diff = now - start_time
    minutes = int(diff.total_seconds() / 60)
    if minutes == 0:
        return "Vừa xong"
    return f"{minutes} phút"


async def get_all_tables(db: AsyncSession) -> list[WaiterTableOut]:
    # Lấy tất cả bàn
    result = await db.execute(select(Ban).order_by(Ban.tenban))
    bans = result.scalars().all()

    table_outs = []
    for ban in bans:
        # Xác định trạng thái của bàn
        status = "empty"
        if ban.trangthai == 1:
            status = "empty"
        elif ban.trangthai == 2:
            status = "occupied"
        elif ban.trangthai == 3:
            status = "cleaning"

        time_str = ""
        items_out = []

        # Nếu bàn đang có khách, tìm phiếu bàn chưa thanh toán (hoadon_id is NULL)
        if status == "occupied":
            pb_result = await db.execute(
                select(PhieuBan).where(
                    and_(PhieuBan.ban_id == ban.ban_id, PhieuBan.hoadon_id.is_(None))
                )
            )
            phieu_bans = pb_result.scalars().all()

            if phieu_bans:
                # Lấy giờ gọi món của phiếu đầu tiên
                time_str = format_time_elapsed(phieu_bans[0].giogoimon)

                # Lấy tất cả chi tiết phiếu của các phiếu này
                pb_ids = [pb.phieuban_id for pb in phieu_bans]
                ct_result = await db.execute(
                    select(ChiTietPhieu, ThucDon)
                    .join(ThucDon, ChiTietPhieu.mon_id == ThucDon.id)
                    .where(ChiTietPhieu.phieuban_id.in_(pb_ids))
                )

                for ct, mon in ct_result.all():
                    # Map trạng thái DB sang Frontend
                    db_status = ct.trangthai
                    fe_status = "pending"
                    status_text = "Chờ nấu"

                    if db_status == "cho_nau":
                        fe_status = "pending"
                        status_text = "Chờ nấu"
                    elif db_status == "dang_nau":
                        fe_status = "cooking"
                        status_text = "Đang nấu"
                    elif db_status == "da_xong":
                        fe_status = "ready"
                        status_text = "Chưa phục vụ"  # Bếp báo xong, chờ Waiter bưng
                    elif db_status == "da_phuc_vu":
                        fe_status = "served"
                        status_text = "Đã phục vụ"
                    elif db_status == "da_huy":
                        continue  # Bỏ qua món đã hủy

                    is_drink = True if "uống" in (mon.phanloai or "").lower() else False

                    items_out.append(
                        WaiterItemOut(
                            id=ct.chitietphieu_id,
                            name=mon.tenmon,
                            qty=ct.soluong,
                            status=fe_status,
                            statusText=status_text,
                            price=format_price(mon.giaban * ct.soluong),
                            isDrink=is_drink,
                        )
                    )

        # Cập nhật theo US-11: Map Bàn vật lý thành Khu vực
        zone = None
        if ban.tenban in ["Bàn 01", "Bàn 02", "Bàn 03"]:
            zone = "Khu A"
        elif ban.tenban in ["Bàn 04", "Bàn 05", "Bàn 06"]:
            zone = "Khu B"

        table_outs.append(
            WaiterTableOut(
                id=ban.ban_id,
                name=ban.tenban,
                status=status,
                pax=2,  # DB không lưu số khách nữa, hardcode tạm
                capacity=4,  # Hardcode tạm sức chứa
                time=time_str,
                zone=zone,
                items=items_out,
            )
        )

    return table_outs


async def mark_item_served(db: AsyncSession, item_id: str) -> None:
    ct = (
        (await db.execute(select(ChiTietPhieu).where(ChiTietPhieu.chitietphieu_id == item_id)))
        .scalars()
        .first()
    )
    if not ct:
        raise ApiError(404, "NOT_FOUND", "Không tìm thấy món ăn này")
    if ct.trangthai != "da_xong":
        raise ApiError(400, "INVALID_STATE", "Món này chưa nấu xong hoặc đã phục vụ")

    ct.trangthai = "da_phuc_vu"
    await db.commit()


async def clean_table(db: AsyncSession, ban_id: str) -> None:
    ban = (await db.execute(select(Ban).where(Ban.ban_id == ban_id))).scalars().first()
    if not ban:
        raise ApiError(404, "NOT_FOUND", "Không tìm thấy bàn này")
    if ban.trangthai != 3:
        raise ApiError(400, "INVALID_STATE", "Bàn này chưa thể dọn dẹp")

    ban.trangthai = 1  # Trở về trạng thái sẵn sàng
    await db.commit()


async def void_item(db: AsyncSession, item_id: str, new_quantity: int = 0) -> None:
    ct = (
        (await db.execute(select(ChiTietPhieu).where(ChiTietPhieu.chitietphieu_id == item_id)))
        .scalars()
        .first()
    )
    if not ct:
        raise ApiError(404, "NOT_FOUND", "Không tìm thấy món ăn này")

    if ct.trangthai == "da_phuc_vu":
        raise ApiError(400, "INVALID_STATE", "Tuyệt đối không được sửa món đã phục vụ")

    if new_quantity <= 0:
        await db.delete(ct)
    else:
        ct.soluong = new_quantity

    await db.commit()
