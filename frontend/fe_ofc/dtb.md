# Tài liệu Cấu trúc Cơ sở dữ liệu (Database Schema)

Dưới đây là cấu trúc CSDL của hệ thống Smart Restaurant được trình bày dưới dạng bảng để dễ đọc và dễ tra cứu, không cần phải đọc code SQL.

---

### 1. Bảng `users` (Tài khoản & Phân quyền)
Lưu trữ thông tin nhân viên và phân quyền RBAC (Role-Based Access Control).

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Mã định danh duy nhất của user. |
| `full_name` | VARCHAR | Not Null | Tên hiển thị của nhân viên. |
| `role` | VARCHAR | MANAGER, WAITER, KITCHEN, CASHIER | Vai trò của nhân viên trong hệ thống. |
| `pin_code` | VARCHAR | | Mã PIN 4 số (VD: 1234) dùng để Manager duyệt lệnh Hủy món. |
| `created_at` | TIMESTAMP | Default NOW() | Thời gian tạo tài khoản. |

---

### 2. Bảng `menu_items` (Thực đơn - Món ăn thành phẩm)
Danh sách các món ăn xuất hiện trên E-Menu của Khách và Tablet của Waiter.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Mã định danh món ăn. |
| `name` | VARCHAR | Not Null | Tên món (VD: Lẩu Thái Tomyum, Bò Lúc Lắc). |
| `category` | VARCHAR | Not Null | Phân loại (Món chính, Khai vị, Đồ uống...). |
| `price` | INT | Not Null | Giá bán ra (AI phải dựa vào đây để báo giá, không tự bịa). |
| `is_active` | BOOLEAN | Default TRUE | Trạng thái Đang bán (True) hoặc Tạm ẩn (False). |
| `image_url` | TEXT | | Đường dẫn hình ảnh hiển thị. |

---

### 3. Bảng `inventory` (Kho nguyên liệu thô)
Quản lý các nguyên liệu thô dùng để chế biến hoặc hàng hóa chưa chế biến (Rượu, Nước ngọt).

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Mã định danh nguyên liệu. |
| `ingredient_name` | VARCHAR | Not Null | Tên nguyên liệu (VD: Bò Kobe, Tôm Sú, Vang Đỏ). |
| `unit` | VARCHAR | Not Null | Đơn vị tính (Kg, Gram, Chai, Lít). |
| `system_stock` | DECIMAL | Default 0 | Tồn kho hệ thống tự động tính toán (Tồn lý thuyết). |
| `actual_stock` | DECIMAL | | Tồn kho thực tế do Quản lý đi đếm đọng lại cuối ngày. |

---

### 4. Bảng `recipes` (Định lượng / Công thức nấu)
Là bảng trung gian kết nối `menu_items` và `inventory`, dùng để trừ kho tự động khi nấu.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Mã định danh công thức. |
| `menu_item_id` | UUID | Foreign Key | Liên kết tới món ăn thành phẩm (VD: Lẩu Thái). |
| `inventory_id` | UUID | Foreign Key | Liên kết tới nguyên liệu thô (VD: Tôm Sú). |
| `quantity_required` | DECIMAL | Not Null | Định lượng cần thiết (VD: 0.5 kg để nấu 1 lẩu). |

---

### 5. Bảng `table_sessions` (Phiên ăn tại bàn)
Quản lý trạng thái hiện tại của các bàn trong nhà hàng.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Mã định danh phiên bàn. |
| `table_name` | VARCHAR | Not Null | Tên bàn (VD: Bàn 01, Bàn VIP 2). |
| `status` | VARCHAR | empty, occupied, cleaning | Trạng thái hiện tại của bàn. |
| `pax` | INT | Default 0 | Số lượng khách đang ngồi tại bàn. |
| `started_at` | TIMESTAMP | | Thời gian bắt đầu ngồi. |
| `ended_at` | TIMESTAMP | | Thời gian khách đứng dậy thanh toán rời đi. |

---

### 6. Bảng `orders` (Hóa đơn tổng)
Quản lý tổng tiền và trạng thái thanh toán của toàn bộ hóa đơn.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Mã định danh đơn hàng. |
| `session_id` | UUID | Foreign Key | Liên kết với phiên bàn hiện tại. |
| `total_amount` | INT | Default 0 | Tổng tiền cần thanh toán. |
| `status` | VARCHAR | draft, confirmed, paid, cancelled | Trạng thái hóa đơn (Bản nháp, Đã chốt, Đã trả tiền...). |

---

### 7. Bảng `order_items` (Chi tiết từng món - Kết nối KDS)
Quản lý từng món ăn nhỏ bên trong hóa đơn. Đây là bảng quan trọng nhất để đẩy dữ liệu xuống màn hình Bếp.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Mã định danh chi tiết món. |
| `order_id` | UUID | Foreign Key | Liên kết với Hóa đơn tổng. |
| `menu_item_id` | UUID | Foreign Key | Liên kết với tên món trong Menu. |
| `quantity` | INT | Default 1 | Số lượng gọi (VD: x2 Lẩu Thái). |
| `status` | VARCHAR | pending, cooking, ready, served, void | Tiến trình làm món (Chờ nấu, Đang nấu, Chờ bưng, Đã phục vụ, Đã hủy). |
| `special_instructions`| TEXT | | Ghi chú của khách (VD: Không hành, Ít cay). |

---

### 8. Bảng `void_refund_logs` (Nhật ký Hủy món - Chống gian lận)
Lưu lại bằng chứng và nguyên nhân mỗi khi có thao tác hủy món.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Mã định danh log. |
| `order_item_id` | UUID | Foreign Key | Liên kết tới món ăn bị hủy. |
| `manager_id` | UUID | Foreign Key | Liên kết tới Quản lý đã nhập mã PIN duyệt hủy. |
| `reason` | TEXT | Not Null | Lý do hủy (Khách đổi ý, Hết đồ, Khách phàn nàn...). |

---

### 9. Bảng `voice_transcripts` (Nhật ký Hội thoại AI Voice)
Lưu trữ nội dung chat/voice giữa Khách và AI để đối soát nếu xảy ra tranh chấp gọi nhầm món.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Mã định danh log voice. |
| `session_id` | UUID | Foreign Key | Liên kết với phiên bàn (Để cuối ca bàn đó tự động bị xóa đi). |
| `raw_text` | TEXT | Not Null | Bản dịch nguyên văn lời khách nói (VD: "Cho chị 1 bò lúc lắc"). |
| `ai_intent` | JSONB | | Lệnh JSON cấu trúc do AI bóc tách ra được. |
