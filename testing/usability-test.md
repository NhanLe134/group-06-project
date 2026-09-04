# BÁO CÁO KỊCH BẢN KIỂM THỬ TÍNH KHẢ DỤNG & KẾT QUẢ RÀ SOÁT (USABILITY TEST SCRIPT & FINDINGS)
## Dự án: Hệ thống Smart Restaurant Ordering & KDS (Group 06)

> **Tài liệu kiểm soát:** `vault/07-QA/usability-test-script-and-findings.md`  
> **Giai đoạn dự án:** Giai đoạn Kiểm thử Tính khả dụng (UX/UI Usability Testing)  
> **Người thực hiện:** QA Lead / UX Researcher – Group 06  
> **Nguồn đối chiếu:** `vault/01-Requirements/requirements.md`, `vault/02-Research/user-research.md`, `vault/04-User-Stories/user-stories.md`

---

## 1. TỔNG QUAN VỀ ĐỢT KIỂM THỬ TÍNH KHẢ DỤNG (USABILITY OVERVIEW)

Đợt kiểm thử tính khả dụng được thực hiện với 3 nhóm người dùng đại diện (Khách hàng Anh Tuấn - gia đình đông người, Khách hàng trẻ tech-savvy, và Phục vụ Chị Lan) nhằm đánh giá mức độ thân thiện, khả năng tương tác bằng giọng nói (AI Voice-to-Order) và tính minh bạch trong quy trình chốt đơn hàng tại bàn.

---

## 2. KỊCH BẢN KIỂM THỬ & TIÊU CHUẨN THÀNH CÔNG (TEST SCRIPT & TASK MATRIX)

| Mã Task | Nhiệm vụ kiểm thử (Task Description) | Yêu cầu / Trace | Tiêu chuẩn thành công (Success Criterion) |
| :---: | :--- | :--- | :--- |
| **T1** | Tìm cà phê / đồ uống dưới 200k bằng giọng nói (Voice AI) | `US-02`<br>`REQ-01`<br>`REQ-05` | User nhận ra trạng thái micro (mic state) và chọn thành công 1 sản phẩm hợp lệ trong vòng $\le 60$ giây. |
| **T2** | Thêm 2 sản phẩm vào giỏ hàng nháp (Order Draft) | `US-01`<br>`REQ-02` | Số lượng sản phẩm (Quantity) cập nhật chính xác, user hiểu rõ phản hồi thị giác (visual feedback) của giỏ hàng. |
| **T3** | Nói câu thoại mơ hồ *"Thêm sữa"* / *"Cho 1 đĩa bò"* | `US-02`<br>`BR-04`<br>(Clarification) | User hiểu Assistant đang đặt câu hỏi làm rõ (Clarification), không nghĩ rằng hệ thống gặp lỗi hoặc bị treo. |
| **T4** | Chốt đơn và thanh toán (Checkout Process) | `US-01`<br>`BR-01`<br>(Explicit Confirm) | User nhận ra cần phải bấm nút xác nhận (Explicit Confirmation) và đọc được tổng số tiền rõ ràng trước khi chính thức đặt hàng. |

---

## 3. KẾT QUẢ PHÁT HIỆN, BẰNG CHỨNG & QUYẾT ĐỊNH THIẾT KẾ (FINDINGS, EVIDENCE & DECISIONS)

| Phát hiện (Finding) | Bằng chứng thực tế (Evidence) | Quyết định điều chỉnh (Decision) |
| :--- | :--- | :--- |
| **1. Trạng thái Micro chưa rõ ràng (Mic state chưa rõ)** | **2/3 người dùng** nói rằng họ không biết hệ thống có đang thực sự lắng nghe giọng nói hay chưa. | Thêm hiệu ứng nhấp nháy (**Pulse animation**) xung quanh icon micro + hiển thị nhãn chữ **"Đang nghe..."** + nút dừng thu âm (**Stop action**). |
| **2. Nút xác nhận dễ bị bỏ qua (Confirmation dễ bị bỏ qua)** | **1/3 người dùng** nói *"Tôi tưởng đã đặt rồi"* khi mới chỉ thấy món hiển thị trong giỏ nháp (Order Draft) mà chưa bấm gửi bếp. | Đổi tên nút CTA thành **"Xác nhận đặt hàng"**; bổ sung câu thông báo rõ ràng: **"Chưa tạo đơn - Vui lòng kiểm tra lại trước khi gửi bếp"**. |
| **3. Phản hồi bằng câu hội thoại tốt hơn Dropdown (Clarification tốt hơn dropdown)** | **3/3 người dùng** hiểu ngay lập tức câu hỏi *"Bạn muốn chọn loại bò/loại nước nào?"* khi AI hỏi lại. | Giữ nguyên cơ chế phản hồi bằng lời nói (**Conversational Clarification**) kết hợp hiển thị các thẻ món gợi ý (**Cards**) để người dùng chọn nhanh bằng 1 chạm. |

---

## 4. TỔNG KẾT & KẾ HOẠCH ĐỒNG BỘ (ACTION PLAN)

1. **Cập nhật Giao diện E-Menu (Guest UI)**:
   - Thêm trạng thái trực quan visual feedback cho Microphone (`Pulse` + Text `"Đang nghe..."`).
   - Sửa lại Label nút chốt đơn từ `"Gửi đơn"` thành `"Xác nhận đặt hàng - Chưa tạo đơn"`.
2. **Cập nhật Tài liệu Vault**:
   - Khớp nối các điều chỉnh UI/UX vào `vault/04-User-Stories/user-stories.md` và `docs/TRACEABILITY.md`.
   - Bổ sung kịch bản kiểm thử tính khả dụng này vào danh mục kiểm thử định kỳ của nhóm QA.
