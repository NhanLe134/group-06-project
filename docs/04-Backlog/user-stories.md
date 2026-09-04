# User Stories & Acceptance Criteria (Phase 4)
> **Quy tắc sinh:** Bám sát 100% vào `requirements.md`, `giaotrinh.md` (Phase 4), và thỏa mãn Definition of Ready (DoR).
> **Cấu trúc:** Nhóm requirement thành các Epic (Customer, Operations, Management). Mỗi Story có đủ Estimate (≤3 points) và Dependencies.

---

# EPIC 1: GUEST ORDERING EXPERIENCE (Trải nghiệm gọi món của khách)
*Mang lại giá trị cốt lõi: Khách tự gọi món nhanh chóng qua đa nền tảng (Web/Voice) và tự thanh toán.*

## US-01: Khách lướt xem Menu và Thêm vào Giỏ hàng
- **User Story:** *As a* Khách hàng tại bàn, *I want* lướt xem E-Menu và thêm món vào Giỏ (Order Draft), *so that* tôi có thể tự kiểm tra danh sách trước khi chốt gửi bếp.
- **Context:** Điểm chạm đầu tiên của hệ thống, đòi hỏi UX/UI trực quan. Cần tuân thủ quy tắc Không tự động chốt đơn (Explicit Confirmation - BR-RO-03). (Phụ trách: Nhàn - UX/UI).
- **Requirement IDs:** `REQ-04`, `REQ-09`, `REQ-15`
- **Acceptance Criteria:**
  - **AC1:** `GIVEN` khách quét QR mã bàn hợp lệ, `WHEN` chọn món và bấm "Thêm vào giỏ", `THEN` món hiển thị trong Order Draft kèm tổng tiền dự kiến.
  - **AC2:** `GIVEN` khách ở Order Draft, `WHEN` bấm "Gửi đơn xuống bếp", `THEN` hệ thống hiện Popup xác nhận cuối cùng (Yes/No).
  - **AC3:** `GIVEN` khách mở E-Menu, `WHEN` một món bị Bếp báo *Out of Stock*, `THEN` món đó hiển thị mờ và không thể click thêm.
- **Out of Scope:** Không xử lý thanh toán trực tiếp tại màn hình này.
- **Dependencies:** Thiết kế UI/UX E-Menu (TBD), API Fetch Menu List (TBD).
- **Estimate đề xuất:** 2 points

## US-02: Dùng giọng nói AI (Voice) để gọi món bổ sung
- **User Story:** *As a* Khách hàng, *I want* bấm nút Micro để đọc tên món ăn, *so that* AI phân tích và tự nhặt đúng món bỏ vào giỏ hàng.
- **Context:** Trải nghiệm rảnh tay có rủi ro nhận diện sai do môi trường. AI phải tuân thủ quyền riêng tư dữ liệu và Fallback NFR. (Phụ trách: Ny - QA).
- **Requirement IDs:** `REQ-01`, `REQ-05`, `NFR-RO-02`, `NFR-RO-05`
- **Acceptance Criteria:**
  - **AC1:** `GIVEN` đang ở màn hình AI Chat, `WHEN` khách nói *"Cho 2 ly Pepsi"*, `THEN` AI phản hồi bằng giọng nói *"Đã thêm 2 ly Pepsi"* và đẩy món vào Giỏ.
  - **AC2:** `GIVEN` khách nói tên nguyên liệu chung chung (VD: *"Bò"*), `WHEN` menu có nhiều loại, `THEN` AI kích hoạt Clarification để hỏi lại.
  - **AC3:** `GIVEN` môi trường nhà hàng quá ồn, `WHEN` AI nghe lỗi quá 2 lần, `THEN` tự động hiển thị bàn phím (Text fallback - NFR-RO-05).
  - **AC4:** `GIVEN` phiên bàn kết thúc (Thanh toán xong), `WHEN` kiểm tra server, `THEN` file âm thanh thô của khách phải bị xóa vĩnh viễn (NFR-RO-02).
- **Out of Scope:** AI tự động giảm giá hoặc tư vấn chuyện phiếm (Prompt injection).
- **Dependencies:** API nhận diện giọng nói Speech-to-Text (TBD), Backend xử lý NLP (TBD). Cần làm sau khi US-01 (Giỏ hàng) hoàn thiện.
- **Estimate đề xuất:** 3 points

## US-05: Khách hàng Chia tiền hóa đơn (Split Bill)
- **User Story:** *As a* Khách hàng đi ăn nhóm, *I want* có tùy chọn chia bill trên thiết bị, *so that* chúng tôi tự trả tiền phần của mình (chia đều/theo món).
- **Context:** Tính năng thanh toán tại bàn cuối bữa ăn.
- **Requirement IDs:** `REQ-03`
- **Acceptance Criteria:**
  - **AC1:** `GIVEN` khách bấm "Thanh toán", `WHEN` chọn "Split Bill", `THEN` hiển thị 2 tùy chọn: "Chia đều" và "Chia theo món".
  - **AC2:** `GIVEN` khách chọn Chia đều cho 3 người, `WHEN` tổng bill 300k, `THEN` hệ thống tạo ra 3 mã QR MoMo 100k.
- **Out of Scope:** Không hỗ trợ thanh toán thẻ Visa/Mastercard (Theo giới hạn scope gốc).
- **Dependencies:** Cổng thanh toán nội địa (VNPAY/MoMo API - TBD).
- **Estimate đề xuất:** 2 points

---

# EPIC 2: KITCHEN & TABLE OPERATIONS (Vận hành Bếp & Phục vụ)
*Mang lại giá trị cốt lõi: Tự động hóa luồng thông tin giữa Bếp và Nhân viên phục vụ để tăng tốc độ xoay vòng bàn.*

## US-03: Bếp nhận Order và Báo hoàn thành trên KDS
- **User Story:** *As a* Đầu bếp, *I want* nhìn thấy đơn hàng hiện lên KDS theo thứ tự thời gian, *so that* tôi biết món nào cần nấu trước và báo Done.
- **Context:** Xử lý hiển thị thông tin Real-time và cảnh báo trễ hạn. (Phụ trách: Nhã - Eng).
- **Requirement IDs:** `REQ-08`, `REQ-09`
- **Acceptance Criteria:**
  - **AC1:** `GIVEN` khách bấm gửi đơn, `WHEN` hệ thống nhận đơn, `THEN` KDS tự động nhảy Ticket kèm đồng hồ đếm ngược.
  - **AC2:** `GIVEN` Ticket trên KDS chờ quá 15 phút, `WHEN` đồng hồ chạm mốc, `THEN` Ticket chớp đỏ và đẩy lên vị trí đầu ưu tiên.
  - **AC3:** `GIVEN` Bếp bấm *Out of Stock* món Bò, `WHEN` hệ thống ghi nhận, `THEN` khóa món Bò trên mọi thiết bị ngay lập tức.
- **Out of Scope:** KDS không có quyền gộp bill hay đổi giá món ăn.
- **Dependencies:** Cấu trúc Websocket/Realtime (TBD).
- **Estimate đề xuất:** 3 points

## US-04: Phục vụ bưng món và Cập nhật trạng thái
- **User Story:** *As a* Nhân viên phục vụ, *I want* nhận thông báo khi món nấu xong, *so that* tôi bưng ra bàn kịp thời và cập nhật Table Map.
- **Context:** Quản lý State Machine vòng đời món ăn và xử lý ngoại lệ nghiệp vụ (Khách bom/Từ chối). (Phụ trách: Trang - BA).
- **Requirement IDs:** `REQ-06`, `REQ-07`, `REQ-10`
- **Acceptance Criteria:**
  - **AC1:** `GIVEN` Bếp bấm "Done", `WHEN` hệ thống nhận tin, `THEN` Tablet của Waiter kêu "Ting Ting" và báo số bàn.
  - **AC2:** `GIVEN` phục vụ bưng món ra bàn thành công, `WHEN` phục vụ bấm "Đã phục vụ", `THEN` trạng thái món đổi thành *Served* và cập nhật màu trên Table Map.
  - **AC3:** `GIVEN` khách từ chối món (Cancel), `WHEN` phục vụ bấm "Hủy món", `THEN` hiện Popup yêu cầu mã PIN của Manager (Áp dụng NFR RBAC).
- **Out of Scope:** Không tích hợp hệ thống định vị GPS nhân viên.
- **Dependencies:** API Push Notification (TBD). Làm sau US-03.
- **Estimate đề xuất:** 2 points

---

# EPIC 3: RESTAURANT MANAGEMENT & CMS (Quản trị nhà hàng)
*Mang lại giá trị cốt lõi: Cung cấp công cụ cho Quản lý kiểm soát giá cả, doanh thu và tồn kho.*

## US-06: Quản lý xem Dashboard Doanh thu
- **User Story:** *As a* Quản lý nhà hàng, *I want* xem Dashboard báo cáo trên POS, *so that* tôi nắm doanh thu và top món bán chạy trong ngày.
- **Context:** Chức năng đọc số liệu thống kê.
- **Requirement IDs:** `REQ-13`
- **Acceptance Criteria:**
  - **AC1:** `GIVEN` Manager vào POS, `WHEN` click tab Dashboard, `THEN` biểu đồ doanh thu ca hiện tại hiển thị.
  - **AC2:** `GIVEN` Dashboard đang mở, `WHEN` có bàn thanh toán xong, `THEN` Tổng doanh thu tự động nhảy số.
- **Out of Scope:** Không xuất file phân tích tài chính/PDF phức tạp.
- **Dependencies:** Database Aggregation API (TBD).
- **Estimate đề xuất:** 2 points

## US-07: Quản lý chỉnh sửa Menu (CMS)
- **User Story:** *As a* Quản lý nhà hàng, *I want* sửa tên, ảnh, giá món ăn trong phần mềm, *so that* Menu E-menu tự động lấy giá mới nhất.
- **Context:** Thao tác CRUD Menu và tuân thủ phân quyền RBAC.
- **Requirement IDs:** `REQ-11`, `NFR-RO-03`
- **Acceptance Criteria:**
  - **AC1:** `GIVEN` Quản lý đổi giá món Bít tết, `WHEN` bấm Lưu, `THEN` giá trên điện thoại khách hàng lập tức đổi theo.
  - **AC2:** `GIVEN` Waiter truy cập link sửa Menu, `WHEN` load trang, `THEN` bị chặn và báo lỗi 403 Forbidden (NFR-RO-03).
- **Out of Scope:** Không tích hợp công cụ cắt ghép chỉnh sửa ảnh trực tiếp.
- **Dependencies:** Cần thiết kế Role-based Access Control (RBAC) - (TBD).
- **Estimate đề xuất:** 2 points

## US-08: Đối soát Tồn kho (Inventory Reconciliation)
- **User Story:** *As a* Bếp trưởng / Quản lý, *I want* nhập số lượng nguyên liệu thực tế cuối ngày, *so that* phần mềm đối chiếu hao hụt.
- **Context:** Quy trình chốt ca kho.
- **Requirement IDs:** `REQ-12`
- **Acceptance Criteria:**
  - **AC1:** `GIVEN` màn hình Tồn kho, `WHEN` nhập 5kg (số lý thuyết là 6kg), `THEN` đánh dấu chênh lệch -1kg màu đỏ.
  - **AC2:** `GIVEN` hoàn tất, `WHEN` bấm "Chốt ca", `THEN` tồn kho đầu ngày hôm sau thiết lập thành số thực tế vừa nhập.
- **Out of Scope:** Quản lý hạn sử dụng (HSD) của nguyên liệu.
- **Dependencies:** Database Inventory (TBD).
- **Estimate đề xuất:** 1 point
