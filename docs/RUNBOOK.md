# Runbook — Smart Ordering (Group 06)

## Yêu cầu

| Công cụ | Phiên bản |
|---|---|
| Python | ≥ 3.13 |
| uv | mới nhất — `pip install uv` hoặc xem [docs.astral.sh/uv](https://docs.astral.sh/uv/getting-started/installation/) |
| Node.js | 24 LTS |
| Docker | tùy chọn — chỉ cần nếu muốn chạy PostgreSQL offline |

> **Chuỗi kết nối Supabase** (`DATABASE_URL`, `SUPABASE_SECRET_KEY`): xin trưởng nhóm qua tin nhắn riêng — **không đưa lên Git hoặc chat chung**.

---

## 1. Cấu hình biến môi trường backend

```bash
cp backend/.env.example backend/.env
```

Mở `backend/.env`, điền:

- **`DATABASE_URL`** — Supabase Dashboard → Connect → Session pooler → URI, thay `[YOUR-PASSWORD]` bằng mật khẩu DB của nhóm.
- **`SUPABASE_SECRET_KEY`** — xin trưởng nhóm.

File `backend/.env` đã nằm trong `.gitignore` — **không commit, không gửi lên chat**.

### (Tùy chọn) Chạy offline bằng Docker

```bash
docker compose up -d db
```

Để `DATABASE_URL` trống (dùng mặc định `localhost:5432`) và đặt `AUTO_CREATE_SCHEMA=true` trong `backend/.env` — backend sẽ tự tạo bảng và seed món mẫu khi khởi động.

> ⚠️ **Không bật `AUTO_CREATE_SCHEMA=true`** khi trỏ vào Supabase dùng chung.

---

## 2. Chạy Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

- API: **http://localhost:8000**
- Swagger UI: **http://localhost:8000/docs**
- Kiểm tra kết nối DB: **http://localhost:8000/health/db**
  - Trả `{"database": "ok"}` → thành công
  - Trả `503` → `DATABASE_URL` sai hoặc chưa điền

### Database: migration & dữ liệu demo

```bash
cd backend

# Chạy các migration mới trong backend/db/migrations/ (đã chạy thì tự bỏ qua)
uv run python -m scripts.migrate

# Thêm thực đơn mẫu (nếu trống) + 4 đơn demo cho KDS
uv run python -m scripts.seed_demo

# Xóa mọi bàn có hậu tố "(demo)"
uv run python -m scripts.seed_demo --xoa-demo
```

- Schema gốc: `backend/db/schema.sql`
- Từ migration `007`, khóa chính là mã đọc được (`MON001`, `HD-20261007-0001`) — xem ADR-ARCH-004.
- Thay đổi schema mới → thêm file `backend/db/migrations/NNN_ten.sql` và **báo cả nhóm** (database dùng chung).

---

## 3. Frontend tĩnh (fe_ofc)

Các file HTML trong `frontend/fe_ofc/pages/` chạy **trực tiếp trên trình duyệt** (double-click hoặc dùng Live Server), không cần build.

Cấu hình API URL tại `frontend/fe_ofc/assets/js/config.js` — mặc định `http://localhost:8000`.

### Màn hình Bếp KDS (US-03)

Mở `frontend/fe_ofc/pages/kitchen.html` khi backend đang chạy.  
Nút demo "Đơn mới: Bàn 01 + Bàn 02" cần `DEMO_MODE=true` trong `backend/.env` (khởi động lại backend sau khi sửa).  
Spec: `story-spec-us03-kds.md`.

### Quản lý: Phiếu Kiểm kê / Đóng ca (US-08)

Mở `frontend/fe_ofc/pages/manager.html` → tab **Phiếu Kiểm kê** (cần backend chạy).  
Chỉ đối soát món có số lượng tồn (`thucdon.soluongton`).  
Chốt ca cần PIN tài khoản QUAN_LY — dữ liệu demo tạo sẵn **"Quản lý Demo (demo)"** PIN `1234` (chạy `seed_demo` trước).  
Spec: `story-spec-us08-inventory.md`.

---

## 4. Frontend Vite (React/TS)

```bash
cd frontend
npm install
npm run dev
```

- Frontend: **http://localhost:5173**
- Gọi API tại `http://localhost:8000` theo mặc định (đổi qua biến `VITE_API_URL` nếu cần).

---

## 5. Khóa Supabase nằm ở đâu?

| Khóa | Vị trí | Commit? |
|---|---|---|
| `DATABASE_URL`, `SUPABASE_SECRET_KEY` (secret) | `backend/.env` — chỉ backend đọc | ❌ Không (gitignore) |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (công khai) | `frontend/fe_ofc/assets/js/config.js` | ✅ Có — khóa công khai, chỉ dùng phía client (Realtime); mọi thao tác ghi dữ liệu đi qua FastAPI |

---

## 6. Kiểm tra chất lượng (khớp CI)

```bash
# Backend
cd backend
uv run ruff check .
uv run pytest

# Frontend
cd frontend
npm run lint
npm run test
npm run build
```

---

## 7. Xem log backend

Backend ghi log ra console (cửa sổ chạy `uvicorn`; khi deploy: tab **Logs** của dịch vụ trên Render). Cấu hình: `backend/app/logging_setup.py`, mức log bằng biến `LOG_LEVEL` (`DEBUG` | `INFO` | `WARNING` | `ERROR`, mặc định `INFO`).

Mỗi dòng: `giờ mức module sự_kiện key=value ...`, ví dụ:

```
2026-10-09 11:02:05 INFO app.orders order_sent_to_kitchen ban="Bàn 01" items=2 lines=1
2026-10-09 11:02:05 INFO app.stock stock_reserved dishes=MON001 ingredients=NL001:-0.4
2026-10-09 11:02:05 INFO app.kds kds_status item=CTP-...-0004 ban="Bàn 01" mon=Coca soluong=2 trangthai=da_xong
2026-10-09 11:02:05 INFO app.http api_error method=POST path=/orders status=409 code=ITEM_OUT_OF_STOCK
2026-10-09 11:02:05 ERROR app.http unhandled_error method=GET path=/kds/items error=RuntimeError  (+ traceback)
```

| Module | Ghi gì |
|---|---|
| `app.http` | Mỗi request (phương thức, đường dẫn, mã trạng thái, ms); lỗi nghiệp vụ `api_error`; lỗi 500 `unhandled_error` kèm traceback |
| `app.orders` | Khách gửi bếp |
| `app.stock` | Trừ kho / từ chối do thiếu hàng / hoàn kho |
| `app.kds` | Bếp đổi trạng thái, tách suất, xóa món hết hàng |
| `app.menu` | Món đổi còn ↔ hết (báo hết, mở bán, hết nguyên liệu) |
| `app.ws` | Client WebSocket bị ngắt |

Lọc nhanh (PowerShell): `uv run uvicorn app.main:app --reload 2>&1 | Select-String "app.kds"`.
**Không** ghi secret, chuỗi kết nối DB, PIN hay ghi chú khách nhập.

---

## Cấu trúc thư mục chính

```
group-06-project/
├── backend/
│   ├── app/
│   │   ├── config.py          # Cấu hình (đọc backend/.env)
│   │   ├── db.py              # Kết nối AsyncPG / SQLAlchemy
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── routers/           # API routes (menu, orders, kds, inventory)
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── ws/                # WebSocket (Realtime KDS)
│   ├── db/
│   │   ├── schema.sql         # Schema gốc
│   │   └── migrations/        # NNN_ten.sql — chạy qua scripts.migrate
│   ├── scripts/
│   │   ├── migrate.py         # Chạy migration mới
│   │   └── seed_demo.py       # Seed dữ liệu demo
│   ├── tests/                 # pytest
│   ├── .env.example           # Mẫu biến môi trường (an toàn để commit)
│   └── pyproject.toml
├── frontend/
│   ├── fe_ofc/
│   │   ├── assets/
│   │   │   ├── css/           # Stylesheet per role
│   │   │   └── js/            # Logic per role + config.js
│   │   └── pages/             # HTML tĩnh (customer, manager, waiter, kitchen, cashier)
│   └── src/                   # Vite/React app (đang phát triển)
├── docs/                      # Tài liệu dự án
├── docker-compose.yml         # PostgreSQL local (tùy chọn)
└── .env.example               # Mẫu tổng quan (backend/.env.example là bản chi tiết)
```

---

## Common Issues

| Triệu chứng | Nguyên nhân | Cách fix |
|---|---|---|
| `/health/db` trả 503 | `DATABASE_URL` sai/trống | Kiểm tra `backend/.env`, đảm bảo URI đúng format Supabase Session pooler |
| `uv sync` lỗi Python version | Python < 3.13 | Cài Python 3.13+ hoặc dùng `uv python install 3.13` |
| CORS error từ browser | Backend chưa chạy | Chạy `uv run uvicorn app.main:app --reload` trước |
| Nút demo KDS không hoạt động | `DEMO_MODE=false` | Đặt `DEMO_MODE=true` trong `backend/.env` rồi restart backend |
| Bảng chưa tồn tại (local Docker) | `AUTO_CREATE_SCHEMA=false` | Đặt `AUTO_CREATE_SCHEMA=true` trong `backend/.env` (chỉ local) |
