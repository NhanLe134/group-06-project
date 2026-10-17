# Phân chia Task & Kế hoạch (US-08 & Manager Dashboard)

## 1. Phần của Nhã (US-08)
- **Giao diện phụ trách:** Tab `Phiếu Kiểm kê` (Đổi tên thành **Báo cáo Hao hụt / Đối soát Tiêu hao**).
- **Kế hoạch triển khai (US-08):**
  - Không làm kiểm đếm kho tĩnh nhàm chán. Chuyển sang làm **Đối soát nguyên liệu cuối ngày**.
  - **Logic:** `[Lấy ra đầu ngày] - [Cân lại cuối ngày] = [Tiêu hao Thực tế]`.
  - **Độ thông minh:** Lấy *Tiêu hao Thực tế* đem so sánh với *Tiêu hao Lý thuyết* (từ số lượng món POS đã bán). Nếu độ chênh lệch (Hao hụt) vượt mức 5%, tự động bắn cảnh báo ĐỎ lên hệ thống để Quản lý biết khâu nào đang làm rơi vãi hoặc lãng phí.

## 2. Phần của Bạn (Tu)
- **Giao diện phụ trách:** Tab `Tổng quan (Dashboard)` và Tab `Thực phẩm`.
- **Kế hoạch triển khai:**
  - **Tab Thực phẩm:** Làm chuẩn CRUD (Thêm/Sửa/Xóa) danh sách nguyên vật liệu cơ bản của nhà hàng (Tên, Đơn vị tính, Hình ảnh, Cảnh báo sắp hết hàng).
  - **Tab Dashboard:** Cần nâng cấp thêm các tính năng "AI" hoặc "Real-time" để giao diện nhìn xịn sò và đúng chất môn hệ thống thông tin. (Chi tiết xem gợi ý bổ sung).

## 3. Note ghép API cho màn hình Waiter (Tu - 06/10)
- **Quy tắc 1 (Trạng thái bàn):** Giữ nguyên trạng thái `dang_don_dep` giống Backend để UI báo rõ bàn nào đang có người dọn, tránh việc Lễ tân xếp khách vào nhầm. Bàn chỉ trở thành `trong` sau khi ấn nút Dọn xong.
- **Quy tắc 2 (Mapping Trạng thái món):** Dữ liệu ngầm lấy đúng mã của Backend (`cho_nau`, `dang_nau`, `da_xong`, `da_phuc_vu`). Khi hiển thị lên giao diện cho Waiter thì code FE tự map lại thành text chuyên nghiệp hơn (VD: `da_xong` -> "Sẵn sàng phục vụ/Cần bưng ngay", `dang_nau` -> "Bếp đang chuẩn bị").
- **Quy tắc 3 (Tên biến FE & BE):** Biến logic trong JS (`waiter.js`) cứ lấy theo đúng field trả về từ API Backend (`tenmon`, `giaban`, `sokhach`...) để xử lý cho mượt. Còn text tĩnh trên HTML hiện cho người dùng xem thì cứ giữ thiết kế xịn như hiện tại.

## 4. Nhật ký điều tra: Web load dữ liệu chậm (Local & Deploy) — Sẽ sửa sau (15/10)

### Bảng số liệu đo đạc thực tế:
| Endpoint | Local (`127.0.0.1`) | Local (`localhost`) | Deploy (Render Free) |
|---|---|---|---|
| `/health` | **0.003s** | **2.06s** (chờ timeout IPv6) | **0.9s** (thức) / **>15s** (ngủ) |
| `/health/db` (1 query test) | **0.58s - 0.83s** | **2.6s - 2.8s** | **1.2s - 2.0s** |
| `/menu` (payload 2.65 MB) | **1.7s - 2.5s** | **3.7s - 4.5s** | **3.7s - 12.5s** |
| `/waiter/tables` (N+1 queries) | **3.27s** | **5.3s** | **4.0s - 7.0s** |

### Các nguyên nhân cốt lõi phát hiện:
1. **Payload Menu quá nặng (2.65 MB JSON / 19 món):**
   - Cột `thucdon.anhminhhoa` đang lưu trực tiếp chuỗi Base64 dài cả triệu ký tự vào database Supabase.
   - Điển hình: Món Mì Ý (`MON025`) có ảnh base64 dài tới **1.24 MB**, món Cơm chiên hải sản **256 KB**, Bò xào cần **247 KB**, Coca **241 KB**.
   - Supabase ở Hàn Quốc phải truyền 2.65 MB qua mạng về Backend, Backend chuyển tiếp 2.65 MB về Client làm đơ mạng.
2. **Độ trễ mạng Database (Supabase Seoul `ap-northeast-2`):**
   - Kết nối TCP từ Việt Nam tới `aws-0-ap-northeast-2.pooler.supabase.com` tốn ~137ms/lần.
   - Mỗi câu truy vấn round-trip kèm TLS tốn 150ms - 250ms.
3. **N+1 Query ở Backend (`/waiter/tables` mất 3.27s):**
   - Hàm `get_all_tables` trong `backend/app/services/waiter.py` lặp qua từng bàn đang có khách và bắn tuần tự 2 câu query riêng biệt (`select PhieuBan` rồi `select ChiTietPhieu, ThucDon`).
   - Với 3 bàn có khách, backend phải bắn 7 câu query tuần tự qua Hàn Quốc (~1.5s - 3s delay).
4. **Local Windows: Dính TCP SYN Timeout 2 giây với `localhost`:**
   - Frontend `config.js` trỏ về `http://localhost:8000`.
   - Windows ưu tiên thử IPv6 `[::1]:8000` trước, nhưng Uvicorn chỉ listen IPv4 `127.0.0.1:8000` $\rightarrow$ Windows chờ hết timeout 2 giây mới fallback sang IPv4, làm mọi request local bị trễ thêm 2s.
5. **Deploy: Render Free Tier ngủ đông (Cold Start):**
   - Sau 15 phút không dùng, server tắt $\rightarrow$ mở lại lần đầu mất 12 - 50 giây để khởi động.
   - Quãng đường dữ liệu chạy vòng quanh thế giới: Client (VN) $\leftrightarrow$ Render (US) $\leftrightarrow$ Supabase (Hàn Quốc).
6. **Màn hình Quản lý (`manager.js`):**
   - Khi load trang gọi dồn dập 3 API cùng lúc (`GET /api/menu`, `GET /inventory/ingredients`, `GET /inventory/shifts`) gây nghẽn pool kết nối.

### Kế hoạch xử lý (TODO khi bắt tay sửa):
- [ ] **FE `config.js`:** Đổi `http://localhost:8000` thành `http://127.0.0.1:8000` (hoặc chạy uvicorn với `--host 0.0.0.0`) để xóa ngay 2 giây trễ trên Local.
- [ ] **Database / Menu:** Chuyển toàn bộ ảnh Base64 trong bảng `thucdon` sang lưu URL ảnh (up lên Supabase Storage bucket / Imgur / Cloudinary) $\rightarrow$ giảm payload từ 2.65 MB xuống còn < 15 KB (tăng tốc độ gấp 20-50 lần).
- [ ] **BE `waiter.py`:** Viết lại query `get_all_tables` dùng `JOIN` gộp trong 1-2 query thay vì vòng lặp N+1 query.
- [ ] **Deploy:** Cài đặt bot ping tự động (UptimeRobot / cronjob) vào endpoint `/health` mỗi 10 phút để Render không bị tắt ngủ đông.

