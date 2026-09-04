# User Stories & Acceptance Criteria (Phase 4)
> **Quy tắc sinh:** Bám sát 100% vào `requirements.md`, `giaotrinh.md` (Phase 4), và thỏa mãn Definition of Ready (DoR).
> **Cấu trúc:** Nhóm requirement thành các Epic (Customer, Operations, Management). Mỗi Story có đủ Estimate (≤3 points) và Dependencies.

## Bảng Tổng Hợp (Epic & User Stories)
*Lưu ý: Bảng này tuân thủ Output #13 trong giáo trình, đóng vai trò tóm tắt toàn bộ Backlog.*

| Epic | Capability | Story | Title | Pts |
|---|---|---|---|---|
| EP1 | Guest Ordering Experience | US-01 | Khách lướt xem Menu và Thêm vào Giỏ hàng | 2 |
| EP1 | Guest Ordering Experience | US-02 | Dùng giọng nói AI (Voice) để gọi món bổ sung | 3 |
| EP1 | Guest Ordering Experience | US-05 | Khách hàng Thanh toán (Trả toàn bộ hoặc Chia Bill) | 2 |
| EP2 | Kitchen & Table Operations | US-03 | Bếp nhận Order và Báo hoàn thành trên KDS | 3 |
| EP2 | Kitchen & Table Operations | US-04 | Phục vụ bưng món và Cập nhật trạng thái | 2 |
| EP3 | Restaurant Management & CMS | US-06 | Quản lý xem Dashboard Doanh thu | 2 |
| EP3 | Restaurant Management & CMS | US-07 | Quản lý chỉnh sửa Menu (CMS) | 2 |
| EP3 | Restaurant Management & CMS | US-08 | Đối soát Tồn kho (Inventory Reconciliation) | 1 |

---

# EPIC 1: GUEST ORDERING EXPERIENCE (Trải nghiệm gọi món của khách)
*Mang lại giá trị cốt lõi: Khách tự gọi món nhanh chóng qua đa nền tảng (Web/Voice) và tự thanh toán.*

## US-01: Khách lướt xem Menu và Thêm vào Giỏ hàng
- **User Story:** *Là* Khách hàng tại bàn, *tôi muốn* lướt xem E-Menu và thêm món vào Giỏ (Order Draft), *để* tôi có thể tự kiểm tra danh sách trước khi chốt gửi bếp.
- **Context:** Điểm chạm đầu tiên của hệ thống, đòi hỏi UX/UI trực quan. Cần tuân thủ quy tắc Không tự động chốt đơn (Explicit Confirmation - BR-RO-03). (Phụ trách: Nhàn - UX/UI).
- **Requirement IDs:** `REQ-04`, `REQ-09`, `REQ-15`
- **Acceptance Criteria:**
  - **AC1:** `CHO TRƯỚC` khách quét QR mã bàn hợp lệ, `KHI` chọn món và bấm "Thêm vào giỏ", `THÌ` món hiển thị trong Order Draft kèm tổng tiền dự kiến.
  - **AC2:** `CHO TRƯỚC` khách ở Order Draft, `KHI` bấm "Gửi đơn xuống bếp", `THÌ` hệ thống hiện Popup xác nhận cuối cùng (Yes/No).
  - **AC3:** `CHO TRƯỚC` khách mở E-Menu, `KHI` một món bị Bếp báo *Out of Stock*, `THÌ` món đó hiển thị mờ và không thể click thêm.
- **Out of Scope:** Không xử lý thanh toán trực tiếp tại màn hình này.
- **Dependencies:** Thiết kế UI/UX E-Menu (TBD), API Fetch Menu List (TBD).
- **Estimate đề xuất:** 2 points

## US-02: Dùng giọng nói AI (Voice) để gọi món bổ sung
- **User Story:** *Là* Khách hàng, *tôi muốn* bấm nút Micro để đọc tên món ăn, *để* AI phân tích và tự nhặt đúng món bỏ vào giỏ hàng.
- **Context:** Trải nghiệm rảnh tay có rủi ro nhận diện sai do môi trường. AI phải tuân thủ quyền riêng tư dữ liệu và Fallback NFR. (Phụ trách: Ny - QA).
- **Requirement IDs:** `REQ-01`, `REQ-05`, `NFR-RO-02`, `NFR-RO-05`
- **Acceptance Criteria:**
  - **AC1:** `CHO TRƯỚC` đang ở màn hình AI Chat, `KHI` khách nói *"Cho 2 ly Pepsi"*, `THÌ` AI phản hồi bằng giọng nói *"Đã thêm 2 ly Pepsi"* và đẩy món vào Giỏ.
  - **AC2:** `CHO TRƯỚC` khách nói tên nguyên liệu chung chung (VD: *"Bò"*), `KHI` menu có nhiều loại, `THÌ` AI kích hoạt Clarification để hỏi lại.
  - **AC3:** `CHO TRƯỚC` môi trường nhà hàng quá ồn, `KHI` AI nghe lỗi quá 2 lần, `THÌ` tự động hiển thị bàn phím (Text fallback - NFR-RO-05).
  - **AC4:** `CHO TRƯỚC` phiên bàn kết thúc (Thanh toán xong), `KHI` kiểm tra server, `THÌ` file âm thanh thô của khách phải bị xóa vĩnh viễn (NFR-RO-02).
- **Out of Scope:** AI tự động giảm giá hoặc tư vấn chuyện phiếm (Prompt injection).
- **Dependencies:** API nhận diện giọng nói Speech-to-Text (TBD), Backend xử lý NLP (TBD). Cần làm sau khi US-01 (Giỏ hàng) hoàn thiện.
- **Estimate đề xuất:** 3 points

## US-05: Khách hàng Thanh toán (Trả toàn bộ hoặc Chia Bill)
- **User Story:** *Là* Khách hàng, *tôi muốn* chọn thanh toán toàn bộ hoặc chia bill trên thiết bị, *để* có thể linh hoạt tự trả tiền phần của mình.
- **Context:** Tính năng thanh toán tại bàn cuối bữa ăn.
- **Requirement IDs:** `REQ-03`
- **Acceptance Criteria:**
  - **AC1:** `CHO TRƯỚC` khách bấm nút "Thanh toán", `KHI` chọn "Trả toàn bộ", `THÌ` hệ thống sinh ra 1 mã QR duy nhất cho tổng hóa đơn.
  - **AC2:** `CHO TRƯỚC` khách bấm "Thanh toán", `KHI` chọn "Split Bill", `THÌ` hiển thị 2 tùy chọn: "Chia đều" và "Chia theo món".
  - **AC3:** `CHO TRƯỚC` khách chọn Chia đều cho 3 người, `KHI` tổng bill 300k, `THÌ` hệ thống tạo ra 3 mã QR MoMo 100k.
- **Out of Scope:** Không hỗ trợ thanh toán thẻ Visa/Mastercard (Theo giới hạn scope gốc).
- **Dependencies:** Cổng thanh toán nội địa (VNPAY/MoMo API - TBD).
- **Estimate đề xuất:** 2 points

---

# EPIC 2: KITCHEN & TABLE OPERATIONS (Vận hành Bếp & Phục vụ)
*Mang lại giá trị cốt lõi: Tự động hóa luồng thông tin giữa Bếp và Nhân viên phục vụ để tăng tốc độ xoay vòng bàn.*

## US-03: Bếp nhận Order và Báo hoàn thành trên KDS
- **User Story:** *Là* Đầu bếp, *tôi muốn* nhìn thấy đơn hàng hiện lên KDS theo thứ tự thời gian, *để* tôi biết món nào cần nấu trước và báo Done.
- **Context:** Xử lý hiển thị thông tin Real-time và cảnh báo trễ hạn. (Phụ trách: Nhã - Eng).
- **Requirement IDs:** `REQ-08`, `REQ-09`
- **Acceptance Criteria:**
  - **AC1:** `CHO TRƯỚC` khách bấm gửi đơn, `KHI` hệ thống nhận đơn, `THÌ` KDS tự động nhảy Ticket kèm đồng hồ đếm ngược.
  - **AC2:** `CHO TRƯỚC` Ticket trên KDS chờ quá 15 phút, `KHI` đồng hồ chạm mốc, `THÌ` Ticket chớp đỏ và đẩy lên vị trí đầu ưu tiên.
  - **AC3:** `CHO TRƯỚC` Bếp bấm *Out of Stock* món Bò, `KHI` hệ thống ghi nhận, `THÌ` khóa món Bò trên mọi thiết bị ngay lập tức.
- **Out of Scope:** KDS không có quyền gộp bill hay đổi giá món ăn.
- **Dependencies:** Cấu trúc Websocket/Realtime (TBD).
- **Estimate đề xuất:** 3 points

## US-04: Phục vụ bưng món và Cập nhật trạng thái

**As a** Nhân viên phục vụ (Waiter), **I want** nhận thông báo ngay khi món ăn được nấu xong, **so that** tôi có thể bưng ra bàn nhanh chóng và cập nhật trạng thái đơn hàng trên sơ đồ bàn.

**Context:**
- Quản lý vòng đời món ăn (State Machine) từ lúc Bếp nấu xong đến khi Khách nhận.
- Áp dụng các yêu cầu: `REQ-06` (Thông báo món chín), `REQ-07` (Cập nhật trạng thái Served), `REQ-10` (Hủy món).
- Ràng buộc nghiệp vụ: `BR-02` (Hủy món phải có PIN Manager), `NFR-RO-03` (RBAC - Phục vụ không có quyền Hủy món).
- Phụ trách: Trang (BA).

**Acceptance Criteria:**
- **AC1 (Happy Path - Thông báo món hoàn thành):**
  `CHO TRƯỚC` món ăn được Bếp bấm "Done" trên KDS, `KHI` hệ thống nhận tín hiệu, `THÌ` Tablet của nhân viên phục vụ phát âm thanh "Ting Ting" và hiển thị Popup báo số bàn.
- **AC2 (Happy Path - Cập nhật trạng thái Table Map):**
  `CHO TRƯỚC` phục vụ mang món ra bàn, `KHI` bấm nút "Đã phục vụ" (Served), `THÌ` trạng thái món đổi thành *Served* và màu sắc bàn trên Table Map được cập nhật.
- **AC3 (Business Rule - Xử lý Khách hủy/trả món):**
  `CHO TRƯỚC` khách hàng từ chối nhận món, `KHI` phục vụ bấm "Hủy món", `THÌ` hệ thống hiện Popup yêu cầu nhập mã PIN của Manager (Áp dụng BR-02).
- **AC4 (Edge Case - Nhập sai mã PIN Hủy món):**
  `CHO TRƯỚC` Popup yêu cầu mã PIN Hủy món đang hiện, `KHI` nhập sai mã PIN quá 3 lần, `THÌ` hệ thống khóa chức năng Hủy trên thiết bị đó trong 5 phút.
- **AC5 (Fallback / Error Handling - Rớt mạng kết nối):**
  `CHO TRƯỚC` Tablet của phục vụ rớt mạng tạm thời, `KHI` có thông báo Bếp Done, `THÌ` hệ thống tự động đẩy thông báo Fallback về màn hình POS chính của Thu ngân.

**Out of Scope:**
- Không tích hợp hệ thống định vị GPS theo dõi nhân viên phục vụ.
- Không xử lý thanh toán hóa đơn tại luồng này.

**Dependencies:**
- Cần hoàn thành US-03 (Bếp KDS) trước.
- API Push Notification / Websocket.

**Estimate:** 2 points

---

# EPIC 3: RESTAURANT MANAGEMENT & CMS (Quản trị nhà hàng)
*Mang lại giá trị cốt lõi: Cung cấp công cụ cho Quản lý kiểm soát giá cả, doanh thu và tồn kho.*

## US-06: Quản lý xem Dashboard Doanh thu
- **User Story:** *Là* Quản lý nhà hàng, *tôi muốn* xem Dashboard báo cáo trên POS, *để* tôi nắm doanh thu và top món bán chạy trong ngày.
- **Context:** Chức năng đọc số liệu thống kê.
- **Requirement IDs:** `REQ-13`
- **Acceptance Criteria:**
  - **AC1:** `CHO TRƯỚC` Manager vào POS, `KHI` click tab Dashboard, `THÌ` biểu đồ doanh thu ca hiện tại hiển thị.
  - **AC2:** `CHO TRƯỚC` Dashboard đang mở, `KHI` có bàn thanh toán xong, `THÌ` Tổng doanh thu tự động nhảy số.
- **Out of Scope:** Không xuất file phân tích tài chính/PDF phức tạp.
- **Dependencies:** Database Aggregation API (TBD).
- **Estimate đề xuất:** 2 points

## US-07: Quản lý chỉnh sửa Menu (CMS)
- **User Story:** *Là* Quản lý nhà hàng, *tôi muốn* sửa tên, ảnh, giá món ăn trong phần mềm, *để* Menu E-menu tự động lấy giá mới nhất.
- **Context:** Thao tác CRUD Menu và tuân thủ phân quyền RBAC.
- **Requirement IDs:** `REQ-11`, `NFR-RO-03`
- **Acceptance Criteria:**
  - **AC1:** `CHO TRƯỚC` Quản lý đổi giá món Bít tết, `KHI` bấm Lưu, `THÌ` giá trên điện thoại khách hàng lập tức đổi theo.
  - **AC2:** `CHO TRƯỚC` Waiter truy cập link sửa Menu, `KHI` load trang, `THÌ` bị chặn và báo lỗi 403 Forbidden (NFR-RO-03).
- **Out of Scope:** Không tích hợp công cụ cắt ghép chỉnh sửa ảnh trực tiếp.
- **Dependencies:** Cần thiết kế Role-based Access Control (RBAC) - (TBD).
- **Estimate đề xuất:** 2 points

## US-08: Đối soát Tồn kho (Inventory Reconciliation)
- **User Story:** *Là* Bếp trưởng / Quản lý, *tôi muốn* nhập số lượng nguyên liệu thực tế cuối ngày, *để* phần mềm đối chiếu hao hụt.
- **Context:** Quy trình chốt ca kho.
- **Requirement IDs:** `REQ-12`
- **Acceptance Criteria:**
  - **AC1:** `CHO TRƯỚC` màn hình Tồn kho, `KHI` nhập 5kg (số lý thuyết là 6kg), `THÌ` đánh dấu chênh lệch -1kg màu đỏ.
  - **AC2:** `CHO TRƯỚC` hoàn tất, `KHI` bấm "Chốt ca", `THÌ` tồn kho đầu ngày hôm sau thiết lập thành số thực tế vừa nhập.
- **Out of Scope:** Quản lý hạn sử dụng (HSD) của nguyên liệu.
- **Dependencies:** Database Inventory (TBD).
- **Estimate đề xuất:** 1 point
