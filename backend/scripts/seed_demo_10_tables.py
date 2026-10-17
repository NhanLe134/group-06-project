"""Script nạp dữ liệu Demo cho 10 bàn bao phủ toàn bộ 8 trạng thái và thông báo của Waiter Tablet (US-04, US-11).

8 Trạng thái:
1. Trống (Empty) - Bàn 10 (Khu B)
2. Đang chọn món - Bàn 05 (Khu A)
3. Chờ bếp nấu - Bàn 03 (Khu A)
4. Bếp đang nấu - Bàn 04 (Khu A)
5. Cần lên món (Đồ ăn) - Bàn 02 (Khu A)
6. Đã đủ món - Bàn 06 (Khu B)
7. Trễ món > 5p (SLA Warning) - Bàn 01 (Khu A)
8. Cần dọn (Cleaning) - Bàn 07 (Khu B)

Kèm các trạng thái thông báo:
- Cần lên món (Đồ uống) - Bàn 08 (Khu B) -> Kích hoạt notif "CẦN LẤY NƯỚC"
- Tiện đường (Gom món) - Bàn 08 & 09 (Khu B) -> Cùng có "Trà Đào Cam Sả" hoàn tất -> Kích hoạt widget "GOM MÓN"
"""

import asyncio
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

# Tự động nạp thư mục backend vào sys.path để chạy từ bất cứ đâu
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import delete, select

from app.db import async_session_factory, engine
from app.models.menu import ThucDon
from app.models.order import Ban, ChiTietPhieu, PhieuBan


async def seed_demo():
    async with async_session_factory() as db:
        print("🚀 Đang chuẩn bị dữ liệu demo cho 10 bàn...")

        # 1. Đảm bảo đủ 10 bàn
        ten_bans = [f"Bàn {i:02d}" for i in range(1, 11)]
        existing_bans = (await db.execute(select(Ban))).scalars().all()
        ban_by_name = {b.tenban: b for b in existing_bans}

        for i, name in enumerate(ten_bans, 1):
            if name not in ban_by_name:
                new_ban = Ban(ban_id=f"BAN{i:03d}", tenban=name, trangthai=1)
                db.add(new_ban)
                ban_by_name[name] = new_ban
        await db.flush()

        # 2. Xóa các phiếu bàn CHƯA thanh toán (hoadon_id is None) của 10 bàn để làm sạch trạng thái
        ban_ids = [b.ban_id for b in ban_by_name.values()]
        active_pbs = (
            await db.execute(
                select(PhieuBan).where(PhieuBan.ban_id.in_(ban_ids), PhieuBan.hoadon_id.is_(None))
            )
        ).scalars().all()

        active_pb_ids = [pb.phieuban_id for pb in active_pbs]
        if active_pb_ids:
            await db.execute(delete(ChiTietPhieu).where(ChiTietPhieu.phieuban_id.in_(active_pb_ids)))
            await db.execute(delete(PhieuBan).where(PhieuBan.phieuban_id.in_(active_pb_ids)))
            await db.flush()
            print(f"🧹 Đã dọn {len(active_pb_ids)} phiếu bàn cũ chưa thanh toán.")

        # 3. Lấy menu
        menu_items = (await db.execute(select(ThucDon))).scalars().all()
        menu_by_name = {m.tenmon: m for m in menu_items}

        now = datetime.now(UTC).replace(tzinfo=None)

        # CẤU HÌNH CHI TIẾT 10 BÀN
        # (Tên bàn, trangthai bàn, phút gọi trước đây, danh sách món [(tên món, số lượng, trạng thái món, ghi chú)])
        demo_config = [
            # 1. TRỄ MÓN > 5P (Bàn 01 - Khu A): Có món da_xong quá 5p -> SLA Alert đỏ rực
            (
                "Bàn 01",
                2,
                15,
                [
                    ("Gà Rán Giòn Cay", 2, "da_xong", "Khách giục - trễ món"),
                    ("Cơm chiên dương châu", 1, "dang_nau", None),
                ],
            ),
            # 2. CẦN LÊN MÓN - ĐỒ ĂN (Bàn 02 - Khu A): Món ăn vừa xong -> Notif "CẦN BƯNG MÓN"
            (
                "Bàn 02",
                2,
                3,
                [
                    ("Bò sốt tiêu đen", 1, "da_xong", None),
                    ("Phở bò", 1, "dang_nau", None),
                ],
            ),
            # 3. CHỜ BẾP NẤU (Bàn 03 - Khu A): Toàn bộ món đang chờ nấu
            (
                "Bàn 03",
                2,
                3,
                [
                    ("Bò xào cần", 1, "cho_nau", None),
                    ("Khoai tây chiên", 1, "cho_nau", None),
                ],
            ),
            # 4. BẾP ĐANG NẤU (Bàn 04 - Khu A): Có món đang nấu, chưa có món nào xong
            (
                "Bàn 04",
                2,
                6,
                [
                    ("Mì Ý Sốt Bò Bằm", 1, "dang_nau", None),
                    ("Lẩu Thái Tomyum Hải Sản", 1, "cho_nau", "Ít cay"),
                ],
            ),
            # 5. ĐANG CHỌN MÓN (Bàn 05 - Khu A): Khách đã vào bàn nhưng chưa gửi món
            (
                "Bàn 05",
                2,
                2,
                [],
            ),
            # 6. ĐÃ ĐỦ MÓN (Bàn 06 - Khu B): 100% món đã được phục vụ
            (
                "Bàn 06",
                2,
                20,
                [
                    ("Bún chả Hà Nội", 2, "da_phuc_vu", None),
                    ("Bánh Flan Caramel", 2, "da_phuc_vu", None),
                ],
            ),
            # 7. CẦN DỌN (Bàn 07 - Khu B): Khách đã thanh toán, trangthai=3 -> Notif "DỌN DẸP BÀN"
            (
                "Bàn 07",
                3,
                None,
                None,
            ),
            # 8. CẦN LÊN MÓN - ĐỒ UỐNG (Bàn 08 - Khu B): Món nước vừa xong -> Notif "CẦN LẤY NƯỚC"
            (
                "Bàn 08",
                2,
                4,
                [
                    ("Sprite", 1, "da_xong", "Ướp lạnh"),
                    ("Sữa chua Hy Lạp", 1, "da_phuc_vu", None),
                ],
            ),
            # 9. GOM MÓN TIỆN ĐƯỜNG (Bàn 09 - Khu B): Cùng gọi "Sprite" với Bàn 08
            # -> Kích hoạt widget "GOM MÓN"
            (
                "Bàn 09",
                2,
                3,
                [
                    ("Sprite", 2, "da_xong", None),
                    ("Coca", 1, "da_phuc_vu", None),
                ],
            ),
            # 10. TRỐNG (Bàn 10 - Khu B): Bàn sẵn sàng đón khách
            (
                "Bàn 10",
                1,
                None,
                None,
            ),
        ]

        for tenban, trangthai_ban, minutes_ago, items in demo_config:
            ban = ban_by_name[tenban]
            ban.trangthai = trangthai_ban

            if items is not None:
                gio = now - timedelta(minutes=minutes_ago or 5)
                phieu = PhieuBan(ban_id=ban.ban_id, giogoimon=gio, hoadon_id=None)
                db.add(phieu)
                await db.flush()

                for tenmon, qty, tt_mon, ghichu in items:
                    mon = menu_by_name.get(tenmon)
                    if not mon:
                        for m in menu_items:
                            if tenmon.lower() in m.tenmon.lower():
                                mon = m
                                break
                    if mon:
                        db.add(
                            ChiTietPhieu(
                                phieuban_id=phieu.phieuban_id,
                                mon_id=mon.id,
                                soluong=qty,
                                trangthai=tt_mon,
                                ghichu=ghichu,
                            )
                        )
                    else:
                        print(f"⚠️ Không tìm thấy món: {tenmon}")

        await db.commit()
        print("✅ Nạp dữ liệu demo 10 bàn thành công!")
        print("=" * 60)
        print("KHU A:")
        print("  Bàn 01: 🚨 Trễ món > 5p (SLA Warning)")
        print("  Bàn 02: 🔔 Cần lên món (Đồ ăn)")
        print("  Bàn 03: ⏳ Chờ bếp nấu")
        print("  Bàn 04: 🍳 Bếp đang nấu")
        print("  Bàn 05: 📖 Đang chọn món")
        print("KHU B:")
        print("  Bàn 06: ✅ Đã đủ món (100% phục vụ)")
        print("  Bàn 07: 🧹 Cần dọn (Chờ dọn dẹp)")
        print("  Bàn 08: 🥤 Cần lên món (Sprite)")
        print("  Bàn 09: ⚡ Tiện đường (Gom món Sprite cùng Bàn 08)")
        print("  Bàn 10: ✨ Trống (Sẵn sàng)")
        print("=" * 60)


async def main():
    sys.stdout.reconfigure(encoding="utf-8")
    await seed_demo()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
