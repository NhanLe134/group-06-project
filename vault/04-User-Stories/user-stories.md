# User Stories & Acceptance Criteria (Phase 4)
> **Quy tắc sinh:** Bám sát 100% vào `requirements.md`, `giaotrinh.md` (Phase 4), và thỏa mãn Definition of Ready (DoR).
> **Cấu trúc:** Nhóm requirement thành các Epic (Customer, Operations, Management). Mỗi Story có đủ Estimate (≤3 points) và Dependencies.

## Bảng Tổng Hợp (Epic & User Stories)
*Lưu ý: Bảng này tuân thủ Output #13 trong giáo trình, đóng vai trò tóm tắt toàn bộ Backlog.*

| Epic | Capability | Story | Title | Pts |
|---|---|---|---|---|
| EP1 | Guest Ordering Experience | US-01 | Khách lướt xem Menu và Thêm vào Giỏ hàng | 3 |
| EP1 | Guest Ordering Experience | US-02 | Dùng giọng nói AI (Voice) để gọi món bổ sung | 3 |
| EP1 | Guest Ordering Experience | US-05 | Thanh toán hóa đơn qua QR (Toàn bộ) | 1 |
| EP1 | Guest Ordering Experience | US-09 | Khách xem Hóa đơn tạm tính của bàn | 1 |
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

- **AC6 (UX — Bộ đếm số lượng trên thẻ món — ADR-N06)**
  - **Given** Khách đã thêm một món vào Order Draft với số lượng n,
  - **Then** Nút "+ Thêm" trên thẻ món được thay bằng bộ đếm `− n +`; bấm `−` về 0 quay lại nút "+"; món hết hàng hiển thị bộ đếm nhưng nút `+` Disabled (`ADR-001`); chỉnh số lượng trong Order Draft cập nhật ngược bộ đếm.

- **AC7 (UX — Danh sách nhóm theo phân loại + scroll-spy — ADR-N09)**
  - **Then** Món hiển thị nhóm theo thứ tự `Món chính` ➔ `Set lẩu` ➔ `Đồ uống`; chip nhóm đang xem nền cam, chip khác nền trắng; bấm chip cuộn tới nhóm; tìm kiếm lọc trong nhóm và ẩn nhóm trống.

- **AC8 (UX — Ghi chú từng món trong giỏ — ADR-N01)**
  - **Then** Mở trình ghi chú cho món trong giỏ: ô nhập tự do; **Lưu** gắn ghi chú vào dòng món (hiển thị cả trên Hóa đơn — US-09 AC1); **Xóa ghi chú** để làm trống.

- **AC9 (Business Rule — Hai tầng hiển thị hết bán / hết tồn — ADR-N11)**
  - **Then** (1) Bếp/quản lý **tắt bán** (`trangthaiban = false`) → món **ẨN hẳn** khỏi E-Menu (`listed = false`); (2) món **còn bán nhưng hết tồn** (`soluongton = 0`) → vẫn hiện nhưng xám "Hết hàng", nút "+" disabled; món đang trong Draft xử lý theo AC3.

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
**Design link:** [Figma CMP-PROD-CARD, CMP-NOTE-MODAL](docs/05-Design/figma-handoff.md)

## US-02 - Dùng giọng nói AI (Voice) để gọi món bổ sung

**User Story:** *As a* Khách hàng (Customer), *I want* bấm nút Micro để đọc tên món ăn, *so that* AI phân tích và tự động nhặt đúng món bỏ vào giỏ hàng giúp tôi gọi món rảnh tay.

**Context:**
- `REQ-01` (FR): Trợ lý ảo AI tư vấn món ăn.
- `REQ-05` (FR): Gọi món bằng giọng nói (Voice-to-order).
- `NFR-RO-02`: Quyền riêng tư - Xóa file âm thanh.
- `NFR-RO-05`: Khả dụng - Text fallback khi môi trường ồn.
Trải nghiệm rảnh tay có rủi ro nhận diện sai do môi trường ồn ào. Trợ lý ảo cần hỗ trợ hỏi lại (Clarification) nếu không chắc chắn.

**Acceptance Criteria:**

- **AC1 (Happy Path - Nhận diện chính xác)**
  - **Given** Khách hàng đang ở màn hình AI Chat,
  - **When** Khách nói *"Cho 2 ly Pepsi"*,
  - **Then** AI phản hồi bằng giọng nói *"Đã thêm 2 ly Pepsi"* và lập tức đẩy món vào Order Draft.

- **AC2 (Edge Case - Cần làm rõ món ăn)**
  - **Given** Khách nói tên nguyên liệu chung chung (VD: *"Bò"*),
  - **When** Menu có nhiều loại (Bò xào, Bò nướng),
  - **Then** AI kích hoạt Clarification để hỏi lại (ví dụ: *"Nhà hàng có 2 món bò, bạn chọn món nào?"*).

- **AC3 (Fallback - Môi trường ồn NFR-RO-05)**
  - **Given** Môi trường nhà hàng quá ồn,
  - **When** AI nghe lỗi hoặc không nhận diện được quá 2 lần,
  - **Then** Giao diện tự động hiển thị bàn phím (Text fallback) để khách tự nhập.

- **AC4 (Privacy - NFR-RO-02)**
  - **Given** Phiên bàn đã kết thúc (Thanh toán xong),
  - **When** Hệ thống kiểm tra dữ liệu,
  - **Then** File âm thanh thô của khách phải bị xóa vĩnh viễn khỏi server.

**Out of Scope:**
- AI tự động giảm giá hoặc nói chuyện phiếm (Prompt injection).

**Dependencies:**
- API nhận diện giọng nói (Speech-to-Text). Backend xử lý NLP.
- Cần làm sau khi US-01 (Giỏ hàng) hoàn thiện.

**Estimate:** 3 points
**Design link:** [Figma CMP-VOICE-BTN, CMP-DRAFT-SHEET, CMP-CONFIRM-DLG, CMP-AMBIG-MODAL](docs/05-Design/figma-handoff.md)

## US-05 - Thanh toán hóa đơn qua QR (Toàn bộ)

**User Story:** *As a* Khách hàng tại bàn (Customer) và Thu ngân, *I want* khách thanh toán toàn bộ hóa đơn bằng quét mã VietQR ngân hàng (SePay) và hệ thống tự động gạch nợ khi tiền vào tài khoản, *so that* thanh toán nhanh gọn, đúng tiền, không phải cộng tiền thủ công hay kiểm tra app ngân hàng bằng tay.

**Context:**
- `REQ-04` (FR): Thanh toán bằng quét mã QR tại bàn (`BR-RO-06`) — triển khai **SePay VietQR** (ADR-N15).
- `NFR-RO-03`: Phân quyền (RBAC) — Thu ngân thực hiện thanh toán cho bàn trong ca của mình.
- **Phạm vi (ADR-N08):** Chia Bill (`REQ-03`) đã cắt khỏi MVP ngày 2026-10-03 — chỉ thanh toán toàn bộ tại quầy Thu ngân.

**Acceptance Criteria:**

- **AC1 (Happy Path — Tạo QR thanh toán toàn bộ)**
  - **When** Thu ngân bấm "Tạo mã thanh toán" cho bàn đang ăn đã hoàn thành phục vụ (AC5),
  - **Then** Hiển thị mã QR VietQR theo tổng tiền; nội dung CK định danh `Ban {số bàn} - {hoadon_id}` hiển thị dưới QR (hóa đơn nháp `chua_thanh_toan` — ADR-N16, tạo lại không trùng).

- **AC2 (Happy Path — Webhook SePay tự động gạch nợ → paid)**
  - **When** SePay gửi Webhook biến động số dư về `POST /sepay/webhook` (ADR-N15),
  - **Then** Đối soát **ưu tiên khớp `hoadon_id`** (fallback tên bàn không dấu → số tiền), chốt hóa đơn `da_thanh_toan`, gắn `hoadon_id` vào phiếu (ADR-N14 giữ nguyên), bàn về "chờ dọn"; nút "Xác nhận đã nhận tiền & Đóng bàn" vẫn còn cho tiền mặt.

- **AC3 (Realtime — Thông báo Thu ngân — ADR-N15)**
  - **Then** WebSocket `PAYMENT_SUCCESS` kênh `cashier:tables` → Thu ngân nổ Toast thành công, danh sách bàn tự làm mới, thẻ QR tự đóng.

- **AC4 (Fallback — Cổng thanh toán lỗi)**
  - **Then** Toast "Không thể khởi tạo mã QR thanh toán. Vui lòng kiểm tra lại mạng hoặc thử lại"; giữ nguyên hóa đơn, "Thử lại" không lặp đơn (hóa đơn nháp tái sử dụng — ADR-N16).

- **AC5 (Business Rule — Chỉ tạo QR khi tất cả món đã hoàn thành)**
  - **Given** Còn món khác `Đã phục vụ`/`Đã hủy`,
  - **When** Bấm "Tạo mã thanh toán",
  - **Then** Chặn + cảnh báo "còn N món chưa hoàn thành", không sinh QR (đồng bộ US-09 AC2).

- **AC6 (Công cụ kiểm thử — Mô phỏng Webhook — ADR-N15)**
  - **When** Gọi `POST /sepay/demo-sim/{ban_id}`,
  - **Then** Backend tự sinh payload Webhook đúng định dạng nội dung CK của QR thật, chạy đủ luồng AC2→AC3 — không cần chuyển khoản thật.

**Out of Scope:**
- Chia Bill theo người/món (`REQ-03`) — cắt theo ADR-N08; Visa/Mastercard; hóa đơn VAT.

**Dependencies:**
- Tài khoản SePay kết nối ngân hàng của quán (VietQR + Webhook biến động số dư, cấu hình `SEPAY_*`).
- WebSocket kênh `cashier:tables` — sự kiện `PAYMENT_SUCCESS`.

**Estimate:** 1 point
**Design link:** [Figma SCR-CASHIER-MAIN, CMP-CASHIER-TABLE-CARD, CMP-CASHIER-PAY-PANEL, SCR-BILL-QR](docs/05-Design/figma-handoff.md)

## US-03 - Bếp nhận Order và Báo hoàn thành trên KDS

**User Story:** *As an* Đầu bếp (Kitchen Staff), *I want* nhìn thấy đơn hàng hiển thị trên KDS theo thứ tự và thao tác cập nhật trạng thái, *so that* tôi biết món nào cần ưu tiên nấu và đồng bộ trạng thái hết hàng tức thì.

**Context:**
Đặc tả bám sát tri thức Vault, trích dẫn nguồn:
- `REQ-08` (FR): Màn hình KDS sắp xếp đơn ưu tiên, nhấp nháy Đỏ khi chờ quá 15 phút.
- `REQ-09` / `BR-03`: Bếp bấm Out of Stock (OOS) → trạng thái khóa món được đồng bộ trên mọi thiết bị trong vòng 1 giây.
- `REQ-15`: Xử lý món OOS đang nằm sẵn trong Order Draft của khách.
- `FR-03`: Bếp xem Ticket và đếm ngược trên KDS.
- `NFR-RO-01`: Thời gian tải màn hình < 2 giây.
- Ràng buộc kỹ thuật: Cập nhật thời gian thực bằng Pub/Sub WebSocket (`kds:tickets`).

**Acceptance Criteria:**

**AC1** (Happy Path - Nhận đơn real-time và hiển thị KDS)
Given khách hàng hoàn tất bấm "Xác nhận gửi bếp" từ E-Menu
When hệ thống tiếp nhận đơn hàng thành công
Then KDS tự động hiển thị Ticket mới theo thứ tự thời gian kèm đồng hồ đếm ngược.

**AC2** (Edge Case - Cảnh báo trễ hạn)
Given một Ticket món ăn đang ở trạng thái chờ trên KDS
When đồng hồ đếm ngược vượt mốc 15 phút
Then Ticket tự động chớp đỏ và được đẩy lên vị trí ưu tiên cao nhất.

**AC3** (Business Rule - Đồng bộ Out of Stock)
Given Đầu bếp chọn "Out of Stock" (OOS) cho một nguyên liệu hoặc món ăn
When hệ thống ghi nhận trạng thái mới
Then món ăn bị khóa trên mọi E-Menu trong vòng 1 giây và các Order Draft đang chứa món này bị vô hiệu hóa nút gửi.

**AC4** (Fallback - Mất kết nối mạng)
Given thiết bị KDS mất kết nối mạng với máy chủ
When Đầu bếp thao tác hoàn thành món hoặc báo OOS
Then giao diện hiển thị lỗi kết nối có thể phục hồi và lưu tạm thao tác để tự động đồng bộ sau khi có mạng.

**Out of Scope:**
- Gộp tách bill; thay đổi giá tiền; định vị nhân viên.

**Dependencies:**
- Kênh WebSocket realtime (`kds:tickets`); API đồng bộ kho; US-01 (E-Menu); US-04 (Waiter).

## US-04 - Phục vụ bưng món và Cập nhật trạng thái

**User Story:** *Là* Nhân viên phục vụ (Waiter), *tôi muốn* nhận thông báo tức thì bằng âm thanh và thị giác khi Bếp báo hoàn thành món ăn trên KDS, xác nhận đã bưng món và cập nhật trạng thái bàn trên Table Map, *để* tôi bưng món ra bàn kịp thời, chính xác cho khách và duy trì sơ đồ trạng thái bàn thời gian thực cho toàn nhà hàng.

**Context:**
Đặc tả bám sát tri thức Vault, trích dẫn nguồn:
- `REQ-06` (FR): Table Session Map hiển thị trực quan trạng thái bàn bằng mã màu (Xanh: Trống `empty`, Đỏ: Đang ăn `occupied`, Xám/Vàng: Cần dọn dẹp `needs_cleaning`). Nguồn: `vault/01-Requirements/requirements.md`, `vault/01-Requirements/glossary.md`.
- `REQ-07` (FR): App phục vụ phát âm thanh "Ting Ting" và popup thông báo khi món nấu xong từ Kitchen Ticket trên KDS. Nguồn: `vault/01-Requirements/requirements.md`.
- `REQ-10` / `BR-02` (Hủy món - Void/Refund & RBAC): Cơ chế phân quyền RBAC nghiêm ngặt — Waiter tuyệt đối không được tự ý hủy món đã gửi bếp; mọi thao tác hủy món (Void) bắt buộc phải xác thực mã PIN của Manager và ghi log vào `void_refund_logs`. Nguồn: `vault/01-Requirements/requirements.md`, `vault/03-Product/PRD.md`, `vault/06-Engineering/api-contract.md`.
- State Machine Món ăn (`order_items.status`): `pending` ➔ `cooking` ➔ `done` ➔ `served` (hoặc `void`). Nguồn: `vault/06-Engineering/data-model.md`.
- State Machine Bàn ăn (`tables.status`): `empty` ➔ `occupied` ➔ `needs_cleaning`. Nguồn: `vault/06-Engineering/data-model.md`.
- `NFR-RO-03`: Quyền hạn (Security/RBAC) — Phục vụ không có quyền sửa menu, giá hoặc tự hủy đơn; thao tác trái phép trả về mã lỗi 403 Forbidden (`INVALID_MANAGER_PIN`).
- `NFR-RO-04`: Ứng dụng Phục vụ chạy mượt mà trên thiết bị máy POS / Tablet Android chuyên dụng.
- Ràng buộc kỹ thuật: Đồng bộ Real-time qua kênh WebSocket `table:{table_session_id}` và `kds:tickets` (độ trễ ≤ 1s theo `vault/06-Engineering/architecture.md`); API hủy món `POST /orders/items/{id}/void`.

**Acceptance Criteria:**

- **AC1 (Happy Path — Nhận thông báo món nấu xong từ KDS)**
  - **Cho trước:** Bếp trưởng hoàn thành chế biến món "Bò sốt tiêu đen" (Bàn 06) và bấm nút "Done" trên màn hình KDS (`REQ-07`, `US-03`),
  - **Khi:** Hệ thống broadcast sự kiện qua kênh WebSocket `table:{table_session_id}` đến Tablet của Waiter (`NFR-RO-04`),
  - **Thì:** Trong vòng ≤ 1 giây, Tablet Waiter phát âm thanh thông báo "Ting Ting" kèm Popup/Badge nổi bật: `"Bàn 06: Bò sốt tiêu đen đã nấu xong"`; trạng thái món trên hệ thống chuyển từ `cooking` sang `done` (`data-model.md`).

- **AC2 (Happy Path — Phục vụ bưng món ra bàn và Cập nhật Table Map)**
  - **Cho trước:** Món ăn đang ở trạng thái `done` và Waiter đã bưng món đến bàn giao thành công cho khách tại Bàn 06,
  - **Khi:** Waiter bấm nút "Đã phục vụ" (Mark as Served) trên giao diện Tablet,
  - **Thì:** Trạng thái `order_items.status` chuyển thành `served` (`data-model.md`); thông báo món hoàn thành tự động biến mất; sơ đồ Table Map cập nhật trạng thái Bàn 06 hiển thị màu Đỏ (`occupied` - Đang ăn) nếu đây là món đầu tiên được phục vụ của phiên bàn (`REQ-06`).

- **AC3 (Edge Case — Hủy món / Điều chỉnh số lượng món theo quy trình thực tế)**
  - **Cho trước:** Món ăn đang ở trạng thái `pending` hoặc `ready` (Nếu đang `cooking` mà số lượng là 1 thì chặn hủy để tránh lãng phí, trừ khi thay đổi số lượng > 1),
  - **Khi:** Waiter bấm nút "Điều chỉnh/Hủy món" (Void Item) trên màn hình chi tiết bàn,
  - **Thì:** Hệ thống hiển thị Popup điều chỉnh số lượng. Theo quy trình nhà hàng (giao tiếp miệng với bếp trước khi thao tác), hệ thống cho phép Waiter trực tiếp thay đổi số lượng hoặc Hủy toàn bộ món (Hard Delete) mà KHÔNG cần nhập mã PIN Quản lý hay lưu Audit Log (Bỏ qua BR-02/REQ-10 để tối ưu tốc độ vận hành thực tế).

**Out of Scope:**
- Không tích hợp hệ thống định vị GPS nhân viên trong khuôn viên nhà hàng (vượt quá phạm vi MVP).
- Waiter không có quyền chỉnh sửa Menu, sửa giá món hoặc tự ý áp dụng voucher giảm giá trên Tablet (thuộc quyền hạn của Manager trong US-07 và NFR-RO-03).
- Không xử lý thanh toán, chia hóa đơn (thuộc phạm vi US-05).

**Dependencies:**
- API: `POST /orders/items/{id}/void` (Hủy món có xác thực PIN Manager theo `api-contract.md`); `PATCH /tables/{id}/status` (Cập nhật trạng thái bàn trên Table Map).
- WebSocket Channel: `table:{table_session_id}` (Kênh nhận thông báo món chín theo thời gian thực); `kds:tickets` (Đồng bộ trạng thái từ KDS).
- Component UI: TableMapGrid, DishDoneNotificationBadge, ManagerPinAuthModal.
- Story phụ thuộc: Phụ thuộc vào US-03 (Bếp bấm Done trên KDS qua WebSocket thì US-04 mới nhận được thông báo); là tiền đề cho US-05 (Thanh toán sau khi các món đã hoàn tất phục vụ).

**Estimate:** 2 points
**Design link:** [Figma CMP-WAITER-ALERT, SCR-TABLE-MAP](docs/05-Design/figma-handoff.md)

---

# EPIC 3: RESTAURANT MANAGEMENT & CMS (Quản trị nhà hàng)
*Mang lại giá trị cốt lõi: Cung cấp công cụ cho Quản lý kiểm soát giá cả, doanh thu và tồn kho.*

## US-06 - Quản lý xem Dashboard Doanh thu

**User Story:** *As a* Quản lý nhà hàng (Manager), *I want* xem Dashboard báo cáo trên POS, *so that* tôi có thể nắm bắt doanh thu và các món bán chạy nhất (Top món) trong ngày một cách trực quan.

**Context:**
- `REQ-13` (FR): Dashboard báo cáo Real-time (Doanh thu, Top món, Tỷ lệ lấp đầy).
Chức năng đọc số liệu thống kê giúp quản lý ra quyết định kinh doanh ngay trong ca làm việc.

**Acceptance Criteria:**

- **AC1 (Happy Path - Hiển thị Dashboard)**
  - **Given** Quản lý nhà hàng truy cập vào hệ thống POS,
  - **When** Quản lý click vào tab Dashboard,
  - **Then** Biểu đồ doanh thu của ca hiện tại và top món ăn hiển thị rõ ràng.

- **AC2 (Real-time Update)**
  - **Given** Màn hình Dashboard đang được mở,
  - **When** Có một bàn thanh toán hoàn tất,
  - **Then** Tổng số doanh thu tự động nhảy số theo thời gian thực mà không cần tải lại trang.

**Out of Scope:**
- Không hỗ trợ xuất file phân tích tài chính/PDF phức tạp.

**Dependencies:**
- Database Aggregation API (truy vấn doanh thu).

**Estimate:** 2 points
**Design link:** [Figma SCR-TABLE-MAP](docs/05-Design/figma-handoff.md)

## US-07 - Quản lý chỉnh sửa Menu (CMS)

**User Story:** *As a* Quản lý nhà hàng (Manager), *I want* thao tác chỉnh sửa tên, hình ảnh, và giá món ăn trong phần mềm quản lý, *so that* Menu điện tử (E-menu) trên thiết bị của khách sẽ tự động cập nhật thông tin và giá mới nhất.

**Context:**
- `REQ-11` (FR): CMS Quản lý Menu (Thêm, Sửa, Đổi giá, Cập nhật hình) đồng bộ E-Menu.
- `NFR-RO-03`: Quyền hạn (RBAC) - Chỉ quản lý mới có quyền chỉnh sửa.

**Acceptance Criteria:**

- **AC1 (Happy Path - Cập nhật thông tin Menu)**
  - **Given** Quản lý thay đổi giá của món "Bít tết" trên giao diện CMS,
  - **When** Quản lý bấm "Lưu",
  - **Then** Giá món trên điện thoại của mọi khách hàng đang xem E-menu lập tức thay đổi theo đồng bộ (thời gian thực/tải lại trang).

- **AC2 (Security / RBAC - NFR-RO-03)**
  - **Given** Nhân viên phục vụ (Waiter) đang đăng nhập hệ thống,
  - **When** Waiter cố gắng truy cập link sửa Menu hoặc gọi API chỉnh sửa,
  - **Then** Hệ thống chặn thao tác, báo lỗi 403 Forbidden.

**Out of Scope:**
- Không tích hợp công cụ cắt ghép chỉnh sửa ảnh trực tiếp bên trong phần mềm.

**Dependencies:**
- Role-based Access Control (RBAC) Middleware.

**Estimate:** 2 points
**Design link:** [Figma SCR-TABLE-MAP](docs/05-Design/figma-handoff.md)

## US-08 - Đối soát Tồn kho (Inventory Reconciliation)

**User Story:** *As a* Bếp trưởng hoặc Quản lý (Manager/Head Chef), *I want* nhập số lượng nguyên liệu thực tế vào cuối ngày, *so that* phần mềm có thể tự động đối chiếu và làm nổi bật các khoản hao hụt so với tồn kho lý thuyết.

**Context:**
- `REQ-12` (FR): Màn hình nhập số liệu thực tế để Đối soát tồn kho cuối ngày.
Quy trình chốt ca kho rất quan trọng để tránh thất thoát và chuẩn bị nguyên liệu cho ngày hôm sau.

**Acceptance Criteria:**

- **AC1 (Happy Path - Nhập chênh lệch)**
  - **Given** Màn hình đối soát Tồn kho đang hiển thị, số lượng lý thuyết của nguyên liệu là 6kg,
  - **When** Quản lý nhập số lượng thực tế là 5kg,
  - **Then** Giao diện tự động tính toán và đánh dấu chênh lệch "-1kg" bằng màu đỏ.

- **AC2 (Happy Path - Chốt ca)**
  - **Given** Quản lý đã hoàn tất việc nhập số liệu cho toàn bộ nguyên liệu,
  - **When** Quản lý bấm "Chốt ca",
  - **Then** Tồn kho đầu ngày hôm sau được thiết lập thành số lượng thực tế vừa nhập.

**Out of Scope:**
- Không quản lý hạn sử dụng (HSD) của nguyên liệu ở giai đoạn này.

**Dependencies:**
- Database Inventory API.

**Estimate:** 1 point
**Design link:** [Figma CMP-KDS-STOCK](docs/05-Design/figma-handoff.md)

---

## US-09 - Khách xem Hóa đơn tạm tính của bàn

**User Story:** *As a* Khách hàng tại bàn (Customer), *I want* mở Hóa đơn tạm tính từ nút "Xem hóa đơn" trên E-Menu để xem toàn bộ món đã gọi kèm trạng thái phục vụ và tổng tiền, rồi yêu cầu thanh toán, *so that* tôi kiểm soát chi phí và được hệ thống hướng dẫn đúng thời điểm đi thanh toán mà không phải hỏi nhân viên.

**Context:**
- `BR-05`: Đơn sau khi gửi không thể tự hủy — Hóa đơn KHÔNG có nút hủy/xóa đơn.
- US-07 (Price Snapshot): giá ghi nhận tại thời điểm đặt; biến động giá sau không ảnh hưởng đơn đã gửi.
- US-04: Trạng thái phục vụ theo 4 mốc `Chờ nấu`/`Đang nấu`/`Chờ phục vụ` (từ KDS) và `Đã phục vụ` (Waiter bấm).
- **Phạm vi (ADR-N04, ADR-N05):** Timeline "Đơn đã gửi" đã cắt khỏi màn khách; Hóa đơn mở qua nút "Xem hóa đơn" ở tiêu đề E-Menu, kèm nút "Yêu cầu thanh toán".

**Acceptance Criteria:**

- **AC1 (Happy Path — Mở Hóa đơn từ E-Menu)**
  - **When** Khách bấm nút "Xem hóa đơn" ở góc phải tiêu đề "E-Menu — Bàn 06",
  - **Then** Mở trang Hóa đơn toàn màn hình: bảng Tên món (kèm ghi chú) / SL / Thành tiền / Trạng thái phục vụ theo 4 mốc `Chờ nấu` → `Đang nấu` → `Chờ phục vụ` → `Đã phục vụ` + tổng; giá snapshot `CATALOG` tại thời điểm đặt.

- **AC2 (Yêu cầu thanh toán khi còn món chưa phục vụ)**
  - **Given** Tồn tại món có trạng thái khác `Đã phục vụ` (và khác `Đã hủy`),
  - **Then** Nút "Yêu cầu thanh toán" khóa sẵn kèm hộp cảnh báo vàng hiện ngay khi mở hóa đơn; khi khách vẫn bấm,
  - **When** hiển thị cảnh báo (icon vàng): "Bạn còn món chờ phục vụ. Vui lòng đợi nhân viên bưng món ra đủ, kiểm tra lại hóa đơn rồi hãy yêu cầu thanh toán nhé. Nếu cần hỗ trợ gấp, xin gọi nhân viên!"

- **AC3 (Yêu cầu thanh toán khi đã phục vụ đủ)**
  - **Given** Toàn bộ món đã `Đã phục vụ`,
  - **When** Khách bấm "Yêu cầu thanh toán",
  - **Then** Hiển thị xác nhận (icon xanh): "Vui lòng đến quầy thu ngân để thanh toán. Xin cảm ơn!"

- **AC4 (BR-05)** — Hóa đơn không có nút hủy/xóa đơn.

- **AC5 (Edge Case — Bàn chưa có đơn)** — trang hóa đơn hiện trạng thái rỗng, nút "Yêu cầu thanh toán" Disabled.

- **AC6 (UX — Hóa đơn nhóm theo đợt gọi — ADR-N13)**
  - **Then** Hóa đơn có tiêu đề nhóm "Đợt N — gọi lúc HH:MM · X món" cho từng lần gọi bếp; món nằm dưới tiêu đề nhóm của mình.

**Out of Scope:**
- Timeline trạng thái trên màn khách (ADR-004) — đã cắt theo ADR-N04; QR thanh toán / chia bill — US-05.

**Dependencies:**
- API: `GET /orders/current?table_name=Bàn 06` (ADR-N14).
- Story phụ thuộc: US-01 (sinh đơn), US-04 (sự kiện "Đã phục vụ").
- Component: BillView (full-screen), ProvisionalBill, PaymentRequestModal.

**Estimate:** 2 points
**Design link:** [Figma SCR-BILL-VIEW, CMP-PAY-MODAL](docs/05-Design/figma-handoff.md)
