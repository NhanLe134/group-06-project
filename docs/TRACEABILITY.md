# Ma trận Truy vết (Traceability Matrix)
> Bằng chứng truy xuất nguồn gốc (Requirement -> Story -> Task) để bảo vệ đồ án trước Giảng viên.

| Requirement ID (Nguồn gốc) | User Story ID (Giá trị người dùng) | Taiga Task ID (Phân rã kỹ thuật) | Trạng thái |
|---|---|---|---|
| **REQ-01** (AI tư vấn món) | **US-01** (Khách chat AI) | T-01 (DB Schema)<br>T-02 (Tích hợp Gemini API)<br>T-03 (UI Chatbot) | Ready |
| **REQ-02** (Explicit Confirmation) | **US-02** (Xác nhận Order Draft) | T-04 (API Checkout)<br>T-05 (UI Order Draft & Popup) | Ready |
| **REQ-05** (Voice-to-order) | **US-03** (Phục vụ đọc món) | T-06 (Web Speech API) | Ready |
| **REQ-06 & REQ-07** (Table Map & Notification) | **US-04** (App Phục vụ) | T-07 (WebSocket Server)<br>T-08 (UI Table Map) | Ready |
| **REQ-08 & REQ-09** (KDS & Out of Stock) | **US-05** (Màn hình Bếp) | T-09 (UI KDS Board)<br>T-10 (API Out of Stock) | Ready |
| **REQ-04 & REQ-03** (Thanh toán QR & Split) | **US-06** (Thanh toán Khách) | T-11 (Sinh QR Động)<br>T-13 (Unit Test tính tiền) | Ready |
| **REQ-10** (RBAC Void/Refund) | **US-07** (Phân quyền Quản lý) | T-12 (RBAC Middleware) | Ready |

**Kết luận:** Mọi Requirement ưu tiên (Must-have/Should-have) đều đã được map đầy đủ sang User Story và Task kỹ thuật. Không có Requirement nào bị "mồ côi". Ma trận hoàn hảo.
