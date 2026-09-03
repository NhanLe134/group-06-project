# Glossary - Từ điển thuật ngữ dự án Restaurant Operations & Smart Ordering

| Thuật ngữ | Định nghĩa nghiệp vụ |
| :--- | :--- |
| Table Session | Phiên hoạt động của bàn ăn, gắn với mã bàn và các lượt gọi món trong ca phục vụ. |
| Kitchen Ticket | Phiếu hiển thị gọi món điện tử được truyền tức thì đến màn hình Bếp sau khi đơn được xác nhận. |
| Order Draft | Bản nháp gọi món ghi nhận danh sách món, số lượng, ghi chú tùy chọn trước khi chốt gửi bếp. |
| Explicit Confirmation | Hành động xác nhận chủ động bằng cách bấm nút "Gửi Bếp" hoặc "Xác nhận Thanh toán", ngăn chặn thao tác nhầm. |
| Intent | Ý định có cấu trúc bóc tách từ câu nói/tin nhắn của người dùng (ví dụ: RECOMMEND_DISH, ADD_TO_ORDER, REQUEST_BILL). |
| Tool Call | Lệnh JSON có schema cố định mà AI phát ra để backend thực thi (AI không truy cập DB trực tiếp). |
| Grounded Response | Câu trả lời của AI chỉ được lấy từ dữ liệu thực tế (Menu catalog, tồn kho, trạng thái bàn) do backend cung cấp. |
| Clarification | Phản hồi của AI hỏi lại người dùng khi câu lệnh chưa đủ thông tin (chưa rõ món, độ cay, hoặc trùng tên món). |
| Out of Stock (OOS) | Trạng thái món ăn tạm ngưng phục vụ khi nguyên liệu trong kho đã cạn kiệt. |
| Batching Suggestion | Gợi ý của AI gom các món cùng loại giữa các bàn để bếp nấu chung một mẻ, tiết kiệm thời gian và năng lượng. |
