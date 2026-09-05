# User Stories & Acceptance Criteria (Phase 4)
> **Quy tắc sinh:** Bám sát 100% vào `requirements.md`, `giaotrinh.md` (Phase 4), và thỏa mãn Definition of Ready (DoR).
> **Cấu trúc:** Nhóm requirement thành các Epic (Customer, Operations, Management). Mỗi Story có đủ Estimate (≤3 points) và Dependencies.

## Bảng Tổng Hợp (Epic & User Stories)
*Lưu ý: Bảng này tuân thủ Output #13 trong giáo trình, đóng vai trò tóm tắt toàn bộ Backlog.*

| Epic | Capability | Story | Title | Pts |
|---|---|---|---|---|
| EP1 | Guest Ordering Experience | US-01 | Trợ lý ảo AI tư vấn món ăn dựa trên sở thích và dị ứng | 3 |
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

## US-01 - Trợ lý ảo AI tư vấn món ăn dựa trên sở thích và dị ứng

**User Story:** *As a* Khách hàng tại bàn (Customer), *I want* Trợ lý AI gợi ý món ăn phù hợp với sở thích cá nhân và tự động lọc bỏ các món có nguy cơ gây dị ứng, *so that* tôi chọn món nhanh chóng, an toàn cho sức khỏe mà không cần mất thời gian tra cứu thủ công.

**Context:**
Đặc tả bám sát tri thức Vault, trích dẫn nguồn:
- `REQ-01` (FR): Trợ lý ảo AI tư vấn món ăn dựa trên sở thích/dị ứng của khách hàng.
- `BR-01` / `REQ-02` (Explicit Confirmation): mọi thao tác gợi ý chỉ đưa món vào Order Draft; nghiêm cấm tự động gửi bếp khi khách chưa chủ động bấm "Xác nhận gửi bếp".
- `BR-06` / `REQ-09`: không đề xuất món đã Out of Stock (OOS) hoặc vượt quá tồn kho thực tế.
- `NFR-RO-01` & `NFR-RO-05`: thời gian phản hồi AI < 2 giây; hỗ trợ bàn phím nhập text fallback khi môi trường ồn.

**Acceptance Criteria:**

- **AC1 (Happy Path — Gợi ý theo Sở thích & Dị ứng)**
  - **Given** Khách khai báo thông tin dị ứng (VD: "Dị ứng hải sản") hoặc sở thích (VD: "Món chay/Ăn cay"),
  - **When** Khách yêu cầu "Gợi ý món phù hợp cho tôi",
  - **Then** AI hiển thị danh sách món gợi ý phù hợp, lọc bỏ 100% món chứa thành phần dị ứng kèm nhãn giải thích (VD: "Lọc bỏ: Tôm, Cua").

- **AC2 (Edge Case — Làm rõ yêu cầu mơ hồ / Clarification)**
  - **Given** Khách đưa yêu cầu chưa rõ ràng (VD: "Cho tôi món bò"),
  - **When** Menu có nhiều món bò khác nhau,
  - **Then** AI hiển thị Popup/Thẻ gợi ý để khách chọn loại cụ thể (Clarification) chứ không tự ý chọn bừa.

- **AC3 (Business Rule — Kiểm soát Tồn kho & OOS)**
  - **Given** Món ăn được AI gợi ý vừa chuyển sang trạng thái Out of Stock (OOS) hoặc hết tồn kho (`BR-06`),
  - **When** Danh sách tư vấn hiển thị,
  - **Then** Thẻ món tự động mờ xám (*Grayed-out*), nút "+ Thêm" bị vô hiệu hóa và AI cảnh báo "Món này vừa hết hàng".

- **AC4 (Business Rule — Explicit Confirmation)**
  - **Given** Khách bấm chọn một món từ danh sách gợi ý của AI,
  - **When** Thao tác thành công,
  - **Then** Món ăn chỉ được đưa vào Giỏ nháp (Order Draft); hệ thống **không** tự động gửi đơn xuống Bếp cho đến khi khách bấm "Xác nhận gửi Bếp" (`BR-01`).

- **AC5 (Fallback & Safety Handling)**
  - **Given** Khách nhập yêu cầu không liên quan hoặc rác input,
  - **When** AI xử lý câu lệnh,
  - **Then** AI kích hoạt Guardrail phản hồi lịch sự, đưa ra 3 tùy chọn gợi ý nhanh và bật bàn phím nhập liệu thủ công (`NFR-RO-05`).

**Out of Scope:**
- Tự động chốt đơn và thanh toán QR (thuộc US-05).
- Bếp tiếp nhận đơn và cập nhật KDS (thuộc US-03).
- CMS chỉnh sửa thông tin nguyên liệu dị ứng (thuộc US-07).

**Dependencies:**
- API Backend xử lý Gemini NLP / Matching Engine (`allergens`, `tags`).
- Component UI: MenuCard, OrderDraftDrawer (`CMP-DRAFT-SHEET`), AmbiguousModal (`CMP-AMBIG-MODAL`).
- Story phụ thuộc: US-03 (Bếp báo OOS trên KDS) để có dữ kiện tồn kho real-time.

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

### US-03 - Bếp nhận Order và Báo hoàn thành trên KDS

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

**Estimate:** 3 points

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

- **AC3 (Edge Case — Khách từ chối nhận món / Hủy món sau khi gửi bếp)**
  - **Cho trước:** Món ăn đã gửi xuống bếp hoặc đã nấu xong (`status` là `cooking` hoặc `done`), nhưng khách yêu cầu hủy/từ chối nhận món (khách đổi ý, đợi quá lâu),
  - **Khi:** Waiter bấm nút "Hủy món" (Void Item) trên màn hình chi tiết đơn của Bàn 06,
  - **Thì:** Hệ thống chặn hủy trực tiếp và hiển thị Popup bắt buộc: (1) Nhập lý do hủy món (`reason`), (2) Nhập mã PIN bảo mật của Quản lý (`REQ-10`, `BR-02`, `api-contract.md`); Waiter không thể tự phê duyệt thao tác này.

- **AC4 (Business Rule — Xác thực PIN Manager & Ghi Log kiểm toán Void)**
  - **Cho trước:** Popup yêu cầu mã PIN Manager đang hiển thị sau khi kích hoạt hủy món (AC3),
  - **Khi:** Quản lý nhà hàng trực tiếp nhập mã PIN hợp lệ và bấm "Xác nhận hủy",
  - **Thì:** Hệ thống gửi request `POST /orders/items/{id}/void` kèm `pin_code` và `reason` (`api-contract.md`); API xác thực thành công trả về `200 OK`: (1) Cập nhật `order_items.status = void`, (2) Tự động ghi 1 bản ghi kiểm toán bất biến vào bảng `void_refund_logs` (`order_item_id`, `reason`, `approved_by`, `approved_at`) chống gian lận (`NFR-RO-03`); món được gỡ khỏi hóa đơn thanh toán của khách.

- **AC5 (Fallback / Error Handling — Nhập sai PIN Quản lý hoặc Món không thể hủy)**
  - **Cho trước:** Người thao tác nhập mã PIN Quản lý không chính xác, hoặc món ăn đã ở trạng thái `served` / `void`,
  - **Khi:** Hệ thống gửi yêu cầu đến backend để xử lý,
  - **Thì:** Backend từ chối thao tác và trả về mã lỗi tương ứng:
    + Nếu sai mã PIN: Trả lỗi `403 Forbidden` (`INVALID_MANAGER_PIN`), hiển thị cảnh báo "Mã PIN Quản lý không chính xác; vui lòng kiểm tra lại" và tạm khóa chức năng sau 3 lần thử sai liên tiếp.
    + Nếu món đã phục vụ (`status = served`): Trả lỗi `400 Bad Request` (`ORDER_ITEM_NOT_VOIDABLE`), hiển thị thông báo "Món đã bưng ra bàn, không thể hủy qua luồng tự động".

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
