# Figma Page Structure & Story Mapping Handoff - Group 06

> **Tài liệu**: Quy hoạch Cấu trúc Figma & Ánh xạ Handoff cho Lập trình viên (Figma & Dev Handoff)  
> **Dự án**: Smart Restaurant Ordering — Group 06  
> **Người thực hiện**: Lê Thị Thanh Nhàn (Role UX/UI Designer & AI/Vault Master)  

---

## 1. QUY HOẠCH CẤU TRÚC 4 TRANG TRÊN FIGMA (FIGMA PAGES STRUCTURE)

Tệp Figma dự án được tổ chức chuẩn hóa thành 4 trang chính phục vụ quá trình bàn giao (Handoff):

```
🎨 Group-06-Smart-Restaurant-Ordering.fig
├─ 📄 1. Foundations (Design Tokens, Color Swatches, Typography Scale, Spacing Grid)
├─ 🧩 2. Components (VoiceButton, ProductCard, CartItem, OrderDraftSheet, KDSTicketCard, WaiterAlert)
├─ 📱 3. Flows (Screen 1 E-Menu → Screen 2 Draft → Screen 3 KDS → Screen 4 Waiter Tablet)
└─ 🚀 4. Handoff (Frame IDs, Component Specs & Redline Specs cho Developers/QA)
```

---

## 2. BẢNG ÁNH XẠ MÃ COMPONENT / FRAME SANG USER STORIES (STORY MAPPING)

Bảng dưới đây hỗ trợ Lập trình viên (Developers) và QA bấm thẳng từ mã User Story đến đúng Frame/Component ID trên Figma:

| Mã Component / Frame ID | Tên Component / Màn hình Figma | User Story liên kết (`user-stories.md`) | Mã Requirement liên kết |
| :--- | :--- | :--- | :--- |
| `CMP-VOICE-BTN` | VoiceButton (Floating Micro & Wave animation) | `US-01` (Gọi món bằng giọng nói AI) | `REQ-01`, `ADR-002` |
| `CMP-PROD-CARD` | ProductCard (Card món ăn, nút ＋, nhãn OOS) | `US-01`, `US-03` (Xem & chọn món) | `REQ-01`, `REQ-09`, `ADR-001` |
| `CMP-DRAFT-SHEET`| OrderDraft (Giỏ hàng bản nháp, nhãn đỏ cảnh báo) | `US-02` (Rà soát bản nháp giỏ hàng) | `REQ-02`, `ADR-003` |
| `CMP-CONFIRM-DLG`| ConfirmDialog (Popup Explicit Confirmation) | `US-02` (Xác nhận gửi Bếp) | `REQ-02`, `BR-RO-03` |
| `CMP-AMBIG-MODAL`| AmbiguousModal (Popup hỏi chọn món mơ hồ) | `US-01` (Hỏi lại làm rõ loại món) | `BR-RO-04`, `ADR-004` |
| `CMP-KDS-TICKET` | KDSTicketCard (Thẻ đơn KDS, 3 trạng thái, timer đỏ) | `US-04` (Bếp KDS nhận & xử lý đơn) | `REQ-08` |
| `CMP-KDS-STOCK`  | KDSStockControl (Nút công tắc báo món Hết hàng) | `US-04` (Bếp báo hết món) | `REQ-09` |
| `CMP-WAITER-ALERT`| WaiterAlertCard (Thông báo món sẵn sàng & nút Đã phục vụ) | `US-05` (Phục vụ dọn món tại bàn) | `REQ-05`, `REQ-07` |
| `SCR-BILL-QR`   | Bill & QR Payment Modal (Mã QR MoMo & Split Bill) | `US-06` (Thanh toán QR & chia tiền) | `REQ-03`, `REQ-04` |
| `SCR-TABLE-MAP`  | TableSessionMap (Sơ đồ màu bàn & Manager Void) | `US-07` (Sơ đồ bàn & Manager Void) | `REQ-06`, `REQ-10` |
