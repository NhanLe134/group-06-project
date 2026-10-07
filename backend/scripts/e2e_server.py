"""Backend riêng cho test E2E (Playwright US-03 / US-08) — SQLite tạm, có dữ liệu mẫu.

KHÔNG dùng Supabase dùng chung: mỗi lần chạy tạo 1 database mới trong thư mục tạm, tắt là mất.
Chạy (từ thư mục backend):  uv run python -m scripts.e2e_server  [cổng, mặc định 8765]
Playwright tự bật server này: testing/test_scripts/playwright.us03.config.ts.
"""

import os
import sys
import tempfile
from decimal import Decimal
from itertools import count

# Phải đặt trước khi import app.* — engine đọc DATABASE_URL lúc import
_DB_PATH = os.path.join(tempfile.mkdtemp(prefix="g06-e2e-"), "e2e.db")
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_DB_PATH}"
os.environ["AUTO_CREATE_SCHEMA"] = "false"

import uvicorn  # noqa: E402
from sqlalchemy import create_engine, event  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.db import Base  # noqa: E402
from app.main import app  # noqa: E402
from app.models import CongThuc, NguoiDung, ThucDon, TonKho  # noqa: E402

# Trên Supabase mã (MON001, HD-...) do DB sinh (migration 007); SQLite không có → giả lập ở đây
_PREFIX = {
    "nguoidung": "NV", "thucdon": "MON", "tonkho": "NL", "congthuc": "CT", "phienban": "PB",
    "hoadon": "HD", "chitietmon": "CTM", "loghuymon": "HM", "loggiongnoi": "GN",
    "phieukiemke": "PKK", "chitietkiemke": "CTKK",
}
_counter = count(1)


@event.listens_for(Base, "before_insert", propagate=True)
def _fake_id(mapper, connection, target) -> None:
    if getattr(target, "id", None) is None:
        target.id = f"{_PREFIX[mapper.local_table.name]}{next(_counter):03d}"


def seed(engine) -> None:
    """Dữ liệu mẫu dùng trong testing/test_cases/test-cases-US03.md và US08.md."""
    with Session(engine) as s:
        bo = TonKho(tennguyenlieu="Thịt bò", donvitinh="kg", tonhethong=Decimal("10"))
        pho = ThucDon(tenmon="Phở bò", phanloai="Món chính", giaban=65000)
        pho.congthuc.append(CongThuc(nguyenlieu=bo, dinhluong=Decimal("0.2")))  # 50 phần
        s.add_all([
            pho,
            ThucDon(tenmon="Salad cá ngừ", phanloai="Khai vị", giaban=90000),
            ThucDon(tenmon="Gỏi cuốn", phanloai="Khai vị", giaban=45000),
            ThucDon(tenmon="Bánh flan", phanloai="Tráng miệng", giaban=25000),
            ThucDon(tenmon="Chè đậu đen", phanloai="Tráng miệng", giaban=25000),
            ThucDon(tenmon="Coca", phanloai="Đồ uống", giaban=15000, soluongton=24),
            ThucDon(tenmon="Trà đá", phanloai="Đồ uống", giaban=5000, soluongton=50),
            NguoiDung(hoten="Quản lý E2E", vaitro="QUAN_LY", mapin="1234"),
            NguoiDung(hoten="Thu ngân E2E", vaitro="THU_NGAN", mapin="9999"),
        ])
        s.commit()


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows (cp1252)
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    engine = create_engine(f"sqlite:///{_DB_PATH}")
    Base.metadata.create_all(engine)
    seed(engine)
    print(f"E2E backend: http://127.0.0.1:{port}  (DB tạm: {_DB_PATH})", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


if __name__ == "__main__":
    main()
