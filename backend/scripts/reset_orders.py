import asyncio
import sys

from sqlalchemy import delete

from app.db import async_session_factory, engine
from app.models import PhienBan

async def clear_orders() -> None:
    async with async_session_factory() as db:
        # Xóa toàn bộ PhienBan (ca phục vụ)
        # Nhờ khóa ngoại ON DELETE CASCADE, hệ thống sẽ tự động dọn dẹp luôn 
        # bảng HoaDon, ChiTietMon, và LogHuyMon liên quan.
        # Các bảng dữ liệu cứng như ThucDon, NguoiDung vẫn được giữ nguyên.
        result = await db.execute(delete(PhienBan))
        await db.commit()
        print(f"✅ Đã dọn dẹp sạch sẽ {result.rowcount} phiên bàn (Kèm theo hóa đơn, món bếp). Menu thực đơn vẫn an toàn!")

async def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    await clear_orders()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
