"""API SePay Webhook gạch nợ tự động (ADR-N15).

Cấu hình SePay Webhook:
- URL Webhook: https://your-backend-domain.com/sepay/webhook
- Phương thức: POST (application/json)
- SePay trả payload biến động số dư ngân hàng -> Backend tự động gạch nợ và phát WebSocket PAYMENT_SUCCESS.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.errors import ApiError
from app.models.order import Ban
from app.services import orders as service
from app.ws.manager import CASHIER_CHANNEL, manager

router = APIRouter(prefix="/sepay", tags=["sepay"])
Db = Annotated[AsyncSession, Depends(get_db)]


class SepayWebhookIn(BaseModel):
    id: int | None = None
    gateway: str | None = None
    transactionDate: str | None = None
    accountNumber: str | None = None
    code: str | None = None
    content: str | None = None
    transferType: str | None = None
    transferAmount: int = 0
    accumulated: int | None = None
    subAccount: str | None = None
    referenceCode: str | None = None
    description: str | None = None


async def _find_table_by_sepay_content(
    db: AsyncSession, content: str | None, amount: int
) -> Ban | None:
    """Tìm bàn theo nội dung chuyển khoản (VD: 'DH_BAN06' -> Bàn 06) hoặc số tiền."""
    bans = (await db.execute(select(Ban))).scalars().all()
    normalized_content = (content or "").upper().replace(" ", "").replace("_", "")

    # 1. Tìm theo mã tên bàn trùng trong nội dung
    for ban in bans:
        clean_name = ban.tenban.upper().replace(" ", "").replace("_", "")
        if clean_name in normalized_content:
            return ban

    # 2. Nếu không khớp chuỗi tên bàn, tìm bàn có tổng tiền hóa đơn trùng với số tiền chuyển vào
    matching_bans: list[Ban] = []
    for ban in bans:
        phieu_list = await service.get_open_phieuban_list(db, ban.ban_id)
        if phieu_list:
            items = await service._bill_items(db, phieu_list)
            if sum(i.thanhtien for i in items) == amount:
                matching_bans.append(ban)

    return matching_bans[0] if len(matching_bans) == 1 else None


@router.post("/webhook")
async def sepay_webhook(
    data: SepayWebhookIn,
    db: Db,
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, Any]:
    """Webhook nhận từ SePay khi có biến động số dư ngân hàng.

    Tự động đối soát -> gạch nợ hóa đơn -> phát WebSocket PAYMENT_SUCCESS.
    """
    # Nếu có cấu hình sepay_webhook_api_key, kiểm tra header
    if settings.sepay_webhook_api_key:
        expected = f"Apikey {settings.sepay_webhook_api_key}"
        if authorization != expected and authorization != settings.sepay_webhook_api_key:
            raise ApiError(401, "UNAUTHORIZED_WEBHOOK", "Mã API Key SePay Webhook không hợp lệ.")

    # Chỉ xử lý tiền vào (transferAmount > 0)
    if data.transferAmount <= 0:
        return {"success": True, "message": "Ignored non-incoming transaction"}

    ban = await _find_table_by_sepay_content(db, data.content, data.transferAmount)
    if ban is None:
        return {
            "success": True,
            "message": f"Không tìm thấy bàn khớp với nội dung '{data.content}' hoặc số tiền {data.transferAmount}đ",
        }

    # Đóng bàn tự động & sinh hóa đơn
    try:
        result = await service.close_table(db, ban.ban_id)
    except ApiError:
        return {"success": True, "message": f"Bàn '{ban.tenban}' đã thanh toán hoặc chưa có phiếu."}

    # Bắn WebSocket thông báo realtime tới Thu ngân & Khách hàng
    await manager.publish(
        CASHIER_CHANNEL,
        "PAYMENT_SUCCESS",
        {
            "ban_id": ban.ban_id,
            "table_name": ban.tenban,
            "tongtien": result["tongtien"],
            "hoadon_id": result["hoadon_id"],
            "gateway": data.gateway or "SePay",
        },
    )

    return {
        "success": True,
        "message": f"Thanh toán thành công cho {ban.tenban}!",
        "table_name": ban.tenban,
        "tongtien": result["tongtien"],
    }


@router.post("/demo-sim/{ban_id}")
async def sepay_demo_simulation(ban_id: str, db: Db) -> dict[str, Any]:
    """Endpoint mô phỏng thanh toán SePay thành công (dành cho test/demo local)."""
    ban = await db.get(Ban, ban_id)
    if ban is None:
        raise ApiError(404, "TABLE_NOT_FOUND", "Không tìm thấy bàn.")

    phieu_list = await service.get_open_phieuban_list(db, ban.ban_id)
    if not phieu_list:
        raise ApiError(409, "NO_OPEN_BILL", f"Bàn '{ban.tenban}' chưa có phiếu để thanh toán.")

    items = await service._bill_items(db, phieu_list)
    amount = sum(i.thanhtien for i in items)

    # Giả lập payload Webhook từ SePay
    sim_data = SepayWebhookIn(
        gateway="MBBank",
        content=f"DH_{ban.tenban.replace(' ', '')}",
        transferAmount=amount,
    )
    return await sepay_webhook(sim_data, db)
