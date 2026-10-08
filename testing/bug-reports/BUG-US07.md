# BUG-US07 — CMS Quản lý Thực đơn

> **Phụ trách:** Ny (Dev & QA) | **User Story:** US-07 | **Liên kết:** [`test-cases-US07.md`](../test_cases/test-cases-US07.md)

---

# BUG-US07-001 — Cập nhật món hiển thị toast lỗi dù API thành công

| Mục | Nội dung |
|---|---|
| Story | US-07 — Sửa giá, trạng thái và thông tin món |
| Mức độ | **P1 — Critical** — gây hiểu nhầm nghiêm trọng: Manager nghĩ lưu thất bại nhưng thực tế đã lưu |
| Phát hiện | 2026-10-08, kiểm thử thủ công TC-MA-CMS-012, TC-MA-CMS-013 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY01, fix bổ sung A-NY19) |
| Trạng thái | Closed (Passed) |

## Summary
Khi Manager bấm "Lưu thay đổi" để sửa giá hoặc trạng thái món, giao diện hiện toast "Không thể cập nhật món" dù `PUT /api/menu/{id}` đã thành công và badge trong bảng đã cập nhật đúng.

## Environment
Chrome 128 / `manager.html` / CMS Tab Thực đơn / `https://smart-orderding.vercel.app`.

## Reproduction Steps
1. Mở tab Thực đơn (CMS), click Sửa một món bất kỳ.
2. Đổi Trạng thái từ "Đang bán" → "Tạm ẩn".
3. Bấm "Lưu thay đổi".
4. Quan sát toast "Không thể cập nhật món" xuất hiện dù badge trong bảng đã đổi sang "Tạm ẩn".

## Expected vs Actual
- Expected: Toast "Đang cập nhật món" hiện ngay khi bấm Lưu; toast "Cập nhật thành công" hiện sau khi API xác nhận; badge cập nhật tức thì.
- Actual: Toast "Không thể cập nhật món" xuất hiện dù `PUT /api/menu/{id}` trả `200 OK` và dữ liệu đã lưu thành công.

## Root Cause Analysis
Trong `submitEditMenu()`, gọi `stockApi('PUT', .../recipe, ...)` nằm trong cùng `try` block với `menuRequest('PUT', ...)`. Khi recipe API lỗi (404 hoặc timeout vì section recipe không có dữ liệu), lỗi bị `catch` bên ngoài bắt và hiện toast lỗi, dù `PUT /api/menu/{id}` đã thành công.

## Solution
Tách `stockApi` recipe update ra `.catch()` riêng — lỗi recipe chỉ hiện warning toast nhỏ, không block toast thành công của thao tác chính.

## Regression Risk
Cao — ảnh hưởng toàn bộ luồng sửa món; cần kiểm tra cả trường hợp có và không có recipe.

## Test Plan
- Manual: sửa trạng thái món → kiểm tra toast "Cập nhật thành công" và badge đổi màu đúng.
- Manual: sửa giá món → kiểm tra giá cập nhật trong bảng.
- Manual: sửa món không có recipe → không hiện toast lỗi.
- TC liên quan: TC-MA-CMS-012, TC-MA-CMS-013.

---

# BUG-US07-002 — Chrome gợi ý lưu mật khẩu khi thêm món mới

| Mục | Nội dung |
|---|---|
| Story | US-07 — Form thêm món mới |
| Mức độ | **P3 — Low** — ảnh hưởng trải nghiệm giao diện, không ảnh hưởng chức năng |
| Phát hiện | 2026-10-07, kiểm thử thủ công TC-MA-CMS-006 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY01) |
| Trạng thái | Closed (Passed) |

## Summary
Khi Manager mở form "Thêm Món Mới", Chrome nhận diện các trường input là form đăng nhập và hiện popup gợi ý lưu mật khẩu.

## Environment
Chrome 128 / `manager.html` / Modal "Thêm Món Mới vào Thực Đơn".

## Reproduction Steps
1. Mở tab Thực đơn (CMS) → bấm "+ Thêm món mới".
2. Nhập Tên món và Giá bán.
3. Chrome hiện popup "Lưu mật khẩu?" ở góc màn hình.

## Expected vs Actual
- Expected: Chrome không hiện popup lưu mật khẩu trong luồng thêm món; trường PIN Quản lý được nhận diện là mã dùng một lần.
- Actual: Chrome nhận diện sai form là form đăng nhập và gợi ý lưu thông tin vào password manager.

## Root Cause Analysis
Nút submit trong form không có `type="button"` (mặc định là `type="submit"`), kết hợp cấu trúc input gần nhau khiến Chrome hiểu nhầm là form login.

## Solution
Thêm `type="button"` cho tất cả nút Lưu trong form thêm/sửa món; đánh dấu trường PIN quản lý là `autocomplete="one-time-code"`.

## Regression Risk
Thấp — chỉ ảnh hưởng trải nghiệm giao diện.

## Test Plan
- Manual: mở form thêm món trên Chrome → không thấy popup lưu mật khẩu.
- Manual: nhập và lưu món → chức năng hoạt động bình thường.
- TC liên quan: TC-MA-CMS-006.

---

# BUG-US07-003 — Món mới tự nhận ảnh minh họa mặc định dù không chọn ảnh

| Mục | Nội dung |
|---|---|
| Story | US-07 — Thêm món mới vào thực đơn |
| Mức độ | **P2 — Medium** — ảnh hưởng tính chính xác dữ liệu |
| Phát hiện | 2026-10-07, kiểm thử thủ công TC-MA-CMS-006 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY02) |
| Trạng thái | Closed (Passed) |

## Summary
Khi Manager thêm món mới mà không chọn ảnh, hệ thống tự gán URL ảnh Unsplash mặc định thay vì lưu `image_url = null`.

## Environment
Chrome / `manager.html` / Modal "Thêm Món Mới vào Thực Đơn".

## Reproduction Steps
1. Mở form thêm món.
2. Điền đầy đủ các trường bắt buộc nhưng **không chọn ảnh**.
3. Bấm "Lưu".
4. Quan sát cột Hình ảnh trong bảng — hiện ảnh Unsplash dù không chọn.

## Expected vs Actual
- Expected: Không chọn ảnh → `image_url: null` → CMS hiển thị placeholder "Chưa có ảnh minh họa".
- Actual: `image_url` được gán URL Unsplash mặc định trong `submitAddMenu()`; ảnh ngẫu nhiên xuất hiện dù Manager chưa chọn.

## Root Cause Analysis
Logic trong `submitAddMenu()` luôn gán URL Unsplash fallback khi `previewEl.src` rỗng; không phân biệt "chưa chọn ảnh" và "ảnh bị lỗi load".

## Solution
Chỉ lưu `image_url` khi `previewEl.style.display !== 'none'` (người dùng đã chọn và preview ảnh); ngược lại gửi `image_url: null`.

## Regression Risk
Thấp — ảnh hưởng tính chính xác dữ liệu, không ảnh hưởng luồng đặt món.

## Test Plan
- Manual: thêm món không chọn ảnh → kiểm tra cột hình ảnh hiện placeholder.
- Manual: thêm món có chọn ảnh → kiểm tra ảnh hiển thị đúng.
- TC liên quan: TC-MA-CMS-006.

---

# BUG-US07-004 — Trường số lượng tồn kho bị ẩn ở một số danh mục món

| Mục | Nội dung |
|---|---|
| Story | US-07 — Thêm và sửa thông tin món |
| Mức độ | **P2 — High** — ảnh hưởng khả năng quản lý tồn kho cho món tráng miệng và khai vị |
| Phát hiện | 2026-10-07, kiểm thử thủ công TC-MA-CMS-009, 010, 015 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY09) |
| Trạng thái | Closed (Passed) |

## Summary
Trường "Số lượng tồn" trong form thêm/sửa món bị ẩn đối với danh mục Tráng miệng, Khai vị, Món chính; chỉ hiển thị cho Đồ uống.

## Environment
Chrome / `manager.html` / Modal "Thêm Món Mới" và "Sửa Thông Tin Món Ăn".

## Reproduction Steps
1. Mở form thêm món.
2. Chọn Danh mục = "Tráng miệng".
3. Quan sát: trường "Số lượng tồn" bị ẩn.

## Expected vs Actual
- Expected: Trường Số lượng tồn hiển thị và cho nhập ở mọi danh mục; là trường tùy chọn, không bắt buộc.
- Actual: Trường chỉ hiển thị cho danh mục "Đồ uống"; các danh mục khác bị ẩn.

## Root Cause Analysis
Logic `applyEditStockMode()` ẩn `#menu-stock-group` khi mode là `che_bien` (chế biến); không cho phép nhập tồn kho tùy chọn cho các danh mục không phải đồ uống.

## Solution
Luôn hiển thị trường tồn kho ở mọi danh mục; đặt `hidden = false` cho `#menu-stock-group` và `#edit-stock-group`; gửi `stock: null` khi để trống thay vì ẩn trường.

## Regression Risk
Trung bình — ảnh hưởng form thêm/sửa món ở mọi danh mục.

## Test Plan
- Manual: thêm món Tráng miệng → kiểm tra trường tồn kho hiển thị.
- Manual: nhập tồn = 10 → lưu → kiểm tra cột Số lượng tồn trong bảng hiện "10".
- Manual: không nhập tồn → lưu → kiểm tra hiện "—".
- TC liên quan: TC-MA-CMS-009, TC-MA-CMS-010, TC-MA-CMS-015.

---

# BUG-US07-005 — Playwright timeout khi tìm toast thành công sau sửa giá/trạng thái

| Mục | Nội dung |
|---|---|
| Story | US-07 — Automated test bộ CMS |
| Mức độ | **P2 — High** — ảnh hưởng bộ test tự động US-07 |
| Phát hiện | 2026-10-08, chạy `us07-create_cms.spec.ts` — AI_USAGE_LOG A-NY19 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY19) |
| Trạng thái | Closed (Passed) |

## Summary
TC-MA-CMS-012 và TC-MA-CMS-013 trong bộ test Playwright timeout khi chờ toast thành công sau khi bấm "Lưu thay đổi".

## Environment
Playwright / Chromium / `us07-create_cms.spec.ts` / CI hoặc local.

## Reproduction Steps
1. Chạy `npx playwright test tests/us07-create_cms.spec.ts`.
2. Quan sát TC-MA-CMS-012 (Sửa giá) và TC-MA-CMS-013 (Sửa trạng thái) fail.
3. Log: `expect(locator).toBeVisible() → Timeout 5000ms exceeded`.

## Expected vs Actual
- Expected: Toast `.toast--success` xuất hiện trong 8 giây sau khi bấm Lưu thay đổi; test pass.
- Actual: Toast không tìm thấy vì selector sai và BUG-US07-001 khiến toast lỗi xuất hiện thay toast thành công.

## Root Cause Analysis
Kết hợp 2 vấn đề:
1. Selector trong test dùng `.toast-success` nhưng class thực tế trong `manager.js` là `.toast--success`.
2. BUG-US07-001 làm recipe API lỗi → `catch` block hiện toast "Không thể cập nhật món" trước khi test tìm thấy toast thành công.

## Solution
1. Sửa selector trong `CmsPage.ts` và `assertions.ts`: dùng `.toast--success`, `.toast--danger`.
2. Sửa BUG-US07-001 để recipe lỗi không block toast thành công.
3. Tăng timeout trong `expectToastSuccess()` lên 10s cho network call thật trên Vercel.

## Regression Risk
Cao — ảnh hưởng bộ test tự động; cần chạy lại toàn suite sau khi sửa.

## Test Plan
- Automated: chạy lại toàn bộ `us07-create_cms.spec.ts` → TC-012 và TC-013 pass.
- Automated: kiểm tra không có timeout trong nhiều lần chạy liên tiếp.
- TC liên quan: TC-MA-CMS-012, TC-MA-CMS-013.
