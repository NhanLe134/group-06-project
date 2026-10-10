# TEST CASES CHI TIẾT — US-04: PHỤC VỤ BƯNG MÓN VÀ CẬP NHẬT TRẠNG THÁI

> **Tài liệu kiểm soát:** `testing/test_cases/test-cases-US04.md`
> **Màn hình kiểm thử:** Tablet Phục vụ (`waiter.html`, `waiter.js`)

| ID | Category | Type | Priority | Description | Preconditions | Test Steps | Expected Result | Actual Result | Result | BUG Status |
|---|---|---|---|---|---|---|---|---|---|---|
| TC-US04-01 | Thông báo | Chức năng | Cao | Kiểm tra nhận thông báo đồ uống hoàn thành | Khách order đồ uống, bar làm xong | 1. Bar báo xong đồ uống trên KDS.<br>2. Quan sát thẻ thông báo của Waiter. | Hiển thị thẻ thông báo màu xanh lam "CẦN LẤY NƯỚC". | | | |
| TC-US04-02 | Thông báo | Chức năng | Cao | Kiểm tra nhận thông báo đồ ăn hoàn thành | Khách order đồ ăn, bếp làm xong | 1. Bếp báo xong đồ ăn.<br>2. Quan sát thẻ thông báo. | Hiển thị thẻ thông báo màu xanh lá "CẦN BƯNG MÓN". | | | |
| TC-US04-03 | Thông báo | Chức năng | Cao | Kiểm tra nhận thông báo dọn dẹp bàn | Bàn 01 vừa thanh toán xong | 1. Thu ngân chốt thanh toán.<br>2. Quan sát màn hình Waiter. | Hiển thị thẻ báo màu đỏ "DỌN DẸP BÀN". | | | |
| TC-US04-04 | Cập nhật bàn | Chức năng | Cao | Kiểm tra sơ đồ bàn chuyển sang trạng thái Đang dùng bữa | Bàn đang trống | 1. Lên order mới cho bàn.<br>2. Quan sát màu sắc bàn trên sơ đồ. | Bàn chuyển sang màu nền Đỏ. | | | |
| TC-US04-05 | Cập nhật bàn | Chức năng | Cao | Kiểm tra sơ đồ bàn chuyển sang trạng thái Dọn dẹp | Bàn màu Đỏ, khách ra về | 1. Thu ngân thanh toán hóa đơn.<br>2. Quan sát sơ đồ bàn. | Bàn chuyển sang màu xám/kèm biểu tượng chổi dọn dẹp. | | | |
| TC-US04-06 | Cập nhật bàn | Chức năng | Cao | Kiểm tra sơ đồ bàn khôi phục trạng thái Trống | Bàn đang trạng thái Dọn dẹp | 1. Waiter bấm nút "Đã dọn xong".<br>2. Quan sát sơ đồ bàn. | Bàn chuyển về màu Trắng (Sẵn sàng đón khách mới). | | | |
| TC-US04-07 | Chi tiết bàn | Giao diện | Trung bình | Kiểm tra ngăn kéo chi tiết bàn hiển thị đủ 3 phân vùng món | Bàn có món chờ nấu, đang nấu, chờ bưng, đã bưng | 1. Click vào Bàn 01 trên sơ đồ.<br>2. Cuộn xem ngăn kéo (Drawer). | Danh sách món được chia rõ ràng thành: "Chờ nấu", "Đang nấu", "Cần phục vụ", "Đã phục vụ". | | | |
| TC-US04-08 | Gọi thêm món | Chức năng | Trung bình | Kiểm tra tính năng gọi thêm món từ sơ đồ bàn | Bàn đang dùng bữa | 1. Click vào Bàn 01.<br>2. Bấm nút "Thêm món". | Hệ thống chuyển hướng sang màn hình Menu (customer) với đúng Session của bàn. | | | |
| TC-US04-09 | Phục vụ món | Chức năng | Cao | Kiểm tra xác nhận bưng món thành công | Bàn có món chờ bưng | 1. Bấm nút "Đã hoàn tất" trên thẻ thông báo.<br>2. Kiểm tra lại ngăn kéo bàn. | Thẻ thông báo biến mất. Trong ngăn kéo bàn, món chuyển sang nhóm "Đã phục vụ". | | | |
| TC-US04-10 | Hủy món | Chức năng | Cao | Kiểm tra hủy hoàn toàn món đang chờ nấu (Qty = 0) | Có món trạng thái Chờ nấu | 1. Chọn món Chờ nấu.<br>2. Bấm nút Sửa.<br>3. Nhập số lượng 0 và Lưu. | Món bị xóa hoàn toàn khỏi đơn hàng. Hệ thống báo Toast xanh thành công. | | | |
| TC-US04-11 | Sửa số lượng | Chức năng | Cao | Kiểm tra giảm số lượng món đang chờ nấu | Món chờ nấu có Qty = 3 | 1. Chọn món chờ nấu.<br>2. Giảm số lượng xuống 2.<br>3. Bấm Lưu. | Số lượng món cập nhật còn 2. Hóa đơn bàn được tính lại tổng tiền. | | | |
| TC-US04-12 | Sửa số lượng | Chức năng | Cao | Kiểm tra tăng số lượng món đang chờ nấu | Món chờ nấu có Qty = 1 | 1. Chọn món chờ nấu.<br>2. Tăng số lượng lên 3.<br>3. Bấm Lưu. | Số lượng món cập nhật thành 3. | | | |
| TC-US04-13 | Sửa số lượng | Ngoại lệ | Cao | Kiểm tra chặn sửa số lượng thành chữ/ký tự lạ | Món chờ nấu | 1. Bấm Sửa món.<br>2. Nhập "abc" hoặc "-5".<br>3. Bấm Lưu. | Trường nhập liệu báo lỗi định dạng, không cho phép lưu, không gọi API. | | | |
| TC-US04-14 | Sửa số lượng | Ngoại lệ | Cao | Kiểm tra chặn sửa số lượng món Đang nấu | Món đang nấu (Cooking) | 1. Mở ngăn kéo chi tiết bàn.<br>2. Tìm món "Đang nấu". | Giao diện KHÔNG hiển thị nút Sửa/Hủy cho món Đang nấu. | | | |
| TC-US04-15 | Sửa số lượng | Ngoại lệ | Cao | Kiểm tra chặn sửa số lượng món Đã phục vụ | Món đã phục vụ (Served) | 1. Tìm món "Đã phục vụ". | Giao diện KHÔNG hiển thị nút Sửa/Hủy. | | | |
| TC-US04-16 | Sửa số lượng | Bảo mật | Cao | Kiểm tra API Backend chặn lệnh hủy món đã phục vụ | Món đã phục vụ | 1. Dùng Postman gọi thẳng API `void` cho món đã phục vụ. | Backend trả về HTTP 400 (INVALID_STATE) "Tuyệt đối không được sửa món đã phục vụ". | | | |
| TC-US04-17 | Xử lý sự cố | Ngoại lệ | Trung bình | Kiểm tra hành vi bấm Phục vụ khi mất kết nối mạng | Mất mạng Internet | 1. Tắt Wifi thiết bị.<br>2. Bấm "Đã hoàn tất". | Hệ thống chặn thao tác. Hiện Toast vàng "Đang ngoại tuyến, thao tác lưu tạm". | | | |
| TC-US04-18 | Xử lý sự cố | Chức năng | Trung bình | Kiểm tra tự động đồng bộ khi có mạng trở lại | Thiết bị đang lưu cache offline | 1. Bật lại Wifi.<br>2. Làm mới trang Waiter. | Ứng dụng tự động đồng bộ ngầm. Món hiển thị đúng trạng thái "Đã phục vụ". | | | |
| TC-US04-19 | Đề xuất AI | Chức năng | Thấp | Kiểm tra thông báo gợi ý bán chéo (Upsell) | Bàn đang dùng bữa | 1. Lên order món chính cho Bàn 01.<br>2. Đợi 45 phút không phát sinh order mới. | Nhận được Push Notification xúi Waiter ra mời thêm đồ tráng miệng/nước uống. | | | |
