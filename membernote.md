# Phân chia Task & Kế hoạch (US-08 & Manager Dashboard)

## 1. Phần của Nhã (US-08)
- **Giao diện phụ trách:** Tab `Phiếu Kiểm kê` (Đổi tên thành **Báo cáo Hao hụt / Đối soát Tiêu hao**).
- **Kế hoạch triển khai (US-08):**
  - Không làm kiểm đếm kho tĩnh nhàm chán. Chuyển sang làm **Đối soát nguyên liệu cuối ngày**.
  - **Logic:** `[Lấy ra đầu ngày] - [Cân lại cuối ngày] = [Tiêu hao Thực tế]`.
  - **Độ thông minh:** Lấy *Tiêu hao Thực tế* đem so sánh với *Tiêu hao Lý thuyết* (từ số lượng món POS đã bán). Nếu độ chênh lệch (Hao hụt) vượt mức 5%, tự động bắn cảnh báo ĐỎ lên hệ thống để Quản lý biết khâu nào đang làm rơi vãi hoặc lãng phí.

## 2. Phần của Bạn (Tu)
- **Giao diện phụ trách:** Tab `Tổng quan (Dashboard)` và Tab `Thực phẩm`.
- **Kế hoạch triển khai:**
  - **Tab Thực phẩm:** Làm chuẩn CRUD (Thêm/Sửa/Xóa) danh sách nguyên vật liệu cơ bản của nhà hàng (Tên, Đơn vị tính, Hình ảnh, Cảnh báo sắp hết hàng).
  - **Tab Dashboard:** Cần nâng cấp thêm các tính năng "AI" hoặc "Real-time" để giao diện nhìn xịn sò và đúng chất môn hệ thống thông tin. (Chi tiết xem gợi ý bổ sung).

## 3. Note ghép API cho màn hình Waiter (Tu - 06/10)
- **Quy tắc 1 (Trạng thái bàn):** Giữ nguyên trạng thái `dang_don_dep` giống Backend để UI báo rõ bàn nào đang có người dọn, tránh việc Lễ tân xếp khách vào nhầm. Bàn chỉ trở thành `trong` sau khi ấn nút Dọn xong.
- **Quy tắc 2 (Mapping Trạng thái món):** Dữ liệu ngầm lấy đúng mã của Backend (`cho_nau`, `dang_nau`, `da_xong`, `da_phuc_vu`). Khi hiển thị lên giao diện cho Waiter thì code FE tự map lại thành text chuyên nghiệp hơn (VD: `da_xong` -> "Sẵn sàng phục vụ/Cần bưng ngay", `dang_nau` -> "Bếp đang chuẩn bị").
- **Quy tắc 3 (Tên biến FE & BE):** Biến logic trong JS (`waiter.js`) cứ lấy theo đúng field trả về từ API Backend (`tenmon`, `giaban`, `sokhach`...) để xử lý cho mượt. Còn text tĩnh trên HTML hiện cho người dùng xem thì cứ giữ thiết kế xịn như hiện tại.
