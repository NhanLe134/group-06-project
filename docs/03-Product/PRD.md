# Product Requirements Document (PRD)

## 1. Tên dự án
Hệ thống Smart Restaurant Ordering & KDS

## 2. Mục tiêu (Objective)
Số hóa hoàn toàn quy trình phục vụ tại bàn, từ lúc khách quét QR gọi món (có AI tư vấn) đến khi bếp nhận đơn qua KDS và khách tự thanh toán, giúp giảm tỷ lệ sai sót đơn hàng xuống dưới 2% và tăng hiệu suất xoay vòng bàn.

## 3. Core Features (Tính năng cốt lõi)
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
## 4. Ranh giới Dự án (Out of Scope)
- Cổng thanh toán quốc tế (Visa/Mastercard/Stripe).
- Ứng dụng/Nghiệp vụ giao hàng tận nơi (Delivery).
- Hệ thống nhân sự (Chấm công, tính lương).

## 5. User Flow (Sơ đồ luồng)
Vui lòng xem chi tiết sơ đồ tại file: `user-flow.mmd`.
*(Đã bao gồm luồng dự phòng Fallback khi mất mạng hoặc quét mã QR thất bại).*
