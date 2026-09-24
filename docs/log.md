# Nhật ký Quyết định (Decision Log)

## Ngày 24/09/2026

1. **Tech Stack (Backend & Database):**
   - **Bối cảnh:** Thầy có gợi ý có thể dùng Supabase cho nhanh.
   - **Quyết định:** Giữ nguyên phương án **FastAPI + PostgreSQL thuần** (dùng Docker Compose). 
   - **Lý do:** Tài liệu PRD (`docs/03-Product/PRD.md`) ở trạng thái Đã phê duyệt (Approved) ghi rõ bắt buộc dùng FastAPI và PostgreSQL. Việc dùng Supabase sẽ đi ngược lại Single Source of Truth của dự án và có nguy cơ bị trừ điểm Output.

2. **Database Schema:**
   - **Tình trạng:** Cấu trúc chi tiết của các bảng (ERD) đã được lưu trữ sẵn và đạt chuẩn tại file `vault/06-Engineering/data-model.md` (Output #18). Không cần phải định nghĩa lại từ đầu.
   - **Hành động:** Sử dụng schema này làm chuẩn để code Model cho Backend.

3. **Thay đổi Thứ tự Triển khai:**
   - **Quyết định:** Team thống nhất ưu tiên hoàn thiện đặc tả User Stories trước (tiến hành tách 8 US thành 8 file độc lập trong thư mục `vault/04-User-Stories/`).
   - **Hành động kế tiếp (Next Step):** Chỉ sau khi các User Stories đã được chốt và tách file xong, team mới quay lại thực hiện Khởi tạo Database và setup Base Project Backend FastAPI (Mục A của Sprint 1 Plan).
