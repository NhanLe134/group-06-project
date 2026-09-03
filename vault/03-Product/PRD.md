# Product Requirements Document (PRD)

## 1. Tên dự án
Hệ thống Smart Restaurant Ordering & KDS

## 2. Mục tiêu (Objective)
Số hóa hoàn toàn quy trình phục vụ tại bàn, từ lúc khách quét QR gọi món (có AI tư vấn) đến khi bếp nhận đơn qua KDS và khách tự thanh toán, giúp giảm tỷ lệ sai sót đơn hàng xuống dưới 2% và tăng hiệu suất xoay vòng bàn.

## 3. Core Features (Tính năng cốt lõi)
- **Guest Ordering:** Cho phép khách hàng tự quét mã QR tại bàn để xem E-Menu. Tích hợp AI Assistant tư vấn món ăn dựa trên sở thích và dị ứng. Bắt buộc hiển thị Order Draft để xác nhận (Explicit Confirmation).
- **Waiter Tablet:** Hỗ trợ nhân viên phục vụ ghi order bằng giọng nói (Voice-to-order), theo dõi Table Map và nhận thông báo khi có món hoàn thành.
- **Kitchen KDS:** Màn hình hiển thị ticket order trong bếp. Sắp xếp thứ tự ưu tiên (FIFO), cảnh báo quá giờ (màu đỏ) và đồng bộ trạng thái "Out of Stock".
- **Manager POS:** Xử lý thanh toán QR MoMo/VNPAY tự động. Phân quyền RBAC quản lý việc Void/Refund. Đối soát tồn kho thực tế.

## 4. Ranh giới Dự án (Out of Scope)
- Cổng thanh toán quốc tế (Visa/Mastercard/Stripe).
- Ứng dụng/Nghiệp vụ giao hàng tận nơi (Delivery).
- Hệ thống nhân sự (Chấm công, tính lương).

## 5. User Flow (Sơ đồ luồng)
Vui lòng xem chi tiết sơ đồ tại file: `user-flow.mmd`.
*(Đã bao gồm luồng dự phòng Fallback khi mất mạng hoặc quét mã QR thất bại).*
