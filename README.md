# Restaurant Smart Ordering — Group 06

Hệ thống gọi món thông minh cho nhà hàng (QR ordering, AI Voice Assistant, KDS, thanh toán QR nội địa). Xem chi tiết nghiệp vụ tại [`vault/`](vault/00-Index.md), tài liệu kỹ thuật tại [`vault/06-Engineering/`](vault/06-Engineering/README.md).

## Tech stack

- **Frontend:** React + TypeScript + Vite, Node.js 24 LTS
- **Backend:** Python 3.13, FastAPI, quản lý gói bằng [uv](https://github.com/astral-sh/uv)
- **Database:** PostgreSQL trên Supabase, dùng chung cho cả nhóm ([ADR-ARCH-003](vault/06-Engineering/architecture.md)); Docker chỉ dùng khi cần chạy offline
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`)

Chi tiết kiến trúc: [`vault/06-Engineering/architecture.md`](vault/06-Engineering/architecture.md).

## Chạy dự án local

### Yêu cầu

- Python ≥ 3.13 với [uv](https://github.com/astral-sh/uv) đã cài
- Node.js 24 LTS
- Chuỗi kết nối Supabase của nhóm (xin trưởng nhóm qua tin nhắn riêng — **không** đưa lên Git/chat chung)
- (Tuỳ chọn) [Docker](https://www.docker.com/) nếu muốn chạy PostgreSQL offline

### 1. Cấu hình biến môi trường backend

```bash
cp backend/.env.example backend/.env
```

Mở `backend/.env`, điền `DATABASE_URL` (Supabase Dashboard → **Connect** → **Session pooler** → URI, thay `[YOUR-PASSWORD]`) và `SUPABASE_SECRET_KEY`. File này đã nằm trong `.gitignore` — **không commit**.

> **Chạy offline bằng Docker (tuỳ chọn):** `docker compose up -d db`, để `DATABASE_URL` mặc định (bỏ trống) và đặt `AUTO_CREATE_SCHEMA=true` để backend tự tạo bảng + seed món mẫu. **Không** bật `AUTO_CREATE_SCHEMA` khi trỏ vào Supabase dùng chung.

### 2. Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

API chạy tại `http://localhost:8000` (Swagger UI: `http://localhost:8000/docs`). Kiểm tra kết nối database: `http://localhost:8000/health/db` phải trả `{"database": "ok"}` (trả `503` nếu `DATABASE_URL` sai/chưa điền).

### Database: migration & dữ liệu demo

```bash
cd backend
uv run python -m scripts.migrate              # chạy backend/db/migrations/*.sql (chạy lại nhiều lần không lỗi)
uv run python -m scripts.seed_demo            # thêm thực đơn mẫu (nếu trống) + 4 đơn demo cho KDS
uv run python -m scripts.seed_demo --xoa-demo # xóa mọi bàn có hậu tố "(demo)"
```

Schema gốc: `backend/db/schema.sql`. Thay đổi schema mới → thêm file `backend/db/migrations/NNN_ten.sql` và báo cả nhóm (database dùng chung).

### Màn hình Bếp KDS (US-03)

Mở `frontend/fe_ofc/pages/kitchen.html` khi backend đang chạy. KDS gọi API theo `API_BASE_URL` trong `frontend/fe_ofc/assets/js/config.js` (mặc định `http://localhost:8000`). Nút demo "Đơn mới: Bàn 01 + Bàn 02" cần `DEMO_MODE=true` trong `backend/.env` (khởi động lại backend sau khi sửa). Spec: [`story-spec-us03-kds.md`](vault/06-Engineering/story-spec-us03-kds.md).

### Khóa Supabase nằm ở đâu?

| Khóa | Vị trí | Commit? |
| :--- | :--- | :--- |
| `DATABASE_URL`, `SUPABASE_SECRET_KEY` (secret) | `backend/.env` — chỉ backend đọc | Không (gitignore) |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (công khai) | `frontend/fe_ofc/assets/js/config.js` | Có — khóa công khai, chỉ dùng phía client (Realtime); mọi thao tác ghi dữ liệu đi qua FastAPI |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại `http://localhost:5173`, gọi API tại `http://localhost:8000` theo mặc định (đổi qua biến môi trường `VITE_API_URL` nếu cần).

## Kiểm tra chất lượng (khớp CI)

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

## Cấu trúc thư mục

Xem chi tiết tại [`vault/06-Engineering/repo-structure.md`](vault/06-Engineering/repo-structure.md).
