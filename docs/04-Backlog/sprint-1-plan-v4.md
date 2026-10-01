# Sprint 1 Plan (v4) - Phân công theo Role

> **Thời hạn dự án (Timeline):** 27/08/2026 đến 02/10/2026

Tài liệu này quy định việc phân công công việc dựa theo Role chuyên môn của 4 thành viên (Trang, Nhã, Nhàn, Ny), chia theo từng giai đoạn cụ thể.

*(**Lưu ý quan trọng:** Dù làm việc chéo theo Role để hỗ trợ dự án tổng thể, nhưng khi lên báo cáo/bảo vệ, **mỗi thành viên vẫn phải tự thuyết trình và nắm cực kỳ kỹ về User Story (US) cốt lõi của cá nhân mình** - ví dụ Trang là US-04, các bạn khác cũng có US tương ứng).*

## 1. Bảng Phân Công Tổng Quan (Role, Việc Làm, Output)

| Thành viên | Role | Việc làm (Nhiệm vụ chính) | Output (Sản phẩm bàn giao) |
| --- | --- | --- | --- |
| **Trang** | **BA** | Phân tích nghiệp vụ toàn hệ thống, định nghĩa BR & AC, viết tài liệu AI feature cho Dev hiểu. Hỗ trợ giải đáp logic cho team. | Tài liệu US hoàn chỉnh, AI Feature Docs, Slide/Kịch bản báo cáo |
| **Nhã** | **Code** | Setup Base Project (React/FastAPI/DB), code logic chính, viết API, xử lý WebSocket, tích hợp AI logic vào hệ thống. | Source code (trên GitHub `main`), Database (Docker), API Specs |
| **Nhàn** | **UX/UI** | Thiết kế giao diện (UI), trải nghiệm người dùng (UX) cho tất cả các US. Làm Wireframe và Prototype có thể tương tác. | File thiết kế Figma, Prototype hoàn chỉnh, UI/UX Guidelines |
| **Ny** | **Test** | Xây dựng kịch bản kiểm thử (Test Cases), thực hiện test thủ công/tích hợp, log lỗi và theo dõi tiến độ fix bug của Dev. | Bảng Test Cases, Verification Reports, Bug Logs trên hệ thống |

---

## 2. Chi Tiết Các Giai Đoạn (Phases) & Deadline

### Phase 1: Khởi tạo, Phân tích & Thiết kế (27/08 - 05/09/2026) - ✅ ĐÃ HOÀN THÀNH
- **Trang (BA):** Hoàn thiện phân tích các US (đặc biệt làm kỹ US-04 của Trang), viết mô tả chi tiết cách AI vận hành để chuyển giao cho Dev.
- **Nhàn (UX/UI):** Lên thiết kế Wireframe cơ bản cho các màn hình cốt lõi (Menu, Table Map, KDS, Order). Chốt màu sắc, font chữ.
- **Nhã (Code):** Khởi tạo Github repository, setup bộ khung React + Vite (Frontend), FastAPI + uv (Backend), viết `docker-compose.yml` cho PostgreSQL. Đẩy code mẫu lên nhánh `main`.
- **Ny (Test):** Đọc các tài liệu US của BA để hiểu nghiệp vụ, bắt đầu lên Test Plan và nháp các Test Cases (Happy Cases trước).
- **Deadline Phase 1:** 05/09/2026 (Hoàn thiện xong tài liệu, thiết kế khung, code base chạy được).

### Phase 2: Code, Ghép Giao Diện & Kiểm Thử Thành Phần (06/09 - 20/09/2026) - ✅ ĐÃ HOÀN THÀNH
- **Nhã (Code):** Bắt đầu code các API CRUD cốt lõi, dựng giao diện Frontend theo thiết kế của Nhàn. Ghép nối API và UI, xử lý WebSocket real-time. (Hỗ trợ code các tính năng khó cho các US của thành viên khác).
- **Nhàn (UX/UI):** Cập nhật thiết kế chi tiết (UI High-fidelity), thiết kế thêm các trạng thái lỗi, loading, thông báo (popup, toast) phục vụ cho tính năng AI Batching/Upsell.
- **Trang (BA):** Theo sát Nhã và Nhàn để đảm bảo code và thiết kế không bị lệch hướng so với Yêu cầu Nghiệp vụ (BR, AC).
- **Ny (Test):** Kiểm thử (Unit/API Test) cho từng component mà Dev vừa code xong, đưa ra feedback sớm để sửa lỗi nhanh gọn.
- **Deadline Phase 2:** 20/09/2026 (Có sản phẩm chạy được cơ bản 70-80% luồng chính).

### Phase 3: Hoàn Thiện, E2E Test & Chuẩn Bị Báo Cáo (21/09 - 02/10/2026) - ⏳ ĐANG THỰC HIỆN
- **Nhã (Code):** Xử lý fix bug từ Ny trả về, tối ưu hiệu năng (optimize code), đảm bảo AI engine tích hợp đúng luồng và chạy mượt.
- **Ny (Test):** Chạy kiểm thử toàn diện từ đầu tới cuối (End-to-End Test). Đóng vai các user khác nhau để test chéo luồng. Xuất báo cáo Verification Report.
- **Nhàn (UX/UI):** Review ứng dụng thực tế sau khi code xong (UX Audit), chỉnh sửa CSS hoặc UI asset nếu hiển thị trên web/tablet chưa đẹp.
- **Trang (BA):** Gom tài liệu, làm Slide báo cáo. Hướng dẫn lại các thành viên kịch bản nói cho từng US cá nhân (chắc chắn mỗi người tự hiểu và nói tốt US của mình trước thầy cô).
- **Deadline Phase 3 (Dự án hoàn tất):** 02/10/2026 (Sẵn sàng nộp bài và Defend).
