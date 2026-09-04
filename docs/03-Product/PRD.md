# Product Requirements Document (PRD)
> **Bám sát tiêu chuẩn Giáo trình:** Tài liệu này cung cấp đầy đủ Problem, Users, Goals, Scope, Workflow, Requirements, và Metrics.

## 1. Kiểm soát tài liệu (Document Control)
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Dự án** | Hệ thống Smart Restaurant Ordering & KDS |
| **Business Analyst** | Trang (Nhóm 06) |
| **Phiên bản** | v2.0 (Bổ sung FR, NFR, BR) |
| **Trạng thái** | Đã phê duyệt (Approved) |

---

## 2. Vấn đề cần giải quyết (Problem Statement)
Tại các nhà hàng truyền thống vào giờ cao điểm:
- **Khách hàng** thường xuyên phải vẫy tay chờ đợi lâu để gọi món hoặc tính tiền.
- **Nhân viên phục vụ** ghi chú sai món hoặc quên order, dẫn đến khiếu nại (Trải nghiệm tồi tệ).
- **Giao tiếp Bếp - Phục vụ** bị gián đoạn bằng bill giấy, làm chậm tốc độ xoay vòng bàn và dễ thất lạc đơn.

---

## 3. Mục tiêu & Chỉ số (Goals & Success Metrics)
**Mục tiêu (Goals):**
Số hóa toàn bộ quy trình phục vụ tại bàn, từ lúc khách quét QR gọi món (hỗ trợ AI Voice) đến khi Bếp nhận đơn qua KDS và bưng bê chính xác.

**Chỉ số đo lường (Success Metrics):**
| Metric (Chỉ số) | Mục tiêu kỳ vọng (Target) |
| :--- | :--- |
| **Order Time** | Giảm thời gian trung bình từ lúc khách ngồi đến lúc chốt đơn xuống **< 3 phút**. |
| **Error Rate** | Giảm tỷ lệ sai/thiếu món (Wrong/Missing items) xuống **< 2%**. |
| **Turnover Rate** | Tăng hiệu suất xoay vòng bàn lên **15%** trong khung giờ vàng. |

---

## 4. Đối tượng Người dùng (Users & Personas)
| Role (Vai trò) | Mục tiêu (Goals) | Pain Points (Nỗi đau hiện tại) |
| :--- | :--- | :--- |
| **Khách hàng (Diners)** | Xem hình ảnh món ăn trực quan, gọi món nhanh gọn và tự thanh toán. | Phải chờ đợi nhân viên rảnh rỗi mới được order. |
| **Phục vụ (Waiters)** | Biết chính xác bàn nào gọi gì, món nào đã nấu xong để bưng ra. | Hay bị khách phàn nàn vì bếp làm chậm/quên món. |
| **Bếp (Kitchen Staff)** | Nhìn thấy ticket order theo thứ tự thời gian rõ ràng. | Dễ làm rơi mất bill giấy, không biết bill nào tới trước. |
| **Quản lý (Manager)** | Quản lý menu, doanh thu và kiểm soát các giao dịch bất thường. | Thất thoát do nhân viên tự ý hủy món không lý do. |

---

## 5. Ranh giới Dự án (Scope)
| In Scope (Trong phạm vi) | Out of Scope (Ngoài phạm vi) |
| :--- | :--- |
| - Gọi món tại bàn qua QR (E-Menu & AI Voice).<br>- Hệ thống KDS cho nhà bếp.<br>- Cập nhật trạng thái bưng bê (Table Map).<br>- Quản trị Menu và Đối soát tồn kho cuối ngày. | - Cổng thanh toán quốc tế (Visa/Stripe).<br>- Ứng dụng giao hàng tận nơi (Delivery).<br>- Hệ thống nhân sự (Chấm công, tính lương). |

---

## 6. Sơ đồ Luồng (User Workflow)
**Vui lòng xem chi tiết sơ đồ tại file:** `user-flow.mmd`.
*(Đã bao gồm luồng happy path và luồng dự phòng Fallback khi mất mạng hoặc quét mã QR thất bại).*

---

## 7. Yêu cầu Hệ thống (System Requirements)

### 7.1. Yêu cầu Chức năng (Functional Requirements - FR)
*(Chi tiết Acceptance Criteria xem tại `user-stories.md`)*

| FR-ID | Tên tính năng (Feature Name) | Trọng số ưu tiên (MoSCoW) | Nguồn User Story |
| :--- | :--- | :--- | :--- |
| **FR-01** | Khách lướt E-Menu và Thêm vào Giỏ hàng | Must-have | `US-01` |
| **FR-02** | Khách gọi món bằng Giọng nói AI | Should-have | `US-02` |
| **FR-03** | Bếp xem Ticket và đếm ngược trên KDS | Must-have | `US-03` |
| **FR-04** | Phục vụ nhận thông báo món chín & Cập nhật bàn | Must-have | `US-04` |
| **FR-05** | Khách chia tiền hóa đơn (Split Bill) | Could-have | `US-05` |
| **FR-06** | Dashboard Báo cáo Doanh thu | Should-have | `US-06` |
| **FR-07** | Quản lý CMS Menu (Giá, Hình ảnh) | Must-have | `US-07` |
| **FR-08** | Đối soát Tồn kho cuối ngày | Could-have | `US-08` |

### 7.2. Yêu cầu Phi Chức năng (Non-Functional Requirements - NFR)
| NFR-ID | Loại (Category) | Mô tả yêu cầu (Description) |
| :--- | :--- | :--- |
| **NFR-RO-02** | Privacy / Security | Các file âm thanh thô ghi âm từ khách qua tính năng Voice Ordering phải bị hủy bỏ ngay lập tức sau phiên. |
| **NFR-RO-03** | Security (RBAC) | Quyền hạn được thiết lập chặt chẽ: Chỉ cấp Manager mới được truy cập CMS Menu. Phục vụ (Waiter) không có quyền Hủy món. |
| **NFR-RO-05** | Reliability (Fallback) | Tính năng AI Voice nếu nghe lỗi quá 2 lần trong môi trường ồn, bắt buộc phải tự động hiển thị bàn phím Text. |

### 7.3. Quy tắc Nghiệp vụ (Business Rules - BR)
| BR-ID | Tên quy tắc | Ràng buộc logic (Constraint) |
| :--- | :--- | :--- |
| **BR-01** | Explicit Confirmation | Khách không thể order trực tiếp. Mọi thao tác chọn món đều phải vào "Order Draft" và bấm xác nhận bước cuối. |
| **BR-02** | Hủy món (Void/Refund) | Mọi thao tác hủy món đã đẩy xuống bếp đều yêu cầu phải nhập mã PIN của Manager. |
| **BR-03** | Khóa món (Out of Stock) | Ngay khi Bếp đánh dấu món OOS, hệ thống phải disable món đó trên thiết bị của khách trong vòng 1 giây. |
