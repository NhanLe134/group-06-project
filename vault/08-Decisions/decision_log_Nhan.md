# DECISION LOG — NHẬT KÝ QUYẾT ĐỊNH RIÊNG (Lê Thị Thanh Nhàn)

> **Dự án**: Hệ thống Gọi món Nhà hàng Thông minh (Group 06)
> **Phạm vi**: File này chỉ ghi các quyết định do **Lê Thị Thanh Nhàn** tự đưa ra khi thực hiện phần được phân công (US-01 — Màn hình Khách hàng: E-Menu & Order Draft). Không ghi quyết định chung của team (xem `decision-log.md`).
> **Quy ước mã**: tiền tố `ADR-N` (N = Nhàn) để tránh trùng mã với decision-log chung của team.

---

| ID | Quyết định | Trạng thái | Ngày / Người duyệt | Bối cảnh (Context) | Quyết định chính thức (Decision) | Phương án bị loại (Alternatives) | Hệ quả & Tác động (Consequences) | Kiểm chứng / Theo dõi (Follow-up) |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **ADR-N01** | Bổ sung nhập ghi chú thủ công cho từng món trong Order Draft | Approved | 2026-10-03<br>Lê Thị Thanh Nhàn | US-01 gốc chỉ gồm: danh sách món E-Menu, thanh phân loại, giỏ hàng. Khách không có cách nào nói rõ yêu cầu riêng theo từng món (VD: phở *không hành, nhiều cay*) nếu không dùng giọng nói (thuộc US-02, chưa có). Prototype chỉ trích ghi chú tự động từ câu thoại, không có UI nhập tay. | 1. Mở rộng US-01: thêm nút *"Ghi chú món"* trên từng dòng món trong Order Draft, chạm mở modal nhập.<br>2. Modal gồm chip gợi ý nhanh (*Không hành, Ít cay...*) + ô nhập tự do; ghi chú đi kèm món khi gửi bếp. | Chỉ dùng Voice AI để ghi chú (mất mạng thì không ghi chú được); Ô input hiển thị sẵn trên dòng món (dòng quá dài, khó chạm trên điện thoại). | **+** Khách nêu yêu cầu món ăn không cần giọng nói.<br>**+** Bếp nhận rõ yêu cầu, giảm món làm sai. | Test trên trình duyệt mobile: modal vừa màn hình, không scroll ngang. Cần kiểm tra khi tích hợp gửi đơn xuống KDS. |
