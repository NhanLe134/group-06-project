# Screen Flow Architecture - Group 06 (Restaurant Operations & Smart Ordering)

> **Tài liệu**: Sơ đồ Kiến trúc Luồng Màn hình & Trạng thái UI (Screen & State Transitions)  
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

## 2. MA TRẬN VỊ TRÍ HIỂN THỊ 10 TRẠNG THÁI UI (10 REQUIRED UI STATES MAPPING)

| # | Trạng thái (UI State) | Màn hình xuất hiện | Điều kiện kích hoạt (Trigger Condition) | Hành vi UI & Phản hồi hệ thống |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **`idle`** | Screen 1 (E-Menu) | Khách mới mở trang web hoặc chưa tương tác. | E-Menu hiển thị danh sách món ăn ở trạng thái bình thường. Nút Micro ở chế độ sẵn sàng. |
| 2 | **`listening`** | Screen 1 (Voice Modal) | Khách bấm giữ/nhấp vào nút Micro gọi món. | Nút Micro sáng xanh nhấp nháy, hiển thị sóng âm đang thu tiếng nói của khách. |
| 3 | **`processing`** | Screen 1 (Voice Modal) | Khách ngưng nói, hệ thống gửi âm thanh đến AI. | Spinner xoay tròn kèm dòng chữ *"AI đang phân tích câu lệnh của bạn..."*. |
| 4 | **`ambiguous`** | Screen 1 (Clarification) | Khách nói câu lệnh chung chung *"Cho 1 đĩa bò"* (`BR-RO-04`). | Bật Popup làm rõ: *"Nhà hàng có Bò xào cần (85k) và Bò sốt tiêu đen (120k), bạn chọn loại nào?"*. |
| 5 | **`out-of-stock`** | Screen 1 & Screen 2 | Khách chọn món có trạng thái hết hàng (`ADR-001`). | Thẻ món tự động mờ xám (*Grayed-out*), khóa nút bấm, AI đọc thông báo và gợi ý món khác. |
| 6 | **`order-draft`** | Screen 2 (Order Draft) | Sau khi thêm ít nhất 1 món ăn hợp lệ. | Cửa sổ giỏ hàng trượt từ dưới lên (Drawer), hiển thị món, số lượng, ghi chú "không hành", tổng tiền. |
| 7 | **`empty`** | Screen 2 (Order Draft) | Giỏ hàng chưa có món nào hoặc khách xóa hết món. | Hiển thị hình minh họa giỏ hàng trống kèm nút *"Khám phá Menu"*. |
| 8 | **`confirm`** | Screen 2 (Confirmation) | Khách xem giỏ hàng và chuẩn bị chốt đơn. | Nút bấm vật lý **"Xác nhận gửi Bếp"** sáng nổi bật (Primary Action) để người dùng bấm trực tiếp. |
| 9 | **`success`** | Screen 1 & 2 & 3 | Sau khi khách bấm nút "Xác nhận gửi Bếp". | Bật Popup thành công *"Đã gửi đơn xuống Bếp (#B06-001)"*, giỏ hàng làm sạch, đẩy thẻ đơn sang Bếp KDS. |
| 10 | **`network-error`** | Toàn bộ ứng dụng | Mất kết nối internet / Server KDS không phản hồi. | Thanh thông báo màu đỏ hiển thị trên cùng *"Mất kết nối mạng. Đơn hàng sẽ được lưu offline"*. |

---

## 3. CÁC ĐIỂM GỌI API GIẢ LẬP (SIMULATED API ENDPOINTS)

Dưới đây là các điểm dữ liệu trao đổi giữa các màn hình di động, Bếp KDS và Phục vụ được giả lập trong ứng dụng Web Prototype:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Khách hàng (Bàn 06)
    actor Kitchen as 👨‍🍳 Bếp KDS (Kitchen)
    actor Waiter as 🛎️ Phục vụ (Waiter)

    Customer->>Customer: 1. Nói "Cho 1 phở bò" / Chạm chọn món
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
