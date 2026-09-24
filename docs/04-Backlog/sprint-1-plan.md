# Sprint 1 & Day 1 Kick-off Plan
> Ngày bắt đầu: 24/09/2026

Tài liệu này tổng hợp các hạng mục công việc cần làm trong ngày đầu tiên (Day 1) và hướng dẫn phối hợp code (tránh conflict) khi team chia nhau làm các User Stories (US).

## 1. Công việc ngày đầu tiên (Day 1)

Ngày đầu tiên tập trung vào việc **thiết lập nền tảng** và làm các tính năng cốt lõi (Core Features).

### A. Khởi tạo Base Project (Công việc chung)
- **Frontend:** Khởi tạo project React + TypeScript + Vite. Setup các thư mục chuẩn, cài đặt routing cơ bản.
- **Backend:** Khởi tạo project Python FastAPI (dùng `uv`), tạo các thư mục API, Model, Service.
- **Database:** Viết file `docker-compose.yml` để chạy PostgreSQL 18.
- **Git/Github:** Đẩy source code khung (base) này lên Github (nhánh `main`) để mọi người cùng clone về.

### B. Thống nhất Database Schema (Cả team)
- Thống nhất cấu trúc các bảng cốt lõi: 
  - `MenuItems` (Món ăn)
  - `Orders`, `OrderItems` (Đơn hàng và chi tiết đơn)
  - `Tables` (Bàn ăn)
*(Lưu ý: Nếu schema không thống nhất ngay từ đầu, phần API và UI sau này sẽ phải sửa rất nhiều).*

### C. Phân chia User Story (Bắt đầu code Sprint 1)
Nên bắt đầu với các US là xương sống của dự án:
- **Người 1:** Làm **US-01 (E-Menu & Giỏ hàng)**. Đây là tính năng khách hàng nhìn thấy đầu tiên (UI danh sách món ăn, giỏ hàng local).
- **Người 2:** Làm **US-07 (CMS Quản lý Menu)** hoặc viết API CRUD cho Menu. (US-01 cần API này để lấy danh sách món hiển thị).
- **Người 3 (nếu có):** Setup cấu trúc UI cho **US-03 (Màn hình KDS cho Bếp)** và thiết lập cơ chế WebSocket (dự án yêu cầu realtime).

---

## 2. Chiến lược Quản lý Source Code & Xử lý Conflict

Để tránh việc nhiều người cùng sửa một file dẫn đến "Merge Conflict" khó gỡ, team cần tuân thủ các quy tắc sau:

### A. Cấu trúc thư mục (Architecture)
- **Chia theo Feature/Module:** Tránh gom tất cả API vào 1 file `api.js`. Hãy tạo thư mục riêng cho từng US.
  - Ví dụ: `src/features/menu/` (cho US-01), `src/features/kds/` (cho US-03).

### B. Quy trình làm việc với Git (Git Flow)
1. **Tuyệt đối không code trực tiếp trên nhánh `main`.**
2. **Tạo nhánh riêng cho từng US:** 
   - Lệnh: `git checkout -b feature/US-01-emenu`
3. **Commit nhỏ và thường xuyên:** Xong phần nào commit phần đó (ví dụ: xong UI list món ăn là commit).
4. **Pull code mỗi ngày:** Đầu giờ làm việc, chạy `git pull origin main` trên nhánh của mình để lấy code mới nhất.

### C. Cách xử lý khi bị Merge Conflict
1. Nếu bạn push code hoặc tạo Pull Request mà Git báo **"Merge Conflict"**, đừng hoảng sợ.
2. Mở VS Code, tìm đến file bị báo lỗi. VS Code sẽ bôi màu hiển thị 2 đoạn code: code của bạn (Current Change) và code mới trên main (Incoming Change).
3. Đọc hiểu và bấm chọn `Accept Current Change`, `Accept Incoming Change`, hoặc `Accept Both`.
4. **Giao tiếp:** Nếu không chắc chắn, hãy nhắn ngay cho người đã viết đoạn code kia để thống nhất giữ lại phần nào.
