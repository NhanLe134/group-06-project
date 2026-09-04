# Danh sách Yêu cầu (Requirements List)

| ID | Loại | Yêu cầu (Requirement) | Nguồn | Priority |
|---|---|---|---|---|
| REQ-01 | FR | Trợ lý ảo AI tư vấn món ăn dựa trên sở thích/dị ứng của khách. | [Anh Tuấn (P1)](../02-Research/interview-notes.md) | Must |
| REQ-02 | BR | [Explicit Confirmation](glossary.md): Bắt buộc phải có màn hình [Order Draft](glossary.md) để người dùng dò lại và bấm xác nhận chốt đơn. Không cho phép AI tự chốt. | [Anh Tuấn (P1)](../02-Research/interview-notes.md) | Must |
| REQ-03 | FR | Chức năng Split Bill (Chia tiền) theo người/món. | [Anh Tuấn (P1)](../02-Research/interview-notes.md) | Should |
| REQ-04 | FR | Thanh toán bằng quét mã QR MoMo/VNPAY tại bàn. | [Chị Lan (P2)](../02-Research/interview-notes.md) | Must |
| REQ-05 | FR | Giao diện Tablet hỗ trợ Voice-to-order cho nhân viên phục vụ. | [Chị Lan (P2)](../02-Research/interview-notes.md) | Must |
| REQ-06 | FR | [Table Session](glossary.md) Map hiển thị trạng thái bàn bằng màu sắc (Trống, Đang ăn, Cần dọn). | [Chị Lan (P2)](../02-Research/interview-notes.md) | Must |
| REQ-07 | FR | App thông báo âm thanh khi món nấu xong từ KDS [Kitchen Ticket](glossary.md). | [Chị Lan (P2)](../02-Research/interview-notes.md) | Must |
| REQ-08 | FR | Màn hình KDS sắp xếp đơn ưu tiên, nhấp nháy Đỏ khi chờ quá 15 phút. | [Anh Hùng (P3)](../02-Research/interview-notes.md) | Must |
| REQ-09 | FR | Nút "[Out of Stock](glossary.md)" tự động khóa món trên mọi menu của khách và phục vụ. | [Anh Hùng (P3)](../02-Research/interview-notes.md) | Must |
| REQ-10 | BR | Phân quyền RBAC: Chỉ tài khoản Manager mới có quyền Void/Refund món đã đẩy xuống bếp. | [Quản lý](../02-Research/interview-notes.md) | Must |
| REQ-11 | FR | CMS Quản lý Menu (Thêm, Sửa, Đổi giá, Cập nhật hình) đồng bộ AI. | [Quản lý](../02-Research/interview-notes.md) | Must |
| REQ-12 | FR | Màn hình nhập số liệu thực tế để Đối soát tồn kho (Inventory Reconciliation). | [Quản lý](../02-Research/interview-notes.md) | Should |
| REQ-13 | FR | Dashboard báo cáo Real-time (Doanh thu, Top món, Tỷ lệ lấp đầy). | [Quản lý](../02-Research/interview-notes.md) | Could |
| REQ-14 | FR | Tích hợp thanh toán trực tuyến bằng thẻ quốc tế Visa/Mastercard qua cổng Stripe. | (AI đề xuất) | [Out of Scope](scope.md) |
| REQ-15 | BR | Xử lý món hết hàng đang nằm trong [Order Draft](glossary.md): Khi món chuyển [Out of Stock](glossary.md) (REQ-09) trong khi khách chưa bấm xác nhận, món hiển thị mờ (grayed-out) kèm nhãn đỏ "Món đã hết"; nút "Xác nhận gửi bếp" (Explicit Confirmation) bị Disabled cho đến khi khách gỡ món hết hàng; AI Assistant thông báo nhắc khách bỏ món. | [ADR-001](../08-Decisions/decision-log.md) | Must |
