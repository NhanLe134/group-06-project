# Product Requirements Document (PRD)

## 1. Tên dự án
Hệ thống Smart Restaurant Ordering & KDS

## 2. Mục tiêu (Objective)
Số hóa hoàn toàn quy trình phục vụ tại bàn, từ lúc khách quét QR gọi món (có AI tư vấn) đến khi bếp nhận đơn qua KDS và khách tự thanh toán, giúp giảm tỷ lệ sai sót đơn hàng xuống dưới 2% và tăng hiệu suất xoay vòng bàn.

## 3. Core Features (Tính năng cốt lõi)
Dựa trên 4 luồng thao tác chính yếu (User Stories), hệ thống tập trung giải quyết:
- **US-01: Guest Ordering (E-Menu & Giỏ hàng):** Cho phép khách hàng tự quét mã QR tại bàn để xem E-Menu và chọn món. Bắt buộc hiển thị Order Draft để xác nhận (Explicit Confirmation).
- **US-02: AI Voice Ordering:** Tích hợp AI Assistant nhận diện giọng nói hỗ trợ gọi món nhanh, xử lý các trường hợp dị ứng hoặc thiếu thông tin (Clarification). Hỗ trợ Fallback sang nhập text nếu ồn.
- **US-03: Kitchen KDS (Màn hình bếp):** Màn hình hiển thị ticket order trong bếp theo thời gian thực (Websocket). Cảnh báo quá 15 phút (màu đỏ) và đồng bộ trạng thái "Out of Stock" khóa món tự động.
- **US-04: Waiter Table Management:** Tablet cho nhân viên phục vụ nhận thông báo khi món chín, cập nhật sơ đồ bàn (Table Map) và xử lý phân quyền Hủy món (Void/Refund) qua mã PIN Quản lý.
## 4. Ranh giới Dự án (Out of Scope)
- Cổng thanh toán quốc tế (Visa/Mastercard/Stripe).
- Ứng dụng/Nghiệp vụ giao hàng tận nơi (Delivery).
- Hệ thống nhân sự (Chấm công, tính lương).

## 5. User Flow (Sơ đồ luồng)
Vui lòng xem chi tiết sơ đồ tại file: `user-flow.mmd`.
*(Đã bao gồm luồng dự phòng Fallback khi mất mạng hoặc quét mã QR thất bại).*
