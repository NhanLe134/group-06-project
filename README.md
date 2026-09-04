# Restaurant Smart Ordering — Group 06

Hệ thống gọi món thông minh cho nhà hàng (QR ordering, AI Voice Assistant, KDS, thanh toán QR nội địa). Xem chi tiết nghiệp vụ tại [`vault/`](vault/00-Index.md), tài liệu kỹ thuật tại [`vault/06-Engineering/`](vault/06-Engineering/README.md).

## Tech stack

- **Frontend:** React + TypeScript + Vite, Node.js 24 LTS
- **Backend:** Python 3.13, FastAPI, quản lý gói bằng [uv](https://github.com/astral-sh/uv)
- **Database:** PostgreSQL 18 (chạy qua Docker)
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`)

Chi tiết kiến trúc: [`vault/06-Engineering/architecture.md`](vault/06-Engineering/architecture.md).

## Chạy dự án local

### Yêu cầu

- [Docker](https://www.docker.com/) (chạy PostgreSQL)
- Python ≥ 3.13 với [uv](https://github.com/astral-sh/uv) đã cài
- Node.js 24 LTS

### 1. Database

```bash
cp .env.example .env
docker compose up -d db
```

### 2. Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

API chạy tại `http://localhost:8000` (Swagger UI: `http://localhost:8000/docs`). Bảng DB được tạo tự động và seed vài món mẫu khi backend khởi động lần đầu (xem `app/main.py`) — đây là giải pháp tạm cho vertical slice; khi vào giai đoạn triển khai đầy đủ nên chuyển sang Alembic migration.

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
