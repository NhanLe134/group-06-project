# Danh mục Yêu cầu Hệ thống (Requirement Inventory) - Nhóm 06
Hệ thống: Restaurant Operations & Smart Ordering
Workflow cốt lõi: Table/order -> Kitchen -> Serve -> Pay -> Close
Nguồn gốc: Phỏng vấn Anh Tuấn (P1), Chị Lan (P2), Anh Hùng (P3) tại `vault/02-Research/interview-notes.md`

## 1. Functional Requirements (Yêu cầu chức năng - FR)
| ID | Loại | Mô tả yêu cầu | Nguồn truy vết | Priority | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| REQ-RO-01 | FR | Khách hàng quét mã QR tại bàn để mở menu điện tử và gọi món bằng giọng nói hoặc văn bản. | P1 (Tuấn) | Must | Quét đúng mã bàn, mở giao diện menu; nhận diện giọng nói tiếng Việt chuẩn xác. |
| REQ-RO-02 | FR | Trợ lý AI tư vấn mâm cơm/set món theo số lượng người, tầm giá và loại trừ dị ứng từ Menu thực tế. | P1 (Tuấn) | Must | AI chỉ gợi ý món có trong menu, không gợi ý món chứa thành phần dị ứng đã khai báo. |
| REQ-RO-03 | FR | Khách hàng/Waiter xem bản nháp (Order Draft) kèm hình ảnh, tùy chọn ghi chú khẩu vị (ít cay, không hành). | P1 (Tuấn), P2 (Lan) | Must | Hiển thị đủ tên món, số lượng, ghi chú tùy chọn và đơn giá chuẩn từ hệ thống. |
| REQ-RO-04 | FR | Đơn gọi món chỉ được chuyển thành order chính thức sau khi bấm nút Explicit Confirmation. | P1, P2, BR-RO-03 | Must | Bấm "Xác nhận gửi bếp" mới gửi đơn; không tự động gửi đơn khi khách đang nói thử. |
| REQ-RO-05 | FR | Màn hình KDS của Bếp hiển thị danh sách order và ghi chú món theo thời gian thực thay cho máy in giấy. | P3 (Hùng) | Must | Đơn từ bàn xuất hiện trên KDS trong < 1 giây; ghi chú món được bôi đậm nổi bật. |
| REQ-RO-06 | FR | Bếp trưởng có thể cập nhật trạng thái chế biến từng món (Đang nấu, Đã xong) trên màn hình KDS. | P3 (Hùng) | Must | Thao tác đổi trạng thái cập nhật đồng bộ tức thì sang thiết bị của nhân viên phục vụ. |
| REQ-RO-07 | FR | AI KDS Assistant tự động nhận diện và gợi ý gom các món trùng nhau giữa các bàn để nấu chung một mẻ. | P3 (Hùng) | Must | Có từ 2 bàn trở lên cùng gọi món chiên/xào gần thời điểm, hiển thị gợi ý nấu chung. |
| REQ-RO-08 | FR | Khách hàng không thể tự hủy món sau khi đã gửi bếp; muốn hủy phải gửi yêu cầu tới Waiter xử lý. | P2 (Lan), BR-RO-05 | Must | Giao diện khách không có nút "Tự hủy đơn"; chỉ có nút "Gọi nhân viên hỗ trợ". |
| REQ-RO-09 | FR | Waiter kiểm tra trạng thái từ Bếp và thực hiện hủy món trên thiết bị nếu bếp chưa nấu. | P2 (Lan) | Must | Phục vụ xem được trạng thái chế biến; chỉ nút hủy được kích hoạt khi món chưa sang "Đang nấu". |
| REQ-RO-10 | FR | Hệ thống tự động tạo mã QR thanh toán động kèm chính xác số tiền và mã bàn tại thời điểm thanh toán. | P2 (Lan) | Must | Khách quét mã thanh toán có sẵn mã bàn trong nội dung, thu ngân đối soát tự động tức thì. |
| REQ-RO-11 | FR | Quản lý tồn kho nguyên liệu, tự động trừ tồn kho theo định lượng khi món ăn được xác nhận nấu. | P3 (Hùng) | Must | Tồn kho nguyên liệu giảm tương ứng định lượng món bán ra; cảnh báo khi chạm ngưỡng tối thiểu. |
| REQ-RO-12 | FR | Tự động chuyển trạng thái món sang "Tạm ngưng phục vụ" (Out of Stock) khi nguyên liệu không còn đủ. | P3 (Hùng), BR-RO-02 | Must | Menu tự động khóa chọn món hết hàng; AI không được gợi ý món đang Out of Stock. |

## 2. Non-Functional Requirements (Yêu cầu phi chức năng - NFR)
| ID | Loại | Mô tả yêu cầu | Nguồn | Priority | Tiêu chí nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| NFR-RO-01 | NFR | Thời gian phản hồi giao diện cho thao tác gọi món hoặc tư vấn AI phải <= 2.5 giây. | Constraint | Must | Độ trễ API đạt p95 <= 2.5s ở môi trường mạng thử nghiệm. |
| NFR-RO-02 | NFR | Không lưu trữ vĩnh viễn file âm thanh giọng nói; bản ghi transcript xóa sau khi đóng phiên bàn. | Privacy | Must | Thư mục audio thô rỗng; cơ sở dữ liệu không có cột lưu binary audio. |
| NFR-RO-03 | NFR | Kiểm soát quyền truy cập chặt chẽ (RBAC); Waiter/Khách không gọi được API thanh toán của Thu ngân. | Security | Must | Gửi request trái quyền nhận mã lỗi 403 Forbidden. |
| NFR-RO-04 | NFR | Mọi thao tác xác nhận đơn, hủy món và thanh toán phải ghi nhận Audit Log có cấu trúc. | Compliance | Must | Bảng audit_logs ghi nhận đủ: actor_id, action, timestamp, order_id. |
| NFR-RO-05 | NFR | Giao diện hỗ trợ đầy đủ chế độ nhập tay (Text fallback) khi tính năng giọng nói gặp sự cố. | Accessibility | Must | 100% workflow Table -> Kitchen -> Pay hoàn thành bình thường không cần micro. |

## 3. Business Rules (Quy tắc nghiệp vụ cốt lõi - BR)
| ID | Quy tắc nghiệp vụ | Căn cứ thực tế |
| :--- | :--- | :--- |
| BR-RO-01 | Bảng giá món ăn và trạng thái tồn kho chỉ được lấy từ cơ sở dữ liệu backend; AI Assistant tuyệt đối không được tự sinh giá, tự sửa giá hoặc tự áp mã giảm giá. | Bảo toàn doanh thu |
| BR-RO-02 | Không cho phép thêm món vào Order Draft nếu số lượng yêu cầu vượt quá tồn kho nguyên liệu khả dụng; món hết hàng phải khóa ngay trên menu. | Anh Hùng (Kho) |
| BR-RO-03 | Mọi đơn gọi món bắt buộc phải có thao tác bấm xác nhận rõ ràng (Explicit Confirmation) trên Order Draft; không được tự động gửi đơn khi khách chưa duyệt. | Anh Tuấn (Khách) |
| BR-RO-04 | Khi khách hàng đưa ra yêu cầu mơ hồ hoặc có nhiều món cùng loại, AI bắt buộc phải đặt câu hỏi làm rõ (Clarification), không được tự ý quyết định. | Tránh lên nhầm món |
| BR-RO-05 | Khách hàng không có quyền tự hủy đơn/món sau khi đơn đã gửi bếp. Quyền hủy món chỉ thuộc về Waiter/Thu ngân sau khi đã đối soát với Bếp. | Chị Lan (Phục vụ) |
| BR-RO-06 | Mã QR thanh toán chuyển khoản bắt buộc phải gắn liền với mã phiên bàn (Table Session ID); tổng tiền thanh toán do máy chủ tính toán, không nhận từ client. | Chị Lan (Thu ngân) |

## 4. Scope Ranh giới dự án
- **Must Have:** Quét QR gọi món tại bàn (Voice/Text); Tư vấn món dị ứng/mâm cơm; Order Draft & Xác nhận gửi bếp; Màn hình KDS cho Bếp; Khóa món Out of Stock; Tạo mã QR thanh toán động theo bàn; Quản lý quyền hủy món.
- **Should Have:** AI gợi ý gom món cùng loại cho Bếp (Batching suggestion); Báo cáo doanh thu ca cho Quản lý.
- **Could Have:** Text-to-speech đọc tên món khi hoàn tất chế biến.
- **Out of Scope:** Tích hợp thanh toán thẻ Visa/Mastercard thật; Nhận diện khuôn mặt khách quen; Tự động đặt bàn qua tổng đài điện thoại.
