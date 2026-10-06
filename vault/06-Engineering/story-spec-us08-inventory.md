# Story Spec — US-08: Đối soát tồn kho và Đóng ca

> Theo template "Story Spec" của giáo trình (§9). Owner: Nhã (Engineering) — task T-13 (UI), T-14 (API) trong `docs/04-Backlog/taiga-tasks.md`. Cập nhật: 2026-10-06.

| Mục | Nội dung |
| :--- | :--- |
| **Story ID** | US-08 — `docs/04-Backlog/user stories/US-08.md` (Could-have, 2 points) |
| **Requirement IDs** | REQ-12 / FR-08 (giao diện đóng ca, bảng kê tồn kho), BR-06 (kiểm soát tồn kho), BR-07 (dữ liệu ca đã chốt bất biến), NFR-RO-03 (chỉ Quản lý chốt ca) |
| **Design link** | `frontend/fe_ofc/pages/manager.html` → tab "Phiếu Kiểm kê" (giao diện của nhóm, mở rộng theo phương án (a) được Dev duyệt) |
| **Kiến trúc liên quan** | ADR-ARCH-003 (FastAPI là lớp duy nhất truy cập Supabase), `dtb.md` (bảng `thucdon.soluongton`) |

## 1. Goal

Cuối ca, Quản lý xem bảng đối soát cho các món **đếm số lượng** (thành phẩm như nước uống chai/lon — `thucdon.soluongton` khác NULL), nhập tồn thực tế, giải trình hao hụt và chốt ca. Ca đã chốt không sửa được; tồn thực tế trở thành tồn đầu ca sau.

## 2. Phạm vi & quyết định thiết kế (Dev duyệt 2026-10-06)

- Chỉ đối soát món có `soluongton` khác NULL — khớp Out of Scope của US-08 ("chỉ quản lý tồn theo đơn vị món thành phẩm", không tính định mức nguyên liệu).
- **Kỳ của ca:** từ lúc chốt phiếu gần nhất (lần đầu: 00:00 giờ Việt Nam hôm nay) đến lúc chốt phiếu này.
- **Tồn đầu ca (A):** chụp giá trị `thucdon.soluongton` lúc tạo phiếu. Giả định: hiện chưa có luồng chốt đơn tự trừ `soluongton`, nên giá trị này = tồn thực tế của ca trước + hàng nhập thêm (cập nhật qua `PATCH /menu/items/{id}/stock`). Khi luồng chốt đơn tự trừ tồn được làm, cần xem lại cách lấy A.
- **Đã bán (B):** tổng `chitietmon.soluong` của món đó có `giogoimon` trong kỳ, bỏ qua món `da_huy` và hóa đơn `da_huy`.
- **Tồn lý thuyết (C) = A − B.** **Chênh lệch = Tồn thực tế − C** (âm = hao hụt, dương = dư).

## 3. Happy path

1. Quản lý mở tab "Phiếu Kiểm kê" → `GET /inventory/shifts` (danh sách phiếu, mới nhất trước).
2. Bấm "Tạo Phiếu Kiểm Kê" → `POST /inventory/shifts` tạo phiếu nháp (mã `PKK-YYYYMMDD-HHMMSS`) chụp tồn đầu ca.
3. **AC1:** mở phiếu → `GET /inventory/shifts/{id}` trả bảng A, B, C (tính trực tiếp khi còn nháp).
4. **AC2:** nhập tồn thực tế → giao diện tô dòng hao hụt và hiện "Hao hụt: n"; lưu nháp bằng `PUT /inventory/shifts/{id}/lines`.
5. **AC3 + AC5:** bấm "Xác nhận Đóng ca" → nhập PIN Quản lý → `POST /inventory/shifts/{id}/close`: lưu B, C, chênh lệch; `thucdon.soluongton = tồn thực tế`; phiếu `da_chot`, ghi người chốt + giờ chốt; giao diện chuyển chỉ xem.

## 4. Alternate / error paths

| Tình huống | Hành vi |
| :--- | :--- |
| Đã có 1 phiếu nháp | 409 `SHIFT_DRAFT_EXISTS` (DB còn chặn bằng unique index — chỉ 1 phiếu `nhap`) |
| Không có món nào đếm số lượng | 409 `NO_TRACKED_ITEMS` |
| **AC4** — có hao hụt mà bỏ trống lý do | Giao diện chặn + lỗi đỏ ngay dòng đó, **không gọi API**; server vẫn kiểm tra lại: 422 `LOSS_REASON_REQUIRED` kèm danh sách món |
| Chưa nhập đủ tồn thực tế | 422 `ACTUAL_STOCK_MISSING` |
| Tồn thực tế âm | 422 (validation) — DB còn có CHECK |
| PIN sai / không phải Quản lý | 403 `INVALID_MANAGER_PIN` |
| Sửa / xóa / chốt lại phiếu đã chốt (BR-07) | 409 `SHIFT_CLOSED` |
| Không tìm thấy phiếu | 404 `SHIFT_NOT_FOUND` |

## 5. Data read / write

| Bảng | Đọc | Ghi |
| :--- | :--- | :--- |
| `phieukiemke` (mới — migration 006) | danh sách / chi tiết phiếu | tạo phiếu, chốt (`trangthai`, `giochot`, `nguoichot_id`), xóa phiếu nháp |
| `chitietkiemke` (mới — migration 006) | dòng đối soát | `tonthucte`, `lydo`; khi chốt: `daban`, `tonlythuyet`, `chenhlech` |
| `thucdon` | `tenmon`, `soluongton` | `soluongton = tonthucte` khi chốt |
| `chitietmon` (+ `hoadon`) | `soluong`, `giogoimon`, `trangthai` để tính B | — |
| `nguoidung` | `vaitro = 'QUAN_LY'`, `mapin` để xác thực PIN | — |

## 6. API contract

Chi tiết: `api-contract.md` Mục 7. `GET /inventory/shifts`, `POST /inventory/shifts`, `GET /inventory/shifts/{id}`, `PUT /inventory/shifts/{id}/lines`, `POST /inventory/shifts/{id}/close`, `DELETE /inventory/shifts/{id}`.

## 7. Authorization

- AC5 / NFR-RO-03: chốt ca bắt buộc **PIN của tài khoản `QUAN_LY`** (Manager Override, giống `POST /orders/items/{id}/void`); người chốt được ghi vào `nguoichot_id` (audit trail BR-07).
- **TBD:** chưa có JWT nên các API đọc/tạo/lưu nháp chưa giới hạn vai trò. `nguoidung.mapin` đang lưu PIN dạng chữ thường (theo schema của nhóm) — nên băm (hash) khi làm story Auth.

## 8. Validation / business rules

- Phiếu `da_chot` bất biến: mọi thao tác ghi trả 409 (BR-07).
- Chốt ca trong 1 transaction, khóa dòng phiếu (`FOR UPDATE`) để 2 người không chốt trùng.
- Khi chốt mà tồn thực tế làm món đổi trạng thái còn/hết hàng → phát `ITEM_OOS_BROADCAST` (đồng bộ E-Menu/KDS).

## 9. Test plan

| Lớp | Kiểm chứng | Nơi |
| :--- | :--- | :--- |
| API (SQLite in-memory) | tạo phiếu chỉ gồm món đếm số lượng; 1 phiếu nháp; tính B đúng kỳ (bỏ món hủy, món ngoài kỳ); lưu nháp; AC4 thiếu lý do 422; thiếu tồn thực tế 422; PIN sai 403; chốt ca cập nhật `soluongton` + khóa phiếu; sửa/xóa phiếu đã chốt 409; kỳ của phiếu sau bắt đầu từ giờ chốt phiếu trước | `backend/tests/routers/test_inventory.py` |
| E2E có script (Edge headless + backend + Supabase) | tạo phiếu, nhập số, tô hao hụt, chặn thiếu lý do, PIN, chốt, chỉ xem | AI Usage Log |

## 10. Definition of Done

- [x] Spec viết trước khi code.
- [x] Migration 003 chạy trên Supabase; ruff sạch; pytest 44/44; E2E 5 AC trên Supabase thật (AI Usage Log A-56).
- [ ] Phân quyền API theo JWT (chờ story Auth).
