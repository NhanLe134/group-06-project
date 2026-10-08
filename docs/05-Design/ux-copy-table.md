# UX Copy Specification Table - Group 06 (Smart Restaurant Ordering)

> **Tài liệu**: Bảng Quy chuẩn Từ ngữ Giao diện & Câu thoại Trợ lý AI (UX Copy Table)  
> **Phiên bản**: 2.0 (Chuẩn hóa toàn bộ câu từ theo 4 tiêu chí: *Rõ ràng - Ngắn gọn - Nhất quán - Có hướng khắc phục lỗi*)  
> **Dự án**: Smart Restaurant Ordering — Group 06  
> **Người thực hiện**: Lê Thị Thanh Nhàn (Role UX/UI Designer & AI/Vault Master)  

---

## 1. NÚT BẤM VÀ HÀNH ĐỘNG (CTA BUTTONS COPY)

| Vị trí / Component | Mã ID Element | UX Copy chuẩn (Văn bản nút bấm) | Nguyên tắc thiết kế từ ngữ (UX Writing Rules) |
| :--- | :--- | :--- | :--- |
| **Nút chốt đơn giỏ hàng** | `btn-open-draft`, `btn-confirm-send` | *"Xác nhận gửi Bếp ngay"* | Động từ hành động mạnh mẽ, chỉ rõ đích đến là gửi xuống Bếp. |
| **Nút xem hóa đơn** | `btn-view-bill` | *"Xem hóa đơn"* | Nhắn gọn, rõ ràng nghĩa xem danh sách món đã gọi. |
| **Nút yêu cầu thanh toán** | `btn-request-pay` | *"Yêu cầu thanh toán"* | Lịch sự, thể hiện hành động gửi tín hiệu tới thu ngân. |
| **Nút lưu ghi chú món** | `btn-note-save` | *"Lưu ghi chú"* | Ngắn gọn, khẳng định hành động đính kèm ghi chú vào món. |
| **Nút xóa ghi chú món** | `btn-note-clear` | *"Xóa ghi chú"* | Cho phép hủy bỏ nhanh tùy chỉnh vừa chọn. |
| **Nút tiếp tục gọi món** | `btn-close-success` | *"Tiếp tục gọi món"* | Định hướng hành vi quay lại xem E-Menu sau khi gửi đơn thành công. |
| **Nút dọn món Phục vụ** | `.btn-served` | *"Đã phục vụ"* | Từ ngữ khẳng định hoàn thành nhiệm vụ đưa món tới bàn. |
| **Nút đóng bàn Thu ngân** | `.btn-close-table` | *"In hóa đơn & Đóng bàn"* | Rõ nghĩa thao tác 2 trong 1: xuất bill và giải phóng bàn về Bàn trống. |
| **Nút Hủy / Quản lý** | `btn-ghost`, `btn-cancel` | *"Hủy bỏ"* | Từ ngữ mềm mỏng, không gây áp lực khi khách đổi ý. |

---

## 2. THÔNG BÁO LỖI VÀ HƯỚNG KHẮC PHỤC (ACTIONABLE ERROR MESSAGES)

| Mã lỗi / Ngữ cảnh | UX Copy chuẩn (Văn bản thông báo lỗi) | Nguyên tắc thiết kế từ ngữ (UX Writing Rules) |
| :--- | :--- | :--- |
| **Món hết hàng (Out of Stock)** | *"Món này hiện tại bếp đã hết hàng. Vui lòng chọn món khác hoặc tham khảo món gợi ý nhé!"* | Báo lý do rõ ràng, khách quan, hướng dẫn khách chọn món thay thế. |
| **Vượt quá tồn kho (Stock Insufficient)** | *"Số lượng gọi vượt quá tồn kho còn lại (chỉ còn {quantity} phần). Vui lòng giảm số lượng."* | Đưa ra con số tồn kho thực tế, hướng dẫn hành động sửa lỗi cụ thể. |
| **Mất kết nối mạng (Offline)** | *"Mất kết nối mạng. Vui lòng kiểm tra kết nối Wifi/4G và thử lại. Giỏ hàng của bạn vẫn được an toàn."* | Tránh từ ngữ kỹ thuật, khẳng định dữ liệu giỏ hàng an toàn để khách an tâm. |
| **Lỗi cổng thanh toán (Sim Error AC5)** | *"Giao dịch thanh toán thất bại (Mô phỏng lỗi AC5). Vui lòng thử lại hoặc chuyển sang thanh toán tiền mặt."* | Cung cấp phương án thay thế ngay lập tức khi cổng online bị lỗi. |
| **Không tìm thấy món (Search Empty)** | *"Không tìm thấy món ăn phù hợp với từ khóa '{keyword}'. Vui lòng thử lại từ khóa khác."* | Nêu rõ từ khóa tìm kiếm và gợi ý thử lại. |

---

## 3. TRẠNG THÁI TRỐNG (EMPTY STATES COPY)

| Vị trí / Component | UX Copy chuẩn (Văn bản hiển thị) | Gợi ý hành vi (Actionable Callout) |
| :--- | :--- | :--- |
| **Giỏ hàng nháp trống** | *"Chưa có món nào trong bản nháp"* | *"Hãy chọn món từ E-Menu hoặc bấm nút Micro để gọi món bằng giọng nói!"* |
| **Chưa chọn bàn Thu ngân** | *"Vui lòng chọn một bàn từ danh sách bên trái để xem chi tiết hóa đơn và thanh toán."* | Hướng dẫn Thu ngân thao tác chọn bàn. |
| **Bếp KDS chưa có đơn** | *"Hiện tại chưa có đơn hàng mới cần chế biến."* | Trạng thái nghỉ của bếp, tự động cập nhật khi có đơn gửi xuống. |

---

## 4. CÂU THOẠI VÀ PHẢN HỒI TRỢ LÝ AI (VOICE / ASSISTANT COPY)

| Trạng thái AI Voice | Câu thoại / Phản hồi chuẩn | Quy tắc giọng điệu (Tone of Voice) |
| :--- | :--- | :--- |
| **Listening (Đang nghe)** | *"🔴 Đang nghe… Nói tên món ăn hoặc yêu cầu của bạn."* | Trực tiếp, rõ ràng, có tín hiệu đỏ nhận biết trạng thái thu âm. |
| **Clarification (Hỏi lại BR-RO-04)** | *"Nhà hàng có {n} món phù hợp: {option_1} và {option_2}. Bạn muốn chọn loại nào ạ?"* | Lịch sự, đưa danh sách kèm giá tiền minh bạch, kết thúc bằng câu hỏi lựa chọn. |
| **Add to Cart (Thêm giỏ thành công)** | *"Đã thêm {quantity} phần {product_name} vào giỏ hàng bản nháp!"* | Phản hồi xác nhận tức thì, đọc đúng tên món và số lượng. |
| **Voice Error / Ambiguous** | *"Dạ em chưa nghe rõ tên món. Bạn có thể nói lại hoặc chạm chọn trên menu nhé!"* | Thân thiện, không gây cảm giác lỗi do người dùng, gợi ý fallback chạm tay. |

---

## 5. HỘP THOẠI XÁC NHẬN VÀ THÔNG BÁO THÀNH CÔNG (CONFIRMATION DIALOGS)

| Loại Modal | Tiêu đề (Heading) | Nội dung thông báo (Body Copy) | Nút bấm phản hồi |
| :--- | :--- | :--- | :--- |
| **Modal Xác nhận gửi Bếp** (`ConfirmDialog`) | *"Xác nhận gửi bếp"* | *"Gửi đơn gồm {count} món (Tổng: {total}đ) xuống Bếp để bắt đầu chế biến?"* | **[Hủy bỏ]** — **[Xác nhận]** |
| **Modal Ghi chú món** (`NoteModal`) | *"Ghi chú món ăn"* | *"Chọn nhanh hoặc gõ yêu cầu riêng cho món này (bếp sẽ thấy khi nhận đơn)."* | **[Xóa ghi chú]** — **[Lưu ghi chú]** |
| **Modal Yêu cầu thanh toán** (`PayModal`) | *"Yêu cầu thanh toán"* | *"Đã gửi yêu cầu thanh toán tới quầy Thu ngân thành công. Nhân viên sẽ tới bàn ngay ạ!"* | **[Đã hiểu]** |
| **Modal Đơn gửi thành công** (`SuccessModal`) | *"Đã gửi đơn xuống bếp thành công!"* | *"Đơn hàng bàn {table} đã được chuyển tới Bếp KDS. Mã đơn: #{order_code}"* | **[Tiếp tục gọi món]** |
