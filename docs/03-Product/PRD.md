# Product Requirements Document (PRD)

## 1. Tên dự án
Hệ thống Smart Restaurant Ordering & KDS

## 2. Vấn đề cần giải quyết (Problem Statement)
- Khách hàng thường xuyên phải chờ đợi lâu để gọi món hoặc tính tiền vào giờ cao điểm.
- Nhân viên phục vụ ghi chú sai món hoặc quên món của khách, dẫn đến trải nghiệm tồi tệ.
- Giao tiếp giữa khu vực Phục vụ (Front-of-house) và nhà Bếp (Back-of-house) bị gián đoạn, làm chậm tốc độ xoay vòng bàn.

## 3. Đối tượng Người dùng (Users & Personas)
- **Khách hàng (Diners):** Người đến ăn tại nhà hàng, muốn xem hình ảnh món ăn trực quan, gọi món nhanh (bằng thao tác chạm hoặc giọng nói) và thanh toán tiện lợi.
- **Nhân viên Phục vụ (Waiters):** Cần biết chính xác món nào đã nấu xong để bưng ra đúng bàn, không phải chạy ra vào bếp liên tục.
- **Đầu bếp (Kitchen Staff):** Cần nhìn thấy danh sách món cần nấu theo thứ tự thời gian rõ ràng, không bị sót bill giấy.
- **Quản lý (Manager):** Cần công cụ để quản lý thực đơn, xem báo cáo doanh thu và duyệt các yêu cầu hủy món.

## 4. Mục tiêu & Chỉ số Thành công (Goals & Success Metrics)
**Mục tiêu (Goals):**
Số hóa hoàn toàn quy trình phục vụ tại bàn, từ lúc khách quét QR gọi món (có AI tư vấn) đến khi bếp nhận đơn qua KDS và khách tự thanh toán.

**Chỉ số đo lường (Success Metrics):**
- Giảm thời gian trung bình từ lúc khách ngồi vào bàn đến khi chốt đơn hàng xuống dưới 3 phút.
- Giảm tỷ lệ sai sót đơn hàng (Wrong/Missing items) xuống mức dưới 2%.
- Tăng hiệu suất xoay vòng bàn (Table turnover rate) lên 15% trong giờ cao điểm.

## 5. Core Features (Tính năng cốt lõi)
Hệ thống bao gồm 8 User Stories (đáp ứng tiêu chuẩn 8-12 US của giáo trình), được chia làm 2 nhóm:

**Nhóm 1: Luồng Vận hành chính (End-to-End Workflow)**
- **US-01: Guest Ordering (E-Menu & Giỏ hàng):** Khách tự quét mã QR tại bàn để xem Menu và chọn món. Bắt buộc hiển thị Order Draft (Explicit Confirmation).
- **US-02: AI Voice Ordering:** Tích hợp AI nhận diện giọng nói gọi món nhanh, có cơ chế hỏi lại (Clarification) và Fallback nhập text.
- **US-03: Kitchen KDS (Màn hình bếp):** KDS hiển thị ticket realtime (Websocket). Cảnh báo đỏ món quá 15 phút, đồng bộ khóa món (Out of Stock).
- **US-04: Waiter Table Management:** Tablet cho nhân viên nhận thông báo món chín, cập nhật Table Map và xử lý Hủy món (Void) qua mã PIN.

**Nhóm 2: Luồng Phụ trợ & Quản trị (Supporting & Admin)**
- **US-05: Split Bill (Chia tiền hóa đơn):** Khách hàng chia tiền ngay trên điện thoại (Chia đều hoặc theo món) bằng MoMo/VNPAY.
- **US-06: Revenue Dashboard:** Quản lý xem biểu đồ doanh thu và top món bán chạy trong ngày theo thời gian thực trên POS.
- **US-07: CMS Menu Management:** Quản lý sửa giá, ảnh món ăn. Áp dụng RBAC cấm nhân viên phục vụ truy cập tính năng này.
- **US-08: Inventory Reconciliation:** Bếp trưởng đối soát hao hụt nguyên liệu thực tế cuối ca so với lý thuyết.

## 6. Ranh giới Dự án (Out of Scope)
- Cổng thanh toán quốc tế (Visa/Mastercard/Stripe).
- Ứng dụng/Nghiệp vụ giao hàng tận nơi (Delivery).
- Hệ thống nhân sự (Chấm công, tính lương).

## 7. User Flow (Sơ đồ luồng)
Vui lòng xem chi tiết sơ đồ tại file: `user-flow.mmd`.
*(Đã bao gồm luồng dự phòng Fallback khi mất mạng hoặc quét mã QR thất bại).*
