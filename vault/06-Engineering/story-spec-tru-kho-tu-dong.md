# Story Spec — Tự động trừ kho khi gọi món (nguyên liệu `tonkho` + công thức `congthuc`)

> Theo template "Story Spec" của giáo trình (§9). Owner: Nhã (Engineering). Cập nhật: 2026-10-07.
> **Trạng thái: Proposed** — Nhã duyệt các quyết định Q1–Q6 theo gợi ý của AI (AI_USAGE_LOG A-75, A-77); **cần PO/nhóm xác nhận** vì phần định mức nguyên liệu đang nằm trong Out of Scope của US-08.

| Mục | Nội dung |
| :--- | :--- |
| **Story liên quan** | US-03 AC3 (Out of Stock tự đồng bộ), US-01 (E-Menu khóa món hết hàng), US-08 (tồn đầu ca) |
| **Requirement IDs** | REQ-09 / BR-03 (hết hàng tự khóa món), REQ-12 / BR-06 (kiểm soát tồn kho) |
| **Bảng** | `tonkho` (nguyên liệu), `congthuc` (định lượng món ↔ nguyên liệu), `thucdon.soluongton` (món thành phẩm) |
| **Kiến trúc** | ADR-ARCH-003 (FastAPI là lớp duy nhất ghi DB), ADR-ARCH-004 (mã `NL001`, `CT001`) |

## 1. Goal

Khi khách gửi bếp, hệ thống **tự trừ** nguyên liệu theo công thức (và trừ `soluongton` với món thành phẩm như nước chai/lon). Món nào không còn đủ nguyên liệu cho 1 phần thì **tự chuyển Hết hàng** trên E-Menu, KDS, Phục vụ mà không cần bếp bấm tay.

## 1b. Preconditions

- Món chế biến đã có công thức (`congthuc`) và nguyên liệu có tồn (`tonkho.tonhethong`); món mua sẵn đã nhập Số lượng tồn.
- Nguyên liệu, công thức được Quản lý nhập ở trang Quản lý (tab Thực phẩm, form Sửa món).
- Bàn gửi bếp qua `POST /orders` (US-01).

## 2. Quyết định nghiệp vụ (Q1–Q6)

| # | Quyết định | Lý do |
| :--- | :--- | :--- |
| Q1 | **Trừ kho lúc gửi bếp** (`POST /orders`), trong cùng transaction với tạo món | Chặn bán vượt số lượng ngay từ E-Menu |
| Q2 | **Hoàn kho khi hủy món đang `cho_nau`**; món đã nấu thì không hoàn (tính hao hụt) | Món chưa nấu chưa tiêu hao nguyên liệu |
| Q3 | **Theo từng món** (Nhã chọn phương án A, 2026-10-07): món **Mua sẵn** = có nhập Số lượng tồn (`soluongton` khác NULL, vd. sữa chua hũ, Coca lon) → đếm và trừ theo `soluongton`; món **Chế biến** = `soluongton` NULL → tính và trừ theo nguyên liệu + công thức. Không phụ thuộc phân loại (Tráng miệng/Đồ uống… đều có thể là 1 trong 2 kiểu); không cần đổi DB | Cùng phân loại vẫn có món mua sẵn và món tự chế biến |
| Q4 | Quản lý nhập nguyên liệu ở tab **"Thực phẩm"**, nhập công thức trong **form Sửa món** (trang Quản lý) | Dùng màn hình sẵn có của nhóm |
| Q5 | Số phần còn ("Còn N") chỉ hiện ở KDS và trang Quản lý; khách chỉ thấy còn/hết | Không lộ số tồn cho khách |
| Q6 | **Không cho tồn âm**: thiếu nguyên liệu thì từ chối đơn (409); DB có CHECK `tonhethong >= 0` | Dữ liệu tồn luôn hợp lệ |

## 3. Quy tắc tính

- **Số phần còn làm được** (theo từng món):
  - Mua sẵn (`soluongton` khác NULL): = `soluongton`; công thức (nếu có) bị bỏ qua.
  - Chế biến (`soluongton` NULL): = `min( ⌊tonhethong ÷ dinhluong⌋ )` theo từng nguyên liệu trong công thức. Chưa có công thức → không giới hạn (`null`), KDS hiện "Chưa có công thức" để nhắc nhập.
  - Form Thêm/Sửa món có lựa chọn "Chế biến / Mua sẵn"; chọn Chế biến thì `soluongton` được xóa về NULL.
- **Hết hàng (bán)** = bếp đã báo hết (`trangthaiban = false`) **hoặc** số phần còn = 0.
- **KDS chặn nấu** món đang Chờ nấu **chỉ khi bếp báo hết bằng tay** (`trangthaiban = false`). Món đã gửi bếp đã được giữ nguyên liệu, nên số phần còn = 0 không chặn nấu món đó.
- **Mở bán lại** (`/in-stock`) bị từ chối 409 `STOCK_EMPTY` nếu số phần còn vẫn = 0 (phải nhập thêm hàng trước).
- **US-08:** phiếu kiểm kê gồm các món **mua sẵn** (`soluongton` khác NULL). Vì `soluongton` nay giảm theo đơn, tồn đầu ca A = `soluongton` lúc tạo phiếu + số đã bán từ đầu kỳ đến lúc tạo phiếu (để không trừ hai lần).

## 4. API

| Method | Path | Mô tả |
| :--- | :--- | :--- |
| GET | `/inventory/ingredients` | Danh sách nguyên liệu: mã, tên, đơn vị, tồn hệ thống, các món đang dùng |
| POST | `/inventory/ingredients` | Thêm nguyên liệu `{name, unit, stock}` |
| PUT | `/inventory/ingredients/{id}` | Sửa tên/đơn vị/tồn (nhập hàng) — món đổi còn/hết thì phát `menu:oos` |
| DELETE | `/inventory/ingredients/{id}` | Xóa; 409 `INGREDIENT_IN_USE` nếu còn món dùng |
| GET | `/menu/items/{id}/recipe` | Công thức của món |
| PUT | `/menu/items/{id}/recipe` | Thay toàn bộ công thức `{lines: [{ingredient_id, quantity}]}` |
| GET | `/menu` | Thêm trường `portions` (số phần còn, `null` = không giới hạn) |

Lỗi khi gửi bếp: 409 `ITEM_OUT_OF_STOCK` kèm `details` = danh sách `{thucdon_id, tenmon, con_lai}` khi không đủ.

## 5. Acceptance Criteria

- **AC1** — Bò xào cần 0.2 kg bò, kho có 1 kg. Gửi bếp 2 phần → kho còn 0.6 kg, `GET /menu` trả `portions = 3`.
- **AC2** — Kho bò còn 0.3 kg, khách gửi 2 phần → 409 `ITEM_OUT_OF_STOCK`, kho không đổi, không tạo món.
- **AC3** — Gửi bếp làm kho bò về dưới 0.2 kg → Bò xào và **mọi món khác dùng bò** chuyển Hết hàng, phát `ITEM_OOS_BROADCAST` lên `menu:oos`.
- **AC4** — Bếp xóa món Chờ nấu (hết hàng) → nguyên liệu và `soluongton` được cộng trả lại.
- **AC5** — Đồ uống `soluongton = 24`, gửi bếp 5 lon → còn 19.
- **AC6** — Món đã gửi bếp vẫn nấu được dù số phần còn về 0.
- **AC7** — Xóa nguyên liệu đang có trong công thức → 409 `INGREDIENT_IN_USE`.

## 6. File thay đổi

- Backend: `models/menu.py` (quan hệ + số phần còn), `services/stock.py` (mới), `routers/ingredients.py` (mới), `schemas/stock.py` (mới), `schemas/menu.py`, `services/orders.py` + `routers/orders.py` (Nhàn), `services/kds.py` + `routers/kds.py`, `routers/menu.py`, `services/inventory.py`, `services/voice.py` (Ny — giới hạn số lượng theo số phần còn), `main.py`.
- DB: `backend/db/migrations/011_tonkho_congthuc_rang_buoc.sql` (CHECK + UNIQUE) — **cần nhóm duyệt trước khi chạy trên Supabase**.
- Frontend: `manager.html` / `manager.js` (tab Thực phẩm — Trang; form Sửa món — Ny), `kitchen.html`.
- Test: `tests/routers/test_stock.py` (mới), cập nhật `test_kds.py`.

## 6b. Data read / write

| Bảng | Đọc | Ghi |
| :--- | :--- | :--- |
| `thucdon` | `soluongton`, `trangthaiban`, `phanloai` | `soluongton` (trừ/hoàn khi món mua sẵn) |
| `congthuc` | định lượng theo món | thay toàn bộ khi `PUT /menu/items/{id}/recipe` |
| `tonkho` | `tonhethong` | `tonhethong` (trừ/hoàn, nhập hàng) |
| `chitietmon`, `hoadon`, `phienban` | — | tạo khi gửi bếp (US-01) |

## 6c. Authorization

Chưa có đăng nhập (chờ JWT — AI_USAGE_LOG A-84). Khi có: nguyên liệu/công thức chỉ role `QUAN_LY`; gửi bếp theo phiên bàn khách (`X-Session-Token`).

## 6d. Validation / business rules

- Số lượng gọi ≥ 1; tồn nguyên liệu ≥ 0; định lượng > 0; 1 nguyên liệu chỉ xuất hiện 1 lần trong công thức (422 `DUPLICATE_INGREDIENT`; DB UNIQUE ở migration 011).
- Không đủ hàng → 409 `ITEM_OUT_OF_STOCK` cho **cả đơn**, không trừ phần nào.
- Kiểm tra và trừ trong **cùng transaction** có `SELECT … FOR UPDATE` trên `thucdon` và `tonkho` → nhiều bàn đặt cùng lúc không bán vượt.
- Xóa nguyên liệu đang có trong công thức → 409 `INGREDIENT_IN_USE`.

## 6e. Observability / logging

- Mọi món đổi còn ↔ hết phát `ITEM_OOS_BROADCAST` trên `menu:oos` (E-Menu, KDS cập nhật không F5).
- Hủy món chờ nấu ghi `loghuymon`. Chưa có log riêng cho từng lần trừ kho — đối soát qua `chitietmon` (số đã bán) và phiếu kiểm kê US-08.

## 6f. Test plan

| Tầng | Test | AC |
| :--- | :--- | :--- |
| Unit | `backend/tests/unit/test_stock_rules.py` (số phần còn, hết hàng, biên 0.01 kg), `test_kds_rules.py` | AC1, AC6 |
| Integration | `backend/tests/routers/test_stock.py` (11 test) | AC1–AC5, AC7 |
| Integration Postgres | `backend/tests/pg/test_race_last_portion.py` — 6 bàn tranh suất cuối | Q6 |
| E2E | `testing/test_scripts/tests/us03-kds.spec.ts` TC-OP-KDS-010 | AC3, AC6 |
| Regression | `test_inventory.py::test_opening_stock_not_double_counted_after_real_orders` (BUG-US08-001) | Mục 3 (US-08) |

Test case: `testing/test_cases/test-cases-US03.md`. Kết quả: `testing/reports/US-03/`.

## 6g. Definition of Done

- [x] Spec viết trước khi code (A-77); test chạy pass (2026-10-07).
- [x] API + giao diện Quản lý + KDS; `ruff`, `pytest`, `vitest`, Playwright pass.
- [ ] PO/nhóm xác nhận Q1–Q6 và mở scope (đang Proposed).
- [ ] Nhóm duyệt rồi chạy migration 011 trên Supabase.
- [ ] PR có Story ID được thành viên khác review.

## 7. Ngoài phạm vi

Gộp đồ uống sang `tonkho`; đơn vị quy đổi (g ↔ kg); kiểm kê nguyên liệu cuối ca (`tonkho.tonthucte`); nhập hàng theo phiếu nhập; phân quyền (chờ JWT).
