# Stakeholders & Personas

## 1. Khách hàng (Customer) - Trải nghiệm trực tiếp
- **Đại diện:** Anh Tuấn (28 tuổi, nhân viên văn phòng).
- **Đặc điểm:** Thường đi ăn nhóm đông (4-6 người), có người kén ăn hoặc dị ứng.
- **Mục tiêu (Goals):**
  - Dùng AI tư vấn món ăn tránh dị ứng nhanh chóng.
  - Có màn hình Order Draft để dò lại chi tiết trước khi đặt.
  - Cần tính năng Split Bill và thanh toán QR tự động tại bàn để không phải xếp hàng.

## 2. Phục vụ bàn (Waiter) - Vận hành sảnh
- **Đại diện:** Chị Lan (22 tuổi, sinh viên làm part-time ca tối).
- **Đặc điểm:** Chịu áp lực cao, hay quên do phải nhớ quá nhiều order miệng từ khách.
- **Mục tiêu (Goals):**
  - Sử dụng Tablet có tính năng Voice-to-order thay vì viết tay.
  - Cần Table Map trực quan để xem trạng thái bàn (Trống/Đang ăn).
  - Nhận thông báo "Ting ting" ngay khi KDS dưới bếp báo món đã nấu xong.

## 3. Đầu bếp (Kitchen) - Sản xuất món ăn
- **Đại diện:** Chú Hùng (45 tuổi, bếp trưởng 15 năm kinh nghiệm).
- **Đặc điểm:** Làm việc trong môi trường ồn ào, nóng bức, ghét giấy tờ thủ công.
- **Mục tiêu (Goals):**
  - Hệ thống KDS xếp đơn ưu tiên rõ ràng (cảnh báo nhấp nháy Đỏ khi đơn đợi quá 15 phút).
  - Đọc rõ các ghi chú đặc biệt (không hành, ít cay).
  - Có nút "Out of Stock" để tự động khóa món ngoài Menu, tránh khách gọi món đã hết.

## 4. Quản lý / Thu ngân (Manager / Cashier) - Vận hành tổng thể
- **Đại diện:** Chị Mai (35 tuổi, quản lý nhà hàng).
- **Đặc điểm:** Chịu trách nhiệm về doanh thu, nhân sự và tồn kho.
- **Mục tiêu (Goals):**
  - Tự động cộng tiền bill chính xác 100%.
  - Phân quyền RBAC nghiêm ngặt để chặn nhân viên tự ý hủy món (chống gian lận).
  - Tính năng CMS để dễ dàng cập nhật menu, đồng bộ trực tiếp với AI.
  - Đối soát Tồn kho thực tế (Inventory Reconciliation) hiệu quả vào cuối ngày.
