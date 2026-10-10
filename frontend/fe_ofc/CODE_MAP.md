# CODE MAP — Tra cứu nhanh code màn hình Khách hàng (US-01 / US-09)

> **Cách dùng:** thầy/cô hỏi về chức năng gì → tìm hàng tương ứng trong bảng bên dưới → mở file + hàm được chỉ.
> Quy ước file: đặt tên tiếng Việt không dấu, mỗi file = 1 tính năng.
> Toàn bộ màn khách nằm trong `frontend/fe_ofc/`:
> - Trang web: `pages/customer.html` (+ `pages/qr.html` — tạo QR theo bàn)
> - Code JS: `assets/js/` — **CSS: `assets/css/customer.css`** (chia section có tên đầy đủ, tìm bằng `Ctrl+F` tên class)

## 1. Sơ đồ file JS (thứ tự load trong customer.html)

| Thứ tự | File | Vai trò |
|---|---|---|
| 1 | `config.js` | Địa chỉ API (dev: localhost:8000, production: Render) — của team |
| 2 | `api.js` | Hàm `apiFetch()` gọi Backend + báo lỗi chuẩn |
| 3 | `realtime.js` | WebSocket/realtime (của team) — hàm `subscribeChannel` |
| 4 | `mock-data.js` | Dữ liệu tĩnh — hiện chỉ còn phục vụ voice.js (US-02) |
| 5 | `utils.js` | `fmtVND()` định dạng tiền |
| 6 | **`DuLieuChung.js`** | **Trạng thái chung + hàm tiện ích** — LOAD ĐẦU TIÊN |
| 7 | **`ThucDon.js`** | **E-Menu: thực đơn, phân loại, tìm kiếm** |
| 8 | **`GioHang.js`** | **Giỏ nháp (Order Draft) + sticky bar** |
| 9 | **`GhiChuMon.js`** | **Ghi chú từng món** |
| 10 | **`GuiBep.js`** | **Xác nhận gửi bếp** |
| 11 | **`HoaDon.js`** | **Hóa đơn tạm tính + yêu cầu thanh toán (US-09)** |
| 12 | `customer.js` | File chính — chỉ KHỞI TẠO, không chứa logic |

## 2. Bảng tra cứu: "Thầy hỏi X" → code ở đâu

| Câu hỏi / Chức năng | File | Hàm / Vị trí cụ thể |
|---|---|---|
| Thực đơn tải từ đâu? Làm sao hiển thị? | ThucDon.js | `loadMenu()` → `renderMenu()` |
| Tìm kiếm món hoạt động thế nào? (bỏ dấu) | ThucDon.js | hàm `norm()` (DuLieuChung.js) + sự kiện `#search-input` |
| Chip phân loại / cuộn tới nhóm? | ThucDon.js | `renderCategories()`, `setActiveChip()`, sự kiện `#cat-row` |
| Lướt tới đâu chip sáng tới đó (scroll-spy)? | ThucDon.js | `updateActiveChip()` + `window scroll` |
| Thẻ món hiển thị thế nào? Ảnh, giá? | ThucDon.js | `renderCard()` |
| Món hết hàng xử lý thế nào? (REQ-09) | ThucDon.js + kds/menu (backend) | `renderCard()` nhánh `oos`; backend `app/models/menu.py la_het_hang` |
| Nút "+" / bộ đếm − 1 + trên thẻ? | ThucDon.js + GioHang.js | `renderCard()` (hiển thị) + sự kiện `#menu-grid` (xử lý bấm) |
| Giỏ hàng hiển thị, thêm/bớt món? | GioHang.js | `renderDraft()`, `addToDraft()`, sự kiện `#draft-body` |
| Ghi chú món (không hành, ít cay)? | GhiChuMon.js | `openNoteEditor()`, `saveNote()` |
| Gửi bếp — dữ liệu gửi đi gì? | GuiBep.js | `sendToKitchen()` → `POST /orders` |
| Vì sao phải bấm xác nhận 2 lần? (BR-01) | GuiBep.js | `openConfirm()` (modal) → `sendToKitchen()` |
| Hóa đơn tạm tính lấy từ đâu, nhóm đợt? | HoaDon.js | `openBillView()` → `buildBillTable()` (nhóm theo `dot` — ADR-N13) |
| Khi nào được bấm yêu cầu thanh toán? | HoaDon.js | `requestPayment()` (AC2 cảnh báo / AC3 cho phép — `all_served`) |
| Mã bàn từ QR tới từ đâu? | DuLieuChung.js | `tableName` (URL `?table=` → sessionStorage) |
| Trạng thái bàn 1/2/3 là gì? | backend `app/models/order.py` (Ban) + `services/orders.py` | ADR-N14 |
| Món "Bán chạy" lấy từ đâu? | backend `app/schemas/menu.py` (`bestseller` ← `thucdon.banchay`) + ThucDon.js `renderCard()` (`.badge-hot`) | ADR-002 |
| Lỗi API hiển thị ở đâu? | DuLieuChung.js | `showApiError()` |

## 3. Backend — gọi món & hóa đơn (US-01/09/05)

| Chức năng | File backend | Hàm |
|---|---|---|
| Gửi bếp (đa đợt, trừ kho) | `backend/app/services/orders.py` | `create_order()` |
| Hóa đơn tạm tính | `backend/app/services/orders.py` | `current_order()`, `_bill_items()` (gán đợt `dot`) |
| QR thanh toán | `backend/app/services/orders.py` | `build_pay_qr()` |
| Thanh toán & đóng bàn | `backend/app/services/orders.py` | `close_table()`, `mark_cleaned()` |
| API endpoints | `backend/app/routers/orders.py` | `/orders`, `/orders/current`, `/cashier/tables`, `/tables/{ban_id}/...` |

## 4. Cấu trúc DB (chi tiết đầy đủ: `frontend/fe_ofc/dtb.md`)

```
ban (MASTER, 6 bàn)                thucdon (MASTER, món + giá)
 └─< phieuban (phiếu = 1 lần gọi)   └─> chitietphieu (món trong phiếu)
        hoadon (chỉ sinh khi THANH TOÁN) ──< phieuban.hoadon_id
```
- `phieuban.hoadon_id = NULL` → món của **khách đang ngồi**
- `phieuban.hoadon_id != NULL` → đã thuộc **hóa đơn khách trước**
