# Screen Inventory & State Matrix - Group 06

> **Tài liệu**: Danh mục Màn hình & Ma trận Trạng thái Giao diện (Screen Inventory & State Matrix)  
> **Phiên bản**: 2.0 (Phân tích theo Requirements `REQ-01` đến `REQ-15`, Business Rules `BR-RO-01..06` & `ADR-001..004`, Cập nhật chuẩn theo giao diện `frontend/fe_ofc/`)  
> **Người thực hiện**: Lê Thị Thanh Nhàn (Role UX/UI Designer & AI/Vault Master)  

---

## 1. DANH MỤC TỔNG HỢP MÀN HÌNH (SCREEN INVENTORY)

Dựa trên toàn bộ Yêu cầu nghiệp vụ (`requirements.md`), các quy tắc (`BR-RO`) và giao diện thực tế (`frontend/fe_ofc/`), hệ thống được quy hoạch gồm **7 Màn hình/Phân vùng cốt lõi** phục vụ trọn vẹn các nhóm người dùng (Khách hàng, Bếp, Phục vụ, Thu ngân & Quản lý):

| Mã Màn hình (Screen ID) | Tên Màn hình | Người dùng chính (Persona) | Yêu cầu Kỹ thuật liên kết (Requirement IDs) | Mô tả Chức năng & Phạm vi Giao diện |
| :---: | :--- | :--- | :--- | :--- |
| **SCR-CUST-01** | E-Menu Di động & Trợ lý Voice AI | Khách hàng (Anh Tuấn) | `REQ-01`, `REQ-08`, `REQ-09`, `REQ-15`, `BR-RO-04`, `ADR-001`, `ADR-002`, `ADR-N01` | Xem danh mục món ăn, cuộn chọn món chạm tay, nút Micro gọi món bằng giọng nói có hiệu ứng sóng âm thu âm, popup hỏi làm rõ loại món, hiển thị cảnh báo món hết hàng mờ xám (*Grayed-out*), và **Modal ghi chú món ăn** (`#note-modal`: chọn chip không hành, nhiều cay hoặc gõ tự do). |
| **SCR-CUST-02** | Giỏ hàng Order Draft & Xác nhận gửi Bếp | Khách hàng (Anh Tuấn) | `REQ-02`, `REQ-15`, `BR-RO-03`, `BR-RO-05`, `ADR-001`, `ADR-003` | Giỏ hàng tạm tính hiển thị danh sách món chọn, ghi chú riêng từng món, tổng tiền, nhãn màu đỏ *"Bản nháp - Chưa gửi bếp"*, khóa nút gửi bếp nếu có món hết hàng và popup *"Xác nhận gửi Bếp ngay"*. |
| **SCR-CUST-03** | Hóa đơn tạm tính & Yêu cầu thanh toán | Khách hàng (Anh Tuấn) | `REQ-03`, `REQ-04`, `US-09`, `BR-RO-06` | Xem trang Hóa đơn tạm tính (`#bill-view`) tổng hợp các món đã gọi trong phiên, kiểm tra tiền và bấm nút *"Yêu cầu thanh toán"* (`#pay-modal`) gửi tín hiệu tới quầy Thu ngân. |
| **SCR-CASH-01** | Màn hình Thu ngân — Thanh toán & Đóng bàn | Thu ngân (Ca Chiều) | `REQ-03`, `REQ-05`, `REQ-06`, `US-05` | Danh sách bàn phân màu 3 trạng thái (*Trống - Xanh*, *Đang ăn - Đỏ*, *Yêu cầu trả tiền - Vàng*), bảng chi tiết hóa đơn, chọn PTTT (Tiền mặt / Mã QR MoMo), in bill, công tắc mô phỏng lỗi cổng thanh toán (`#err-sim` AC5), và nút Đóng bàn. |
| **SCR-KDS-01** | Màn hình Bếp KDS (Kitchen Display System) | Bếp trưởng (Bếp Hùng) | `REQ-03`, `REQ-08`, `REQ-09` | Hiển thị thẻ đơn theo thời gian gửi (FIFO), cảnh báo nhấp nháy đỏ khi chờ quá 15 phút, nút bấm chuyển 3 trạng thái (`Chờ nấu` → `Đang làm` → `Đã xong`), và bảng nút công tắc báo món Hết hàng (*Out of Stock*). |
| **SCR-WAIT-01** | Waiter Tablet — Chuông báo & Dọn món | Phục vụ (Chị Lan) | `REQ-05`, `REQ-07` | Chuông báo âm thanh và danh sách món đã nấu xong từ Bếp, nút bấm `Đã phục vụ` để dọn món tới bàn, và công cụ nhận lệnh thoại hỗ trợ gọi món nhanh cho phục vụ. |
| **SCR-WAIT-02** | Sơ đồ Bàn Table Session & Phân quyền Quản lý | Phục vụ & Quản lý | `REQ-06`, `REQ-10` | Sơ đồ màu sắc trạng thái bàn (*Trống*, *Đang ăn*, *Cần dọn*), và cửa sổ phân quyền RBAC yêu cầu mật khẩu Quản lý khi thực hiện hủy món (Void/Refund). |

---

## 2. MA TRẬN TRẠNG THÁI GIAO DIỆN (STATE MATRIX)

Ma trận dưới đây xác định chính xác các trạng thái giao diện (UI States) xuất hiện trên từng màn hình, đảm bảo Developer và QA không bỏ sót bất kỳ kịch bản nào khi lập trình và viết Test Case.

| Mã Màn hình | Default | Listening / Processing | Ambiguous (Hỏi lại) | Note Modal (Ghi chú) | Out-of-Stock (Mờ xám) | Order-Draft | Confirm | Success / Paid | Empty / Table States | Network / Pay Error |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **SCR-CUST-01** (E-Menu) | **X** | **X** | **X** | **X** | **X** | — | — | — | — | **X** (Banner đỏ) |
| **SCR-CUST-02** (Order Draft) | — | — | — | **X** | **X** | **X** | **X** | **X** | **X** | **X** |
| **SCR-CUST-03** (Hóa đơn tạm tính) | **X** | — | — | — | — | — | **X** | **X** | — | **X** |
| **SCR-CASH-01** (Thu ngân Cashier) | **X** | — | — | — | — | — | **X** | **X** (Đóng bàn) | **X** (3 màu bàn) | **X** (`#err-sim` AC5) |
| **SCR-KDS-01** (Bếp KDS) | **X** | **X** | — | — | **X** | — | — | **X** | **X** | **X** |
| **SCR-WAIT-01** (Waiter Tablet) | **X** | **X** | — | — | — | — | — | **X** | **X** | **X** |
| **SCR-WAIT-02** (Sơ đồ Bàn) | **X** | — | — | — | — | — | **X** | **X** | **X** | **X** |
