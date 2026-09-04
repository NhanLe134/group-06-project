# Taiga Backlog Tasks (Phân rã kỹ thuật)
> Danh sách Task đã chẻ nhỏ đến mức Component/API, sẵn sàng để import lên Taiga.

| Task ID | Thuộc Story | Tên Task (Deliverable) | Loại | Owner | Estimate | Expected Output |
|---|---|---|---|---|---|---|
| T-01 | US-01 | Setup DB Schema cho Menu (categories, items, tags, allergens). | DB | Nhã (Dev) | 4h | File migration schema. |
| T-02 | US-01 | Viết prompt và tích hợp Gemini API để xử lý Natural Language sang Order JSON. | Backend | Nhã (Dev) | 6h | Code function gọi AI API. |
| T-03 | US-01 | Build UI Chatbot Component trên E-Menu. | Frontend | Nhã (Dev) | 5h | UI chat hiển thị món ăn. |
| T-04 | US-02 | Viết API endpoint `POST /api/cart/checkout` xử lý lưu Order Draft. | Backend | Nhã (Dev) | 4h | API trả về 200 OK kèm mã Draft. |
| T-05 | US-02 | Build UI màn hình Order Draft và popup Explicit Confirmation. | Frontend | Nhã (Dev) | 3h | UI hiển thị tổng tiền có nút Xác nhận. |
| T-06 | US-03 | Tích hợp Web Speech API cho tính năng Voice-to-order trên Tablet. | Frontend | Nhã (Dev) | 6h | Component thu âm và parse text. |
| T-07 | US-04 | Dựng WebSocket Server để push thông báo Real-time (Ting ting, KDS done). | Backend | Nhã (Dev) | 8h | WebSocket Endpoint. |
| T-08 | US-04 | Thiết kế logic render màu sắc (Đỏ/Xanh) cho Table Map Component. | Frontend | Nhã (Dev) | 4h | Sơ đồ bàn đổi màu Real-time. |
| T-09 | US-05 | Build UI KDS Board (Kanban style) cho Đầu bếp. | Frontend | Nhã (Dev) | 8h | KDS Board tự động sắp xếp vé. |
| T-10 | US-05 | Viết API `PUT /api/menu/out-of-stock` và logic Broadcast khóa món. | Backend | Nhã (Dev) | 3h | Món bị disable trên mọi client. |
| T-11 | US-06 | Tích hợp thư viện sinh QR Code động cho MoMo/VNPAY. | Frontend | Nhã (Dev) | 3h | QR code scan được bằng app bank. |
| T-12 | US-07 | Viết Middleware Check Role (RBAC) cho endpoint `POST /api/order/void`. | Backend | Nhã (Dev) | 2h | Trả về 403 nếu không phải Manager. |
| T-13 | US-08 | Build UI Màn hình đối soát tồn kho, highlight đỏ khi chênh lệch. | Frontend | Nhã (Dev) | 3h | Bảng nhập số liệu tồn kho cuối ngày. |
| T-14 | US-08 | Viết API `POST /api/inventory/reconcile` lưu chốt ca và cập nhật tồn kho. | Backend | Nhã (Dev) | 3h | API cập nhật tồn kho ngày tiếp theo. |
| T-15 | ALL | Viết Unit Test cho các logic tính tiền và chia bill. | QA | Ny (QA) | 4h | Pass 100% test cases. |
