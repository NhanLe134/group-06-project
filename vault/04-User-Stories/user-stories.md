# User Stories & Acceptance Criteria (Phase 4)
> **Quy tắc sinh:** Document này được sinh ra bám sát 100% vào `vault/01-Requirements/requirements.md` và `vault/08-Decisions/decision-log.md`. KHÔNG chứa tính năng Out of Scope.
> **Mục tiêu:** 8 User Stories được viết theo chuẩn 5 phần của IT BA chuyên nghiệp.

---

> **Lưu ý:** 4 US đầu tiên (US-01 đến US-04) là luồng cốt lõi (Core Flow) chạy liền mạch từ lúc khách vào bàn đến khi phục vụ bưng món. Đây là 4 luồng sẽ dùng làm Prototype Demo.

## US-01: Khách lướt xem Menu và Thêm vào Giỏ hàng
**1. User Story**
*As a* Khách hàng tại bàn, *I want* lướt xem E-Menu và thêm món vào Giỏ (Order Draft), *so that* tôi có thể tự kiểm tra lại danh sách trước khi gửi xuống bếp.

**2. Metadata**
- **Phụ trách:** Nhàn (UX/UI)
- **Nguồn REQ:** `REQ-04`, `REQ-09`, `REQ-15`
- **Priority:** Must

**3. Scope (In/Out)**
- **In-Scope:** Khách xem menu, chọn số lượng, thêm món, hiển thị Popup Order Draft với tổng tiền dự kiến.
- **Out-of-Scope:** Tính năng thanh toán trực tiếp ở màn hình này (chuyển sang US-05).

**4. Business Rules (BR)**
- **Explicit Confirmation (BR-RO-03):** Bắt buộc hiển thị màn hình nháp để khách bấm xác nhận cuối cùng, không tự chốt đơn.
- **Out of Stock:** Món hết hàng không được phép thêm vào giỏ. Nếu đã ở trong giỏ mà hết hàng ngang thì khóa nút xác nhận.

**5. Acceptance Criteria (AC)**
- **AC1 (Happy Path):** `GIVEN` khách quét QR mã bàn hợp lệ, `WHEN` khách chọn món và bấm "Thêm vào giỏ", `THEN` món hiển thị trong Order Draft kèm tổng tiền dự kiến.
- **AC2 (Explicit Confirmation):** `GIVEN` khách đang ở màn hình Order Draft, `WHEN` khách bấm "Gửi đơn xuống bếp", `THEN` hệ thống hiện Popup xác nhận cuối cùng (Yes/No) để chốt đơn.
- **AC3 (Edge Case - Món hết hàng):** `GIVEN` khách mở E-Menu, `WHEN` một món đã bị Bếp báo *Out of Stock* (REQ-09), `THEN` món đó hiển thị mờ (Grayed-out) và nút "Thêm" bị vô hiệu hóa.

---

## US-02: Dùng giọng nói AI (Voice) để gọi món bổ sung
**1. User Story**
*As a* Khách hàng (hoặc Phục vụ), *I want* bấm nút Micro để đọc tên món ăn, *so that* AI tự động phân tích và nhặt đúng món bỏ vào giỏ hàng mà không cần lướt tìm.

**2. Metadata**
- **Phụ trách:** Ny (QA)
- **Nguồn REQ:** `REQ-01`, `REQ-05`, `NFR-RO-02`, `NFR-RO-05`
- **Priority:** Must (Bài tập cuối kỳ yêu cầu AI)

**3. Scope (In/Out)**
- **In-Scope:** Gọi món cơ bản, hỏi về nguyên liệu gây dị ứng, AI phản hồi giọng nói và chữ.
- **Out-of-Scope:** AI tự động giảm giá, AI tư vấn chuyện phiếm (Prompt injection).

**4. Business Rules (BR)**
- **Privacy (NFR-RO-02):** Không lưu trữ vĩnh viễn file âm thanh, xóa ngay khi Table Session kết thúc.
- **Availability (NFR-RO-05):** Phải luôn có lựa chọn chuyển sang nhập Text nếu Voice thất bại.

**5. Acceptance Criteria (AC)**
- **AC1 (Happy Path):** `GIVEN` khách đang ở màn hình AI Chat, `WHEN` khách bấm Micro và nói *"Cho 2 ly Pepsi"*, `THEN` AI phản hồi *"Đã thêm 2 ly Pepsi"* và tự động đẩy món vào Order Draft.
- **AC2 (Edge Case - Thiếu thông tin):** `GIVEN` khách nói *"Cho một phần bò"*, `WHEN` menu có Bò Né và Bò Bít Tết, `THEN` AI kích hoạt Clarification hỏi lại: *"Dạ nhà hàng có Bò Né và Bò Bít Tết, quý khách muốn dùng loại nào ạ?"*.
- **AC3 (Fallback NFR-RO-05):** `GIVEN` môi trường nhà hàng quá ồn, `WHEN` AI không nhận diện được giọng nói quá 2 lần, `THEN` AI tự động gợi ý chuyển sang nhập liệu bằng bàn phím (Text fallback).
- **AC4 (Privacy NFR-RO-02):** `GIVEN` khách hàng gọi món bằng giọng nói xong, `WHEN` bàn thanh toán và kết thúc phiên (Table Session đóng), `THEN` toàn bộ file âm thanh thô của khách phải bị xóa vĩnh viễn khỏi server.

---

## US-03: Bếp nhận Order và Báo hoàn thành trên KDS
**1. User Story**
*As a* Đầu bếp, *I want* nhìn thấy các món khách vừa đặt hiện lên màn hình KDS theo thứ tự thời gian, *so that* tôi biết món nào cần nấu trước và báo Done khi nấu xong.

**2. Metadata**
- **Phụ trách:** Nhã (Eng)
- **Nguồn REQ:** `REQ-08`, `REQ-09`
- **Priority:** Must

**3. Scope (In/Out)**
- **In-Scope:** Màn hình KDS Real-time, báo giờ quá hạn, thao tác khóa món hết hàng.
- **Out-of-Scope:** Màn hình KDS không hỗ trợ việc chỉnh sửa giá món hay gộp bill.

**4. Business Rules (BR)**
- **Cảnh báo trễ:** Món chờ quá 15 phút phải đổi màu cảnh báo.
- **Khóa món đồng bộ:** Báo *Out of Stock* trên KDS phải đồng bộ ngay lập tức ra Menu của khách.

**5. Acceptance Criteria (AC)**
- **AC1 (Happy Path):** `GIVEN` khách hàng bấm "Xác nhận gửi bếp", `WHEN` hệ thống nhận đơn, `THEN` màn hình KDS của bếp tự động nhảy Ticket mới (Real-time) kèm số bàn và đồng hồ đếm ngược.
- **AC2 (Edge Case - Quá giờ):** `GIVEN` một Ticket đang hiển thị trên KDS, `WHEN` thời gian chờ vượt quá 15 phút, `THEN` Ticket đó tự động chớp nháy viền màu Đỏ và đẩy lên vị trí cao nhất.
- **AC3 (Edge Case - Hết nguyên liệu ngang):** `GIVEN` Bếp đang nấu thì phát hiện hết thịt bò, `WHEN` bếp bấm nút *Out of Stock* cho món Bò, `THEN` hệ thống tự động khóa món Bò trên mọi E-Menu (của khách và phục vụ) ngay lập tức.

---

## US-04: Phục vụ bưng món và Cập nhật trạng thái
**1. User Story**
*As a* Nhân viên phục vụ, *I want* nhận được thông báo khi món nấu xong, *so that* tôi có thể bưng ra bàn kịp thời và cập nhật trạng thái bàn trên Tablet.

**2. Metadata**
- **Phụ trách:** Trang (BA)
- **Nguồn REQ:** `REQ-06`, `REQ-07`, `REQ-10`
- **Priority:** Must

**3. Scope (In/Out)**
- **In-Scope:** Xem sơ đồ bàn (Table Map), nhận Push Notification âm thanh, cập nhật trạng thái món.
- **Out-of-Scope:** Theo dõi vị trí phục vụ qua định vị trong nhà hàng.

**4. Business Rules (BR)**
- **Security (REQ-10):** Hủy món (Void) đã nấu xong là quyền của Quản lý, Waiter không được tự hủy.

**5. Acceptance Criteria (AC)**
- **AC1 (Happy Path):** `GIVEN` Bếp bấm "Done" trên KDS, `WHEN` hệ thống ghi nhận, `THEN` Tablet của phục vụ phát âm thanh "Ting Ting" và hiển thị thông báo "Bàn 5 - Bò bít tết đã sẵn sàng".
- **AC2 (State Machine):** `GIVEN` phục vụ bưng món ra bàn thành công, `WHEN` phục vụ bấm "Đã phục vụ" trên Tablet, `THEN` trạng thái món đổi thành *Served* và màu sắc bàn trên Table Map cập nhật.
- **AC3 (Edge Case - Khách từ chối món):** `GIVEN` phục vụ bưng ra nhưng khách từ chối nhận (Cancel), `WHEN` phục vụ bấm "Hủy món" trên Tablet, `THEN` hệ thống bật Popup yêu cầu mã PIN của Manager (Áp dụng phân quyền RBAC REQ-10) để đề phòng nhân viên gian lận.

---
> **Lưu ý:** 4 US bên dưới (US-05 đến US-08) là các tính năng bổ trợ để hoàn thiện hệ thống, đáp ứng tiêu chí 8-12 US của giáo trình.

## US-05: Khách hàng Chia tiền hóa đơn (Split Bill)
**1. User Story**
*As a* Khách hàng đi ăn nhóm, *I want* có tùy chọn chia bill trên thiết bị, *so that* chúng tôi có thể tự trả tiền phần của mình (chia đều hoặc theo món).

**2. Metadata**
- **Nguồn REQ:** `REQ-03`
- **Priority:** Should

**3. Scope (In/Out)**
- **In-Scope:** Tùy chọn chia bill trên tổng tiền và tạo mã QR Momo tương ứng.
- **Out-of-Scope:** Khách hàng không thể thanh toán bằng thẻ Visa/Mastercard (Theo giới hạn dự án).

**4. Business Rules (BR)**
- Tiền chia nhỏ phải cộng lại bằng đúng 100% tổng bill gốc.

**5. Acceptance Criteria (AC)**
- **AC1:** `GIVEN` khách bấm "Thanh toán", `WHEN` chọn "Split Bill", `THEN` màn hình hiển thị 2 tùy chọn: "Chia đều (Split Evenly)" và "Chia theo món (Split by Item)".
- **AC2:** `GIVEN` khách chọn Chia đều cho 3 người, `WHEN` tổng bill là 300k, `THEN` hệ thống tạo ra 3 mã QR thanh toán MoMo độc lập, mỗi mã 100k.

---

## US-06: Quản lý xem Dashboard Doanh thu
**1. User Story**
*As a* Quản lý nhà hàng, *I want* xem Dashboard báo cáo tổng quan trên hệ thống POS, *so that* tôi nắm được doanh thu trong ngày và món ăn nào bán chạy nhất.

**2. Metadata**
- **Nguồn REQ:** `REQ-13`
- **Priority:** Could

**3. Scope (In/Out)**
- **In-Scope:** Biểu đồ doanh thu hôm nay, top 5 món bán chạy.
- **Out-of-Scope:** Phân tích tài chính chuyên sâu, xuất báo cáo PDF tự động.

**4. Business Rules (BR)**
- Dữ liệu doanh thu chỉ được hiển thị cho Role Manager.

**5. Acceptance Criteria (AC)**
- **AC1:** `GIVEN` quản lý đăng nhập thành công vào POS, `WHEN` chọn tab Dashboard, `THEN` biểu đồ doanh thu Real-time của ca làm việc hiện tại được hiển thị.
- **AC2:** `GIVEN` Dashboard đang hiển thị, `WHEN` có một đơn hàng mới vừa được thanh toán thành công, `THEN` con số Tổng doanh thu tự động nhảy lên không cần F5.

---

## US-07: Quản lý chỉnh sửa Menu (CMS)
**1. User Story**
*As a* Quản lý nhà hàng, *I want* có thể thêm/sửa tên, hình ảnh và giá món ăn trong phần mềm, *so that* Menu của khách (E-Menu) và bộ nhớ AI tự động cập nhật.

**2. Metadata**
- **Nguồn REQ:** `REQ-11`, `NFR-RO-03`
- **Priority:** Must

**3. Scope (In/Out)**
- **In-Scope:** Thao tác CRUD (Tạo, xem, sửa, xóa) với Database món ăn.
- **Out-of-Scope:** Chỉnh sửa ảnh, cắt ghép ảnh ngay trong hệ thống CMS.

**4. Business Rules (BR)**
- **Security (NFR-RO-03):** Waiter tuyệt đối không được vào màn hình này.

**5. Acceptance Criteria (AC)**
- **AC1:** `GIVEN` Quản lý cập nhật giá món "Bít tết" từ 100k lên 120k, `WHEN` bấm Lưu, `THEN` giá trên E-Menu của khách tự động đổi thành 120k ngay lập tức.
- **AC2:** `GIVEN` tài khoản Waiter cố tình truy cập vào trang sửa Menu (hoặc URL bị lộ), `WHEN` click vào, `THEN` hệ thống chặn lại và báo lỗi 403 Forbidden.

---

## US-08: Đối soát Tồn kho (Inventory Reconciliation)
**1. User Story**
*As a* Bếp trưởng / Quản lý, *I want* nhập số lượng nguyên liệu thực tế còn lại cuối ngày vào hệ thống, *so that* phần mềm đối chiếu với số liệu lý thuyết và báo cáo chênh lệch.

**2. Metadata**
- **Nguồn REQ:** `REQ-12`
- **Priority:** Should

**3. Scope (In/Out)**
- **In-Scope:** Bảng nhập liệu chênh lệch cuối ngày và chốt sổ kho.
- **Out-of-Scope:** Quản lý hạn sử dụng của từng lốc nguyên liệu (HSD).

**4. Business Rules (BR)**
- Phải nhập lý do nếu chênh lệch âm (thiếu hụt) > 5%.

**5. Acceptance Criteria (AC)**
- **AC1:** `GIVEN` màn hình Tồn kho, `WHEN` Quản lý nhập số lượng thịt bò thực tế là 5kg (số lý thuyết máy tính báo là 6kg), `THEN` hệ thống tự đánh dấu chênh lệch -1kg bằng màu Đỏ.
- **AC2:** `GIVEN` hoàn tất nhập liệu, `WHEN` bấm "Chốt ca", `THEN` số tồn kho đầu ca ngày hôm sau sẽ được thiết lập thành số thực tế vừa nhập.
