# Repo Structure (Output #23)

> Vai trò: Lead Engineer. Mô tả cấu trúc thư mục **thực tế** của repo tại thời điểm viết tài liệu này, cộng thêm cấu trúc **dự kiến** cho `backend/app/` khi bắt đầu code (khớp các module đã liệt kê ở `architecture.md` Mục 1 và 3).

## 1. Cấu trúc thực tế (root)

```
group-06-project/
├── README.md
├── .gitignore
├── .env.example
├── compose.yaml                      # service PostgreSQL 18 (Docker)
│
├── .github/
│   └── workflows/
│       └── ci.yml                    # job backend (uv sync + pytest), job frontend (Node 24 + npm)
│
├── frontend/                         # React + TypeScript + Vite, Node.js 24 LTS
│   ├── src/
│   │   ├── main.tsx, App.tsx, App.css, index.css
│   │   ├── api/menu.ts                # fetchMenuItems() gọi GET /menu
│   │   ├── App.test.tsx               # vitest + Testing Library (3 test case, US-01)
│   │   └── setupTests.ts, vite-env.d.ts
│   ├── e2e/                          # (đang trống — chờ scaffold Playwright, ngoài phạm vi vertical slice)
│   ├── public/                       # favicon, static assets
│   ├── index.html, vite.config.ts, tsconfig*.json, .oxlintrc.json
│   ├── package.json                  # scripts: dev/build/lint(oxlint)/test(vitest)/preview
│   └── package-lock.json
│
├── backend/                          # Python 3.13, FastAPI, uv
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app, lifespan (create_all + seed), CORS, /health
│   │   ├── config.py                  # Settings (pydantic-settings, đọc .env)
│   │   ├── db.py                      # async engine/session, Base, get_db()
│   │   ├── models/menu_item.py        # MenuItem ORM (khớp data-model.md)
│   │   ├── schemas/menu.py            # MenuItemOut (Pydantic)
│   │   └── routers/menu.py            # GET /menu (US-01)
│   ├── tests/
│   │   ├── conftest.py                # fixture db_session (SQLite in-memory) + client (httpx ASGITransport)
│   │   └── routers/test_menu.py       # 3 test case: empty/seeded/health
│   ├── pyproject.toml                # requires-python = ">=3.13", deps FastAPI/SQLAlchemy/asyncpg, ruff config
│   ├── uv.lock
│   └── .python-version               # 3.13
│
├── vault/                            # Single Source of Truth (Project Vault, chuẩn giáo trình)
│   ├── 00-Index.md                   # bản đồ vault + guardrail AI
│   ├── source-priority.md            # luật phân xử ưu tiên nguồn khi mâu thuẫn
│   ├── 01-Requirements/
│   │   ├── requirements.md           # REQ/BR/NFR
│   │   ├── glossary.md
│   │   └── scope.md
│   ├── 02-Research/
│   │   ├── interview-notes.md
│   │   └── user-research.md
│   ├── 03-Product/
│   │   └── PRD.md
│   ├── 04-User-Stories/
│   │   └── user-stories.md
│   ├── 05-Design/                    # (chờ Design phase)
│   ├── 06-Engineering/               # ← Engineering Outputs (tài liệu này nằm ở đây)
│   │   ├── architecture.md           # Output #17
│   │   ├── data-model.md             # Output #18
│   │   ├── command-schema.md         # Output #19
│   │   ├── api-contract.md           # Output #20
│   │   ├── repo-structure.md         # Output #23 (chính là file này)
│   │   ├── story-spec-ai-order.md    # Output #22
│   │   └── ai-prompt-and-review.md   # Output #24 & #25
│   ├── 07-QA/
│   │   └── vault-qa-benchmark.md
│   └── 08-Decisions/
│       └── decision-log.md           # ADR nghiệp vụ (ADR-001 = OOS trong Order Draft)
│
└── docs/                             # tài liệu lịch sử theo tiến trình môn học (giữ nguyên, không xoá)
    ├── 01-Discovery/
    ├── 02-Requirements/
    ├── 03-Product/
    ├── 04-Backlog/
    ├── 05-Technical/                 # stub, trỏ sang vault/06-Engineering/*
    ├── AI_USAGE_LOG.md               # nhật ký 6 cột theo chuẩn giáo trình
    ├── TRACEABILITY.md
    ├── RUNBOOK.md
    └── RELEASE.md
```

## 2. Cấu trúc dự kiến cho `backend/app/` (mở rộng dần từ vertical slice hiện có)

`backend/app/` hiện đã có vertical slice đầu tiên chạy thật: `GET /menu` (US-01, xem Mục 1) — `main.py`, `config.py`, `db.py`, `models/menu_item.py`, `schemas/menu.py`, `routers/menu.py` đã tồn tại và có test pass. Các module còn lại (`orders`, `ai`, `ws`, `jobs`, `payment_gateways`, `auth`...) triển khai theo `architecture.md` (Modular Monolith, ADR-ARCH-001) khi làm tới story tương ứng. Cấu trúc đầy đủ dự kiến:

```
backend/app/
├── __init__.py
├── main.py                # khởi tạo FastAPI app, đăng ký router, lifespan (scheduler)
├── config.py               # đọc .env (DATABASE_URL, JWT_SECRET, AI_API_KEY)
├── db.py                   # async SQLAlchemy engine/session
│
├── models/                 # SQLAlchemy ORM models — 1 file/bảng, khớp data-model.md
│   ├── users.py
│   ├── tables.py
│   ├── table_sessions.py
│   ├── voice_transcripts.py
│   ├── menu_items.py
│   ├── inventory_items.py
│   ├── menu_item_ingredients.py
│   ├── orders.py
│   ├── order_items.py
│   ├── kitchen_tickets.py
│   ├── payments.py
│   └── void_refund_logs.py
│
├── schemas/                 # Pydantic request/response models, khớp api-contract.md
│   ├── orders.py
│   ├── ai.py
│   └── payments.py
│
├── routers/                 # REST endpoint, mỗi file khớp 1 nhóm trong api-contract.md
│   ├── orders.py            # POST /orders/confirm, POST /orders/items/{id}/void
│   ├── ai.py                 # POST /ai/chat, POST /ai/voice
│   ├── menu.py                # đã có GET /menu (vertical slice); còn thiếu CRUD CMS + POST /menu/items/{id}/out-of-stock
│   ├── tables.py              # POST /tables/{id}/close, Table Map
│   ├── payments.py            # POST /payments/qr, /payments/split, /payments/cash-fallback
│   └── inventory.py           # POST /inventory/reconciliation
│
├── ws/                       # WebSocket Pub/Sub (architecture.md Mục 4)
│   ├── manager.py             # ConnectionManager
│   └── router.py               # GET /ws/{channel}
│
├── jobs/                     # Background Job/Cron (architecture.md Mục 5)
│   ├── scheduler.py            # APScheduler + FastAPI lifespan
│   └── voice_cleanup.py        # purge_closed_session_transcripts()
│
├── ai_gateway/                # AI Gateway — map STT/NLU sang command-schema.md
│   ├── stt_client.py           # gọi AI/LLM Provider (Speech-to-Text)
│   ├── nlu_client.py           # gọi AI/LLM Provider (trích intent)
│   └── intent_handler.py       # thực thi rule backend theo command-schema.md
│
├── payment_gateways/          # Adapter Pattern (ADR-ARCH-002)
│   ├── base.py                  # interface PaymentGateway chung
│   ├── momo.py
│   ├── vnpay.py
│   └── cash.py
│
└── auth/
    ├── jwt.py                   # phát hành/verify JWT cho staff (Waiter/Kitchen/Manager)
    ├── session_token.py         # phát hành/verify Session Token cho khách (QR)
    └── rbac.py                  # dependency FastAPI kiểm role, REQ-10 / NFR-RO-03
```

`backend/tests/` dự kiến mirror cấu trúc trên (`tests/routers/test_orders.py`, `tests/ai_gateway/test_intent_handler.py`...) — xem ví dụ cụ thể cho AI Voice tại `story-spec-ai-order.md` Mục 5.

## 3. Quy ước đặt tên & vị trí tài liệu

| Loại nội dung | Vị trí chuẩn | Không đặt ở |
|---|---|---|
| Quyết định kiến trúc/kỹ thuật (ADR-ARCH-*) | `vault/06-Engineering/architecture.md` | `vault/08-Decisions/decision-log.md` (chỉ dành ADR nghiệp vụ) |
| Quyết định nghiệp vụ (ADR-*, do người duyệt) | `vault/08-Decisions/decision-log.md` | — |
| Đặc tả API | `vault/06-Engineering/api-contract.md` | `docs/05-Technical/API.md` (đã là stub trỏ sang) |
| ERD/Schema DB | `vault/06-Engineering/data-model.md` | `docs/05-Technical/data-model.md` (đã là stub trỏ sang) |
| Nhật ký AI (6 cột) | `docs/AI_USAGE_LOG.md` | — (giữ nguyên vị trí theo chuẩn giáo trình) |
| Ma trận truy vết | `docs/TRACEABILITY.md` | — |
