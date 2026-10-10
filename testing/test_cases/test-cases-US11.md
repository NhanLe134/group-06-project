# TEST CASES CHI TIẾT — US-11: QUẢN LÝ KHU VỰC BÀN

> **Tài liệu kiểm soát:** `testing/test_cases/test-cases-US11.md`
> **Màn hình kiểm thử:** Tablet Phục vụ (`waiter.html`, `waiter.js`)

| ID | Category | Type | Priority | Description | Preconditions | Test Steps | Expected Result | Actual Result | Result | BUG Status |
|---|---|---|---|---|---|---|---|---|---|---|
| TC-US11-01 | Lọc sơ đồ bàn | Giao diện | Cao | Kiểm tra bộ lọc mặc định là Tất cả khu vực | Vừa đăng nhập vào Waiter | 1. Truy cập màn hình Waiter.<br>2. Kiểm tra bộ lọc. | Bộ lọc chọn "Tất cả". Sơ đồ hiển thị đầy đủ 6 bàn. Nhận thông báo của cả 6 bàn. | | | |
| TC-US11-02 | Lọc sơ đồ bàn | Giao diện | Cao | Kiểm tra lọc theo Khu A ẩn các bàn thuộc Khu B | Đang ở chế độ Tất cả | 1. Đổi dropdown lọc thành "Khu A".<br>2. Quan sát sơ đồ bàn. | Chỉ hiển thị Bàn 01, 02, 03. Các bàn 04, 05, 06 bị ẩn hoàn toàn khỏi sơ đồ. | | | |
| TC-US11-03 | Lọc thông báo | Chức năng | Cao | Kiểm tra chặn thông báo của các khu vực không trực | Waiter đang lọc xem "Khu A" | 1. Dùng KDS báo xong món cho Bàn 04 (Khu B).<br>2. Quan sát Waiter. | Thiết bị Waiter KHÔNG kêu Ting, KHÔNG bật popup. | | | |
| TC-US11-04 | Đổi bộ lọc | Ngoại lệ | Trung bình | Kiểm tra dữ liệu món chờ không bị mất khi chuyển khu qua lại | Bàn 01 có món chờ bưng | 1. Đang xem Khu A.<br>2. Đổi sang Khu B.<br>3. Trở lại Khu A. | Bàn 01 xuất hiện lại và thông báo chờ bưng của bàn 01 vẫn còn nguyên, không bị sai lệch dữ liệu. | | | |
| TC-US11-05 | API Backend | API | Cao | Kiểm tra API /waiter/tables trả về đúng trường dữ liệu zone | Gọi API trực tiếp bằng Postman | 1. Call GET /waiter/tables.<br>2. Kiểm tra JSON response. | Dữ liệu trả về có trường `"zone": "Khu A"` cho Bàn 01, 02, 03 và `"Khu B"` cho Bàn 04, 05, 06. | | | |
