# Danh sách Yêu cầu (Requirements List)

| ID | Loại | Yêu cầu (Requirement) | Nguồn | Priority |
|---|---|---|---|---|
| REQ-01 | FR | Trợ lý ảo AI tư vấn món ăn dựa trên sở thích/dị ứng của khách. | Khách hàng | Must |
| REQ-02 | BR | Explicit Confirmation: Bắt buộc phải có màn hình Order Draft để người dùng dò lại và bấm xác nhận chốt đơn. Không cho phép AI tự chốt. | Khách hàng | Must |
| REQ-03 | FR | Chức năng Split Bill (Chia tiền) theo người/món. | Khách hàng | Should |
| REQ-04 | FR | Thanh toán bằng quét mã QR MoMo/VNPAY tại bàn. | Khách/Quản lý | Must |
| REQ-05 | FR | Giao diện Tablet hỗ trợ Voice-to-order cho nhân viên phục vụ. | Phục vụ | Must |
| REQ-06 | FR | Table Map hiển thị trạng thái bàn bằng màu sắc (Trống, Đang ăn, Cần dọn). | Phục vụ | Must |
| REQ-07 | FR | App thông báo âm thanh khi món nấu xong từ KDS. | Phục vụ | Must |
| REQ-08 | FR | Màn hình KDS sắp xếp đơn ưu tiên, nhấp nháy Đỏ khi chờ quá 15 phút. | Đầu bếp | Must |
| REQ-09 | FR | Nút "Out of Stock" tự động khóa món trên mọi menu của khách và phục vụ. | Đầu bếp | Must |
| REQ-10 | BR | Phân quyền RBAC: Chỉ tài khoản Manager mới có quyền Void/Refund món đã đẩy xuống bếp. | Quản lý | Must |
| REQ-11 | FR | CMS Quản lý Menu (Thêm, Sửa, Đổi giá, Cập nhật hình) đồng bộ AI. | Quản lý | Must |
| REQ-12 | FR | Màn hình nhập số liệu thực tế để Đối soát tồn kho (Inventory Reconciliation). | Quản lý | Should |
| REQ-13 | FR | Dashboard báo cáo Real-time (Doanh thu, Top món, Tỷ lệ lấp đầy). | Quản lý | Could |
| REQ-14 | FR | Tích hợp thanh toán trực tuyến bằng thẻ quốc tế Visa/Mastercard qua cổng Stripe. | (AI đề xuất) | **Out of Scope** |
