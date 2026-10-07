# Báo cáo Thẩm định AI (Verification Report 2)
**Ngày thực hiện:** 03/09/2026
**Nhiệm vụ:** Rà soát và ngăn chặn lỗi Scope Creep (Phình to phạm vi dự án).

## 1. Phát hiện lỗi Scope Creep
Trong quá trình chạy Prompt `Requirement Reviewer` để phân tích Scope, AI đã tự ý cài cắm thêm một tính năng không có trong tài liệu phỏng vấn:
- **Tính năng sai lệch:** `REQ-14: Tích hợp thanh toán trực tuyến bằng thẻ quốc tế Visa/Mastercard qua cổng Stripe.`
- **Gán vào:** Mục `Must-have Scope` (Bắt buộc phải có).

**Lý do sai (Business Impact):** Theo dữ liệu khảo sát từ Quản lý (Chị Mai), nhà hàng chỉ yêu cầu thanh toán qua **QR MoMo/VNPAY tại bàn**. Việc tích hợp cổng thanh toán quốc tế (Stripe/Visa) đòi hỏi chi phí giao dịch (Transaction fee) rất cao, quy trình đối soát với ngân hàng phức tạp và không phù hợp với tệp khách hàng địa phương. Nếu để lọt lỗi này vào MVP sẽ gây đội vốn dự án nghiêm trọng và lãng phí thời gian của team Dev.

## 2. Bảng so sánh Trước và Sau khi can thiệp (Before vs After)

| Hạng mục | Trước khi sửa (Bản nháp của AI) | Sau khi BA sửa (Bản chính thức) | Quyết định của BA |
|---|---|---|---|
| **REQ-14** | Priority: **Must-have** (Bắt buộc có) | Priority: **Out of Scope** (Bị loại bỏ hoàn toàn khỏi MVP) | Không đồng ý triển khai. Đẩy tính năng thanh toán Visa xuống Out of Scope. |
| **MVP Scope** | Đề xuất Must-have chứa 11 chức năng (bao gồm cả Thanh toán Visa). | Đề xuất Must-have chỉ còn 10 chức năng (Tập trung QR MoMo/VNPAY). | Loại bỏ tính năng gây tốn kém chi phí không cần thiết để tối ưu MVP. |

## 3. Kết luận
BA đã thể hiện vai trò làm chủ (Ownership) trong việc định hình sản phẩm. Bằng việc bắt lỗi và phản bác lại sự suy diễn của AI, BA đã bảo vệ được ngân sách và quỹ thời gian của dự án. File `scope.md` và `requirements.md` đã được chốt sổ, ranh giới dự án đã rõ ràng để team Tech bắt đầu vẽ PRD.
