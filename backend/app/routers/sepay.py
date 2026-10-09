"""API SePay Webhook gạch nợ tự động (ADR-N15).

Cấu hình SePay Webhook:
- URL Webhook: https://your-backend-domain.com/sepay/webhook
- Phương thức: POST (application/json)
- SePay trả payload biến động số dư ngân hàng
  -> Backend tự động gạch nợ và phát WebSocket PAYMENT_SUCCESS.
"""

import unicodedata
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.errors import ApiError
from app.models import HoaDon
from app.models.order import Ban
from app.services import orders as service
from app.services.orders import HOADON_CHUA_TT
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


def _fold(s: str) -> str:
    """Chuẩn hóa so khớp: bỏ dấu tiếng Việt, in hoa, bỏ khoảng trắng/gạch dưới.

    'Bàn 06' và 'Ban 06'/'DH_BAN06' phải khớp được với nhau — trước đây
    so khớp có dấu ('BÀN06' vs 'BAN06') nên luôn rớt xuống lượt so tiền.
    """
    nfkd = unicodedata.normalize("NFKD", s)
    return (
        "".join(c for c in nfkd if not unicodedata.combining(c))
        .upper()
        .replace(" ", "")
        .replace("_", "")
    )


async def _find_table_by_sepay_content(
    db: AsyncSession, content: str | None, amount: int
) -> Ban | None:
    """Tìm bàn theo nội dung chuyển khoản (VD: 'Ban 06 - HD-...' -> Bàn 06) hoặc số tiền."""
    bans = (await db.execute(select(Ban))).scalars().all()
    normalized_content = _fold(content or "")

    # 0. ƯU TIÊN: khớp hoadon_id trong nội dung (QR chứa 'Ban 06 - HD-...') —
    # chính xác từng hóa đơn, không nhầm khi 2 bàn trùng tổng tiền (ADR-N16)
    drafts = (
        await db.execute(select(HoaDon).where(HoaDon.trangthai == HOADON_CHUA_TT))
    ).scalars().all()
    for hd in drafts:
        if hd.hoadon_id and hd.hoadon_id.upper() in normalized_content:
            ban = await db.get(Ban, hd.ban_id)
            if ban is not None:
                return ban

    # 1. Tìm theo mã tên bàn trùng trong nội dung (không phân biệt dấu)
    for ban in bans:
        if _fold(ban.tenban) in normalized_content:
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
            "message": (
                f"Không tìm thấy bàn khớp với nội dung '{data.content}' "
                f"hoặc số tiền {data.transferAmount}đ"
            ),
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
    """Endpoint mô phỏng thanh toán SePay thành công (dành cho test/demo local).

    CHỈ bật khi DEMO_MODE=true (như POST /kds/demo/orders) — nếu không, bất kỳ ai
    gọi được endpoint này cũng có thể đóng bàn trên production.
    """
    if not settings.demo_mode:
        raise ApiError(404, "NOT_FOUND", "Chức năng demo đang tắt.")

    ban = await db.get(Ban, ban_id)
    if ban is None:
        raise ApiError(404, "TABLE_NOT_FOUND", "Không tìm thấy bàn.")

    phieu_list = await service.get_open_phieuban_list(db, ban.ban_id)
    if not phieu_list:
        raise ApiError(409, "NO_OPEN_BILL", f"Bàn '{ban.tenban}' chưa có phiếu để thanh toán.")

    items = await service._bill_items(db, phieu_list)
    amount = sum(i.thanhtien for i in items)

    # Giả lập payload Webhook từ SePay (cùng format nội dung với QR thật);
    # tự ký header Apikey vì đây là lời gọi nội bộ, không đi qua SePay
    draft = await service.get_draft_hoadon(db, ban.ban_id)
    sim_data = SepayWebhookIn(
        gateway="MBBank",
        content=service.build_transfer_content(
            ban.tenban, draft.hoadon_id if draft else None
        ),
        transferAmount=amount,
    )
    auth = f"Apikey {settings.sepay_webhook_api_key}" if settings.sepay_webhook_api_key else None
    return await sepay_webhook(sim_data, db, authorization=auth)
