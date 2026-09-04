# User Stories & Acceptance Criteria (Phase 4)
> **Quy tắc sinh:** Document này được sinh ra bám sát 100% vào `vault/01-Requirements/requirements.md` và `vault/08-Decisions/decision-log.md`. KHÔNG chứa tính năng Out of Scope.
> **Mục tiêu:** Định nghĩa 4 User Story cốt lõi tạo thành 1 luồng Demo Prototype xuyên suốt từ lúc khách vào bàn đến khi bưng món ra bàn.

---

## US-01: Khách lướt xem Menu và Thêm vào Giỏ hàng (Phụ trách: Nhàn - UX/UI)
**Yêu cầu nguồn:** `REQ-04`, `REQ-09`, `REQ-15`
**Vai trò:** Là điểm chạm đầu tiên, chú trọng vào trải nghiệm UI (hình ảnh, hiệu ứng thêm vào giỏ).

*As a* Khách hàng tại bàn, *I want* lướt xem E-Menu và thêm món vào Giỏ (Order Draft), *so that* tôi có thể tự kiểm tra lại danh sách trước khi gửi xuống bếp.

### Acceptance Criteria (AC)
- **AC1 (Happy Path):** `GIVEN` khách quét QR mã bàn hợp lệ, `WHEN` khách chọn món và bấm "Thêm vào giỏ", `THEN` món hiển thị trong Order Draft kèm tổng tiền dự kiến.
- **AC2 (Explicit Confirmation):** `GIVEN` khách đang ở màn hình Order Draft, `WHEN` khách bấm "Gửi đơn xuống bếp", `THEN` hệ thống hiện Popup xác nhận cuối cùng (Yes/No) để chốt đơn (Không tự động chốt).
- **AC3 (Edge Case - Món hết hàng):** `GIVEN` khách mở E-Menu, `WHEN` một món đã bị đánh dấu *Out of Stock* (REQ-09), `THEN` món đó hiển thị mờ (Grayed-out) và nút "Thêm vào giỏ" bị vô hiệu hóa.

---

## US-02: Dùng giọng nói AI (Voice) để gọi món bổ sung (Phụ trách: Ny - QA)
**Yêu cầu nguồn:** `REQ-01`, `REQ-05`, `NFR-RO-02`, `NFR-RO-05`
**Vai trò:** Tính năng phức tạp, mang rủi ro AI nhận diện sai hoặc ảo giác, đòi hỏi tư duy QA/Test Cases chặt chẽ.

*As a* Khách hàng (hoặc Phục vụ), *I want* bấm nút Micro để đọc tên món ăn, *so that* AI tự động phân tích và nhặt đúng món bỏ vào giỏ hàng mà không cần lướt tìm.

### Acceptance Criteria (AC)
- **AC1 (Happy Path):** `GIVEN` khách đang ở màn hình AI Chat, `WHEN` khách bấm Micro và nói *"Cho 2 ly Pepsi"*, `THEN` AI phản hồi *"Đã thêm 2 ly Pepsi"* và tự động đẩy món vào Order Draft.
- **AC2 (Edge Case - Thiếu thông tin):** `GIVEN` khách nói *"Cho một phần bò"*, `WHEN` menu có Bò Né và Bò Bít Tết, `THEN` AI kích hoạt Clarification hỏi lại: *"Dạ nhà hàng có Bò Né và Bò Bít Tết, quý khách muốn dùng loại nào ạ?"*.
- **AC3 (Fallback NFR-RO-05):** `GIVEN` môi trường nhà hàng quá ồn, `WHEN` AI không nhận diện được giọng nói quá 2 lần, `THEN` AI tự động gợi ý chuyển sang nhập liệu bằng bàn phím (Text fallback).
- **AC4 (Privacy NFR-RO-02):** `GIVEN` khách hàng gọi món bằng giọng nói xong, `WHEN` bàn thanh toán và kết thúc phiên (Table Session đóng), `THEN` toàn bộ file âm thanh thô của khách phải bị xóa vĩnh viễn khỏi server.

---

## US-03: Bếp nhận Order và Báo hoàn thành trên KDS (Phụ trách: Nhã - Eng)
**Yêu cầu nguồn:** `REQ-08`, `REQ-09`
**Vai trò:** Xử lý luồng Real-time (Websocket), đếm ngược thời gian, và thay đổi trạng thái đồng bộ toàn hệ thống. Chuẩn kỹ thuật Backend.

*As a* Đầu bếp, *I want* nhìn thấy các món khách vừa đặt hiện lên màn hình KDS theo thứ tự thời gian, *so that* tôi biết món nào cần nấu trước và báo Done khi nấu xong.

### Acceptance Criteria (AC)
- **AC1 (Happy Path):** `GIVEN` khách hàng bấm "Xác nhận gửi bếp", `WHEN` hệ thống nhận đơn, `THEN` màn hình KDS của bếp tự động nhảy Ticket mới (Real-time) kèm số bàn và đồng hồ bắt đầu đếm ngược.
- **AC2 (Edge Case - Quá giờ):** `GIVEN` một Ticket đang hiển thị trên KDS, `WHEN` thời gian chờ vượt quá 15 phút, `THEN` Ticket đó tự động chớp nháy viền màu Đỏ và đẩy lên ưu tiên cao nhất.
- **AC3 (Edge Case - Hết nguyên liệu ngang):** `GIVEN` Bếp đang nấu thì phát hiện hết thịt bò, `WHEN` bếp bấm nút *Out of Stock* cho món Bò, `THEN` hệ thống tự động khóa món Bò trên mọi Menu (của khách và phục vụ) ngay lập tức (Sync).

---

## US-04: Phục vụ bưng món và Cập nhật trạng thái (Phụ trách: Trang - BA)
**Yêu cầu nguồn:** `REQ-06`, `REQ-07`, `REQ-10`
**Vai trò:** Quản lý vòng đời trạng thái của bàn (Table State Machine) và món ăn, xử lý ngoại lệ nghiệp vụ (Khách bom, Đổ đồ ăn).

*As a* Nhân viên phục vụ, *I want* nhận được thông báo khi món nấu xong, *so that* tôi có thể bưng ra bàn kịp thời và cập nhật trạng thái bàn trên Tablet.

### Acceptance Criteria (AC)
- **AC1 (Happy Path):** `GIVEN` Bếp bấm "Done" trên KDS, `WHEN` hệ thống ghi nhận, `THEN` Tablet của nhân viên phục vụ phát âm thanh "Ting Ting" và hiển thị thông báo "Bàn 5 - Bò bít tết đã sẵn sàng".
- **AC2 (State Machine):** `GIVEN` phục vụ bưng món ra bàn thành công, `WHEN` phục vụ bấm "Đã phục vụ" trên Tablet, `THEN` trạng thái món đổi thành *Served* và màu sắc của bàn trên Table Map cập nhật tương ứng.
- **AC3 (Edge Case - Khách từ chối món):** `GIVEN` phục vụ bưng ra nhưng khách từ chối nhận (Cancel), `WHEN` phục vụ bấm "Hủy món" trên Tablet, `THEN` hệ thống bật Popup yêu cầu mã PIN của Manager (Áp dụng phân quyền RBAC REQ-10) để đề phòng nhân viên gian lận.

---
> **Lưu ý:** 4 US trên (US-01 đến US-04) là luồng cốt lõi (Core Flow) sẽ được 4 thành viên trình bày trong báo cáo. 4 US bên dưới (US-05 đến US-08) là các tính năng bổ trợ để hoàn thiện hệ thống nhà hàng theo đúng Scope (Đáp ứng tiêu chí 8-12 US của giáo trình).

## US-05: Khách hàng Chia tiền hóa đơn (Split Bill)
**Yêu cầu nguồn:** `REQ-03`

*As a* Khách hàng đi ăn nhóm, *I want* có tùy chọn chia bill trên thiết bị, *so that* chúng tôi có thể tự trả tiền phần của mình (chia đều hoặc theo món) mà không cần tự tính nhẩm.

### Acceptance Criteria (AC)
- **AC1:** `GIVEN` khách bấm "Thanh toán", `WHEN` chọn "Split Bill", `THEN` màn hình hiển thị 2 tùy chọn: "Chia đều (Split Evenly)" và "Chia theo món (Split by Item)".
- **AC2:** `GIVEN` khách chọn Chia đều cho 3 người, `WHEN` tổng bill là 300k, `THEN` hệ thống tạo ra 3 mã QR thanh toán độc lập, mỗi mã 100k.

---

## US-06: Quản lý xem Dashboard Doanh thu
**Yêu cầu nguồn:** `REQ-13`

*As a* Quản lý nhà hàng, *I want* xem Dashboard báo cáo tổng quan trên hệ thống POS, *so that* tôi nắm được doanh thu trong ngày và món ăn nào bán chạy nhất (Top món).

### Acceptance Criteria (AC)
- **AC1:** `GIVEN` quản lý đăng nhập thành công vào POS, `WHEN` chọn tab Dashboard, `THEN` biểu đồ doanh thu Real-time của ca làm việc hiện tại được hiển thị.
- **AC2:** `GIVEN` Dashboard đang hiển thị, `WHEN` có một đơn hàng mới vừa được thanh toán thành công, `THEN` con số Tổng doanh thu tự động nhảy lên không cần reload trang.

---

## US-07: Quản lý chỉnh sửa Menu (CMS)
**Yêu cầu nguồn:** `REQ-11`, `NFR-RO-03`

*As a* Quản lý nhà hàng, *I want* có thể thêm/sửa tên, hình ảnh và giá món ăn trong phần mềm, *so that* Menu của khách (E-Menu) và AI tự động cập nhật dữ liệu mới nhất.

### Acceptance Criteria (AC)
- **AC1:** `GIVEN` Quản lý cập nhật giá món "Bít tết" từ 100k lên 120k, `WHEN` bấm Lưu, `THEN` giá trên E-Menu của khách tự động đổi thành 120k ngay lập tức.
- **AC2:** `GIVEN` tài khoản Waiter cố tình truy cập vào trang sửa Menu, `WHEN` click vào món, `THEN` hệ thống chặn lại và báo lỗi 403 Forbidden (NFR-RO-03).

---

## US-08: Đối soát Tồn kho (Inventory Reconciliation)
**Yêu cầu nguồn:** `REQ-12`

*As a* Bếp trưởng / Quản lý, *I want* nhập số lượng nguyên liệu thực tế còn lại cuối ngày vào hệ thống, *so that* phần mềm đối chiếu với số liệu lý thuyết và báo cáo mức độ hao hụt (chênh lệch).

### Acceptance Criteria (AC)
- **AC1:** `GIVEN` màn hình Tồn kho, `WHEN` Quản lý nhập số lượng thịt bò thực tế là 5kg (số lý thuyết là 6kg), `THEN` hệ thống đánh dấu chênh lệch -1kg bằng màu đỏ.
- **AC2:** `GIVEN` hoàn tất nhập liệu, `WHEN` bấm "Chốt ca", `THEN` số tồn kho đầu ca ngày hôm sau sẽ được cập nhật thành số thực tế vừa nhập.
