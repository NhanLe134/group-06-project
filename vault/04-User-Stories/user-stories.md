# User Stories & Acceptance Criteria
> Danh sách User Stories được trích xuất từ PRD. Cấu trúc chuẩn: As a... I want... so that...

## Epic 1: Guest Smart Ordering
**US-01: Tư vấn món ăn bằng AI**  
**Yêu cầu nguồn:** [REQ-01](../01-Requirements/requirements.md)  
*As a* Khách hàng, *I want* được chat với AI Assistant để nhận gợi ý món ăn, *so that* tôi có thể chọn món nhanh chóng theo sở thích/dị ứng.
- **AC1:** GIVEN khách mở E-Menu, WHEN bấm vào icon AI, THEN cửa sổ chat hiện lên.
- **AC2:** GIVEN khách gõ "tôi dị ứng đậu phộng", WHEN AI phản hồi, THEN AI chỉ gợi ý các món không có tag đậu phộng.

**US-02: Đặt món và Chốt đơn (Có Xác Nhận)**  
**Yêu cầu nguồn:** [REQ-02](../01-Requirements/requirements.md), [REQ-15](../01-Requirements/requirements.md) | [Explicit Confirmation](../01-Requirements/glossary.md)  
*As a* Khách hàng, *I want* thêm món vào giỏ và xem lại nháp trước khi đặt, *so that* tôi không bị đặt nhầm món.
- **AC1:** GIVEN khách chọn món từ Menu hoặc AI, WHEN bấm Thêm, THEN món được đưa vào Order Draft.
- **AC2 (Business Rule):** GIVEN Order Draft có món, WHEN khách muốn chốt, THEN hệ thống bắt buộc hiển thị popup tổng tiền và nút "Xác nhận đặt món" (Explicit Confirmation) chứ KHÔNG tự động chốt đơn.
- **AC3:** GIVEN khách bấm Xác nhận, WHEN thành công, THEN đơn được đẩy xuống KDS Bếp và hiển thị trạng thái "Đang nấu".
- **AC4 (Business Rule - ADR-001):** GIVEN món trong Order Draft vừa bị bếp báo [Out of Stock](../01-Requirements/glossary.md), WHEN món chuyển trạng thái, THEN món hiển thị mờ kèm nhãn đỏ "Món đã hết", nút "Xác nhận gửi bếp" bị Disabled và AI thông báo *"Dạ món [Tên món] vừa hết hàng, anh/chị vui lòng bỏ món khỏi danh sách để chốt đơn nhé!"* cho đến khi khách gỡ món đó ra khỏi Draft.

## Epic 2: Waiter Operations
**US-03: Voice-to-order trên Tablet**  
**Yêu cầu nguồn:** [REQ-05](../01-Requirements/requirements.md)  
*As a* Phục vụ bàn, *I want* đọc order vào Tablet, *so that* hệ thống tự tạo đơn mà không cần bấm tay.
- **AC1:** GIVEN phục vụ đang ở màn hình bàn, WHEN bấm giữ nút Micro và đọc món, THEN hệ thống tự động nhận diện và thêm món vào Order Draft.

**US-04: Theo dõi Table Map và Nhận thông báo món**  
**Yêu cầu nguồn:** [REQ-06](../01-Requirements/requirements.md), [REQ-07](../01-Requirements/requirements.md)  
*As a* Phục vụ bàn, *I want* xem sơ đồ bàn và nhận thông báo món, *so that* tôi bưng bê kịp thời.
- **AC1:** GIVEN sơ đồ bàn, WHEN bàn có khách quét QR, THEN đổi màu Đỏ.
- **AC2:** GIVEN bếp bấm Done trên KDS, WHEN thành công, THEN app của phục vụ rung và kêu "Ting ting" báo số bàn.

## Epic 3: Kitchen Display System (KDS)
**US-05: Quản lý Ticket & Báo Hết hàng**  
**Yêu cầu nguồn:** [REQ-08](../01-Requirements/requirements.md), [REQ-09](../01-Requirements/requirements.md) | [Out of Stock](../01-Requirements/glossary.md)  
*As a* Đầu bếp, *I want* xem đơn theo thứ tự ưu tiên và có thể báo hết hàng, *so that* tôi nấu đúng tiến độ và không bị khách gọi món đã hết.
- **AC1:** GIVEN đơn hàng đẩy xuống KDS, WHEN đợi quá 15 phút, THEN ticket trên màn hình nhấp nháy Đỏ.
- **AC2:** GIVEN bếp bấm nút "Out of Stock" ở một món, WHEN thành công, THEN món đó bị khóa (mờ đi) trên E-Menu khách hàng ngay lập tức.

## Epic 4: POS & Manager Control
**US-06: Thanh toán QR và Split Bill**  
**Yêu cầu nguồn:** [REQ-03](../01-Requirements/requirements.md), [REQ-04](../01-Requirements/requirements.md)  
*As a* Khách hàng, *I want* chia hóa đơn và thanh toán QR tại bàn, *so that* tôi không phải ra quầy.
- **AC1:** GIVEN khách bấm Thanh toán, WHEN chọn Split Bill, THEN hệ thống cho phép chia đều hoặc chia theo món.
- **AC2:** GIVEN bill đã chốt, WHEN chọn MoMo/VNPAY, THEN hệ thống tạo mã QR động chứa đúng số tiền.

**US-07: Phân quyền Hủy món (Void/Refund)**  
**Yêu cầu nguồn:** [REQ-10](../01-Requirements/requirements.md)  
*As a* Quản lý, *I want* chỉ tài khoản của tôi mới được hủy món đã nấu, *so that* ngăn chặn nhân viên gian lận.
- **AC1:** GIVEN phục vụ bấm Void một món đã đẩy xuống bếp, WHEN thực hiện, THEN hệ thống bật popup yêu cầu mã PIN của Quản lý.
