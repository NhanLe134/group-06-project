# Báo cáo Thẩm định AI (Verification Report 3)
**Ngày thực hiện:** 03/09/2026
**Nhiệm vụ:** Rà soát tính toàn vẹn của Sơ đồ luồng (User Flow), ngăn ngừa thất thoát Use Case (Edge Case / Error Path).

## 1. Phát hiện lỗi thiếu sót (Missing Edge Case)
Trong lần chạy Prompt đầu tiên, AI đã tạo ra một sơ đồ User Flow hoàn hảo theo đường thẳng (Happy Path), mặc định mọi khách hàng đều quét mã QR thành công. AI đã bỏ qua thực tế vận hành:
- **Lỗi thiếu sót:** Không có kịch bản xử lý khi mạng 4G/WiFi chập chờn, hoặc mã QR dán trên bàn bị trầy xước/hỏng.

**Lý do sai (Business Impact):** Trong thực tế nhà hàng F&B, việc quét QR thất bại xảy ra rất thường xuyên. Nếu hệ thống không thiết kế luồng dự phòng (Fallback / Error Path), khách hàng sẽ bị kẹt ở bước đầu tiên, dẫn đến phẫn nộ và bỏ về. Đòi hỏi BA phải can thiệp để thiết kế luồng gọi nhân viên hỗ trợ (dùng Tablet Voice-to-order).

## 2. Bảng so sánh Trước và Sau khi can thiệp (Before vs After)

| Hạng mục | Trước khi sửa (Sơ đồ nháp của AI) | Sau khi BA sửa (Sơ đồ chính thức) | Quyết định của BA |
|---|---|---|---|
| **Kịch bản quét mã QR** | Chỉ có 1 nhánh: `Quét mã QR` -> `Mở Menu` | Có 2 nhánh rẽ: <br>- `Thành công` -> `Mở Menu`<br>- `Thất bại` -> `Gọi Phục vụ dùng Tablet` | BA ép buộc hệ thống phải bao hàm luôn quy trình vận hành dự phòng của nhân viên phục vụ. |
| **Kịch bản Thanh toán** | Chỉ có 1 nhánh: `Quét QR` -> `Thành công` | Có 2 nhánh rẽ: <br>- `Thành công` -> `Đóng bàn`<br>- `Lỗi Ngân hàng` -> `Thanh toán tiền mặt` | BA bổ sung luồng thanh toán tiền mặt để giải quyết lỗi Cổng thanh toán (Payment Gateway timeout). |

## 3. Kết luận
BA đã chứng minh được kỹ năng bao quát hệ thống (System Thinking). Bằng cách từ chối bản vẽ "màu hồng" của AI và ép AI bổ sung các đường rẽ nhánh (Error Paths), tài liệu User Flow giờ đây đã phản ánh đúng 100% kịch bản thực tế khắc nghiệt, làm nền tảng vững chắc để Tech Team không bị bỏ sót mã lỗi khi lập trình.
