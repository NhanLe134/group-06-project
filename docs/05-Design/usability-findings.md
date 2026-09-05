# Usability Findings Report - Group 06

> **Tài liệu**: Báo cáo Kết quả Kiểm thử Usability & Quyết định Điều chỉnh (Usability Findings Report)  
> **Người thực hiện**: Lê Thị Thanh Nhàn (Role UX/UI Designer & AI/Vault Master)  

---

## BẢNG TỔNG HỢP PHÁT HIỆN LỖI → BẰNG CHỨNG → QUYẾT ĐỊNH ĐIỀU CHỈNH

| STT | Phát hiện lỗi UX & Từ ngữ (Finding) | Bằng chứng quan sát thực tế (Evidence) | Quyết định điều chỉnh UI/UX (Decision) | Bản ghi ADR liên kết |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Khó nhận biết món ăn nổi bật / bán chạy của nhà hàng** | 2/3 Khách hàng mất nhiều thời gian lướt qua toàn bộ thực đơn để tìm món ăn ngon/nổi bật. | Bổ sung nhãn cam nổi bật `🔥 Bán chạy` trực tiếp trên thẻ món ăn (*Phở bò tái lăn*, *Set lẩu 4 người*). | **ADR-002** |
| **2** | **Thao tác tìm món ăn bị chậm khi danh sách Menu dài** | 3/3 Khách phải kéo trượt nhiều lần mới tìm thấy món đồ uống/tráng miệng ở cuối trang. | Đưa thanh tìm kiếm lên ngay vị trí đầu tiên của E-Menu: `"Tìm kiếm món"` hỗ trợ nhập liệu bằng tay. | **ADR-003** |
| **3** | **Tiến độ chế biến của Bếp chưa trực quan với khách** | 1/3 Khách ngồi đợi mà không biết món của mình đang làm đến đâu. | Bổ sung thanh Timeline mốc trạng thái thời gian thực: `Chờ nấu` ➔ `Đang làm` ➔ `Đã xong - Chờ phục vụ` ➔ `Đã phục vụ`. | **ADR-004** |
| **4** | **Phục vụ không biết khi nào Bếp đã làm xong món ăn** | Nhân viên phục vụ không thể canh điện thoại liên tục để xem có món lên chưa để phục vụ. | Bổ sung âm thanh chuông báo 🔔 *"Ting Ting"* + hiển thị danh sách món chín tại vùng `"SẮN SÀNG — CHỜ PHỤC VỤ"`. | **ADR-005** |
| **5** | **Bếp không phân biệt được tiến độ chế biến từng đơn khi khách đông** | Đầu bếp bị rối giữa các ticket mới gửi xuống và các đơn đang nấu khi dùng 2 trạng thái cũ (*Chưa xong/Hoàn thành*). | Chuẩn hóa quy trình KDS thành 3 trạng thái phân biệt rõ ràng: `Chờ nấu` (mới nhận) ➔ `Chờ phục vụ` (đang nấu/xong) ➔ `Đã phục vụ` (đã bưng ra bàn). | **ADR-006** |
