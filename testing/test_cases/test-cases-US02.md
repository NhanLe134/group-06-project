# TEST CASES CHI TIẾT — US-02: TRỢ LÝ GỌI MÓN BẰNG VOICE HOẶC TEXT

> **Tài liệu kiểm soát:** `testing/test_cases/test-cases-US02.md`
> **User Story:** US-02 — Dùng trợ lý AI để tư vấn và thêm món vào Order Draft (`docs/04-Backlog/user stories/US-02.md`)
> **Lần chạy:** 2026-10-08; toàn bộ test case `Passed`.
> **Story Spec:** `vault/06-Engineering/story-spec-ai-order.md`
> **Người thực hiện (Who checked):** Ny
> **Màn hình kiểm thử:** `http://localhost:5173/pages/customer.html` → mở Trợ lý gọi món AI
> **Yêu cầu liên quan:** `REQ-01`, `REQ-02`, `REQ-05`, `REQ-15`, `BR-01`, `BR-04`, `BR-06`, `NFR-RO-04`, `NFR-RO-05`
> **Cấu hình bảng:** cùng mẫu 15 cột với `testing/test-cases.md` và `test-cases-US03.md`. Cột **Mode** ghi `Manual/E2E`; cột **Testing Result** dùng `Passed` · `Failed` · `Blocked` · `Un-tested`.

## Liên kết với `testing/test-strategy.md`

| Mã chiến lược | Nội dung | Test case ở file này |
|---|---|---|
| `UT-03` | Parse kết quả AI Voice / Speech-to-Text | TC-US02-MAN-003 |
| `UT-04` | Grounding dữ liệu món và giá từ menu, làm rõ yêu cầu mơ hồ | TC-US02-MAN-002, TC-US02-MAN-006 |

Các ca kiểm thử bổ sung bao phủ chuyển đổi Voice/Text, ghi chú món, Order Draft, dị ứng, tồn kho và xác nhận gửi bếp theo yêu cầu US-02.

## Môi trường & cách chạy

| Tầng | Công cụ | Môi trường dữ liệu |
|---|---|---|
| Manual/E2E | Trình duyệt trên `localhost:5173` | Menu và Order Draft của bàn kiểm thử; không dùng bàn khách thật |
| Voice | Trình duyệt hỗ trợ Web Speech API, có quyền micro | Micro hoạt động; chỉ cần cho ca voice, không phải điều kiện cho ca text |
| Text | Ô nhập trong Trợ lý gọi món AI | Luôn dùng được ngay, không cần gây lỗi micro hoặc chờ fallback |

Mở `customer.html`, khởi chạy trợ lý bằng nút micro nổi. Trước mỗi ca cần giỏ trống thì xóa các món cũ. Khi chỉ kiểm tra Order Draft, dừng trước nút **Xác nhận gửi bếp**.

## Điều kiện và lưu ý

- Có phiên bàn đang hoạt động và menu đã tải xong. Dùng bàn kiểm thử, không gửi đơn thử xuống bếp của bàn khách thật.
- Để kiểm thử Voice, dùng trình duyệt hỗ trợ Web Speech API và cấp quyền micro. Quyền micro không phải điều kiện để kiểm thử text.
- Trước mỗi ca cần giỏ trống thì mở Order Draft và xóa các món cũ. Với ca kiểm tra món dị ứng/tồn kho, chọn món đang bán và đối chiếu dữ liệu menu hiện tại.
- Khi ca chỉ kiểm tra thêm/sửa/xóa bản nháp, dừng trước nút **Xác nhận gửi bếp**.

## BẢNG TEST CASES — US-02

| TC-ID | Description (Test Scenario) | User Story / Trace | Pre-condition | Test step | Step condition to perform | Data | Priority | Mode | Expected result | Testing Result | Date | Who checked | BUG ID | Comment |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **TC-US02-MAN-001** | Ô nhập text luôn hiển thị cùng nút micro | `US-02`<br>`REQ-05`<br>`NFR-RO-05` | Đang ở trang E-Menu; trợ lý chưa gặp lỗi nhận diện giọng nói. | 1. Mở trợ lý bằng nút micro nổi.<br>2. Quan sát khu vực điều khiển trước khi bấm micro.<br>3. Kiểm tra ô nhập text, nút gửi và nút micro. | - | Không cần nhập dữ liệu. | High | Manual/E2E | Ô text và nút gửi hiển thị, dùng được ngay bên cạnh luồng Voice. Không cần tạo lỗi tiếng ồn, từ chối quyền micro hoặc chờ banner fallback mới nhập được. | `Passed` | 2026-10-08 | Ny | BUG-US02-001 | Ca trọng tâm xác nhận thay đổi US-02. |
| **TC-US02-MAN-002** | Thêm món bằng text khi micro chưa được dùng | `US-02`<br>`REQ-01`<br>`NFR-RO-05` | Trợ lý mở; giỏ nháp trống; có món đang bán trong menu. | 1. Không bấm micro.<br>2. Gõ yêu cầu vào ô text và gửi.<br>3. Quan sát tin nhắn trợ lý, Order Draft và thanh tổng tiền. | - | `1 Bò xào cần` (hoặc một món đang bán trong menu). | High | Manual/E2E | Trợ lý nhận đúng tên món và số lượng 1; món xuất hiện trong bản nháp, tổng tiền khớp giá menu. Tin nhắn hiển thị trong hội thoại. Không tự gửi đơn xuống bếp. | `Passed` | 2026-10-08 | Ny | - | Dùng tên và giá thực tế của menu nếu dữ liệu đã thay đổi. |
| **TC-US02-MAN-003** | Thêm món bằng giọng nói | `US-02`<br>`REQ-05` | Trợ lý mở; giỏ nháp trống; trình duyệt được cấp quyền micro; có món đang bán. | 1. Bấm **Bấm micro để nói**.<br>2. Nói rõ yêu cầu đặt món.<br>3. Chờ trợ lý xử lý và quan sát giỏ nháp. | - | Nói: `Cho tôi 1 Bò xào cần` (hoặc một món đang bán). | High | Manual/E2E | Trạng thái nghe/xử lý hiển thị đúng; món và số lượng được nhận diện, thêm vào giỏ nháp với giá đúng menu. Trợ lý trả lời trong hội thoại, không tự gửi đơn xuống bếp. | `Passed` | 2026-10-08 | Ny | BUG-US02-008 | Thử trong môi trường micro bình thường. |
| **TC-US02-MAN-004** | Chuyển từ text sang Voice trong cùng phiên | `US-02`<br>`REQ-01`<br>`REQ-05`<br>`AC6` | Trợ lý mở; giỏ nháp trống; có ít nhất hai món đang bán. | 1. Gõ và gửi yêu cầu thêm món thứ nhất.<br>2. Sau khi xử lý xong, bấm micro và nói yêu cầu thêm món thứ hai.<br>3. Kiểm tra hội thoại, danh sách món và tổng tiền. | - | Text: `1 Bò xào cần`.<br>Voice: `Thêm 1 Cơm chiên hải sản` (đổi sang tên món còn bán nếu cần). | High | Manual/E2E | Hai yêu cầu được thêm trong cùng phiên. Tin nhắn trước và sau còn trong hội thoại; món thứ nhất không bị mất khi dùng micro; số lượng và tổng tiền được cập nhật đúng. | `Passed` | 2026-10-08 | Ny | - | Đổi thứ tự Voice → text và kiểm tra lại. |
| **TC-US02-MAN-005** | Ghi chú món theo yêu cầu tùy chỉnh | `US-02`<br>`REQ-01` | Trợ lý mở; giỏ nháp trống; món được chọn đang bán. | 1. Gửi yêu cầu có tên món và ghi chú qua text hoặc Voice.<br>2. Mở Order Draft và kiểm tra ghi chú ở dòng món.<br>3. Kiểm tra phản hồi của trợ lý. | - | `1 Bò xào cần không rau` | Medium | Manual/E2E | Món được thêm với ghi chú **Không rau**; trợ lý xác nhận nội dung ghi chú và tên món. Giá/tổng tiền vẫn đúng; không tự gửi bếp. | `Passed` | 2026-10-08 | Ny | BUG-US02-002<br>BUG-US02-005 | Có thể lặp lại với Không hành, Ít cay, Nhiều cay, Không đá, Ít ngọt hoặc Chia đôi phần nếu phù hợp món. |
| **TC-US02-MAN-006** | Làm rõ yêu cầu gọi món mơ hồ | `US-02`<br>`REQ-01`<br>`BR-04` | Menu có nhiều món phù hợp với từ khóa chung, ví dụ các món tên có “bò”. | 1. Gửi yêu cầu chung bằng Voice hoặc text.<br>2. Quan sát câu hỏi làm rõ và các lựa chọn.<br>3. Chọn một món trong các lựa chọn. | - | `Cho 1 món bò` | Medium | Manual/E2E | Trợ lý hỏi khách chọn món nào và chỉ hiển thị món phù hợp có trong menu. Không tự chọn món trước khi khách trả lời. Sau khi chọn, đúng món mới được thêm vào Order Draft. | `Passed` | 2026-10-08 | Ny | - | Xác nhận giá hiển thị lấy từ menu. |
| **TC-US02-MAN-007** | Từ chối món hết hàng và gợi ý món thay thế | `US-02`<br>`REQ-15`<br>`BR-06` | Menu có ít nhất một món được đánh dấu hết hàng. | 1. Gửi yêu cầu món hết hàng bằng text hoặc Voice.<br>2. Quan sát phản hồi và các món thay thế.<br>3. Chọn hoặc không chọn món thay thế. | - | Một món đang hiển thị **Hết**, ví dụ **Bò sốt tiêu đen** hoặc **Trà đá** nếu vẫn hết hàng. | High | Manual/E2E | Món hết hàng không được thêm vào giỏ. Trợ lý thông báo tình trạng và chỉ gợi ý món khác đang bán. Chọn món gợi ý thì món đó mới được thêm. | `Passed` | 2026-10-08 | Ny | - | Dùng trạng thái tồn kho thực tế tại thời điểm kiểm thử. |
| **TC-US02-MAN-008** | Không cho gọi vượt số lượng tồn | `US-02`<br>`REQ-15`<br>`BR-06` | Có món mua sẵn với tồn kho hữu hạn; ghi nhận số còn trước khi thử. | 1. Yêu cầu số lượng lớn hơn tồn khả dụng bằng Voice hoặc text.<br>2. Quan sát phản hồi và Order Draft.<br>3. Nếu trợ lý đề nghị số lượng còn lại, xác nhận hoặc từ chối đề nghị. | - | Gọi `tồn khả dụng + 1` phần của món có tồn hữu hạn. | High | Manual/E2E | Trợ lý nêu đúng số lượng còn theo dữ liệu hiện tại; không tự thêm quá tồn hoặc tự giảm số lượng khi khách chưa xác nhận. Giỏ nháp giữ nguyên cho tới khi khách chọn. | `Passed` | 2026-10-08 | Ny | - | Ghi lại tên món và tồn kho thực tế trước khi chạy. |
| **TC-US02-MAN-009** | Tư vấn đồ uống và món giải khát | `US-02` | Menu có món thuộc danh mục Đồ uống/Khai vị đang bán. | 1. Hỏi trợ lý bằng Voice hoặc text về đồ uống/giải khát.<br>2. Đối chiếu các món được gợi ý với danh mục và trạng thái menu. | - | `Quán có nước uống gì?` hoặc `Có gì để giải khát không?` | Medium | Manual/E2E | Trợ lý gợi ý món thuộc Đồ uống/Khai vị còn bán, ví dụ Coca hoặc Trà đá nếu còn hàng. Không tự thêm món vào giỏ trước khi khách chọn. | `Passed` | 2026-10-08 | Ny | BUG-US02-003 | Không mong đợi món đã hết hàng được gợi ý như còn bán. |
| **TC-US02-MAN-010** | Hỏi món súp/món có nước dùng, không gợi ý đồ uống | `US-02` | Menu có hoặc không có món ăn phù hợp; ghi nhận nội dung mô tả/thành phần menu. | 1. Hỏi trợ lý về súp hoặc món có nước.<br>2. Đối chiếu tên, danh mục, mô tả và thành phần của kết quả. | - | `Quán có món súp gì không?` hoặc `Có món nào có nước không?` | Medium | Manual/E2E | Chỉ gợi ý món ăn thuộc Món chính/Khai vị có thông tin về súp, nước dùng, bún, phở, canh hoặc sốt. Tuyệt đối không trả Coca, Trà đá hoặc món Đồ uống cho câu hỏi này. Không tự thêm món. | `Passed` | 2026-10-08 | Ny | BUG-US02-003 | Nếu menu không có kết quả phù hợp, trợ lý nói rõ chưa tìm thấy. |
| **TC-US02-MAN-011** | Báo dị ứng với món đã có trong giỏ và xác nhận xóa | `US-02`<br>`NFR-RO-05` | Order Draft có món mà thành phần/thông tin dị ứng chứa thành phần X. | 1. Thêm món phù hợp vào giỏ nháp.<br>2. Báo dị ứng với X bằng text hoặc Voice.<br>3. Xác nhận bằng câu như **Ừ, xóa đi**.<br>4. Kiểm tra Order Draft và tổng tiền. | - | X là thành phần được khai báo trong dữ liệu món. | High | Manual/E2E | Trợ lý nhận ra món trong giỏ có chứa X và hỏi xác nhận trước. Sau khi khách đồng ý, món bị xóa khỏi giỏ; tổng tiền/số món cập nhật; trợ lý xác nhận đã xóa. Không gửi đơn xuống bếp. | `Passed` | 2026-10-08 | Ny | BUG-US02-004 | Không xác nhận xóa thì món chưa được xóa. |
| **TC-US02-MAN-012** | Giảm số lượng món trong giỏ nháp | `US-02` | Order Draft có ít nhất 3 phần của một món. | 1. Yêu cầu giảm 1 phần hoặc chỉ giữ lại số lượng nhỏ hơn hiện tại.<br>2. Kiểm tra số lượng món và tổng tiền trong thanh nháp/Order Draft. | - | Ví dụ: đang có 3 Coca; gửi `Bỏ bớt 1 Coca` hoặc `Chỉ giữ lại 2 Coca`. | High | Manual/E2E | Số lượng được giảm đúng (còn 2 trong ví dụ); tổng tiền tính lại theo giá menu; trợ lý đọc lại số lượng mới. Các món khác trong giỏ giữ nguyên. | `Passed` | 2026-10-08 | Ny | BUG-US02-006 | Có thể dùng món khác nếu Coca không có trong menu hiện tại. |
| **TC-US02-MAN-013** | Xóa hẳn một món khỏi giỏ nháp | `US-02` | Order Draft có ít nhất một món. | 1. Yêu cầu xóa rõ tên món hoặc nói **Hủy món này** khi giỏ chỉ có một món phù hợp.<br>2. Quan sát Order Draft và tổng tiền. | - | `Xóa Bún chả Hà Nội khỏi giỏ` hoặc `Hủy món này`. | High | Manual/E2E | Toàn bộ dòng món được xóa khỏi bản nháp; tổng tiền và số món cập nhật đúng; trợ lý xác nhận tên món đã xóa. Những món khác không bị thay đổi. | `Passed` | 2026-10-08 | Ny | BUG-US02-007 | Không gửi đơn xuống bếp. |
| **TC-US02-MAN-014** | Text vẫn dùng được khi micro bị từ chối hoặc nhận diện lỗi | `US-02`<br>`NFR-RO-04`<br>`NFR-RO-05` | Trợ lý mở; có thể dùng profile trình duyệt chưa cấp quyền micro hoặc giả lập lỗi nhận diện. | 1. Từ chối quyền micro hoặc tạo lỗi nhận diện.<br>2. Quan sát trạng thái micro và ô text.<br>3. Nhập yêu cầu text và gửi.<br>4. Kiểm tra món đã có trong giỏ trước lỗi (nếu có). | - | Yêu cầu một món đang bán bằng text. | High | Manual/E2E | Micro dừng ở trạng thái lỗi phù hợp; thông báo hướng dẫn không che hoặc khóa ô text. Khách gửi yêu cầu bằng text được; dữ liệu Order Draft trước lỗi được bảo toàn. | `Passed` | 2026-10-08 | Ny | BUG-US02-001 | Text khả dụng cả trước và sau lỗi micro. |
| **TC-US02-MAN-015** | Báo lỗi khi API AI mất kết nối và thử lại bằng text | `US-02`<br>`NFR-RO-05` | Order Draft đã có món; có môi trường kiểm thử cho phép tạm ngắt API AI rồi khôi phục. | 1. Tạm ngắt API AI và gửi yêu cầu bằng text.<br>2. Quan sát thông báo lỗi và Order Draft.<br>3. Khôi phục API AI rồi gửi lại yêu cầu bằng text. | - | Một yêu cầu thêm món đang bán. | Medium | Manual/E2E | Khi API mất kết nối, giao diện không treo, báo lỗi rõ ràng và giữ nguyên giỏ nháp; không giả vờ thêm món thành công. Sau khi API khôi phục, khách gửi lại text được và yêu cầu được xử lý. | `Passed` | 2026-10-08 | Ny | BUG-US02-008 | Tách lỗi API khỏi lỗi micro/STT; không yêu cầu text xử lý được khi backend AI đang mất kết nối. |
| **TC-US02-MAN-016** | Không gửi đơn xuống bếp nếu chưa xác nhận thủ công | `US-02`<br>`REQ-02`<br>`BR-01` | Order Draft có món hợp lệ. | 1. Thêm món bằng Voice hoặc text.<br>2. Không bấm nút **Xác nhận gửi bếp**.<br>3. Kiểm tra Order Draft và khu vực đơn bếp nếu môi trường có thể quan sát. | - | Một món đang bán, số lượng hợp lệ. | High | Manual/E2E | Món chỉ nằm trong Order Draft; trợ lý không tự chốt đơn hoặc tạo ticket bếp. Chỉ thao tác nút xác nhận thủ công mới bắt đầu luồng gửi bếp. | `Passed` | 2026-10-08 | Ny | - | Dừng tại đây nếu không dùng bàn/môi trường chuyên dụng để gửi thử. |

## Tổng kết bộ test cases US-02

| Mode | Số test case | Kết quả hiện tại |
|---|---:|---|
| Manual/E2E | 16 | 16 `Passed` |
| **Tổng** | **16** | **16 Passed · 0 Failed · 0 Blocked · 0 Un-tested** |

Phạm vi gồm Voice/Text, chuyển đổi phương thức, tư vấn món, ghi chú, Order Draft, dị ứng, tồn kho và xác nhận gửi bếp.
