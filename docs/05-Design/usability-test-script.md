# Output #11 - Usability Test Script & Findings - Group 06

> **Tài liệu**: Kịch bản & Kết quả Kiểm thử Tính dễ sử dụng (Usability Test Script & Findings)  
> **Phiên bản**: 1.0 (Chuẩn theo Mẫu Output #11 của Giảng viên)  
> **Người thực hiện**: Lê Thị Thanh Nhàn (Role UX/UI Designer & AI/Vault Master)  

---

## PART 1: USABILITY TEST SCRIPT (KỊCH BẢN KIỂM THỬ USABILITY)

| Task (Nhiệm vụ kiểm thử) | Success Criterion (Tiêu chí thành công) |
| :--- | :--- |
| **T1: Gọi món bằng AI Voice**<br>("Cho 1 phở bò không hành và 2 trà đá") | User nhận ra trạng thái thu âm (đang nghe/đang xử lý), trích xuất đúng 2 món + ghi chú "không hành" $\le 45\text{s}$. |
| **T2: Thêm món bằng thao tác chạm tay trên E-Menu di động** | Số lượng cập nhật đúng, User nhận được phản hồi thông báo đã thêm món vào giỏ hàng. |
| **T3: Nói/Chọn câu mờ hồ "Cho 1 đĩa bò" (BR-RO-04)** | User hiểu trợ lý AI đang hỏi lại để làm rõ loại bò nào (`Bò xào cần` vs `Bò sốt tiêu đen`), không nghĩ hệ thống bị lỗi. |
| **T4: Thử chọn món Out of Stock "Bò sốt tiêu đen" (ADR-001)** | User nhận biết ngay món bị mờ xám (*grayed-out*), nút bấm gửi bếp bị khóa và chọn món thay thế thành công. |
| **T5: Checkout & Chốt đơn gửi Bếp KDS** | User nhận ra cần bấm nút xác nhận gửi bếp, đọc được tổng tiền trước khi đặt và thấy đơn chuyển sang Bếp KDS. |

---

## PART 2: USABILITY FINDINGS (KẾT QUẢ QUAN SÁT & QUYẾT ĐỊNH CẢI TIẾN)

| Finding (Phát hiện lỗi UX/Từ ngữ) | Evidence (Bằng chứng quan sát thực tế) | Decision (Quyết định điều chỉnh UI/Workflow) | ADR |
| :--- | :--- | :--- | :---: |
| **1. Trạng thái thu âm chưa rõ ràng** | 2/3 người thử nghiệm nói không biết hệ thống đã bắt đầu nghe giọng nói hay chưa. | Bổ sung hiệu ứng sóng âm nhấp nháy + nhãn chữ *"Đang nghe..."* + nút dừng thu âm. | **ADR-002** |
| **2. Nút xác nhận gửi bếp dễ bị bỏ qua** | 1/3 người thử nghiệm nói *"Tôi tưởng đơn đã đặt xong rồi"* khi mới thấy món nằm trong giỏ hàng. | Đổi nút bấm thành **"Xác nhận gửi Bếp ngay"**; thêm dòng thông báo nhãn đỏ *"Bản nháp - Chưa gửi bếp"*. | **ADR-003** |
| **3. Thẻ gợi ý làm rõ dễ dùng hơn dạng danh sách sổ** | 3/3 người thử nghiệm hiểu ngay câu hỏi làm rõ *"Bạn chọn Bò xào cần hay Bò sốt tiêu đen?"* và bấm thẻ món chọn nhanh. | Giữ nguyên dạng câu hỏi đối thoại tự nhiên kèm các thẻ hình ảnh món ăn để bấm chọn trực quan. | **ADR-004** |
| **4. Món Out of Stock mờ xám hỗ trợ tốt** | 3/3 người thử nghiệm nhận ra ngay món `Bò sốt tiêu đen` bị mờ xám và chọn món thay thế thành công mà không bối rối. | Duy trì thiết kế món hết hàng mờ xám và vô hiệu hóa nút bấm xác nhận. | **ADR-001** |
