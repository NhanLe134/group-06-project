# Báo cáo Thẩm định AI (Verification Report 5)
**Ngày thực hiện:** 03/09/2026
**Nhiệm vụ:** Rà soát chất lượng phân rã Task cho Taiga (Sprint Planning).

## 1. Phát hiện lỗi chia task "Tù mù"
Khi yêu cầu AI chẻ User Story thành Task, AI đã tạo ra các task không thể kiểm chứng:
- **Task nháp:** `T-01: Làm backend cho phần đặt món (Owner: Ny, 15h)`.
- **Lý do sai:** Task quá chung chung (Epic-level), thời gian estimate quá lớn (15h). Giảng viên quy định task phải có Deliverable rõ ràng (schema, endpoint, component).

## 2. Kết luận & Hành động
BA (đóng vai Scrum Master) đã bác bỏ danh sách task nháp, ép AI chẻ nhỏ thành các API Endpoint (`POST /api/cart/checkout`) và UI Component cụ thể với Estimate dưới 8h/task. Kết quả (bảng Taiga Tasks) đạt chuẩn S.M.A.R.T để Dev bắt đầu code.
