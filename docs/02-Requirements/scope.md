# Phạm vi Dự án (Project Scope)
> Xác định rõ những gì thuộc về phiên bản đầu tiên (MVP) và những gì bị loại trừ để kiểm soát nguồn lực.

## 1. IN SCOPE
### Must-have (Bắt buộc phải có)
- **Hệ thống Guest Ordering:** Quét QR, AI tư vấn món, Order Draft, Explicit Confirmation (REQ-01, REQ-02).
- **Hệ thống Waiter:** Tablet Voice-to-order, Table Map, Nhận thông báo "Ting ting" (REQ-05, REQ-06, REQ-07).
- **Hệ thống KDS (Bếp):** Xếp lịch đơn, cảnh báo quá giờ (đỏ), báo Out of Stock đồng bộ (REQ-08, REQ-09).
- **Hệ thống Manager/POS:** Thanh toán QR MoMo/VNPAY, phân quyền RBAC (chặn Void/Refund), CMS Menu (REQ-04, REQ-10, REQ-11).

### Should-have (Nên có nếu kịp tiến độ)
- Tính năng Split Bill (Chia hóa đơn) ngay trên điện thoại khách (REQ-03).
- Tính năng Đối soát tồn kho thực tế (Inventory Reconciliation) cuối ngày (REQ-12).

### Could-have (Có thể có, ưu tiên thấp)
- Dashboard báo cáo Real-time doanh thu, tỷ lệ lấp đầy bàn (REQ-13).

## 2. OUT OF SCOPE (Ngoài phạm vi - Nghiêm cấm triển khai trong MVP)
- **Thanh toán qua cổng quốc tế (Visa/Mastercard/Stripe):** (REQ-14) Lỗi Scope Creep. Chí phí tích hợp cao, quy trình đối soát phức tạp, chưa phù hợp với quy mô hiện tại.
- App giao hàng tận nơi (Shipper / Delivery).
- Hệ thống chấm công nhân sự.
- Chế độ tích điểm thành viên (Loyalty / Membership).
