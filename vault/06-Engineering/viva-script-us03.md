# Kịch bản thuyết trình cá nhân — Báo cáo lần 1 (Bài 1 + Bài 2)

> Vai trò: Engineering (Nhã). Story sở hữu: US-03 — Bếp nhận Order và Báo hoàn thành trên KDS. Tổng thời lượng: 5 phút. Đọc thử 1-2 lần trước, không học thuộc lòng cứng nhắc — đây là bản nháp để bạn nói tự nhiên theo ý mình.

---

## [0:00 – 0:45] Giới thiệu vai trò (~45 giây, không mở file)

> "Chào thầy/cô, em là Nhã, phụ trách vai trò Engineering trong nhóm — chịu trách nhiệm về Architecture, Data Model, API contract và phần implementation kỹ thuật.
>
> Story em sở hữu xuyên suốt từ yêu cầu đến thiết kế là US-03: Bếp nhận Order và báo hoàn thành trên màn hình KDS — đây là story có 2 rủi ro kỹ thuật chính: phải hiển thị real-time và phải cảnh báo đúng lúc khi món trễ quá 15 phút.
>
> Em sẽ trình bày theo đúng thứ tự: yêu cầu gốc ở Bài 1, sau đó là thiết kế kỹ thuật ở Bài 2, một ví dụ dùng AI có kiểm chứng, và cuối cùng là phần hỏi đáp."

---

## [0:45 – 2:15] Artifact Bài 1 (~90 giây)

**[Mở `vault/00-Index.md`]**

> "Đầu tiên, đây là Project Vault của nhóm — nơi lưu single source of truth, cả người và AI đều đọc từ đây thay vì suy đoán. Cấu trúc chia theo 8 mục từ Requirements đến Decisions."

**[Mở `vault/01-Requirements/requirements.md`, dừng ở dòng REQ-08 và REQ-09]**

> "Story US-03 của em bắt nguồn từ 2 requirement chính: REQ-08 — màn hình KDS phải sắp xếp đơn theo thứ tự ưu tiên và nhấp nháy đỏ khi chờ quá 15 phút; và REQ-09 — nút Out of Stock phải khóa món trên mọi thiết bị ngay lập tức. Cả hai đều được đánh dấu Must, nguồn là phỏng vấn trực tiếp Bếp trưởng Hùng."

**[Mở `vault/07-QA/vault-qa-benchmark.md`, dừng ở câu Q10]**

> "Để chắc chắn Vault đủ dữ liệu cho AI trả lời đúng, tụi em có bộ benchmark 18 câu hỏi. Câu Q10 là edge-case khó nhất liên quan trực tiếp US-03 — món chuyển Out of Stock ngay khi khách đang giữ trong giỏ hàng. Lần test đầu tiên AI chỉ trả lời 'không đủ dữ liệu' rồi dừng lại, tụi em phải sửa Vault 2 lần mới đạt Correct ở lần thứ 3. Cả bộ benchmark hiện đạt 100% ở lần chạy cuối."

---

## [2:15 – 3:45] Artifact Bài 2 (~90 giây)

**[Mở `vault/04-User-Stories/user-stories.md`, mục US-03]**

> "Từ 2 requirement đó, em viết User Story US-03 với 3 Acceptance Criteria: đơn tự động nhảy lên KDS kèm đồng hồ đếm ngược, ticket chớp đỏ khi quá 15 phút, và khóa món ngay lập tức khi Bếp bấm Out of Stock."

**[Mở `vault/06-Engineering/architecture.md`, chỉ vào sơ đồ Container và Mục 4]**

> "Đây là phần em làm nhiều nhất — tài liệu kiến trúc theo chuẩn C4. Em chọn kiến trúc Monolith thay vì Microservices, lý do chính là team nhỏ và CI/CD chỉ chạy trên GitHub Actions với 1 workflow duy nhất, không cần orchestrate nhiều service. Cho US-03, phần quan trọng là WebSocket Pub/Sub ở đây — channel `kds:tickets` để đẩy real-time, có sẵn code mẫu ConnectionManager bằng FastAPI native WebSocket."

**[Mở `vault/06-Engineering/api-contract.md`, Mục 5, event TICKET_OVERDUE]**

> "Và đây là payload cụ thể cho sự kiện TICKET_OVERDUE — không chỉ nói 'sẽ có cảnh báo', mà đã định nghĩa rõ JSON gửi xuống client gồm ticket ID, thời gian đã chờ, và cờ is_overdue."

**[Mở terminal đã chạy sẵn `uv run pytest`, hoặc mở `backend/app/routers/menu.py`]**

> "Để chứng minh kiến trúc này chạy được chứ không chỉ nằm trên giấy, em đã dựng vertical slice đầu tiên — story US-01, endpoint GET /menu chạy thật với FastAPI và PostgreSQL, có 3 test pass, CI xanh cả backend lẫn frontend. Phần WebSocket của US-03 chưa code — em sẽ làm tiếp theo đúng pattern đã thiết kế sẵn ở đây."

---

## [3:45 – 4:45] AI Usage Log (~60 giây)

**[Mở `docs/AI_USAGE_LOG.md`, dừng ở entry A-13]**

> "Đây là một ví dụ em dùng AI có kiểm soát. Khi AI soạn file architecture.md, nó tự đặt tên 2 quyết định kiến trúc là ADR-001 và ADR-002 — nhưng nhóm đã có sẵn một ADR-001 khác trong decision-log.md, nói về xử lý món hết hàng trong giỏ hàng, hoàn toàn khác chủ đề. Em phát hiện ra khi đọc chéo 2 file, và yêu cầu AI đổi tên thành ADR-ARCH-001, ADR-ARCH-002 để tách rõ quyết định kiến trúc với quyết định nghiệp vụ, tránh trùng mã khi tra cứu sau này.
>
> Đây đúng theo quy trình Context → Plan → Generate → Verify — AI sinh nhanh, nhưng người kiểm chứng và ra quyết định cuối cùng."

---

## [4:45 – 5:00] Câu chuyển sang hỏi đáp (~15 giây)

> "Đó là toàn bộ phần em phụ trách — từ requirement REQ-08, REQ-09, đến thiết kế kiến trúc và vertical slice chạy thật. Em sẵn sàng trả lời câu hỏi ạ."

---

## Ghi chú dự phòng — nếu bị hỏi xoáy về "chưa làm gì"

Nếu thầy/cô hỏi thẳng "vậy US-03 chạy được chưa" — **trả lời thật, đừng chống chế**:

> "Dạ chưa ạ, US-03 hiện mới ở mức spec đầy đủ (architecture, API contract, sequence trong story spec) — code WebSocket thật em chưa làm vì ưu tiên dựng xong vertical slice đầu tiên để chứng minh toàn bộ pipeline CI/DB/deploy chạy được trước. Bước tiếp theo là implement đúng theo `architecture.md` Mục 4 đã thiết kế sẵn."

Câu trả lời trung thực kiểu này an toàn hơn nhiều so với nói quá — đúng tinh thần "AI tạo tốc độ, sinh viên chịu trách nhiệm kiểm chứng" của giáo trình.
