# TEST CASES CHI TIẾT — US-07: CMS QUẢN LÝ THỰC ĐƠN (MENU CMS)

> **Tài liệu kiểm soát:** `testing/test_cases/test-cases-US07.md`
> **User Story:** US-07 — Quản lý Menu CMS (CRUD món ăn, sửa giá, cập nhật trạng thái, phân quyền RBAC)
> **Người thực hiện (Who checked):** Ny
> **Giai đoạn dự án:** Testing Phase
> **Lần chạy:** 2026-10-08; toàn bộ test case `Passed`.
> **Màn hình kiểm thử:** [https://smart-orderding.vercel.app/pages/manager.html](https://smart-orderding.vercel.app/pages/manager.html) → Tab **Thực đơn (CMS)**
> **Lưu ý chạy tự động:** Playwright mở trực tiếp trang manager trên Vercel. API `/api/menu` được mock bằng dữ liệu cố định trong từng test để tránh tạo/sửa/xóa dữ liệu trên môi trường dùng chung. Đặt `BASE_URL` để chạy trên môi trường khác.
> **Lưu ý chạy thủ công:** Dùng tài khoản Manager được cấp và dữ liệu hiện có trên môi trường; kiểm tra trực quan giao diện, thông báo, dữ liệu sau thao tác. Không dùng dữ liệu thử trên môi trường chung nếu chưa được phép.
> **Yêu cầu liên quan:** `REQ-11`, `NFR-RO-03`, `BR-04`
> **Cấu hình bảng:** cùng mẫu 15 cột với `testing/test-cases.md` và `test-cases-US03.md`. Tầng test (Unit / Integration / E2E) ghi ở **Comment**; cột **Testing Result** dùng `Passed` · `Failed` · `Blocked` · `Un-tested`.

---

## Liên kết với `testing/test-strategy.md`

| Mã chiến lược | Nội dung | Test case ở file này |
|---|---|---|
| `IT-01` | REST API contract cho thao tác CMS Menu | TC-MA-CMS-006, TC-MA-CMS-012, TC-MA-CMS-016 |
| `IT-04` | RBAC: Waiter không được sửa Menu CMS, API trả HTTP 403 | TC-MA-CMS-018 |

## Môi trường & cách chạy

| Tầng | Công cụ | Môi trường dữ liệu |
|---|---|---|
| Automated/E2E | Playwright (`testing/test_scripts/`) | Trang Manager trên Vercel; API `/api/menu` được mock bằng fixture trong test |
| Manual | Trình duyệt và tài khoản Manager được cấp | Dữ liệu trên môi trường đang kiểm tra; dùng món kiểm thử được phép cho thao tác tạo/sửa/xóa |
| RBAC/API | Postman hoặc công cụ HTTP tương đương | Token Waiter/Guest hợp lệ và ID món hiện có; không dùng token giả |

Chạy Playwright từ `testing/test_scripts/`; đặt `BASE_URL` nếu cần đổi môi trường. Với kiểm thử thủ công, mở trang Manager, chọn tab **Thực đơn (CMS)** và không thay đổi dữ liệu dùng chung nếu chưa được cho phép.

## BẢNG TEST CASES — US-07

| TC-ID | Description (Test Scenario) | User Story / Trace | Pre-condition | Test step | Step condition to perform | Data | Priority | Mode | Expected result | Testing Result | Date | Who checked | BUG ID | Comment |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **TC-MA-CMS-001** | Hiển thị danh sách món ăn đúng cấu trúc bảng | `US-07`<br>`REQ-11` | Mở được trang manager; có ít nhất 1 món. | 1. Mở `https://smart-orderding.vercel.app/pages/manager.html`.<br>2. Chọn tab **Thực đơn (CMS)** trên sidebar. | 2.1 Trang tải xong, bảng danh sách và dữ liệu hiển thị. | URL: `/pages/manager.html` | High | Automated + Manual | Bảng hiển thị 8 cột: STT, Hình ảnh, Tên món ăn, Danh mục, Giá bán, Trạng thái, Số lượng tồn, Thao tác. Đối chiếu dữ liệu hiển thị với danh sách thực tế; badge xanh = Đang bán, đỏ = Tạm ẩn. | `Passed` | 2026-10-08 | Ny | - | Auto dùng fixture mock; manual đối chiếu dữ liệu thật và giao diện. |
| **TC-MA-CMS-002** | Tìm kiếm món ăn theo tên | `US-07`<br>`REQ-11` | Đang ở tab Thực đơn (CMS). Có món "Coca" trong DB. | 1. Click vào ô tìm kiếm phía trên bảng.<br>2. Nhập tên món cần tìm.<br>3. Quan sát bảng lọc kết quả. | 2.1 Nhập đúng tên hoặc một phần tên món. | `Search`: "Coca" | Medium | Automated + Manual | Bảng chỉ hiển thị các món có tên chứa "Coca". Các món khác bị ẩn. Xóa nội dung tìm kiếm → bảng trở lại hiển thị toàn bộ món. | `Passed` | 2026-10-08 | Ny | - | Kiểm tra chức năng search realtime. |
| **TC-MA-CMS-003** | Lọc món theo trạng thái "Tạm ẩn" | `US-07`<br>`REQ-11` | Đang ở tab Thực đơn (CMS). Có ít nhất 1 món trạng thái "Tạm ẩn" (ví dụ: Bún chả Hà Nội). | 1. Click vào icon lọc (▼) cột **Trạng thái**.<br>2. Chọn **Tạm ẩn** trong dropdown. | 2.1 Chọn option "Tạm ẩn" từ filter menu. | `Filter`: Trạng thái = "Tạm ẩn" | Medium | Automated + Manual | Bảng chỉ hiển thị các món có badge "Tạm ẩn". Món "Đang bán" bị ẩn khỏi danh sách. Chọn "Tất cả" → bảng trả lại toàn bộ. | `Passed` | 2026-10-08 | Ny | - | Kiểm tra filter trạng thái. |
| **TC-MA-CMS-004** | Lọc món theo số lượng tồn "Sắp hết (< 20)" | `US-07`<br>`REQ-11` | Có ít nhất 1 món có tồn kho từ 1–19 (ví dụ: Trà đá = 2). | 1. Click icon lọc (▼) cột **Số lượng tồn**.<br>2. Chọn **Sắp hết (< 20)**. | 2.1 Chọn option "Sắp hết (<20)". | `Filter`: Stock = "low" (1–19) | Medium | Automated + Manual | Chỉ hiển thị các món có tồn kho từ 1 đến 19. Món không có tồn kho (—) và món > 20 bị ẩn. | `Passed` | 2026-10-08 | Ny | - | Kiểm tra filter tồn kho sắp hết. |
| **TC-MA-CMS-005** | Xem chi tiết món ăn (modal xem) | `US-07`<br>`REQ-11` | Đang ở tab Thực đơn (CMS). Có món "Coca" trong danh sách. | 1. Tìm dòng món "Coca" trong bảng.<br>2. Click icon **👁 Xem chi tiết** (icon mắt) ở cột Thao tác. | 2.1 Click nút xem chi tiết của món "Coca". | `Item`: "Coca" | Medium | Automated + Manual | Modal "Chi tiết món ăn" mở ra. Hiển thị đầy đủ: Tên món, Danh mục, Số lượng tồn (24), Giá bán (15.000đ), Trạng thái (Đang bán), Hình ảnh, Mô tả, Thành phần, Độ cay, Loại món, Thông tin dị ứng. Tất cả field ở chế độ readonly. | `Passed` | 2026-10-08 | Ny | - | Kiểm tra modal xem chi tiết. |
| **TC-MA-CMS-006** | Thêm món mới hợp lệ (Happy Path) | `US-07`<br>`REQ-11` | Đang ở tab Thực đơn (CMS). | 1. Click nút **+ Thêm món mới** (góc phải trên).<br>2. Modal "Thêm Món Mới vào Thực Đơn" xuất hiện.<br>3. Điền đầy đủ các trường bắt buộc (*).<br>4. Click **Lưu**. | 3.1 Điền tất cả field có dấu (*): Tên, Giá bán, Mô tả, Thành phần, Thông tin dị ứng. | `Tên`: "Sườn sụn rang muối"<br>`Danh mục`: "Món chính"<br>`Giá`: 85000<br>`Mô tả`: "Sườn sụn giòn..."<br>`Thành phần`: "Sườn heo, tỏi, ớt"<br>`Độ cay`: "Cay nhẹ"<br>`Loại`: Mặn<br>`Dị ứng`: "Không có" | High | Automated + Manual | Modal đóng lại. Toast thông báo "Thêm món thành công — Đã thêm món Sườn sụn rang muối vào thực đơn." xuất hiện. Món mới hiển thị ở cuối bảng với đúng thông tin vừa nhập và badge "Đang bán". | `Passed` | 2026-10-08 | Ny | BUG-US07-002<br>BUG-US07-003 | Happy Path thêm món. |
| **TC-MA-CMS-007** | Thêm món mới thiếu trường bắt buộc — bỏ trống Tên | `US-07`<br>`REQ-11`<br>(Negative) | Modal "Thêm Món Mới" đang mở. | 1. Để trống ô **Tên món ăn**.<br>2. Điền đầy đủ các field còn lại.<br>3. Click **Lưu**. | 3.1 Bấm Lưu khi Tên món ăn rỗng. | `Tên`: "" (rỗng)<br>`Giá`: 85000 | High | Automated + Manual | Hệ thống hiển thị toast lỗi "Lỗi nhập liệu — Vui lòng nhập Tên món!". Modal vẫn mở. Không có record mới được tạo trong DB. | `Passed` | 2026-10-08 | Ny | - | Validation bắt buộc trường Tên. |
| **TC-MA-CMS-008** | Thêm món mới thiếu trường bắt buộc — bỏ trống Giá bán | `US-07`<br>`REQ-11`<br>(Negative) | Modal "Thêm Món Mới" đang mở. | 1. Điền Tên món hợp lệ.<br>2. Để trống ô **Giá bán (VNĐ)**.<br>3. Click **Lưu**. | 3.1 Bấm Lưu khi Giá bán rỗng. | `Tên`: "Món test"<br>`Giá`: "" (rỗng) | High | Automated + Manual | Toast lỗi "Lỗi nhập liệu — Vui lòng nhập Giá bán!" xuất hiện. Modal vẫn mở. Không tạo record mới. | `Passed` | 2026-10-08 | Ny | - | Validation bắt buộc trường Giá. |
| **TC-MA-CMS-009** | Thêm món với số lượng tồn tùy chọn | `US-07`<br>`REQ-11` | Modal "Thêm Món Mới" đang mở. | 1. Điền đầy đủ các field bắt buộc.<br>2. Nhập số lượng tồn = 10 vào ô **Số lượng tồn**.<br>3. Click **Lưu**. | 3.1 Nhập số lượng tồn hợp lệ > 0. | `Số lượng tồn`: 10 | Medium | Automated + Manual | Món được tạo thành công. Trong bảng, cột "Số lượng tồn" của món mới hiển thị "10" (có thể chỉnh sửa inline). | `Passed` | 2026-10-08 | Ny | BUG-US07-004 | Tồn kho tùy chọn cho mọi danh mục. |
| **TC-MA-CMS-010** | Thêm món không nhập số lượng tồn (để trống) | `US-07`<br>`REQ-11` | Modal "Thêm Món Mới" đang mở. | 1. Điền đầy đủ các field bắt buộc.<br>2. **Để trống** ô Số lượng tồn.<br>3. Click **Lưu**. | 3.1 Không nhập gì vào ô Số lượng tồn. | `Số lượng tồn`: "" (trống) | Medium | Automated + Manual | Món được tạo thành công. Cột "Số lượng tồn" trong bảng hiển thị "—" (dash) thay vì số. | `Passed` | 2026-10-08 | Ny | BUG-US07-004 | Tồn kho không bắt buộc. |
| **TC-MA-CMS-011** | Hủy bỏ form thêm món (bấm Hủy bỏ) | `US-07`<br>`REQ-11` | Modal "Thêm Món Mới" đang mở, đã nhập một số thông tin. | 1. Nhập tên món "Test hủy bỏ".<br>2. Click nút **Hủy bỏ** (hoặc icon X góc trên phải modal). | 2.1 Bấm nút Hủy bỏ. | `Action`: Cancel | Low | Automated + Manual | Modal đóng lại ngay lập tức. Không có món mới được thêm vào bảng. Dữ liệu đã nhập bị hủy bỏ hoàn toàn. | `Passed` | 2026-10-08 | Ny | - | Kiểm tra nút hủy. |
| **TC-MA-CMS-012** | Sửa giá bán món ăn thành công (TC-MA-002 mở rộng) | `US-07`<br>`REQ-11` | Đang ở tab Thực đơn. Món "Coca" đang có giá 15.000đ và trạng thái "Đang bán". | 1. Click icon **✏ Sửa món** (icon bút chì) trên dòng "Coca".<br>2. Modal "Sửa Thông Tin Món Ăn" mở ra với dữ liệu hiện tại.<br>3. Xóa giá cũ, nhập giá mới = 20000.<br>4. Click **Lưu thay đổi**. | 4.1 Nhập giá mới hợp lệ và bấm Lưu thay đổi. | `Item`: "Coca"<br>`Old Price`: 15000<br>`New Price`: 20000 | High | Automated + Manual | Modal đóng. Toast "Cập nhật thành công — Đã lưu thay đổi cho món Coca." xuất hiện. Bảng cập nhật giá "Coca" thành **20.000đ** ngay lập tức (không cần reload). | `Passed` | 2026-10-08 | Ny | BUG-US07-001<br>BUG-US07-005 | Sửa giá là luồng chính REQ-11. |
| **TC-MA-CMS-013** | Sửa trạng thái món từ "Đang bán" → "Tạm ẩn" | `US-07`<br>`REQ-11` | Món "Coca" đang có trạng thái "Đang bán". | 1. Click icon **✏ Sửa** dòng "Coca".<br>2. Ở dropdown **Trạng thái**, chọn **Tạm ẩn**.<br>3. Click **Lưu thay đổi**. | 3.1 Đổi trạng thái sang Tạm ẩn và lưu. | `Item`: "Coca"<br>`Old Status`: "Đang bán"<br>`New Status`: "Tạm ẩn" | High | Automated + Manual | Toast thành công. Badge trạng thái "Coca" trong bảng đổi sang badge đỏ **Tạm ẩn**. Món này sẽ không hiển thị trên E-Menu của khách. | `Passed` | 2026-10-08 | Ny | BUG-US07-001<br>BUG-US07-005 | Kiểm tra đổi trạng thái ẩn/hiện. |
| **TC-MA-CMS-014** | Sửa món với trường bắt buộc bị xóa trắng | `US-07`<br>`REQ-11`<br>(Negative) | Modal "Sửa Thông Tin Món Ăn" của "Coca" đang mở. | 1. Xóa trắng ô **Tên món ăn**.<br>2. Click **Lưu thay đổi**. | 2.1 Bấm Lưu khi Tên món bị để trống. | `edit-menu-name`: "" (rỗng) | High | Automated + Manual | Toast lỗi "Lỗi nhập liệu — Vui lòng nhập Tên món!" xuất hiện. Modal vẫn mở. Dữ liệu trong DB không thay đổi. | `Passed` | 2026-10-08 | Ny | - | Validation khi sửa. |
| **TC-MA-CMS-015** | Cập nhật số lượng tồn inline trực tiếp trên bảng | `US-07`<br>`REQ-11` | Đang ở tab Thực đơn. Món "Trà đá" đang có tồn = 2 (hiển thị inline input). | 1. Tìm dòng "Trà đá" trong bảng.<br>2. Click vào ô số lượng tồn (hiện đang là 2).<br>3. Xóa và nhập giá trị mới = 50.<br>4. Nhấn **Tab** hoặc click ra ngoài ô để trigger sự kiện lưu. | 4.1 Thay đổi giá trị và rời khỏi ô input. | `Item`: "Trà đá"<br>`Old Stock`: 2<br>`New Stock`: 50 | Medium | Automated + Manual | Giá trị tồn kho của "Trà đá" được cập nhật thành **50** ngay trong bảng. Backend nhận PATCH request cập nhật tồn kho thành công. | `Passed` | 2026-10-08 | Ny | BUG-US07-004 | Inline stock edit (updateMenuStock). |
| **TC-MA-CMS-016** | Xóa món ăn và xác nhận | `US-07`<br>`REQ-11` | Đang ở tab Thực đơn. Có món test "Sườn sụn rang muối" vừa thêm ở TC-MA-CMS-006. | 1. Tìm dòng món "Sườn sụn rang muối".<br>2. Click icon **🗑 Xóa** (icon thùng rác màu đỏ).<br>3. Popup confirm trình duyệt hiện ra.<br>4. Click **OK** xác nhận. | 4.1 Bấm OK trong dialog xác nhận xóa. | `Item`: "Sườn sụn rang muối"<br>`Action`: Delete + Confirm | High | Automated + Manual | Món "Sườn sụn rang muối" biến mất khỏi bảng ngay lập tức. Toast "Xóa thành công — Món ăn đã bị gỡ khỏi thực đơn." xuất hiện. Record bị xóa khỏi DB. | `Passed` | 2026-10-08 | Ny | - | Xóa món với xác nhận. |
| **TC-MA-CMS-017** | Hủy xóa món ăn (bấm Cancel trong dialog) | `US-07`<br>`REQ-11` | Đang ở tab Thực đơn. Có món "Coca" trong bảng. | 1. Click icon **🗑 Xóa** dòng "Coca".<br>2. Popup confirm hiện ra.<br>3. Click **Hủy / Cancel** trong dialog. | 3.1 Bấm Cancel (không xác nhận xóa). | `Item`: "Coca"<br>`Action`: Delete + Cancel | Medium | Automated + Manual | Dialog đóng lại. Món "Coca" vẫn còn trong bảng, không bị xóa. Không có thay đổi nào trong DB. | `Passed` | 2026-10-08 | Ny | - | Kiểm tra hủy xóa. |
| **TC-MA-CMS-018** | Waiter/Guest gọi API sửa menu bị từ chối (RBAC) | `US-07`<br>`NFR-RO-03`<br>(Security) | Có token hợp lệ của tài khoản Waiter/Guest và ID món hiện có; endpoint API hoạt động. | 1. Dùng Postman gửi `PUT https://smart-orderding.vercel.app/api/menu/{id}` với token thật của Waiter/Guest và body thay đổi giá.<br>2. Ghi nhận HTTP status và body.<br>3. Kiểm tra món trong giao diện bằng tài khoản Manager. | 1.1 Không dùng token giả; xác nhận token thuộc role không có quyền sửa menu.<br>2.1 Gửi request và ghi nhận phản hồi. | `Role`: `WAITER` hoặc `GUEST`<br>`API`: `PUT /api/menu/{id}`<br>`Body`: giá trị giá thử nghiệm | High | Manual | API trả **401** nếu token thiếu/không hợp lệ hoặc **403** nếu token hợp lệ nhưng không đủ quyền. Không chấp nhận 200/2xx; dữ liệu món không thay đổi. | `Passed` | 2026-10-08 | Ny | - | Manual vì cần token role hợp lệ; xác minh backend RBAC, không dùng fake token. |
| **TC-MA-CMS-019** | Mở modal sửa → dữ liệu điền sẵn đúng với bảng | `US-07`<br>`REQ-11` | Món "Coca" trong bảng: Giá 15.000đ, Tồn 24, Trạng thái Đang bán, Danh mục Đồ uống. | 1. Click icon **✏ Sửa** dòng "Coca".<br>2. Quan sát tất cả các field trong modal. | 2.1 Kiểm tra từng field sau khi modal mở. | `Item`: "Coca" | Medium | Automated + Manual | Modal mở với dữ liệu điền sẵn khớp 100% với bảng: Tên = "Coca", Danh mục = "Đồ uống", Số lượng tồn = 24, Giá = 15000, Trạng thái = "Đang bán", Hình ảnh hiện ảnh Coca, các field Smart Ordering điền đúng. | `Passed` | 2026-10-08 | Ny | - | Kiểm tra data binding khi mở edit modal. |
| **TC-MA-CMS-020** | Sắp xếp giá từ cao đến thấp | `US-07`<br>`REQ-11` | Đang ở tab Thực đơn với nhiều món giá khác nhau. | 1. Click icon lọc (▼) cột **Giá bán**.<br>2. Chọn **Cao đến thấp**. | 2.1 Chọn option "Cao đến thấp". | `Sort`: price = "high-low" | Low | Automated + Manual | Bảng sắp xếp lại: món có giá cao nhất hiển thị đầu tiên, xuống dần. Badge, tên, danh mục không thay đổi, chỉ thứ tự thay đổi. | `Passed` | 2026-10-08 | Ny | - | Kiểm tra sort giá. |

---

## 📊 TỔNG KẾT BỘ TEST CASES US-07

- **Tổng số Test Cases**: **20 Test Cases** (`TC-MA-CMS-001` → `TC-MA-CMS-020`)
- **Hình thức kiểm thử**: 19 ca **Automated + Manual**; TC-MA-CMS-018 kiểm thử **Manual** do cần token Waiter/Guest hợp lệ.
- **Người thực hiện (Who checked)**: **Ny**
- **Phân bổ theo chức năng**:
  - **Hiển thị & Tìm kiếm / Lọc**: 4 TC (`001`, `002`, `003`, `004`)
  - **Xem chi tiết**: 1 TC (`005`)
  - **Thêm món (CRUD Create)**: 6 TC (`006`, `007`, `008`, `009`, `010`, `011`)
  - **Sửa món (CRUD Update)**: 5 TC (`012`, `013`, `014`, `015`, `019`)
  - **Xóa món (CRUD Delete)**: 2 TC (`016`, `017`)
  - **Bảo mật RBAC**: 1 TC (`018`)
  - **Sắp xếp**: 1 TC (`020`)
- **Phân loại ưu tiên**:
  - `High`: 10 TC
  - `Medium`: 8 TC
  - `Low`: 2 TC
- **Trạng thái**: `Passed` — toàn bộ 20 test case; cập nhật ngày 2026-10-08.
- **Yêu cầu môi trường**: Kết nối được `https://smart-orderding.vercel.app/pages/manager.html`; đăng nhập Manager để thực hiện thao tác CMS. Với môi trường khác, đặt biến `BASE_URL` trước khi chạy Playwright.

