# Usability Findings Report - Group 06

> **Tài liệu**: Báo cáo Kết quả Kiểm thử Usability (Usability Findings Report)  
> **Phiên bản**: 1.0 (Chuẩn theo Mẫu Output #11 của Giảng viên)  
> **Người thực hiện**: Lê Thị Thanh Nhàn (Role UX/UI Designer & AI/Vault Master)  

---

## 📊 BẢNG TỔNG HỢP PHÁT HIỆN LỖI → BẰNG CHỨNG → QUYẾT ĐỊNH ĐIỀU CHỈNH

| Phát hiện lỗi UX & Từ ngữ (Finding) | Bằng chứng quan sát thực tế (Evidence) | Quyết định điều chỉnh (Decision) | Bản ghi ADR liên kết |
| :--- | :--- | :--- | :---: |
| **1. Trạng thái thu âm chưa rõ ràng** | 2/3 người thử nghiệm nói không biết hệ thống đã bắt đầu nghe giọng nói hay chưa. | Bổ sung hiệu ứng sóng âm nhấp nháy + nhãn chữ *"Đang nghe..."* + nút dừng thu âm. | **ADR-002** |
| **2. Nút xác nhận gửi bếp dễ bị bỏ qua** | 1/3 người thử nghiệm nói *"Tôi tưởng đơn đã đặt xong rồi"* khi mới thấy món nằm trong giỏ hàng. | Đổi nút bấm thành **"Xác nhận gửi Bếp ngay"**; thêm dòng thông báo nhãn đỏ *"Bản nháp - Chưa gửi bếp"*. | **ADR-003** |
| **3. Thẻ gợi ý làm rõ dễ dùng hơn dạng danh sách sổ** | 3/3 người thử nghiệm hiểu ngay câu hỏi làm rõ *"Bạn chọn Bò xào cần hay Bò sốt tiêu đen?"* và bấm thẻ món chọn nhanh. | Giữ nguyên dạng câu hỏi đối thoại tự nhiên kèm các thẻ hình ảnh món ăn để bấm chọn trực quan. | **ADR-004** |
| **4. Món hết hàng (Out of Stock) mờ xám hỗ trợ tốt** | 3/3 người thử nghiệm nhận ra ngay món `Bò sốt tiêu đen` bị mờ xám và chọn món thay thế thành công mà không bối rối. | Duy trì thiết kế món hết hàng mờ xám và vô hiệu hóa nút bấm xác nhận. | **ADR-001** |
