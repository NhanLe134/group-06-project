# Bảng phân rã kỹ thuật (WBS) cho Taiga - Giai đoạn 5
> **Hướng dẫn cho BA (Trang):** 
> Copy bảng này và Paste trực tiếp vào phần mềm Taiga. Tuyệt đối tuân thủ nguyên tắc "Task tốt": Tên task phải chỉ rõ Component/API cụ thể, không ghi chung chung.

## EPIC 1: GUEST ORDERING EXPERIENCE
*(Bao gồm US-01 và US-02)*

| Thuộc US | Tên Task Kỹ thuật (Technical Task) | Người phụ trách | Estimate (Giờ) | Expected Output (Đầu ra) | Verify Command / Check |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-01** (Giỏ hàng) | UI: Build E-Menu layout and Sticky Cart component | Nhàn (UX/UI) | 4h | Figma UI & Frontend Component | `npm run test:ui:menu` / Component renders correctly. |
| **US-01** | API: Implement POST /api/cart/items + OOS validation | Nhã (Eng) | 6h | Backend Endpoint | `curl -X POST /api/cart/items` / Trả về 200 OK hoặc 400 OOS. |
| **US-01** | DB: Design Schema for Order Draft and Items | Nhã (Eng) | 2h | Database Migration Script | `db.execute('SELECT * FROM order_drafts')` |
| **US-01** | QA: Automate Add-to-cart happy path + Explicit Confirmation | Ny (QA) | 4h | E2E Test Script | `npm run cypress:run --spec cart.js` |
| **US-02** (AI Voice) | UI: Build VoiceComposer states: idle/listening/processing/error | Nhàn (UX/UI) | 5h | Frontend Component tích hợp Mic | Nút Mic chuyển đỏ khi thu âm, trả về Text. |
| **US-02** | API: Implement Speech-to-Text integration and NLP parser | Nhã (Eng) | 8h | Backend Endpoint `/api/voice/parse` | Gửi file audio, nhận JSON chứa danh sách món. |
| **US-02** | QA: Test Voice fallback text input in noisy environments | Ny (QA) | 3h | Manual/Auto Test Case | Bịt mic 2 lần -> Bàn phím tự động hiện lên (Pass NFR). |
| **US-02** | Sec: Implement cronjob to delete raw audio files after session | Nhã (Eng) | 3h | Backend Worker | File âm thanh bị xóa khỏi thư mục `/tmp` sau 1h. |

---

## EPIC 2: KITCHEN & TABLE OPERATIONS
*(Bao gồm US-03 và US-04)*

| Thuộc US | Tên Task Kỹ thuật (Technical Task) | Người phụ trách | Estimate (Giờ) | Expected Output (Đầu ra) | Verify Command / Check |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US-03** (Bếp KDS) | UI: Build KDS Ticket board with 15-min red warning timer | Nhàn (UX/UI) | 4h | Frontend Board KDS | Món quá 15 phút đổi màu viền sang Đỏ. |
| **US-03** | API: Setup Websocket for real-time ticket pushing | Nhã (Eng) | 6h | Websocket Server | Order mới nhảy lên KDS ngay lập tức không cần F5. |
| **US-03** | DB: Implement Out_of_Stock global lock logic (DB trigger) | Nhã (Eng) | 4h | Database Logic | Bếp bấm nút OOS -> Biến `is_available` = false. |
| **US-03** | QA: Test Websocket concurrency (5 orders at once) | Ny (QA) | 4h | Load Test Script | `k6 run kds_load_test.js` |
| **US-04** (Phục vụ) | UI: Design Table Map View with status colors | Nhàn (UX/UI) | 3h | Frontend Table Map | Bàn trống: Trắng. Bàn có khách: Vàng. Có món: Xanh. |
| **US-04** | API: Implement PUT /api/orders/status (Ready -> Served) | Nhã (Eng) | 3h | Backend Endpoint | Trạng thái chuyển đổi thành công trong Database. |
| **US-04** | Sec: Implement RBAC for Void/Refund requiring Manager PIN | Nhã (Eng) | 5h | Middleware Authorization | `POST /api/orders/void` -> Waiter nhận 403, Manager nhận 200. |
| **US-04** | QA: Verify State Machine transitions (Pending->Ready->Served) | Ny (QA) | 3h | Integration Test | Không được nhảy cóc trạng thái từ Pending lên Served. |
| **US-04** | Doc: Write Verification Report for RBAC logic | Trang (BA) | 2h | Markdown Document | Báo cáo kiểm chứng phân quyền trong `docs/`. |

---
> **Lưu ý Dependency (Sự phụ thuộc):** 
> - Task `POST /api/cart/items` (US-01) phải hoàn thành trước thì mới làm được Task `Speech-to-Text integration` (US-02).
> - Task `Setup Websocket` (US-03) phải xong trước thì Tablet của Phục vụ (US-04) mới nhận được thông báo.
