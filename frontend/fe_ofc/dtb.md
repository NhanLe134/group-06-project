# Tài liệu Cấu trúc Cơ sở dữ liệu (Database Schema)

Dưới đây là cấu trúc CSDL của hệ thống Smart Restaurant được trình bày dưới dạng bảng để dễ đọc và dễ tra cứu, không cần phải đọc code SQL.

> **Nguồn sự thật:** database PostgreSQL trên **Supabase** (ADR-ARCH-003, `vault/06-Engineering/architecture.md`). Tên bảng, tên cột, kiểu dữ liệu, giá trị mặc định và khóa ngoại dưới đây được lấy trực tiếp từ Supabase ngày 2026-10-06. Backend ánh xạ đúng các bảng này tại `backend/app/models/`. Bảng ánh xạ với ERD thiết kế (tên tiếng Anh) xem `vault/06-Engineering/data-model.md` Mục 5.
>
> **Lưu ý về giá trị trạng thái:** các giá trị hợp lệ của cột `trangthai` / `vaitro` lấy theo script tạo bảng của nhóm (ghi ở dạng comment). Database **chưa có ràng buộc CHECK** nên chưa tự chặn giá trị sai — backend phải kiểm tra. Giá trị in **đậm** là giá trị mặc định.

---

### 1. Bảng `nguoidung` (Tài khoản & Phân quyền)
Lưu trữ thông tin nhân viên và phân quyền RBAC (Role-Based Access Control).

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `uuid_generate_v4()` | Mã định danh duy nhất của nhân viên. |
| `hoten` | VARCHAR | Not Null | Tên hiển thị của nhân viên. |
| `vaitro` | VARCHAR | Not Null — `QUAN_LY`, `PHUC_VU`, `BEP`, `THU_NGAN` | Vai trò của nhân viên trong hệ thống (Quản lý, Phục vụ, Bếp, Thu ngân). |
| `mapin` | VARCHAR | | Mã PIN 4 số (VD: 1234) dùng để Quản lý duyệt lệnh Hủy món. |
| `ngaytao` | TIMESTAMP | Default `now()` | Thời gian tạo tài khoản. |

---

### 2. Bảng `thucdon` (Thực đơn - Món ăn thành phẩm)
Danh sách các món ăn xuất hiện trên E-Menu của Khách và Tablet của Phục vụ.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `uuid_generate_v4()` | Mã định danh món ăn. |
| `tenmon` | VARCHAR | Not Null | Tên món (VD: Lẩu Thái Tomyum, Bò Lúc Lắc). |
| `phanloai` | VARCHAR | Not Null | Phân loại (Món chính, Khai vị, Đồ uống...). |
| `giaban` | INT | Not Null | Giá bán ra (AI phải dựa vào đây để báo giá, không tự bịa). |
| `trangthaiban` | BOOLEAN | Default TRUE | Đang bán (TRUE) hoặc Hết hàng / Tạm ẩn (FALSE) — Bếp báo Hết hàng sẽ đặt FALSE (REQ-09, BR-03). Món được coi là Hết hàng khi `trangthaiban = FALSE` **hoặc** `soluongton = 0`. |
| `anhminhhoa` | TEXT | | Đường dẫn hình ảnh hiển thị. |
| `soluongton` | INT | Check `>= 0`, có thể NULL | Số lượng tồn của món bán nguyên đơn vị (nước uống chai/lon...). **NULL** = món chế biến, không đếm số lượng (nguyên liệu quản lý ở `tonkho`/`congthuc`). Về **0** thì món tự thành Hết hàng. Thêm bằng migration `backend/db/migrations/002_thucdon_soluongton.sql`. |

---

### 3. Bảng `tonkho` (Kho nguyên liệu thô)
Quản lý các nguyên liệu thô dùng để chế biến hoặc hàng hóa chưa chế biến (Rượu, Nước ngọt).

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `uuid_generate_v4()` | Mã định danh nguyên liệu. |
| `tennguyenlieu` | VARCHAR | Not Null | Tên nguyên liệu (VD: Bò Kobe, Tôm Sú, Vang Đỏ). |
| `donvitinh` | VARCHAR | Not Null | Đơn vị tính (Kg, Gram, Chai, Lít). |
| `tonhethong` | DECIMAL | Default 0 | Tồn kho hệ thống tự động tính toán (Tồn lý thuyết). |
| `tonthucte` | DECIMAL | | Tồn kho thực tế do Quản lý đi đếm cuối ngày. |

---

### 4. Bảng `congthuc` (Định lượng / Công thức nấu)
Là bảng trung gian kết nối `thucdon` và `tonkho`, dùng để trừ kho tự động khi nấu.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `uuid_generate_v4()` | Mã định danh công thức. |
| `thucdon_id` | UUID | Foreign Key → `thucdon.id` (ON DELETE CASCADE) | Liên kết tới món ăn thành phẩm (VD: Lẩu Thái). |
| `tonkho_id` | UUID | Foreign Key → `tonkho.id` (ON DELETE CASCADE) | Liên kết tới nguyên liệu thô (VD: Tôm Sú). |
| `dinhluong` | DECIMAL | Not Null | Định lượng cần thiết (VD: 0.5 kg để nấu 1 lẩu). |

---

### 5. Bảng `phienban` (Phiên ăn tại bàn)
Quản lý trạng thái hiện tại của các bàn trong nhà hàng.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `uuid_generate_v4()` | Mã định danh phiên bàn. |
| `tenban` | VARCHAR | Not Null | Tên bàn (VD: Bàn 01, Bàn VIP 2). |
| `trangthai` | VARCHAR | Default **`trong`** — **`trong`**, `dang_phuc_vu`, `dang_don_dep` | Trạng thái hiện tại của bàn (Trống, Đang phục vụ, Đang dọn dẹp). |
| `giobatdau` | TIMESTAMP | | Thời gian bắt đầu ngồi. |
| `gioketthuc` | TIMESTAMP | | Thời gian khách đứng dậy thanh toán rời đi. |

---

### 6. Bảng `hoadon` (Hóa đơn tổng)
Quản lý tổng tiền và trạng thái thanh toán của toàn bộ hóa đơn.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `uuid_generate_v4()` | Mã định danh hóa đơn. |
| `phienban_id` | UUID | Foreign Key → `phienban.id` (ON DELETE CASCADE) | Liên kết với phiên bàn hiện tại. |
| `tongtien` | INT | Default 0 | Tổng tiền cần thanh toán. |
| `trangthai` | VARCHAR | Default **`ban_nhap`** — **`ban_nhap`**, `da_chot`, `da_thanh_toan`, `da_huy` | Trạng thái hóa đơn (Bản nháp, Đã chốt, Đã trả tiền, Đã hủy). |
| `thoigian` | TIMESTAMP | Default `NOW()` | Thời điểm tạo hóa đơn. |
| `thoigian_thanhtoan` | TIMESTAMP | | Thời điểm Thu ngân hoàn tất thanh toán & đóng bàn. |

---

### 7. Bảng `chitietmon` (Chi tiết từng món - Kết nối KDS)
Quản lý từng món ăn nhỏ bên trong hóa đơn. Đây là bảng quan trọng nhất để đẩy dữ liệu xuống màn hình Bếp.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `uuid_generate_v4()` | Mã định danh chi tiết món. |
| `hoadon_id` | UUID | Foreign Key → `hoadon.id` (ON DELETE CASCADE) | Liên kết với Hóa đơn tổng. |
| `thucdon_id` | UUID | Foreign Key → `thucdon.id` | Liên kết với tên món trong Thực đơn. |
| `soluong` | INT | Default 1 | Số lượng gọi (VD: x2 Lẩu Thái). |
| `trangthai` | VARCHAR | Default **`cho_nau`** — **`cho_nau`**, `dang_nau`, `da_xong`, `da_phuc_vu`, `da_huy` | Tiến trình làm món (Chờ nấu, Đang nấu, Đã xong — chờ bưng, Đã phục vụ, Đã hủy). |
| `ghichu` | TEXT | | Ghi chú của khách (VD: Không hành, Ít cay). |
| `giogoimon` | TIMESTAMP | Not Null, Default `now()` | Giờ gọi món (lưu theo UTC). KDS xếp món theo thứ tự đến trước và hiển thị "Nhận lúc...". Thêm bằng migration `backend/db/migrations/001_chitietmon_giogoimon.sql`. |

---

### 8. Bảng `loghuymon` (Nhật ký Hủy món - Chống gian lận)
Lưu lại bằng chứng và nguyên nhân mỗi khi có thao tác hủy món.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `uuid_generate_v4()` | Mã định danh log. |
| `chitietmon_id` | UUID | Foreign Key → `chitietmon.id` (ON DELETE CASCADE) | Liên kết tới món ăn bị hủy. |
| `nguoiduyet_id` | UUID | Foreign Key → `nguoidung.id` | Liên kết tới Quản lý đã nhập mã PIN duyệt hủy. |
| `lydohuy` | TEXT | Not Null | Lý do hủy (Khách đổi ý, Hết đồ, Khách phàn nàn...). |

---

### 9. Bảng `loggiongnoi` (Nhật ký Hội thoại AI Voice)
Lưu trữ nội dung chat/voice giữa Khách và AI để đối soát nếu xảy ra tranh chấp gọi nhầm món.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default `uuid_generate_v4()` | Mã định danh log voice. |
| `phienban_id` | UUID | Foreign Key → `phienban.id` (ON DELETE CASCADE) | Liên kết với phiên bàn (Để cuối ca bàn đó tự động bị xóa đi). |
| `vanbangoc` | TEXT | Not Null | Bản ghi nguyên văn lời khách nói (VD: "Cho chị 1 bò lúc lắc"). |
| `ydinhai` | JSONB | | Lệnh JSON cấu trúc do AI bóc tách ra được. |

---

### Bảng đối chiếu tên cũ → tên mới

Dùng khi đọc lại các tài liệu cũ (vault, user story) còn ghi tên tiếng Anh.

| Bảng cũ | Bảng mới | Cột đổi tên |
| :--- | :--- | :--- |
| `users` | `nguoidung` | `full_name`→`hoten`, `role`→`vaitro`, `pin_code`→`mapin`, `created_at`→`ngaytao` |
| `menu_items` | `thucdon` | `name`→`tenmon`, `category`→`phanloai`, `price`→`giaban`, `is_active`→`trangthaiban`, `image_url`→`anhminhhoa` |
| `inventory` | `tonkho` | `ingredient_name`→`tennguyenlieu`, `unit`→`donvitinh`, `system_stock`→`tonhethong`, `actual_stock`→`tonthucte` |
| `recipes` | `congthuc` | `menu_item_id`→`thucdon_id`, `inventory_id`→`tonkho_id`, `quantity_required`→`dinhluong` |
| `table_sessions` | `phienban` | `table_name`→`tenban`, `status`→`trangthai`, `started_at`→`giobatdau`, `ended_at`→`gioketthuc` |
| `orders` | `hoadon` | `session_id`→`phienban_id`, `total_amount`→`tongtien`, `status`→`trangthai` |
| `order_items` | `chitietmon` | `order_id`→`hoadon_id`, `menu_item_id`→`thucdon_id`, `quantity`→`soluong`, `status`→`trangthai`, `special_instructions`→`ghichu` |
| `void_refund_logs` | `loghuymon` | `order_item_id`→`chitietmon_id`, `manager_id`→`nguoiduyet_id`, `reason`→`lydohuy` |
| `voice_transcripts` | `loggiongnoi` | `session_id`→`phienban_id`, `raw_text`→`vanbangoc`, `ai_intent`→`ydinhai` |
