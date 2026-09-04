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

## US-01 - Khách lướt xem Menu và Thêm vào Giỏ hàng

**User Story:** *As a* Khách hàng tại bàn (Customer), *I want* lướt xem E-Menu hiển thị đầy đủ hình ảnh và giá tiền, tự thao tác thêm món vào Giỏ nháp (Order Draft), *so that* tôi chủ động hoàn tất lựa chọn, tự kiểm tra đơn trước khi chủ động gửi xuống Bếp mà không phải chờ nhân viên ghi order.

**Context:**
Đặc tả bám sát tri thức Vault, trích dẫn nguồn:
- `REQ-01` (FR): E-Menu hiển thị danh sách món ăn kèm hình ảnh, giá tiền.
- `REQ-02` / `BR-01` (Explicit Confirmation): mọi thao tác chọn món chỉ đưa vào Order Draft; nghiêm cấm tự động gửi bếp khi khách chưa chủ động bấm "Xác nhận gửi bếp".
- `REQ-09` / `BR-03`: Bếp bấm Out of Stock (OOS) → trạng thái khóa món được đồng bộ trên mọi thiết bị trong vòng 1 giây.
- `REQ-15` / `ADR-001`: món đã nằm trong Order Draft khi chuyển OOS → hiển thị mờ xám (Grayed-out) kèm nhãn đỏ "Món đã hết"; nút "Xác nhận gửi bếp" bị khóa cho đến khi khách gỡ món OOS.
- `BR-06` (Stock Limitation): chặn chọn số lượng vượt quá tồn kho thực tế.
- `NFR-RO-01`: thời gian tải E-Menu < 2 giây.
- `NFR-RO-04`: vận hành mượt trên trình duyệt mobile (Safari iOS & Chrome Android).
- Ràng buộc kỹ thuật: giá món chỉ được đọc từ dữ liệu hệ thống (single source of truth); trạng thái tồn kho đồng bộ theo thời gian thực (WebSocket, ngưỡng ≤ 1s theo `BR-03`).

**Acceptance Criteria:**

- **AC1 (Happy Path — Duyệt menu và thêm món hợp lệ)**
  - **Given** Khách hàng quét mã QR hợp lệ tại Bàn 06 và mở E-Menu trên trình duyệt mobile (Safari iOS hoặc Chrome Android) — `NFR-RO-04`,
  - **When** E-Menu tải xong trong dưới 2 giây (`NFR-RO-01`) hiển thị danh sách món đầy đủ hình ảnh, giá tiền (`REQ-01`), và khách bấm nút "+ Thêm" trên một món đang ở trạng thái *Available*,
  - **Then** món được thêm vào Order Draft với số lượng mặc định = 1 và đúng giá từ dữ liệu hệ thống; thanh giỏ cập nhật số lượng món và tổng tiền tạm tính tức thì; hệ thống **không** gửi bất kỳ ticket nào xuống Bếp (`REQ-02`/`BR-01`).

- **AC2 (Edge Case — Stock Limit)**
  - **Given** Món "Trà đá" còn tồn kho thực tế = 5 phần (`BR-06`),
  - **When** Khách bấm tăng số lượng món "Trà đá" trong Order Draft lên mốc thứ 6 (vượt tồn kho),
  - **Then** Hệ thống chặn thao tác, hiển thị cảnh báo "Món này chỉ còn 5 phần"; số lượng được giữ tối đa bằng 5 và không thể lưu giá trị vượt tồn kho (`BR-06`).

- **AC3 (Edge Case — Out of Stock & ADR-001)**
  - **Given** Món "Bò sốt tiêu đen" đang nằm trong Order Draft của khách với số lượng 1,
  - **When** Bếp bấm Out of Stock trên KDS (`REQ-09`/`BR-03`) và trạng thái được đồng bộ đến thiết bị khách trong vòng 1 giây,
  - **Then** (1) item trong Order Draft tự chuyển mờ xám kèm nhãn đỏ "Món đã hết" (`REQ-15`/`ADR-001`); (2) thẻ món trên E-Menu chuyển xám, hiển thị nhãn "Hết hàng" và nút "+ Thêm" bị vô hiệu hóa (`REQ-09`/`BR-03`); (3) nút "Xác nhận gửi bếp" chuyển sang trạng thái Disabled cho đến khi khách gỡ món OOS khỏi Draft (`REQ-15`/`ADR-001`).

- **AC4 (Business Rule — Explicit Confirmation)**
  - **Given** Order Draft đang chứa ≥ 1 món hợp lệ (không còn món OOS) (`REQ-02`/`BR-01`),
  - **When** Khách bấm nút "Xác nhận gửi bếp",
  - **Then** hệ thống hiển thị modal xác nhận (số món, tổng tiền, cảnh báo "đơn đã gửi sẽ không thể tự hủy trên máy"); đơn chỉ được đẩy xuống Bếp sau khi khách bấm "Xác nhận" trong modal; sau khi gửi thành công, Order Draft làm trống cho vòng gọi mới và hệ thống sinh mã đơn. Mọi thao tác thêm món tại AC1 trước đó không tạo ra đơn tự động.

- **AC5 (Fallback / Error Handling)**
  - **Given** Thiết bị của khách mất kết nối mạng hoặc API E-Menu trả lỗi trong khi khách đang thao tác,
  - **When** Khách bấm "+ Thêm" hoặc kéo làm mới danh sách món,
  - **Then** hệ thống hiển thị banner đỏ "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại; danh sách món chưa thay đổi" kèm nút "Thử lại"; trạng thái Order Draft được bảo toàn nguyên vẹn (không mất món đã chọn); khi mạng khôi phục, bấm "Thử lại" tải lại E-Menu và trạng thái tồn kho mới nhất thành công (tự động áp dụng lại `REQ-09`/`ADR-001` nếu có món đã chuyển OOS trong thời gian ngắt kết nối).

**Out of Scope:**
- Gọi món bằng giọng nói AI (Voice-to-order, Clarification) — thuộc US-02.
- Luồng Bếp nhận ticket và chuyển trạng thái trên KDS — thuộc US-03.
- Thanh toán QR / Split Bill — thuộc US-05.
- Tư vấn món theo sở thích/dị ứng; CMS chỉnh sửa Menu; Đối soát tồn kho cuối ca — thuộc US-06, US-07, US-08.

**Dependencies:**
- API: `GET /menu?tableId=B06` (danh sách món: hình ảnh, giá, trạng thái tồn kho); `PATCH /cart/{tableId}` (đồng bộ Order Draft); kênh Real-time WebSocket đẩy sự kiện `out_of_stock` (điều kiện bắt buộc của `REQ-09`/`BR-03`).
- Component: MenuCard, OrderDraftDrawer (Sticky Bottom Bar), StockSyncService.
- Story phụ thuộc: US-03 (Bếp báo OOS trên KDS) phải sẵn sàng để có dữ kiện tồn kho real-time; US-02 (Voice) mở rộng trực tiếp trên Order Draft của US-01.

**Estimate:** 3 points

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
- **User Story:** *Là* Nhân viên phục vụ, *tôi muốn* nhận thông báo khi món nấu xong, *để* tôi bưng ra bàn kịp thời và cập nhật Table Map.
- **Context:** Quản lý State Machine vòng đời món ăn và xử lý ngoại lệ nghiệp vụ (Khách bom/Từ chối). (Phụ trách: Trang - BA).
- **Requirement IDs:** `REQ-06`, `REQ-07`, `REQ-10`
- **Acceptance Criteria:**
  - **AC1:** `CHO TRƯỚC` Bếp bấm "Done", `KHI` hệ thống nhận tin, `THÌ` Tablet của Waiter kêu "Ting Ting" và báo số bàn.
  - **AC2:** `CHO TRƯỚC` phục vụ bưng món ra bàn thành công, `KHI` phục vụ bấm "Đã phục vụ", `THÌ` trạng thái món đổi thành *Served* và cập nhật màu trên Table Map.
  - **AC3:** `CHO TRƯỚC` khách từ chối món (Cancel), `KHI` phục vụ bấm "Hủy món", `THÌ` hiện Popup yêu cầu mã PIN của Manager (Áp dụng NFR RBAC).
- **Out of Scope:** Không tích hợp hệ thống định vị GPS nhân viên.
- **Dependencies:** API Push Notification (TBD). Làm sau US-03.
- **Estimate đề xuất:** 2 points

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
