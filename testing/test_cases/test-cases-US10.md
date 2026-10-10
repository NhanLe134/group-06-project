# TEST CASES CHI TIẾT — US-10: SMART BATCHING

> **Tài liệu kiểm soát:** `testing/test_cases/test-cases-US10.md`
> **Màn hình kiểm thử:** Tablet Phục vụ (`waiter.html`, `waiter.js`)

| ID | Category | Type | Priority | Description | Preconditions | Test Steps | Expected Result | Actual Result | Result | BUG Status |
|---|---|---|---|---|---|---|---|---|---|---|
| TC-US10-01 | Gom thông báo | Chức năng | Cao | Kiểm tra gom thông báo và âm thanh trong vòng 10 giây | Bếp hoàn thành 3 món của Bàn 01 | 1. Bếp báo xong món 1.<br>2. Chờ 2s báo món 2.<br>3. Chờ 3s báo món 3.<br>4. Đợi hết 10 giây. | Chỉ phát tiếng Ting 1 lần duy nhất. Xuất hiện 1 popup gộp ghi "Bàn 01: 3 món đã sẵn sàng". | | | |
| TC-US10-02 | Gom thông báo | Chức năng | Cao | Kiểm tra tách thông báo nếu vượt quá đếm ngược 10 giây | Bếp báo xong 2 món nhưng cách nhau 15s | 1. Bếp báo xong món 1.<br>2. Chờ 15s.<br>3. Bếp báo xong món 2. | Phát tiếng Ting 2 lần riêng biệt. Xuất hiện 2 popup thông báo rời rạc. | | | |
| TC-US10-03 | Gom mâm (Tray) | Chức năng | Cao | Kiểm tra gợi ý gom mâm khi CÙNG tên món và CÙNG khu vực | Phở Bò bàn 01 và 02 (Khu A) hoàn thành | 1. Bếp báo xong 2 món.<br>2. Nhìn lên thanh Gom món tiện đường. | Xuất hiện thẻ vàng Gom món ghi "2x Phở Bò (Giao đến: Bàn 01, Bàn 02)". | | | |
| TC-US10-04 | Gom mâm (Tray) | Ngoại lệ | Cao | Kiểm tra KHÔNG gom mâm nếu CÙNG tên nhưng KHÁC khu vực | Phở Bò bàn 01 (Khu A) và 04 (Khu B) | 1. Bếp báo xong món.<br>2. Quan sát UI. | Không sinh thẻ Gom mâm. Chỉ có các thẻ báo lẻ ở mục Thông báo mới nhất. | | | |
| TC-US10-05 | Gom mâm (Tray) | Ngoại lệ | Cao | Kiểm tra KHÔNG gom mâm nếu KHÁC tên món | Phở Bò và Trà Đá của bàn 01 | 1. Bếp báo xong món.<br>2. Quan sát UI. | Không sinh thẻ Gom mâm. Hai món tách biệt vì không chung 1 loại để gộp mâm tiện đường. | | | |
| TC-US10-06 | Gom mâm (Tray) | Ngoại lệ | Cao | Kiểm tra KHÔNG gom mâm nếu món chưa nấu xong | Phở Bò bàn 01 (Đang nấu) và 02 (Đã xong) | 1. Xem dữ liệu trên Waiter. | Không sinh thẻ Gom mâm vì 1 món chưa nấu xong (sai trạng thái). | | | |
| TC-US10-07 | Xử lý mâm gộp | Chức năng | Cao | Kiểm tra bấm "Lấy xong" trên mâm gộp sẽ hoàn tất toàn bộ | Mâm gộp có Bàn 01 và 02 | 1. Bấm nút "Lấy xong" trên mâm gộp.<br>2. Mở ngăn kéo bàn 01 và 02 để check. | Mâm gộp biến mất. Cả 2 món ở 2 bàn đều chuyển sang danh sách Đã phục vụ. | | | |
| TC-US10-08 | Tự động làm mới | Chức năng | Trung bình | Kiểm tra UI tự đắp món vào danh sách khi nghe tiếng Ting | Đang đứng màn hình Waiter | 1. Lắng nghe sự kiện WebSocket.<br>2. Không f5 trang. | Cột Thông báo mới nhất tự động đẩy món mới lên dòng đầu tiên. | | | |
