# BUG-US02 — Trợ lý Gọi món bằng Voice / Text

> **Phụ trách:** Ny (Dev & QA) | **User Story:** US-02 | **Liên kết:** [`test-cases-US02.md`](../test_cases/test-cases-US02.md)

---

# BUG-US02-001 — Ô nhập text ẩn cho đến khi micro gặp lỗi

| Mục | Nội dung |
|---|---|
| Story | US-02 AC — Text fallback luôn khả dụng song song với Voice |
| Mức độ | **P1 — Critical** — ảnh hưởng toàn bộ khả năng tiếp cận tính năng Voice |
| Phát hiện | 2026-10-07, kiểm thử thủ công TC-US02-MAN-001 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY06) |
| Trạng thái | Closed (Passed) |

## Summary
Ô nhập text chỉ xuất hiện sau khi nhận diện giọng nói thất bại hoặc có tiếng ồn, thay vì luôn hiển thị song song với nút micro ngay từ khi mở trợ lý.

## Environment
Chrome / `customer.html` / Trợ lý gọi món AI.

## Reproduction Steps
1. Mở trợ lý bằng nút mic nổi.
2. Quan sát khu vực điều khiển trước khi bấm micro.
3. Nhận thấy không có ô nhập text; phải tạo lỗi micro 2 lần mới thấy ô nhập.

## Expected vs Actual
- Expected: Ô text và nút gửi hiển thị ngay khi mở trợ lý, dùng được song song với Voice mà không cần tạo lỗi hay chờ fallback.
- Actual: Ô text bị ẩn hoàn toàn; khách phải gây lỗi micro 2 lần mới thấy ô nhập.

## Root Cause Analysis
UI chỉ render text fallback khi `VS.noisy = true`; không có đường nào để nhập text ngay từ đầu phiên.

## Solution
Luôn render ô text trong `vRender()`; nút micro và ô text hoạt động độc lập, không phụ thuộc trạng thái lỗi.

## Regression Risk
Cao — ảnh hưởng khả năng tiếp cận của toàn bộ tính năng Voice.

## Test Plan
- Manual: mở trợ lý, không bấm micro, xác nhận ô text hiển thị và gửi được.
- Manual: gửi yêu cầu bằng text, kiểm tra món xuất hiện trong Order Draft.
- TC liên quan: TC-US02-MAN-001, TC-US02-MAN-014.

---

# BUG-US02-002 — Voice NLU không tách tên món khỏi ghi chú tùy chỉnh

| Mục | Nội dung |
|---|---|
| Story | US-02 — Thêm món kèm ghi chú modifier |
| Mức độ | **P2 — High** — ảnh hưởng mọi yêu cầu gọi món có ghi chú |
| Phát hiện | 2026-10-07, kiểm thử thủ công TC-US02-MAN-005 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY06) |
| Trạng thái | Closed (Passed) |

## Summary
Khi khách nói kèm modifier (VD: "không hành"), hệ thống không tách được tên món và phần ghi chú, dẫn đến không tìm thấy món hoặc bỏ qua ghi chú.

## Environment
Chrome / `customer.html` / Trợ lý Voice AI — backend `POST /api/v1/ai/voice-parse`.

## Reproduction Steps
1. Mở trợ lý.
2. Gõ hoặc nói: `1 Bò xào cần không hành`.
3. Quan sát Order Draft và phản hồi AI.

## Expected vs Actual
- Expected: Món "Bò xào cần" được thêm với `note = "Không hành"`; trợ lý xác nhận đúng cả tên món lẫn ghi chú.
- Actual: Cả câu bị đưa vào tên món; không tìm thấy món hoặc ghi chú bị bỏ qua.

## Root Cause Analysis
Regex `NOTE_PATTERN` trong `voice.py` chưa được áp dụng để tách modifier khỏi tên món trước khi tra cứu menu; hàm `_note_for(segment)` được gọi nhưng kết quả không được truyền vào `VoiceAdd.note`.

## Solution
Áp dụng `NOTE_PATTERN.sub()` trước khi gọi `_resolve_dish()`; đảm bảo `note=_note_for(segment)` được gán khi tạo `VoiceAdd` trong vòng lặp segments.

## Regression Risk
Trung bình — ảnh hưởng mọi yêu cầu gọi món có ghi chú.

## Test Plan
- Manual: nói/gõ `1 Bò xào cần không hành` → kiểm tra note trong Order Draft.
- Manual: thử nhiều modifier: `Ít cay`, `Không đá`, `Nhiều cay`, `Chia đôi phần`.
- TC liên quan: TC-US02-MAN-005.

---

# BUG-US02-003 — Gợi ý món không phân biệt đúng nhóm đồ uống và món ăn có nước dùng

| Mục | Nội dung |
|---|---|
| Story | US-02 — Tư vấn món theo từ khóa / nguyên liệu |
| Mức độ | **P3 — Medium** — ảnh hưởng luồng tư vấn, không ảnh hưởng thêm món |
| Phát hiện | 2026-10-07, kiểm thử thủ công TC-US02-MAN-009, 010 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY14) |
| Trạng thái | Closed (Passed) |

## Summary
Câu hỏi "có gì để giải khát?" gợi ý cả món ăn không phải đồ uống; câu hỏi "có món súp không?" trả về Coca Cola.

## Environment
Chrome / `customer.html` / Trợ lý Voice AI — backend `POST /api/v1/ai/voice-parse`.

## Reproduction Steps
1. Gõ: `Quán có nước uống gì?` → quan sát gợi ý.
2. Gõ: `Có món súp gì không?` → quan sát gợi ý.

## Expected vs Actual
- Expected: Câu 1 chỉ gợi ý Đồ uống/Khai vị còn bán. Câu 2 chỉ gợi ý món ăn có từ khóa súp/nước dùng, không trả đồ uống.
- Actual: Logic tra cứu theo token không phân biệt ngữ cảnh, trộn lẫn cả hai nhóm; Coca Cola xuất hiện trong kết quả tìm "súp".

## Root Cause Analysis
Hàm `_keyword_matches()` chỉ so khớp token mà không xét danh mục; token "nuoc" khớp cả món ăn có "nước dùng" và Đồ uống.

## Solution
Thêm điều kiện `is_beverage_search` kiểm tra `phanloai == "do uong"` khi query chứa "nuoc"; tách logic tìm kiếm đồ uống và món ăn.

## Regression Risk
Thấp — chỉ ảnh hưởng luồng tư vấn/gợi ý.

## Test Plan
- Manual: hỏi về giải khát → kiểm tra chỉ có Đồ uống/Khai vị trong gợi ý.
- Manual: hỏi về súp/nước dùng → kiểm tra không có Coca/Trà đá trong kết quả.
- TC liên quan: TC-US02-MAN-009, TC-US02-MAN-010.

---

# BUG-US02-004 — Khai báo dị ứng sau khi món vào giỏ không được xử lý

| Mục | Nội dung |
|---|---|
| Story | US-02 — Cảnh báo dị ứng với món trong Order Draft |
| Mức độ | **P1 — Critical** — liên quan an toàn thực phẩm của khách |
| Phát hiện | 2026-10-07, kiểm thử thủ công TC-US02-MAN-011 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY14) |
| Trạng thái | Closed (Passed) |

## Summary
Khi khách nói "Tôi bị dị ứng tôm" sau khi đã thêm Cơm chiên dương châu (có tôm) vào giỏ, trợ lý không hỏi xác nhận xóa món.

## Environment
Chrome / `customer.html` / Trợ lý Voice AI — backend `POST /api/v1/ai/voice-parse`.

## Reproduction Steps
1. Thêm "Cơm chiên dương châu" vào Order Draft.
2. Gõ hoặc nói: `Tôi bị dị ứng tôm`.
3. Quan sát phản hồi và Order Draft.

## Expected vs Actual
- Expected: Trợ lý nhận ra Cơm chiên dương châu có tôm, hỏi xác nhận; sau khi đồng ý, món bị xóa và tổng tiền cập nhật.
- Actual: Trợ lý chỉ cảnh báo chung chung, không xử lý món đã có trong giỏ.

## Root Cause Analysis
Logic `_allergies_in()` phát hiện dị ứng nhưng không đối chiếu với `draft_quantities`; không có cơ chế `pending_draft_removal` để theo dõi trạng thái xác nhận.

## Solution
Thêm `VoicePendingDraftRemoval` schema; trong `interpret()`, sau khi phát hiện dị ứng, quét `draft_quantities` tìm món chứa chất dị ứng và trả `pending_draft_removal` kèm câu hỏi xác nhận.

## Regression Risk
Cao — liên quan an toàn thực phẩm; cần kiểm tra kỹ luồng xác nhận.

## Test Plan
- Manual: thêm món có tôm → báo dị ứng tôm → xác nhận xóa → kiểm tra Order Draft.
- Manual: nói "Không, giữ nguyên" → kiểm tra món vẫn còn trong giỏ.
- TC liên quan: TC-US02-MAN-011.

---

# BUG-US02-005 — Modifier ghi chú không được lưu riêng cho từng phiên thêm món

| Mục | Nội dung |
|---|---|
| Story | US-02 — Ghi chú món theo yêu cầu |
| Mức độ | **P2 — High** — ảnh hưởng trải nghiệm tùy chỉnh món |
| Phát hiện | 2026-10-07, kiểm thử thủ công TC-US02-MAN-005 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY06) |
| Trạng thái | Closed (Passed) |

## Summary
Khi dùng voice gọi `1 Bò xào cần không rau`, ghi chú "Không rau" không được lưu vào trường `note` của món trong Order Draft.

## Environment
Chrome / `customer.html` / Trợ lý Voice AI — backend `POST /api/v1/ai/voice-parse`.

## Reproduction Steps
1. Gõ: `1 Bò xào cần không rau`.
2. Mở Order Draft → quan sát ghi chú ở dòng Bò xào cần.

## Expected vs Actual
- Expected: Dòng "Bò xào cần" có `note = "Không rau"`; trợ lý xác nhận đúng cả tên món lẫn ghi chú.
- Actual: Không có ghi chú; phần modifier bị bỏ qua hoàn toàn.

## Root Cause Analysis
Hàm `_note_for(segment)` trả về string nhưng kết quả không được truyền vào `VoiceAdd.note` trong vòng lặp tạo `adds`.

## Solution
Đảm bảo `note=_note_for(segment)` được gán khi tạo `VoiceAdd` trong vòng lặp segments của `interpret()`.

## Regression Risk
Trung bình — ảnh hưởng mọi yêu cầu gọi món có ghi chú.

## Test Plan
- Manual: gọi món kèm modifier → mở Order Draft → xác nhận ghi chú đúng.
- TC liên quan: TC-US02-MAN-005.

---

# BUG-US02-006 — Giảm số lượng món trong giỏ bằng voice chưa hoạt động

| Mục | Nội dung |
|---|---|
| Story | US-02 — Điều chỉnh số lượng món trong Order Draft |
| Mức độ | **P2 — High** — ảnh hưởng luồng điều chỉnh đơn hàng |
| Phát hiện | 2026-10-07, kiểm thử thủ công TC-US02-MAN-012 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY06) |
| Trạng thái | Closed (Passed) |

## Summary
Câu lệnh "Bỏ bớt 1 Coca" hoặc "Chỉ giữ lại 2 Coca" không giảm số lượng trong Order Draft.

## Environment
Chrome / `customer.html` / Trợ lý Voice AI — backend `POST /api/v1/ai/voice-parse`.

## Reproduction Steps
1. Thêm 3 Coca vào Order Draft.
2. Gõ: `Bỏ bớt 1 Coca`.
3. Kiểm tra Order Draft.

## Expected vs Actual
- Expected: Số lượng Coca giảm từ 3 xuống 2; tổng tiền tính lại; trợ lý xác nhận "Dạ, Coca còn 2 phần ạ".
- Actual: Trợ lý không nhận diện ý định giảm số lượng; Order Draft không thay đổi.

## Root Cause Analysis
`interpret()` không có nhánh xử lý intent "giảm số lượng món đã trong giỏ"; chỉ có intent thêm mới và xóa hoàn toàn.

## Solution
Thêm phát hiện `decrease_request` bằng cụm từ ("bỏ bớt", "giảm", "chỉ giữ lại"); tính `new_qty` và trả `VoiceDraftChange` với số lượng mới.

## Regression Risk
Trung bình — ảnh hưởng luồng điều chỉnh đơn hàng.

## Test Plan
- Manual: 3 Coca trong giỏ → nói "Bỏ bớt 1" → kiểm tra còn 2.
- Manual: "Chỉ giữ lại 1 Coca" → kiểm tra còn 1.
- TC liên quan: TC-US02-MAN-012.

---

# BUG-US02-007 — Xóa hẳn món khỏi Order Draft bằng voice chưa được hỗ trợ

| Mục | Nội dung |
|---|---|
| Story | US-02 — Xóa món khỏi Order Draft |
| Mức độ | **P1 — Critical** — ảnh hưởng khả năng điều chỉnh đơn của khách |
| Phát hiện | 2026-10-07, kiểm thử thủ công TC-US02-MAN-013 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY06) |
| Trạng thái | Closed (Passed) |

## Summary
Câu lệnh "Xóa Bún chả Hà Nội khỏi giỏ" không xóa món khỏi Order Draft.

## Environment
Chrome / `customer.html` / Trợ lý Voice AI — backend `POST /api/v1/ai/voice-parse`.

## Reproduction Steps
1. Thêm "Bún chả Hà Nội" vào Order Draft.
2. Gõ: `Xóa Bún chả Hà Nội khỏi giỏ`.
3. Kiểm tra Order Draft.

## Expected vs Actual
- Expected: Toàn bộ dòng "Bún chả Hà Nội" bị xóa; tổng tiền cập nhật; trợ lý xác nhận "Dạ, em đã xóa Bún chả Hà Nội khỏi giỏ hàng ạ".
- Actual: Order Draft không thay đổi; trợ lý không hiểu ý định xóa.

## Root Cause Analysis
Không có intent handler cho "xóa/hủy món đã trong giỏ"; chỉ có "hết hàng" và "thêm món mới".

## Solution
Thêm `remove_from_draft` field trong `VoiceInterpretOut`; phát hiện intent xóa bằng cụm ("xóa", "hủy món", "bỏ") kết hợp tên món; `vApplyParse` gọi hàm xóa món khỏi draft khi nhận được `remove_from_draft`.

## Regression Risk
Cao — liên quan đến khả năng điều chỉnh đơn của khách.

## Test Plan
- Manual: thêm món → nói "Xóa [tên món]" → kiểm tra biến mất khỏi Draft.
- Manual: nói "Hủy món này" khi giỏ có 1 món → kiểm tra giỏ trống.
- TC liên quan: TC-US02-MAN-013.

---

# BUG-US02-008 — Gemini dùng SDK/model đã ngừng hỗ trợ

| Mục | Nội dung |
|---|---|
| Story | US-02 — AI Voice API gọi Gemini |
| Mức độ | **P1 — Critical** — toàn bộ tính năng Voice AI không hoạt động |
| Phát hiện | 2026-10-07, kiểm tra cấu hình backend — AI_USAGE_LOG A-NY08 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY08) |
| Trạng thái | Closed (Passed) |

## Summary
Backend gọi `gemini-2.0-flash` qua SDK cũ (`google-generativeai`) đã bị deprecated, dẫn đến lỗi 404 khi gọi Voice API; hệ thống fallback về rule-based kém chính xác hơn.

## Environment
Backend FastAPI / Render / `POST /api/v1/ai/voice-parse`.

## Reproduction Steps
1. Gõ bất kỳ yêu cầu gọi món bằng text trong trợ lý.
2. Backend gọi Gemini → nhận lỗi 404 model not found.
3. Trợ lý hiển thị toast "Không kết nối được AI".

## Expected vs Actual
- Expected: Voice API trả kết quả diễn giải hợp lệ; không có lỗi liên quan đến model hay SDK.
- Actual: API trả lỗi `404 Model not found`; fallback sang rule-based.

## Root Cause Analysis
Model `gemini-2.0-flash` bị ngừng hoạt động; SDK `google-generativeai` bị deprecated, cần chuyển sang `google-genai`.

## Solution
Cập nhật `pyproject.toml` dùng `google-genai`; đổi model mặc định thành `gemini-2.0-flash`; cập nhật `uv.lock`; sửa code khởi tạo client sang API mới.

## Regression Risk
Cao — ảnh hưởng toàn bộ tính năng Voice AI khi có `AI_API_KEY`.

## Test Plan
- Manual: gọi món bằng text với AI_API_KEY hợp lệ → kiểm tra phản hồi từ Gemini.
- Manual: kiểm tra không có lỗi model trong backend logs.
- TC liên quan: TC-US02-MAN-015.

---

# BUG-US02-009 — Nút mic FAB không kéo được trên điện thoại

| Mục | Nội dung |
|---|---|
| Story | US-02 — FAB micro có thể di chuyển trên màn hình |
| Mức độ | **P3 — Medium** — chỉ ảnh hưởng vị trí nút mic, không ảnh hưởng chức năng voice |
| Phát hiện | 2026-10-08, báo cáo từ Ny — AI_USAGE_LOG A-NY17 |
| Người sửa | Ny (AI hỗ trợ — AI_USAGE_LOG A-NY12, A-NY17) |
| Trạng thái | Closed (Passed) |

## Summary
Trên thiết bị cảm ứng, kéo nút mic không di chuyển được — trang bị cuộn thay thế; trên desktop hoạt động bình thường.

## Environment
Mobile Chrome / Android / `customer.html` / Màn hình E-Menu.

## Reproduction Steps
1. Mở `customer.html` trên điện thoại.
2. Nhấn và giữ nút mic màu cam.
3. Kéo ngón tay sang vị trí khác trên màn hình.
4. Quan sát: trang cuộn thay vì nút di chuyển.

## Expected vs Actual
- Expected: Nút mic di chuyển theo ngón tay đến vị trí mới; trang không bị cuộn; chạm ngắn vẫn mở trợ lý bình thường.
- Actual: Browser xử lý touch như scroll; nút không di chuyển.

## Root Cause Analysis
Có 2 bug trong `initFabDrag()`:
1. `onTouchMove` chỉ gọi `preventDefault()` sau khi `dragging && hasMoved` — quá trễ, browser đã scroll.
2. `onMoveGlobal` bỏ qua khi `dragging = false` nên touch move sớm không kích hoạt drag.

## Solution
- `preventDefault()` trong `touchmove` luôn chạy (không chờ điều kiện).
- `onMoveGlobal` tính `hasMoved` và kích hoạt drag ngay khi di chuyển > 6px, không cần chờ holdTimer.
- `touchstart` đổi sang `passive: false`.

## Regression Risk
Thấp — chỉ ảnh hưởng vị trí nút mic, không ảnh hưởng chức năng voice.

## Test Plan
- Manual trên mobile: vuốt ngón tay → nút di chuyển, trang không cuộn.
- Manual: chạm ngắn → trợ lý mở bình thường.
- TC liên quan: TC-US02-MAN-001.
