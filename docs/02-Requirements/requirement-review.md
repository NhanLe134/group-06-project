# Phân tích Rủi ro & Điểm mơ hồ (Requirement Review)
> Bảng phân tích chi tiết nhằm phát hiện các gap (khoảng trống) và contradiction (mâu thuẫn) trong yêu cầu.

| ID | Yêu cầu | Rủi ro / Điểm mơ hồ (Gap) | Câu hỏi cần làm rõ |
|---|---|---|---|
| REQ-01 | AI tư vấn món dựa trên sở thích | AI có thể tư vấn sai món gây dị ứng nếu dữ liệu menu chưa gán thẻ (tag) nguyên liệu chuẩn xác. | Dữ liệu món ăn hiện tại đã có đủ Data Tag (cay, dị ứng, chay) chưa? |
| REQ-03 | Chức năng Split Bill | Luồng tính toán chia tiền cực kỳ phức tạp nếu có áp dụng Voucher giảm giá chung cho toàn bill. | Voucher giảm giá sẽ áp dụng TRƯỚC hay SAU khi thực hiện thao tác chia bill? |
| REQ-05 | Tablet Voice-to-order | Công nghệ nhận diện giọng nói trong môi trường nhà hàng quá ồn ào (nhạc lớn, tiếng người) có thể kém chính xác. | Có cần mua thêm micro định hướng/chống ồn cho Tablet của nhân viên không? |
| REQ-06 | Table Map hiển thị trạng thái | Trạng thái "Cần dọn" có thể bị miss nếu nhân viên quên xác nhận. | Phục vụ có cần quyền cập nhật trạng thái "Cần dọn" bằng tay hay hệ thống tự động qua AI Camera? |
| REQ-07 | App thông báo món nấu xong | Phục vụ không cầm máy liên tục có thể bỏ lỡ thông báo đẩy. | Báo hiệu có cần tự động lặp lại liên tục (Snooze) cho đến khi nhân viên xác nhận đã bưng không? |
| REQ-08 | KDS nhấp nháy Đỏ khi đợi >15p | Màn hình cảm ứng KDS dễ bị hỏng do hơi nước, dầu mỡ và nhiệt độ cao trong bếp. | Bếp sử dụng màn hình chuyên dụng công nghiệp hay dùng Tablet phổ thông bọc ốp chống nước? |
| REQ-09 | Nút "Out of Stock" | Đầu bếp làm việc vội lỡ tay chạm nhầm nút Out of Stock gây thất thoát doanh số cả buổi. | Cần có hộp thoại xác nhận (Confirm popup) xuất hiện khi bấm nút báo hết hàng không? |
| REQ-11 | CMS Quản lý Menu | Quản lý up hình độ phân giải quá cao (từ iPhone) sẽ làm chậm thời gian tải menu của khách. | Cần cơ chế tự động nén dung lượng ảnh (Image compression) ở backend khi upload không? |
| REQ-12 | Đối soát tồn kho thực tế | Nhân viên mệt mỏi cuối ngày có thể nhập nhầm (typo) số liệu kiểm đếm kho. | Ai là người chịu trách nhiệm xác nhận (Approve) phiếu kiểm kho cuối cùng trên hệ thống? |
| REQ-13 | Dashboard Real-time | Truy vấn tính toán Real-time liên tục trên cùng Database giao dịch có thể làm chậm tốc độ gọi món. | Dữ liệu Dashboard chỉ cập nhật theo Batch (mỗi 5 phút/lần) thay vì Real-time 100% được không? |
