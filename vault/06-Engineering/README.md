# 06-Engineering — Engineering Outputs

Single Source of Truth cho toàn bộ tài liệu kỹ thuật của dự án Restaurant Smart Ordering. Mọi bản sao ở nơi khác (VD: `docs/05-Technical/`) chỉ là **stub trỏ về đây** — chỉnh sửa nội dung thật tại các file dưới.

| Output | File | Nội dung |
|---|---|---|
| #17 | [`architecture.md`](architecture.md) | C4 Model (System Context + Container), WebSocket Pub/Sub, Background Job/Cron, ADR-ARCH-001/002 |
| #18 | [`data-model.md`](data-model.md) | ERD (Mermaid, PostgreSQL 18), Foreign Keys, cơ chế Hard-delete NFR-RO-02 |
| #19 | [`command-schema.md`](command-schema.md) | Intent AI Assistant (ADD_TO_CART, REMOVE_FROM_CART, QUERY_MENU, CLARIFY) |
| #20 | [`api-contract.md`](api-contract.md) | Đặc tả API (Request/Response/Error) + WebSocket payload |
| #22 | [`story-spec-ai-order.md`](story-spec-ai-order.md) | Đặc tả kỹ thuật US-02 (AI Voice Order + chặn OOS), sequence diagram, kế hoạch pytest |
| #23 | [`repo-structure.md`](repo-structure.md) | Cấu trúc thư mục thực tế + dự kiến cho `backend/app/` |
| #24, #25 | [`ai-prompt-and-review.md`](ai-prompt-and-review.md) | Mẫu AI Prompt sinh code FastAPI/WebSocket + Checklist Code Review |

Nguồn liên quan: [`vault/08-Decisions/decision-log.md`](../08-Decisions/decision-log.md) (ADR nghiệp vụ), [`vault/04-User-Stories/user-stories.md`](../04-User-Stories/user-stories.md), [`vault/01-Requirements/requirements.md`](../01-Requirements/requirements.md).
