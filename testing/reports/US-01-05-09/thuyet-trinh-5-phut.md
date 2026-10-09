# Kịch bản thuyết trình 5 phút — US-01 · US-05 · US-09 (Nhàn)

> Theo giáo trình: 60s chức năng phụ trách → 120s chạy live flow → 90s mở story/PR/test → 60s một lỗi/quyết định khó → 30s bài học.
> Chuỗi bắt buộc giải thích được: **requirement nào → story nào → task/code nào → test nào chứng minh → release ở đâu.**

## 0. Chuẩn bị trước khi nói (10 phút)
- Mở sẵn 3 tab: E-Menu (`customer.html?table=Bàn 06`), Thu ngân (`cashier.html`), GitHub PR + `test_sepay.py`
- Mở sẵn `testing/reports/US-01-05-09/README.md` (bảng kết quả 3 tầng)
- Bật backend local (`uv run uvicorn app.main:app --port 8000`) — dự phòng nếu Render ngủ

## 1. (60s) Chức năng phụ trách
"Mình phụ trách 3 story của Epic Guest Ordering: **US-01** khách gọi món qua E-Menu với giỏ nháp (REQ-01/02, BR-01/03/06), **US-05** thu ngân thanh toán QR qua SePay tự động gạch nợ (REQ-04, ADR-N15/16), **US-09** khách xem hóa đơn tạm tính theo đợt gọi (ADR-N13/14). Ba story nối thành 1 vòng đời: khách gọi → bếp nấu → khách xem tiền → quét QR → hệ thống tự chốt."

## 2. (120s) Chạy live flow
1. Quét QR bàn (hoặc mở link `?table=Bàn 06`) → E-Menu hiện món nhóm theo phân loại
2. Thêm "Phở bò" ×2 → giỏ nháp hiện tổng tiền → **nhấn mạnh: chưa gửi gì xuống bếp (BR-01)**
3. Xác nhận gửi → popup "Mã đơn: PB-xxx" → sang KDS thấy thẻ mới
4. Màn Thu ngân: chọn Bàn 06 → tạo mã QR → **chỉ chuột nội dung CK `Ban 06 - HD-...`**: "hóa đơn nháp sinh tại bước này — khách/ngân hàng nhìn là biết bill nào; webhook khớp chính xác qua hoadon_id"
5. Chạy `POST /sepay/demo-sim/{ban_id}` (hoặc chuyển khoản thật) → **Toast tự nổ "Thanh toán SePay thành công!"** → bàn tự về "chờ dọn" → mở lại hóa đơn khách: món gắn `hoadon_id`, khách sau vào gọi là hóa đơn mới (ADR-N14)

## 3. (90s) Story / PR / Test
- PR `develop` (commit `dcaaa3d`): backend `routers/sepay.py` + `services/orders.py`, FE `cashier.js`
- **Test chứng minh 3 tầng** (pyramid §11.2): Integration `test_sepay.py` (webhook khớp hoadon_id, guard 409, 401 sai key); Unit Vitest `cashier-logic.test.js` (gộp món, nhóm đợt); E2E `us05-cashier.spec.ts` (tạo QR → demo-sim → Toast realtime)
- Chỉ `testing/reports/US-01-05-09/README.md`: **pytest 119/119 · Vitest 17/17 · Playwright 13/13** (kể cả smoke trên Vercel+Render thật)

## 4. (60s) Một lỗi khó — kể BUG-US01-001
"Khi viết E2E mình phát hiện: bấm gửi bếp, đơn tạo thành công trong DB (POST 200) nhưng **popup thành công không bao giờ hiện** — 119 integration test đều pass. Root cause: biến `res` khai báo trong khối `try` nhưng dùng ở ngoài → ReferenceError sau POST. Fix 1 dòng + regression test. Bài rút: bug nằm ở *phản hồi UI sau transaction*, chỉ test logic thuần không thấy — phải E2E chạy cả trang."
(Có thể nhắc thêm BUG-US05-001 — bảo mật demo-sim nếu còn thời gian.)

## 5. (30s) Bài học & cải tiến
- "Test đi cùng task, không để test sau — bug trên nếu để sau sẽ sập ngay lúc demo"
- "Đặc tả phải đuổi kịp code: mỗi ADR chốt là cập nhật lại US + test case (mình đã sync US-01/05/09 ngày 09/10)"
- Nếu làm lại: viết E2E trước cho critical flow (pay-qr), viết guard ở backend ngay từ đầu thay vì chỉ FE
