# Vault Q&A Benchmark - Group 06 (Restaurant Operations & Smart Ordering)
- Bộ kiểm chuẩn: 20 câu hỏi (Fact, Rule, Edge-case, Conflict, Unknown/Out of Scope, NFR)
- Người thực hiện kiểm chuẩn: Lê Thị Thanh Nhàn (Role: AI/Vault)

## BẢNG KIỂM CHUẨN ĐỘ CHÍNH XÁC (VAULT ACCURACY BENCHMARK)

| # | Câu hỏi kiểm tra | Kỳ vọng chuẩn (Expected Answer) | Nguồn/logic đối chiếu | AI thực tế trả lời | Đánh giá (KQ) |
| :---: | :--- | :--- | :--- | :--- | :---: |
| Q01 | Anh Tuấn gặp khó khăn gì khi chọn món cho gia đình? | Menu quá dày, khó gom ý kiến người già/trẻ em, nhân viên không nhớ rõ thành phần dị ứng. | `vault/02-Research/interview-notes.md` | Trích đúng khó khăn từ lời thoại Anh Tuấn. | Correct |
| Q02 | Chị Lan chỉ ra nguy cơ gì khi ghi order bằng giấy giờ cao điểm? | Chữ viết ngoáy làm bếp đọc nhầm món, dễ quên ghi chú "ít cay" của khách. | `vault/02-Research/interview-notes.md` | Nêu đúng lỗi chữ ngoáy và quên note khẩu vị. | Correct |
| Q03 | Bếp trưởng Hùng gặp bất tiện gì khi nhiều bàn cùng gọi khoai tây chiên? | Chiên lặp lại nhiều mẻ riêng lẻ gây tốn dầu và mất thời gian. | `vault/02-Research/interview-notes.md` | Trích đúng bất tiện chiên lẻ tẻ tốn dầu. | Correct |
| Q04 | Khách hàng có thể tự bấm nút Hủy đơn trên app sau khi đã gửi bếp không? | Tuyệt đối không. Khách không có quyền tự hủy; phải gọi Waiter kiểm tra Bếp chưa nấu mới hủy được. | `requirements.md` (BR-RO-05) | Khách không thể tự hủy trên app mà phải qua Waiter kiểm tra Bếp. | Correct |
| Q05 | AI Assistant có được phép tự ý giảm giá 10% cho khách đi đông người không? | Tuyệt đối không. Bảng giá chỉ lấy từ cơ sở dữ liệu backend. | `requirements.md` (BR-RO-01) | Trả lời cấm tự ý sửa giá/giảm giá theo BR-RO-01. | Correct |
| Q06 | Đơn gọi món có được tự động gửi xuống Bếp ngay khi khách vừa dứt lời nói không? | Không. Bắt buộc qua Order Draft và bấm nút Explicit Confirmation. | `requirements.md` (BR-RO-03, REQ-RO-04) | Trả lời cần bấm xác nhận gửi bếp. | Correct |
| Q07 | Món ăn có trạng thái Out of Stock thì hệ thống phải xử lý thế nào? | Khóa ngay trên menu, không cho thêm vào Order Draft, AI không được gợi ý món đó. | `requirements.md` (BR-RO-02, REQ-RO-12) | Trả lời khóa chọn món và ngưng gợi ý. | Correct |
| Q08 | Thu ngân đối soát tiền chuyển khoản của từng bàn bằng cách nào để tránh nhầm lẫn? | Tự động tạo mã QR thanh toán động gắn sẵn số tiền và mã bàn (Table ID). | `requirements.md` (BR-RO-06, REQ-RO-10) | Nêu đúng cơ chế QR động kèm mã bàn. | Correct |
| Q09 | Nếu khách nói "Cho 1 đĩa bò" trong khi menu có Bò xào cần và Bò sốt tiêu đen thì AI xử lý sao? | AI phải kích hoạt Clarification (hỏi lại) để khách chọn loại bò, không được tự chọn bừa. | `requirements.md` (BR-RO-04), `glossary.md` | Kích hoạt Clarification hỏi lại khách lựa chọn. | Correct |
| Q10 | Nếu khách yêu cầu món với số lượng 5 nhưng tồn kho chỉ còn 2 phần thì sao? | Hệ thống từ chối số lượng 5, thông báo chỉ còn 2 phần khả dụng. | `requirements.md` (BR-RO-02, REQ-RO-11) | Từ chối số lượng vượt tồn và báo số lượng còn lại. | Correct |
| Q11 | Nếu ghi chép phỏng vấn ghi khách muốn tự hủy đơn nhưng BR-RO-05 cấm thì nghe theo ai? | Nghe theo BR-RO-05 trong requirements.md vì đứng thứ bậc ưu tiên cao hơn interview-notes.md. | `vault/source-priority.md` | Trích đúng thứ tự ưu tiên tài liệu. | Correct |
| Q12 | Hệ thống có hỗ trợ thanh toán trực tiếp bằng quẹt thẻ tín dụng quốc tế Visa/Mastercard không? | Không hỗ trợ trong MVP; thuộc Out of Scope. | `requirements.md` (Scope Boundary) | KHÔNG. Nằm trong Out of Scope (requirements.md dòng 45). Phương thức duy nhất là QR động. | Correct |
| Q13 | Khách hàng quen có thể quét khuôn mặt (FaceID) tại bàn để tự động nhận diện thành viên không? | Không hỗ trợ; thuộc Out of Scope. | `requirements.md` (Scope Boundary) | KHÔNG. Nhận diện khuôn mặt nằm trong Out of Scope (requirements.md dòng 45). Chỉ có quét QR bàn. | Correct |
| Q14 | Khách có thể gọi điện thoại đến nhà hàng để AI tự động nhấc máy đặt bàn trước không? | KHÔNG ĐỦ DỮ LIỆU TRONG VAULT / Out of Scope. | `requirements.md` (Scope Boundary) | Trả lời: KHÔNG ĐỦ DỮ LIỆU TRONG VAULT. | Correct |
| Q15 | Nhà hàng có đồng bộ dữ liệu hóa đơn tự động với phần mềm kế toán MISA không? | KHÔNG ĐỦ DỮ LIỆU TRONG VAULT / Out of Scope. | `requirements.md` (Scope Boundary) | Trả lời: KHÔNG ĐỦ DỮ LIỆU TRONG VAULT. | Correct |
| Q16 | File âm thanh giọng nói của khách có được lưu trữ vĩnh viễn trên máy chủ không? | Mặc định không lưu trữ vĩnh viễn; transcript bị xóa sau khi phiên bàn kết thúc. | `requirements.md` (NFR-RO-02) | Dẫn đúng mã NFR-RO-02. | Correct |
| Q17 | Nhân viên Waiter có thể dùng tài khoản của mình để sửa đổi giá món ăn trên Menu không? | Không. Quyền chỉnh sửa menu thuộc về Quản lý; vi phạm nhận mã lỗi 403 Forbidden. | `requirements.md` (NFR-RO-03) | Trả lời không có quyền theo RBAC. | Correct |
| Q18 | Nếu micro của thiết bị bị hỏng thì khách và phục vụ có tiếp tục gọi món được không? | Có, 100% quy trình hỗ trợ nhập liệu bằng tay (Text fallback) trên màn hình. | `requirements.md` (NFR-RO-05) | Xác nhận dùng được text fallback. | Correct |
| Q19 | Tính năng AI Batching hỗ trợ gì cho Bếp trưởng Hùng? | Tự động phát hiện và gợi ý gom các món giống nhau giữa các bàn để nấu chung một mẻ. | `requirements.md` (REQ-RO-07) | Nêu đúng gợi ý gom món cùng mẻ. | Correct |
| Q20 | Tổng tiền thanh toán do thiết bị của khách tự tính gửi lên máy chủ có được chấp nhận không? | Không. Tổng tiền bắt buộc phải do Server-side tính toán tại thời điểm xuất hóa đơn. | `requirements.md` (BR-RO-06) | Trả lời Server-side tính toán. | Correct |
