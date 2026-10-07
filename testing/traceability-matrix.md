# MA TRẬN TRUY VẾT YÊU CẦU (TRACEABILITY MATRIX) - GROUP 06

> **Tài liệu căn cứ:** `vault/01-Requirements/requirements.md`, `vault/04-User-Stories/user-stories.md`, `vault/07-QA/test-cases.md`, `vault/08-Decisions/decision-log.md` (ADR-001), `docs/03-Product/PRD.md`.  
> **Người thực hiện:** QA / Business Analyst.  
> **Mục tiêu:** Truy vết xuyên suốt 100% Yêu cầu (Requirements) sang User Stories, Taiga Technical Tasks, Specs/ADRs, Test Cases và Release Status. Đảm bảo **KHÔNG CÓ REQUIREMENT MỒ CÔI**.

---

## 📋 BẢNG MA TRẬN TRUY VẾT CHI TIẾT (TRACEABILITY MATRIX TABLE)

| Requirement ID | Story ID | Taiga Tasks | Spec / ADR | Test IDs | Release Status |
|---|---|---|---|---|---|
| **REQ-01** (Must)<br>AI tư vấn món ăn dưa trên sở thích/dị ứng | `US-02` | `T-02` (Tích hợp Gemini AI API)<br>`T-03` (UI Chatbot & Preference Filter) | `BR-04` (AI Price Grounding & Clarification) | `TC-GO-006`, `TC-GO-007`, `TC-GO-010` | Ready (Sprint 1) |
| **REQ-02** (Must)<br>Explicit Confirmation: Order Draft bắt buộc | `US-01` | `T-04` (API Checkout Engine)<br>`T-05` (UI Order Draft & Popup Confirm) | `BR-01` / `BR-RO-03` (Explicit Confirmation Rule) | `TC-GO-001`, `TC-GO-002` | Ready (Sprint 1) |
| **REQ-03** (Should)<br>Chức năng Split Bill (Chia hóa đơn) | `US-05` | `T-11` (Engine Chia tiền & Sinh QR Động)<br>`T-13` (Unit Test Calculation) | `BR-06` (Round/Remainder Calculator) | `TC-GO-011`, `TC-GO-012` | Ready (Sprint 2) |
| **REQ-04** (Must)<br>Thanh toán bằng QR MoMo/VNPAY tại bàn | `US-01`<br>`US-05` | `T-04` (API Payment Checkout)<br>`T-11` (MoMo/VNPAY Sandbox Gateway) | `BR-RO-06` (Dynamic QR Payment Rule) | `TC-GO-001`, `TC-GO-005`, `TC-GO-011` | Ready (Sprint 1) |
| **REQ-05** (Must)<br>Tablet Voice-to-order cho Phục vụ | `US-02` | `T-06` (Web Speech API Integration) | `BR-04` (Voice Recognition Rule) | `TC-GO-006`, `TC-GO-008` | Ready (Sprint 1) |
| **REQ-06** (Must)<br>Table Map hiển thị màu trạng thái bàn | `US-04` | `T-08` (UI Table Map & Color Engine) | `PRD Section 7.1` (FR-04) | `TC-OP-007` | Ready (Sprint 2) |
| **REQ-07** (Must)<br>App thông báo âm thanh "Ting Ting" khi món Done | `US-04` | `T-07` (WebSocket Sound Push Event) | `PRD Section 7.1` (FR-04) | `TC-OP-006` | Ready (Sprint 2) |
| **REQ-08** (Must)<br>KDS xếp đơn ưu tiên, chớp Đỏ khi > 15 phút | `US-03` | `T-09` (UI KDS Board & 15m Red Flash Timer) | `PRD Section 7.1` (FR-03) | `TC-OP-001`, `TC-OP-002`, `TC-OP-004` | Ready (Sprint 1) |
| **REQ-09** (Must)<br>Out of Stock tự động khóa món toàn hệ thống 1s | `US-01`<br>`US-03` | `T-10` (API Out of Stock Instant Lock) | `BR-03` / `BR-RO-02` (Instant OOS Lock Rule) | `TC-GO-003`, `TC-OP-003`, `TC-OP-005` | Ready (Sprint 1) |
| **REQ-10** (Must)<br>RBAC Void/Refund món đã gửi bếp đòi PIN Quản lý | `US-04` | `T-12` (RBAC Middleware & Manager PIN Validator) | `BR-02` / `BR-RO-05` (Void Manager PIN Rule) | `TC-OP-008`, `TC-OP-009` | Ready (Sprint 2) |
| **REQ-11** (Must)<br>CMS Quản lý Menu (CRUD, Sửa giá, Cập nhật ảnh) | `US-07` | `T-14` (CMS Menu UI & CRUD API) | `NFR-RO-03` (CMS Access Control Rule) | `TC-MA-002` | Ready (Sprint 2) |
| **REQ-12** (Should)<br>Đối soát Tồn kho (Inventory Reconciliation) | `US-08` | `T-15` (Inventory Reconciliation UI & Logic) | `BR-06` (Stock Limit & Delta Calculation) | `TC-MA-004`, `TC-MA-005` | Ready (Sprint 3) |
| **REQ-13** (Could)<br>Dashboard báo cáo Real-time Doanh thu | `US-06` | `T-16` (Dashboard Real-time Analytics Service) | `PRD Section 7.1` (FR-06) | `TC-MA-001` | Ready (Sprint 3) |
| **REQ-14** (Out of Scope)<br>Thanh toán Stripe / Visa / Mastercard | N/A *(Out of Scope)* | N/A *(Bị loại trừ)* | `vault/01-Requirements/scope.md` | N/A *(Out of Scope)* | Out of Scope *(Bị cấm trong MVP)* |
| **REQ-15** (Must)<br>Xử lý món Out of Stock trong Order Draft | `US-01`<br>`US-03` | `T-05` (UI Draft Grayed-out)<br>`T-10` (API Instant OOS) | **ADR-001** (Mờ món, lock button, AI alert) | `TC-GO-004` | Ready (Sprint 1) |
| **NFR-RO-02** (Must)<br>Privacy: Xóa file âm thanh thô sau khi đóng bàn | `US-02` | `T-17` (Audio File Purge Script) | `PRD Section 7.2` (NFR-RO-02) | `TC-GO-009` | Ready (Sprint 1) |
| **NFR-RO-03** (Must)<br>Security: Waiter sửa menu bị lỗi 403 Forbidden | `US-07` | `T-12` (RBAC Middleware Enforcement) | `PRD Section 7.2` (NFR-RO-03) | `TC-MA-003` | Ready (Sprint 2) |
| **NFR-RO-05** (Must)<br>Availability: Text Fallback khi ồn/lỗi 2 lần | `US-02` | `T-06` (Text Fallback UI Component) | `PRD Section 7.2` (NFR-RO-05) | `TC-GO-008` | Ready (Sprint 1) |

---

## 📊 BÁO CÁO RÀ SOÁT TỰ KIỂM TRA (VERIFICATION REPORT)

1. **Tổng số Requirements thuộc Scope MVP**: **17 Yêu cầu** (14 FR/BR + 3 NFRs).
2. **Số lượng Must-have Requirements**: **14/14 Must Requirements (100%)** đã được bao phủ hoàn toàn trong Ma trận truy vết.
   - *Chi tiết*: `REQ-01`, `REQ-02`, `REQ-04`, `REQ-05`, `REQ-06`, `REQ-07`, `REQ-08`, `REQ-09`, `REQ-10`, `REQ-11`, `REQ-15`, `NFR-RO-02`, `NFR-RO-03`, `NFR-RO-05`.
3. **Số lượng Should-have & Could-have Requirements**: **3 Yêu cầu** (`REQ-03`, `REQ-12`, `REQ-13`) đã được truy vết đầy đủ sang User Story, Taiga Tasks và Test Cases.
4. **Out of Scope Requirement**: **1 Yêu cầu** (`REQ-14` - Visa/Stripe) được ghi nhận rõ ràng thuộc phạm vi loại trừ để ngăn ngừa Scope Creep.
5. **Kết luận**: **100% Yêu cầu đều có thông tin truy vết đầy đủ**, khớp nối chính xác 1:1 với bộ mã Test Cases mới (`TC-GO-xxx`, `TC-OP-xxx`, `TC-MA-xxx`).
