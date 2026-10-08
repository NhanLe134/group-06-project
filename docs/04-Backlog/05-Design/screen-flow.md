# Screen Flow Architecture - Group 06 (Restaurant Operations & Smart Ordering)

> **Tài liệu**: Sơ đồ Kiến trúc Luồng Màn hình & Trạng thái UI cho prototype  
> **Phiên bản**: 1.0 (Giai đoạn 3 - Prototype Design)  
> **Tác giả**: Lê Thị Thanh Nhàn (Role UX/UI Designer & AI/Vault Master)  

---

## 1. SƠ ĐỒ LUỒNG CHUYỂN MÀN HÌNH TỔNG THỂ (END-TO-END SCREEN FLOW)

Sơ đồ Mermaid dưới đây thể hiện trọn vẹn luồng di chuyển từ Khách gọi món trên điện thoại $\rightarrow$ Bếp KDS xử lý 3 trạng thái $\rightarrow$ Phục vụ dọn món tại bàn.

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
        D2 --> D3["Phục vụ bấm 'ĐÃ PHỤC VỤ' (Served)\nHoàn tất vòng đời đơn hàng"]
    end
```

---

## 3. CÁC ĐIỂM GỌI API GIẢ LẬP (SIMULATED API ENDPOINTS)

Dưới đây là các điểm dữ liệu trao đổi giữa các màn hình di động, Bếp KDS và Phục vụ được giả lập trong ứng dụng Web Prototype:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Khách hàng (Bàn 06)
    actor Kitchen as 👨‍🍳 Bếp KDS (Kitchen)
    actor Waiter as 🛎️ Phục vụ (Waiter)

    Customer->>Customer: 1. Chạm chọn món "Phở bò"
    Customer->>Customer: 2. POST /api/voice/parse -> Cập nhật Order Draft
    Customer->>Customer: 3. POST /api/orders/confirm -> Bấm "Xác nhận gửi Bếp"
    Customer-->>Kitchen: 4. Event: OrderConfirmed (Dữ liệu đơn #B06-001)
    
    Note over Kitchen: Đơn ở trạng thái 1: CHỜ NẤU (Pending)
    Kitchen->>Kitchen: 5. PATCH /api/kds/status -> Bếp bấm "ĐANG LÀM" (In Progress)
    Kitchen->>Kitchen: 6. PATCH /api/kds/status -> Bếp bấm "ĐÃ XONG" (Ready)
    
    Kitchen-->>Waiter: 7. Event: ItemReadyAlert (Món Bàn 06 đã hoàn tất)
    Waiter->>Waiter: 8. Phục vụ bưng món đến Bàn 06
    Waiter->>Customer: 9. PATCH /api/waiter/served -> Bấm "ĐÃ PHỤC VỤ" (Served)
```
