# Output #16 - Design System & Handoff (DESIGN.md) - Group 06

> **Tài liệu**: Quy chuẩn Hệ thống Thiết kế & Handoff (Design System & Handoff Specification)  
> **Dự án**: Smart Restaurant Ordering — Group 06  
> **Người thực hiện**: Lê Thị Thanh Nhàn (Role UX/UI Designer & AI/Vault Master)  

---

## 1. DESIGN TOKENS (BẢNG TOKENS QUY CHUẨN)

| Token Name | Token Value | Usage / Application (Mục đích sử dụng) |
| :--- | :---: | :--- |
| `color.primary` | `#0D5C75` | Nút bấm chính (Primary CTA), trạng thái hoạt động của Trợ lý Voice AI. |
| `color.success` | `#15803D` | Thông báo thành công, đơn hàng đã chốt, trạng thái "Đã xong/Đã phục vụ". |
| `color.warning` | `#D97706` | Trạng thái làm rõ câu lệnh (Clarification), cảnh báo Bếp chờ quá 15 phút. |
| `color.danger` | `#DC2626` | Trạng thái món hết hàng (Out of Stock), hủy món, báo lỗi mạng. |
| `color.neutral.bg` | `#F8FAFC` | Màu nền ứng dụng di động di động (Mobile App background). |
| `color.neutral.card` | `#FFFFFF` | Nền thẻ món ăn, nền giỏ hàng Order Draft và Modal dialog. |
| `color.text.main` | `#0F172A` | Văn bản chính, tiêu đề món ăn, tổng tiền. |
| `color.text.muted` | `#64748B` | Mô tả phụ, ghi chú dị ứng, thời gian tạo đơn. |
| `radius.md` | `12px` | Bo góc cho Thẻ món ăn (Cards), Ô nhập liệu (Inputs), Modal dialogs. |
| `radius.full` | `9999px` | Bo góc cho Nút bấm Micro (Voice FAB), Nhãn trạng thái (Status Pills). |
| `space.base` | `4px scale` | Hệ tỷ lệ khoảng cách: 4px / 8px / 12px / 16px / 24px / 32px. |
| `type.*` | 13 kiểu chữ — xem §2 | Hệ thống Typography Scale đầy đủ cho Heading, Paragraph, Label & Button, Numeric & Overline (chi tiết cỡ/dòng, Weight, Thẻ HTML tại §2). |

---

## 2. TYPOGRAPHY SCALE (BỘ KIỂU CHỮ)

> **Nguồn**: Kiểm kê toàn bộ khai báo `font-size` / `font-weight` / `line-height` trong prototype `frontend/prototype/css/styles.css` (Output #10), gom nhóm thành 13 kiểu chữ chuẩn. Các cỡ lẻ nửa pixel của prototype (14.5 / 13.5 / 12.5 / 11.5 / 10.5px) đã được làm tròn — bảng dưới là chuẩn duy nhất khi thiết kế màn mới trên Figma và viết CSS.

**Font family (duy nhất, không dùng webfont)**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` — system UI stack, hiển thị tiếng Việt đầy đủ.

### 2.1 Heading (Tiêu đề)

| Kiểu chữ | Token | Thẻ HTML | Cỡ/Dòng (px) | Weight | Màu chữ | Ứng dụng |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **H1 – Display** | `type.display` | `<h1>` | 24 / 30 | 700 | `color.text.main` | Tiêu đề màn hình chọn vai (Screen 0). |
| **H2 – Section** | `type.heading` | `<h2>` | 18 / 24 | 700 | `color.text.main` | Tiêu đề khối trong màn hình (vùng KDS, nhóm "Đơn đã gửi"). |
| **H3 – Dialog title** | `type.title` | `<h3>` | 16 / 22 | 700 | `color.text.main` | Tiêu đề Modal (Xác nhận gửi bếp, Hỏi lại món mơ hồ, Thành công) và Bottom Sheet. |
| **H4 – Card title** | `type.subhead` | `<h3>` | 15 / 20 | 700 | `color.text.main` | Tên món trên Thẻ món, mã đơn trên Ticket KDS, tên thương hiệu trên Top bar (brand dùng Weight 800). |

### 2.2 Paragraph (Đoạn văn)

| Kiểu chữ | Token | Thẻ HTML | Cỡ/Dòng (px) | Weight | Màu chữ | Ứng dụng |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **Body** | `type.body` | `<p>`, `<input>` | 14 / 20 | 400 | `color.text.main` | Nội dung chính Modal, dòng món trong Order Draft và Ticket KDS, ô nhập tìm kiếm. |
| **Body small** | `type.desc` | `<p>` | 13 / 20 | 400 | `color.text.main` | Bubble chat Trợ lý AI / Khách, Empty state, cảnh báo món hết hàng. |
| **Caption** | `type.caption` | `<small>` | 12 / 16 | 400 | `color.text.muted` | Ghi chú chân thẻ ("Đã gửi 19:42"), ghi chú dị ứng, thời gian tạo đơn. |

### 2.3 Nhãn & Nút (Labels & Buttons)

| Kiểu chữ | Token | Thẻ HTML | Cỡ/Dòng (px) | Weight | Màu chữ | Ứng dụng |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **Button** | `type.button` | `<button>` | 14 / 20 | 700 (CTA chính: 800) | `#FFFFFF` trên `color.primary` | Toàn bộ nút bấm: Gửi bếp, Đã phục vụ, Nút Micro, nút Ghost. |
| **Chip** | `type.chip` | `<button>` | 12 / 16 | 600 | `color.text.main` | Chip kịch bản mẫu giọng nói, chip Tồn kho, chip số bàn. |
| **Pill / Badge** | `type.badge` | `<span>` | 11 / 16 | 700–800 | Theo trạng thái (`success` / `warning` / `danger`) | Pill Chờ / Đang nấu / Sẵn sàng, badge "Hết hàng", badge "HOT", số thông báo chuông. |

### 2.4 Số liệu & Nhãn hoa (Numeric & Overline)

| Kiểu chữ | Token | Thẻ HTML | Cỡ/Dòng (px) | Weight | Màu chữ | Ứng dụng |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **Price / Number** | `type.price` | `<b>` | 14 / 20 | 800 | `color.primary` | Giá món, tổng tiền hóa đơn, Timer Ticket KDS, đồng hồ — bắt buộc `font-variant-numeric: tabular-nums`. |
| **Order code** | `type.order-code` | `<p>` | 22 / 28 | 900 | `color.primary` | Mã đơn hàng (`#B06-001`) trong Modal thành công. |
| **Overline** | `type.overline` | `<h4>`, `<th>` | 11 / 14 | 700 | `color.text.muted` | Nhãn cột bảng hóa đơn, nhãn bước Timeline — `text-transform: uppercase` + `letter-spacing: .04em`. Tiêu đề nhóm section (`h4`) dùng kiểu này ở cỡ 14px. |

### 2.5 Quy tắc Typography (Typography Rules)

1. **Số động luôn dùng `tabular-nums`**: mọi số thay đổi theo thời gian (giá, tổng tiền, timer, đồng hồ, số lượng) đặt `font-variant-numeric: tabular-nums` để cột không giật khi số nhảy (prototype đã áp dụng tại `.clock`, `.t-timer`).
2. **Transcript giọng nói**: dùng kiểu **Body** (14/20) + `font-style: italic`, nền màu `color.primary` nhạt — tham chiếu `.transcript` trong prototype.
3. **Chữ hoa có kiểm soát**: chỉ Overline và Pill/Badge được viết hoa toàn bộ, luôn kèm `letter-spacing: .04em`.
4. **Loại trừ**: cỡ chữ 11–12px trên thanh Demo (`.demo-bar`, `.demo-tag`) chỉ tồn tại trong bản demo, không đưa vào hệ thống thiết kế.

---

## 3. COMPONENT INVENTORY (DANH MỤC LINH KIỆN & TRẠNG THÁI)

| Component Name | Variants / States | Accessibility & Behavior (Tiêu chí tiếp cận & Hành vi) |
| :--- | :--- | :--- |
| **VoiceButton** | `idle`, `listening`, `processing`, `disabled`, `error` | Đổi nhãn nút bấm theo trạng thái; hiển thị viền focus rõ ràng; bấm phím `Escape` hoặc nhấp lại để dừng thu âm. |
| **AssistantMessage** | `text`, `product-list`, `clarification`, `error` | Thiết lập thuộc tính `aria-live="polite"` để trình đọc màn hình phát âm thanh phản hồi AI mới ngay khi xuất hiện. |
| **ProductCard** | `default`, `out-of-stock`, `selected` | Giá tiền và trạng thái tồn kho đọc trực tiếp từ Props/Vault dữ liệu hệ thống; vô hiệu hóa nút bấm khi món mang trạng thái Out of Stock. |
| **CartItem** | `default`, `updating`, `error` | Vô hiệu hóa các thao tác bấm liên tục (Debounce mutation) khi đang cập nhật số lượng món trong giỏ. |
| **OrderDraft** | `review`, `changed`, `expired` | Hiển thị rõ dòng nhãn màu đỏ *"Bản nháp - Chưa gửi bếp"* ở đầu giỏ hàng cho đến khi bấm nút xác nhận chốt đơn. |
| **ConfirmDialog** | `default`, `loading`, `error` | Bẫy con trỏ phím (`Focus trap`); bấm phím `Enter` để xác nhận gửi bếp; bấm phím `Escape` để hủy bỏ modal. |
| **KDSTicketCard** | `pending`, `cooking`, `ready`, `overdue` | Thẻ đơn tại Bếp; tự động đổi nền nhấp nháy Đỏ khi thời gian chờ quá 15 phút (`REQ-08`). |
| **WaiterAlertCard** | `ready`, `served` | Phát âm thanh chuông báo khi có món từ Bếp hoàn tất (`REQ-07`); nút bấm lớn `Đã phục vụ` kích thước $\ge 44\text{px}$. |

---

## 3. DESIGN & RESPONSIVE RULES (QUY TẮC THIẾT KẾ)

1. **Quy tắc Thiết kế Di động (Mobile-First Breakpoint)**:
   - Khung hình di động Khách hàng: `max-width: 430px` (Chiều rộng Smartphone tiêu chuẩn).
   - Khung hình Bếp KDS / Waiter Tablet: `min-width: 768px` (Màn hình Tablet làm việc).
2. **Tiêu chuẩn Tiếp cận (Accessibility Standard - WCAG AA)**:
   - Kích thước vùng chạm cảm ứng (Touch Target Size): Tối thiểu $44 \times 44\text{px}$ cho tất cả nút bấm.
   - Độ tương phản màu sắc (Color Contrast Ratio): Tối thiểu 4.5:1 giữa chữ và nền.
   - Nhãn rõ ràng (Explicit Labels): Mọi nút biểu tượng icon (Micro, 🗑, ＋, −) đều phải chứa thuộc tính `aria-label`.

---

### CSS handoff

```css
:root {
  --font-sans: "Be Vietnam Pro", "Segoe UI", Roboto, Arial, sans-serif;
  --type-h1: 800 24px/32px var(--font-sans);
  --type-h2: 700 18px/26px var(--font-sans);
  --type-h3: 700 15px/20px var(--font-sans);
  --type-body: 400 14px/20px var(--font-sans);
  --type-note: 400 12px/18px var(--font-sans);
  --type-button: 700 14px/20px var(--font-sans);
  --type-badge: 700 11px/14px var(--font-sans);
}

.numeric { font-variant-numeric: tabular-nums; }
```
