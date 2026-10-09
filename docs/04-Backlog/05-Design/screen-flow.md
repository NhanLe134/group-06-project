# Screen Flow Architecture - Group 06 (Restaurant Operations & Smart Ordering)

> **Tài liệu**: Sơ đồ Kiến trúc Luồng Màn hình & Trạng thái UI cho ứng dụng  
> **Phiên bản**: 2.0 (Cập nhật chuẩn theo các màn hình `frontend/fe_ofc/` - E-Menu, Order Draft, KDS, Waiter & Cashier)  
> **Tác giả**: Lê Thị Thanh Nhàn (Role UX/UI Designer & AI/Vault Master)  

---

## 1. SƠ ĐỒ LUỒNG CHUYỂN MÀN HÌNH TỔNG THỂ (END-TO-END SCREEN FLOW)

Sơ đồ Mermaid dưới đây thể hiện trọn vẹn luồng di chuyển từ Khách gọi món trên điện thoại $\rightarrow$ Bếp KDS xử lý 3 trạng thái $\rightarrow$ Phục vụ dọn món $\rightarrow$ Khách xem hóa đơn & Thu ngân thanh toán đóng bàn.

```mermaid
flowchart TD
    %% MÀN HÌNH 1: KHÁCH HÀNG (MOBILE E-MENU & VOICE)
    subgraph S1["📱 Màn hình 1: E-Menu Di động & AI Voice Assistant"]
        A1["Khách mở E-Menu (Bàn 06)"] --> A2{"Chọn hình thức gọi món"}
        A2 -- "Chạm E-Menu (Manual Touch)" --> A3["Bấm 'Thêm vào đơn' trên thẻ món"]
        A2 -- "Dùng Giọng nói (AI Voice)" --> A4["Bấm nút Floating Micro"]
        A4 --> A5["Chế độ Listening (Ghi âm)"]
        A5 --> A6["Transcript (Hiển thị văn bản)"]
        A6 --> A7["Processing (AI trích xuất món/ghi chú)"]
        A3 -- "Bấm Ghi chú món" --> A3_NOTE["State: NoteModal (#note-modal)\n(Chọn chip ít cay, không hành...)"]
        A3_NOTE --> A8
    end

    %% MẦM XỬ LÝ ĐẶC BIỆT (CLARIFICATION & OUT OF STOCK)
    subgraph COND["⚙️ Bộ lọc Quy tắc Nghiệp vụ (Vault Business Rules)"]
        A7 -- "Câu lệnh mơ hồ (BR-RO-04)" --> B1["State: Ambiguous\n(Popup hỏi làm rõ loại món)"]
        B1 --> A8
        A3 & A7 -- "Món Out of Stock (ADR-001)" --> B2["State: Out-of-Stock\n(Mờ xám thẻ món & báo hết)"]
        B2 --> A1
    end

    %% MÀN HÌNH 2: ORDER DRAFT & EXPLICIT CONFIRMATION
    subgraph S2["🛒 Màn hình 2: Order Draft & Confirmation Modal"]
        A3 & A7 -- "Thêm món hợp lệ" --> A8["Cập nhật Order Draft Drawer\n(Cố định chân màn hình)"]
        A8 --> A9["Khách kiểm tra Món + Ghi chú + Tổng tiền"]
        A9 --> A10["State: Confirm\n(Bấm nút vật lý 'Xác nhận gửi Bếp')"]
        A10 --> A11["State: Success\n(Xuất mã đơn #B06-001)"]
    end

    %% MÀN HÌNH 3: BẾP KDS (KITCHEN DISPLAY SYSTEM)
    subgraph S3["👨‍🍳 Màn hình 3: Bếp KDS (Kitchen Display System)"]
        A11 -- "Tự động đẩy đơn Real-time" --> C1["Nhận Order thẻ Bàn 06\nTrạng thái 1: CHỜ NẤU (Pending)"]
        C1 --> C2["Bếp bấm chuyển\nTrạng thái 2: ĐANG LÀM (In Progress)"]
        C2 --> C3["Bếp chế biến xong, bấm chuyển\nTrạng thái 3: ĐÃ XONG - CHỜ PHỤC VỤ (Ready)"]
    end

    %% MÀN HÌNH 4: WAITER TABLET (PHỤC VỤ)
    subgraph S4["🛎️ Màn hình 4: Waiter Tablet (Phục vụ)"]
        C3 -- "Thông báo đẩy đến Tablet" --> D1["Hiện Alert: Món Bàn 06 đã sẵn sàng"]
        D1 --> D2["Phục vụ bê món đến Bàn 06"]
        D2 --> D3["Phục vụ bấm 'ĐÃ PHỤC VỤ' (Served)\nCập nhật món hoàn tất"]
    end

    %% MÀN HÌNH 5: THANH TOÁN & THU NGÂN (CASHIER)
    subgraph S5["💳 Màn hình 5: Xem Hóa đơn & Thu ngân (Cashier)"]
        D3 --> E1["Khách bấm 'Xem hóa đơn'\nState: BillView (#bill-view)"]
        E1 --> E2["Khách bấm 'Yêu cầu thanh toán'\nState: PayModal (#pay-modal)"]
        E2 -- "Đẩy tín hiệu Real-time" --> E3["Màn Thu ngân Cashier (SCR-CASH-01)\nBàn 06 chuyển màu VÀNG (Yêu cầu trả tiền)"]
        E3 --> E4["Thu ngân chọn PTTT\n(Tiền mặt / Mã QR MoMo)"]
        E4 --> E5{"Mô phỏng lỗi #err-sim (AC5)"}
        E5 -- "Có lỗi" --> E6["Hiện Toast báo lỗi cổng thanh toán"]
        E5 -- "Thành công" --> E7["In hóa đơn & Bấm 'Đóng bàn'\nBàn 06 chuyển lại màu XANH (Bàn trống)"]
    end
```

---

## 2. CÁC ĐIỂM GỌI API & SỰ KIỆN REAL-TIME (SIMULATED API ENDPOINTS)

Dưới đây là chuỗi tương tác API và sự kiện real-time đầy đủ giữa Khách hàng, Bếp KDS, Phục vụ và Thu ngân:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Khách hàng (Bàn 06)
    actor Kitchen as 👨‍🍳 Bếp KDS (Kitchen)
    actor Waiter as 🛎️ Phục vụ (Waiter)
    actor Cashier as 💳 Thu ngân (Cashier)

    Customer->>Customer: 1. Chạm chọn món hoặc nhập ghi chú (#note-modal)
    Customer->>Customer: 2. POST /api/voice/parse -> Cập nhật Order Draft
    Customer->>Customer: 3. POST /api/orders/confirm -> Bấm "Xác nhận gửi Bếp"
    Customer-->>Kitchen: 4. Event: OrderConfirmed (Dữ liệu đơn #B06-001)
    
    Note over Kitchen: Đơn ở trạng thái 1: CHỜ NẤU (Pending)
    Kitchen->>Kitchen: 5. PATCH /api/kds/status -> Bếp bấm "ĐANG LÀM" (In Progress)
    Kitchen->>Kitchen: 6. PATCH /api/kds/status -> Bếp bấm "ĐÃ XONG" (Ready)
    
    Kitchen-->>Waiter: 7. Event: ItemReadyAlert (Món Bàn 06 đã hoàn tất)
    Waiter->>Waiter: 8. Phục vụ bưng món đến Bàn 06
    Waiter->>Customer: 9. PATCH /api/waiter/served -> Bấm "ĐÃ PHỤC VỤ" (Served)

    Customer->>Customer: 10. GET /api/orders/bill -> Khách xem Hóa đơn tạm tính (#bill-view)
    Customer->>Cashier: 11. POST /api/orders/request-payment -> Khách bấm "Yêu cầu thanh toán"
    Note over Cashier: Bàn 06 trên màn Cashier đổi sang màu VÀNG
    Cashier->>Cashier: 12. POST /api/cashier/pay -> Chọn Tiền mặt/MoMo & in bill
    Cashier->>Customer: 13. Event: TableClosed -> Thu ngân bấm "Đóng bàn", Bàn 06 về màu XANH (Trống)
```
