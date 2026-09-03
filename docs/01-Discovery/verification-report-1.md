# Báo cáo Thẩm định AI (Verification Report 1)
**Ngày thực hiện:** 03/09/2026
**Nhiệm vụ:** Rà soát lỗi Ảo giác (Hallucination) trong giai đoạn Discovery & Persona.

## 1. Phát hiện lỗi Ảo giác (Hallucination)
Trong lần chạy Prompt đầu tiên, AI đã tự động tạo thêm một nhóm đối tượng không có thật trong dữ liệu phỏng vấn:
- **Persona sai lệch:** `Nhân viên Giao hàng (Shipper)`
- **Open Question sai lệch:** `Phí ship (Delivery Fee) tính theo kilomet hay tính đồng giá cho mọi đơn hàng giao tận nhà?`

**Lý do sai:** Dự án nhà hàng trong `interview-notes.md` được định vị là "Phục vụ tại bàn" (Dine-in) với các nghiệp vụ cốt lõi như KDS, Table Map, QR Ordering. Không hề có dữ liệu nào nhắc đến Delivery. Việc AI tự suy diễn thêm Shipper là lỗi Hallucination nghiêm trọng, dẫn đến Scope Creep.

## 2. Bảng so sánh Trước và Sau khi can thiệp (Before vs After)

| Hạng mục | Trước khi sửa (Bản nháp của AI) | Sau khi BA sửa (Bản chính thức) | Quyết định của BA |
|---|---|---|---|
| **Danh sách Personas** | 1. Khách hàng<br>2. Phục vụ<br>3. Đầu bếp<br>4. Quản lý<br>5. Shipper (Giao hàng) | 1. Khách hàng<br>2. Phục vụ<br>3. Đầu bếp<br>4. Quản lý | **Xóa bỏ Persona Shipper** để bám sát dữ liệu phỏng vấn. |
| **Open Questions** | - Cần tạo tài khoản không?<br>- Quy trình fallback mất mạng?<br>- Chính sách hủy món đang nấu?<br>- Phí ship tính thế nào? | - Cần tạo tài khoản không?<br>- Quy trình fallback mất mạng?<br>- Chính sách hủy món đang nấu? | **Xóa bỏ câu hỏi về phí ship**. Hệ thống chỉ tập trung vào nghiệp vụ tại quán. |

## 3. Kết luận
BA đã chặn đứng thành công lỗi ảo giác của AI, bảo vệ ranh giới dự án (Scope boundaries) không bị phình to vô lý. Các file output (`problem-statement.md`, `personas.md`, `open-questions.md`) đã được làm sạch và đảm bảo độ tin cậy 100% dựa trên Source of Truth.
