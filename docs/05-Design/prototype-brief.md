# Output #10 - Prototype Brief - Group 06 (Restaurant Operations & Smart Ordering)

> **Prototype Goal**: Kiểm chứng 4 flows gọi món thông minh có rủi ro cao và đánh giá tính dễ sử dụng (Usability) trên giao diện di động (Mobile-First) cho toàn bộ vòng đời đơn hàng: Khách gọi món → Bếp KDS → Phục vụ dọn món.  
> **Persona chính**:  
> - **Anh Tuấn** (Khách hàng đi ăn cùng gia đình).  
> - **Bếp trưởng Hùng** (Bếp KDS chế biến món).  
> - **Chị Lan** (Phục vụ dọn món tại bàn).  
> **Nguồn yêu cầu**: `REQ-RO-01..09`, `BR-RO-01..06`, `ADR-001`.

---

## 1. 4 CRITICAL USER FLOWS (LUỒNG NỔI BẬT END-TO-END)

### FLOW A - Hybrid Ordering: Browse Touch & AI Voice (Gọi món Chạm & Giọng nói)
1. **Chế độ Chạm (Manual Touch)**: Khách hàng trực tiếp cuộn xem E-Menu trên điện thoại và bấm nút *"Thêm vào đơn"* trên thẻ món ăn bất kỳ $\rightarrow$ Món được thêm linh hoạt vào Order Draft.
2. **Chế độ Giọng nói (AI Voice Assistant)**: Khách bấm nút Micro floating button, hệ thống hiển thị màn hình Order Draft chứa các món đang chọn, nếu không có món đang chọn thì hiển thị **Giỏ hàng trống** →  nói câu lệnh *"Cho 1 phở bò không hành và 2 trà đá"* $\rightarrow$ `listening` → `transcript` → `processing` → trích xuất món + ghi chú → đồng bộ cùng các món đã chạm thêm vào Order Draft.

### FLOW B - Clarification (Làm rõ câu lệnh mơ hồ theo BR-RO-04) 
Khách nói hoặc bấm chọn câu thoại *"Cho 1 đĩa bò"*  
→ AI Assistant phát hiện 2 món phù hợp (`Bò xào cần` - 85k & `Bò sốt tiêu đen` - 120k) → Hiển thị Modal làm rõ → Khách bấm chọn `Bò xào cần` → cập nhật Order Draft.

### FLOW C - Out of Stock Handling (Xử lý món hết hàng theo ADR-001)
`stock check` → phát hiện món mang trạng thái Out of Stock → thẻ món tự mờ xám (*grayed-out*) → vô hiệu hóa nút bấm
Khách chọn chạm hoặc nói *"Thêm 1 Bò sốt tiêu đen"*   → AI đọc/hiển thị cảnh báo hết hàng và đề xuất món thay thế.

### FLOW D - Checkout & Full Lifecycle Handover (Chốt đơn → Bếp KDS → Phục vụ)
1. **Khách chốt đơn trên di động**: Xem giỏ hàng Order Draft → kiểm tra chi tiết món + ghi chú + tổng tiền → bấm nút Explicit Confirmation *"Xác nhận gửi Bếp"* → `success` (Mã đơn #B06-001).
2. **Bếp KDS nhận & xử lý đơn real-time**:
   - Trạng thái 1 (Mặc định): **`Chờ nấu`** (Pending) khi đơn vừa gửi xuống.
   - Trạng thái 2: Bếp bấm chuyển sang **`Đang làm`** (In Progress).
   - Trạng thái 3: Bếp hoàn tất chế biến, bấm chuyển sang **`Đã xong - Chờ phục vụ`** (Ready for Pickup).
3. **Phục vụ dọn món & Hoàn tất**:
   - Màn hình Waiter Tablet nhận thông báo món đã sẵn sàng từ Bếp.
   - Phục vụ mang món đến Bàn 06 và bấm nút **`Đã phục vụ`** (Served) để hoàn tất vòng đời món ăn.

---

## 2. REQUIRED SCREENS (MÀN HÌNH BẮT BUỘC)

0. **Screen 0 - Role Selection & Logout** *(Bổ sung theo duyệt Prototype, ngày 2026-09-04; cập nhật cách đổi vai cùng ngày)*: Màn hình khởi động cho phép người kiểm thử chọn vai thao tác (`Khách gọi món (Di động)` | `Bếp KDS` | `Phục vụ Waiter`) trước khi vào giao diện. Khi muốn đổi vai, bấm **Đăng xuất / Đổi vai** để quay về Screen 0 và chọn lại — **không có thanh chuyển vai trong ứng dụng**.
1. **Screen 1 - Customer Mobile E-Menu & AI Voice Assistant**: Giao diện tối ưu di động (Mobile App Layout), cho phép cuộn xem món, chọn món chạm tay và tích hợp Micro Voice Assistant.
2. **Screen 2 - Mobile Order Draft & Explicit Confirmation Modal**: Màn hình giỏ hàng di động dạng Drawer/Sticky Bottom Bar hiển thị danh sách món chọn linh hoạt, ghi chú đặc biệt, tổng tiền và nút bấm *"Xác nhận gửi Bếp"*.
3. **Screen 3 - Kitchen Display System (KDS)**: Màn hình quản lý đơn tại Bếp hỗ trợ chuyển 3 trạng thái: `Chờ nấu` → `Đang làm` → `Đã xong - Chờ phục vụ`.
4. **Screen 4 - Waiter Tablet**: Màn hình cho nhân viên phục vụ nhận thông báo món đã xong từ Bếp và nút bấm `Đã phục vụ`.

---

## 3. REQUIRED STATES (10 TRẠNG THÁI UI BẮT BUỘC)
| Trạng thái (State) | Kích hoạt khi nào (Trigger) | Hành vi giao diện & UX Copy hiển thị |
| :--- | :--- | :--- |
| `idle` | Khách vừa mở bàn, chưa thao tác gì. | Nút micro ở trạng thái nghỉ; hiển thị thanh tìm kiếm gợi ý: "Tìm kiếm món " |
| `listening` | Khách bấm giữ hoặc chạm vào micro. | Nút micro đổi màu/nhấp nháy sóng âm; hiển thị nhãn: "Đang nghe... Nói tên món ăn của bạn."[cite: 2] |
| `processing` | Khách dứt câu lệnh, hệ thống đang bóc tách intent. | Hiển thị transcript tạm thời kèm biểu tượng quay chờ (spinner) và text: "Đang xử lý yêu cầu..."[cite: 2] |
| `empty` | Phiên bàn mới mở, khách chưa chọn món nào. | Màn hình giỏ hàng trống; hiển thị minh họa kèm text: "Bàn chưa chọn món. Hãy gọi món qua trợ lý hoặc chọn từ menu." |
| `ambiguous` | Câu lệnh gọi món trùng nhiều sản phẩm. | Trợ lý hỏi lại: "Quán có 2 món bò: Bò lúc lắc (85k) và Bò xào cần tây (75k). Bạn muốn chọn món nào?" kèm 2 thẻ để bấm chọn trực tiếp[cite: 2]. |
| `out-of-stock` | Món được chọn đã hết hàng trong kho. | Nút thêm bị vô hiệu hóa; nhãn màu đỏ "Hết hàng"; thông báo: "Món này hiện đã hết, vui lòng chọn món khác."[cite: 2] |
| `network-error` | Kết nối mạng chập chờn hoặc gọi API thất bại. | Banner cảnh báo đỏ: "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại; danh sách món chưa thay đổi." kèm nút "Thử lại"[cite: 2]. |
| `order-draft` | Khách bấm xem danh sách món đã chọn. | Hiển thị bảng tổng hợp món, số lượng, giá tạm tính và huy hiệu cảnh báo rõ: "Bản nháp - Chưa gửi bếp"[cite: 2]. |
| `confirm` | Khách nhấn "Gửi bếp". | Modal/Hộp thoại khóa màn hình hiển thị: "Xác nhận gửi 3 món xuống bếp? Đơn sau khi gửi sẽ không thể tự hủy trên máy." kèm 2 nút [Hủy bỏ] và [Xác nhận][cite: 2]. |
| `success` | Khách đã bấm nút xác nhận gửi bếp. | Màn hình thông báo thành công: "Đã gửi đơn xuống bếp thành công! Mã bàn: B04" kèm âm thanh thông báo và chuyển trạng thái món sang "Đang chờ nấu"[cite: 2]. |

---

## 4. SAMPLE DATA (DỮ LIỆU MẪU)

- **Thông tin vị trí**: Bàn 06 (Lầu 1, Khách: Anh Tuấn + Gia đình 4 người).
- **Thực đơn mẫu (Menu Catalog tương tác linh hoạt)**:
  - `M01`: Phở bò tái lăn - 65.000 VNĐ | Trạng thái: `Available`
  - `M02`: Bún chả Hà Nội - 55.000 VNĐ | Trạng thái: `Available`
  - `M03`: Bò xào cần - 85.000 VNĐ | Trạng thái: `Available`
  - `M04`: Bò sốt tiêu đen - 120.000 VNĐ | Trạng thái: `Out of Stock` (Dùng cho Flow C / ADR-001)
  - `M05`: Trà đá - 5.000 VNĐ | Trạng thái: `Available`
  - `M06`: Set lẩu gia đình 4 người - 350.000 VNĐ | Trạng thái: `Available`

---

## 5. DESIGN CONSTRAINTS (RÀNG BUỘC THIẾT KẾ)

1. **Ràng buộc Giao diện Di động (Mobile-First UX Constraint)**:
   - Màn hình Khách gọi món, nhân viên phục vụ và bếp được thiết kế chuẩn khung hình Smartphone (khung viền di động 430px hoặc Responsive Mobile Layout).
   - Nút bấm và vùng tương tác đạt chuẩn tối thiểu $44 \times 44\text{px}$ để chạm ngón tay mượt mà.
   - Giỏ hàng Order Draft được bố trí cố định dưới chân màn hình (Sticky Bottom Bar).
2. **Tuân thủ Business Rules**:
   - `BR-RO-01`: Giá món ăn cố định từ dữ liệu hệ thống, AI không tự sinh giá hay sửa giá.
   - `BR-RO-03`: Mọi thao tác chạm hay giọng nói đều quy về màn hình Order Draft trước khi bấm nút xác nhận gửi bếp (*Explicit Confirmation*).
   - `BR-RO-05`: Khách hàng không có quyền tự hủy đơn sau khi đã gửi bếp.
3. **Thanh chuyển vai (Role Switcher)**:
   - Không có thanh chuyển vai trong ứng dụng: muốn đổi vai (`Khách gọi món (Di động)` | `Bếp KDS` | `Phục vụ Waiter`), bấm **Đăng xuất / Đổi vai** trên thanh trên cùng để quay về Screen 0 và chọn lại. *(Thay thế yêu cầu Role Switcher cố định — cập nhật 2026-09-04)*

---

## 6. PROMPT ASSUMPTIONS (GIẢ ĐỊNH THIẾT KẾ PROTOTYPE)

*(Các giả định kỹ thuật hiển thị riêng biệt theo đúng quy định, không trộn lẫn vào Requirement nguồn)*

1. **Assumed Dual-Input Engine**: Giả định hệ thống cho phép người dùng thêm món linh hoạt qua cả 2 kênh (chạm thẻ món trên E-Menu di động VÀ gọi món bằng AI Voice), hai kênh này cùng cập nhật vào một State giỏ hàng duy nhất.
2. **Assumed Voice Recognition Engine**: Sử dụng Web Speech API trình duyệt (hoặc danh sách kịch bản câu thoại có sẵn) để giả lập việc chuyển giọng nói thành văn bản (*Transcript*).
3. **Assumed Real-time Data Sync**: Giả định việc đồng bộ dữ liệu trạng thái món giữa Khách di động - Bếp KDS - Phục vụ được xử lý tức thì qua LocalStorage/In-memory State Manager.
4. **Assumed Role Gate & Logout**: Giả định màn hình chọn vai ban đầu (Screen 0) và nút Đăng xuất / Đổi vai thay thế đăng nhập thật; prototype không cài đặt RBAC. *(Bổ sung 2026-09-04)*
