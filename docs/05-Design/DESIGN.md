# Output #16 - Design System & Handoff (DESIGN.md) - Group 06

> **Tài liệu**: Quy chuẩn Hệ thống Thiết kế & Handoff (Design System & Handoff Specification)  
> **Phiên bản**: 1.0 (Chuẩn theo Mẫu Output #16 của Giảng viên)  
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
| `type.heading` | `20px / 28px` | Tiêu đề màn hình, tên món ăn nổi bật (Font Weight: 700). |
| `type.body` | `16px / 24px` | Văn bản nội dung chính, danh sách món trong giỏ (Font Weight: 400). |
| `type.caption` | `13px / 18px` | Thông tin phụ, nhãn trạng thái KDS, mã đơn hàng (Font Weight: 500). |

---

## 2. COMPONENT INVENTORY (DANH MỤC LINH KIỆN & TRẠNG THÁI)

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
