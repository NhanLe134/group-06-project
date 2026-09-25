# Screen Inventory & State Matrix - Group 06

> **Tài liệu**: Danh mục Màn hình & Ma trận Trạng thái Giao diện (Screen Inventory & State Matrix)  
> **Phiên bản**: 1.0 (Phân tích theo Requirements `REQ-01` đến `REQ-15`, Business Rules `BR-RO-01..06` & `ADR-001..004`)  
> **Người thực hiện**: Lê Thị Thanh Nhàn (Role UX/UI Designer & AI/Vault Master)  

---

## 1. DANH MỤC TỔNG HỢP MÀN HÌNH (SCREEN INVENTORY)

Dựa trên toàn bộ Yêu cầu nghiệp vụ (`requirements.md`), các quy tắc (`BR-RO`) và quyết định kiến trúc (`ADR`), hệ thống được quy hoạch gồm **6 Màn hình cốt lõi** phục vụ trọn vẹn 3 nhóm người dùng (Khách hàng, Bếp, Phục vụ & Quản lý):

| mã Màn hình (Screen ID) | Tên Màn hình | Người dùng chính (Persona) | Yêu cầu Kỹ thuật liên kết (Requirement IDs) | Mô tả Chức năng & Phạm vi Giao diện |
| :---: | :--- | :--- | :--- | :--- |
| **SCR-CUST-01** | E-Menu Di động & Trợ lý Voice AI | Khách hàng (Anh Tuấn) | `REQ-01`, `REQ-08`, `REQ-09`, `REQ-15`, `BR-RO-04`, `ADR-001`, `ADR-002`, `ADR-004` | Xem danh mục món ăn, cuộn chọn món chạm tay, nút Micro gọi món bằng giọng nói có hiệu ứng sóng âm thu âm, popup hỏi làm rõ loại món và hiển thị cảnh báo món hết hàng mờ xám (*Grayed-out*). |
| **SCR-CUST-02** | Giỏ hàng Order Draft & Xác nhận gửi Bếp | Khách hàng (Anh Tuấn) | `REQ-02`, `REQ-15`, `BR-RO-03`, `BR-RO-05`, `ADR-001`, `ADR-003` | Giỏ hàng tạm tính hiển thị danh sách món chọn, ghi chú "không hành", tổng tiền, nhãn màu đỏ *"Bản nháp - Chưa gửi bếp"*, khóa nút gửi bếp nếu có món hết hàng và nút bấm *"Xác nhận gửi Bếp ngay"*. |
| **SCR-CUST-03** | Hóa đơn & Thanh toán Mã QR tại bàn | Khách hàng (Anh Tuấn) | `REQ-03`, `REQ-04`, `BR-RO-06` | Xem lại toàn bộ danh sách món đã gọi trong phiên, mã QR thanh toán động MoMo/VNPAY chính xác số tiền, và công cụ hỗ trợ chia tiền (Split Bill) theo người hoặc theo món. |
| **SCR-KDS-01** | Màn hình Bếp KDS (Kitchen Display System) | Bếp trưởng (Bếp Hùng) | `REQ-03`, `REQ-08`, `REQ-09` | Hiển thị thẻ đơn theo thời gian gửi (FIFO), cảnh báo nhấp nháy đỏ khi chờ quá 15 phút, nút bấm chuyển 3 trạng thái (`Chờ nấu` → `Đang làm` → `Đã xong`), và bảng nút công tắc báo món Hết hàng (*Out of Stock*). |
| **SCR-WAIT-01** | Waiter Tablet — Chuông báo & Dọn món | Phục vụ (Chị Lan) | `REQ-05`, `REQ-07` | Chuông báo âm thanh và danh sách món đã nấu xong từ Bếp, nút bấm `Đã phục vụ` để dọn món tới bàn, và công cụ nhận lệnh thoại hỗ trợ gọi món nhanh cho phục vụ. |
| **SCR-WAIT-02** | Sơ đồ Bàn Table Session & Phân quyền Quản lý | Phục vụ & Quản lý | `REQ-06`, `REQ-10` | Sơ đồ màu sắc trạng thái bàn (*Trống*, *Đang ăn*, *Cần dọn*), và cửa sổ phân quyền RBAC yêu cầu mật khẩu Quản lý khi thực hiện hủy món (Void/Refund). |

---

## 2. MA TRẬN TRẠNG THÁI GIAO DIỆN (STATE MATRIX)

Ma trận dưới đây xác định chính xác các trạng thái giao diện (UI States) xuất hiện trên từng màn hình, đảm bảo Developer và QA không bỏ sót bất kỳ kịch bản nào khi lập trình và viết Test Case.

| Mã Màn hình | Default | Listening / Processing | Ambiguous (Hỏi lại) | Out-of-Stock (Mờ xám) | Order-Draft | Confirm | Success | Empty | Network Error |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **SCR-CUST-01** (E-Menu) | **X** | **X**  | **X** | **X**  | — | — | — | — | **X** (Banner đỏ) |
| **SCR-CUST-02** (Order Draft) | — | — | — | **X**  | **X** | **X**  | **X**  | **X** | **X** |
| **SCR-CUST-03** (Thanh toán QR) | **X** | — | — | — | — | **X** | **X** | — | **X** |
| **SCR-KDS-01** (Bếp KDS) | **X**  | **X**  | — | **X**  | — | — | **X**  | **X** | **X** |
| **SCR-WAIT-01** (Waiter Tablet) | **X**  | **X**  | — | — | — | — | **X**  | **X**  | **X** |
| **SCR-WAIT-02** (Sơ đồ Bàn) | **X** | — | — | — | — | **X**  | **X**  | — | **X** |


