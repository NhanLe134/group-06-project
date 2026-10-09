# Project Vault Index - Group 06 (Restaurant Operations & Smart Ordering)
Hệ thống Single Source of Truth cho con người và AI Agents (Claude Code / VSCode).

## QUY TẮC BẮT BUỘC KHI AI TRUY VẤN VAULT (AI VAULT GUARDRAILS):
### 1. Nguyên tắc truy vấn & phản hồi dữ liệu:
1. **Chỉ trả lời ngắn gọn dựa trên tài liệu trong `vault/`**: Tuyệt đối không dùng tri thức bên ngoài để lấp khoảng trống hoặc tự suy đoán (theo Mục 4 giáo trình). 
2. **Hạn chế trả lời dài dòng** đối với những câu hỏi có thể trả lời ngắn gọn.
3. **Trích dẫn nguồn bắt buộc**: Mọi câu trả lời phải nêu rõ mã Yêu cầu (`REQ-RO-xx`), mã Quy tắc (`BR-RO-xx`) và tên file nguồn.
4. **Quy tắc khi thiếu dữ liệu hoặc câu hỏi Unknown (Missing Data & Unknown Guardrail Rule - BẮT BUỘC)**:
   * Nếu trong `vault/` không có thông tin hoặc gặp tình huống ranh giới chưa được quy định tường minh / thuộc Out of Scope, AI **BẮT BUỘC TRẢ LỜI CỤM TỪ:**
     > **"KHÔNG ĐỦ DỮ LIỆU TRONG VAULT"**
   * **AI KHÔNG ĐƯỢC CHỈ CHỊU ĐƯA ĐỀ XUẤT RỒI DỪNG LẠI**, mà bắt buộc phải thực hiện theo cấu trúc phản hồi 5 phần chuẩn sau:
     1) Trích dẫn các mã Yêu cầu / Scope liên quan hiện có (`requirements.md`, `scope.md`).
     2) Chỉ ra chính xác khoảng trống nghiệp vụ chưa có trong Vault hoặc lý do thuộc Out of Scope.
     3) Đề xuất 2-3 phương án xử lý khả thi. Và **BẮT BUỘC HIỂN THỊ NGUYÊN VĂN CÂU CHUYỂN TIẾP SAU CÁC ĐỀ XUẤT**:
        > *"Nếu thấy các đề xuất phía trên không phù hợp, vui lòng trả lời các câu hỏi bên dưới để tôi đưa ra các phương án tốt hơn với bạn"*
      
      Sau đó Liệt kê 2-3 câu hỏi làm rõ (Open Questions) cụ thể bên dưới để con người phản hồi.
5. **Quy tắc Ghi tệp Quyết định (Decision Log & ADR Strict Rule - BẮT BUỘC)**:
   * File `vault/08-Decisions/decision-log.md` **CHỈ ĐƯỢC PHÉP GHI NỔI** khi có **QUYẾT ĐỊNH QUAN TRỌNG VỀ KIẾN TRÚC/NGHIỆP VỤ** và **DO CON NGƯỜI TRỰC TIẾP RA QUYẾT ĐỊNH CHỌN PHƯƠNG ÁN**.
   * AI tuyệt đối KHÔNG ĐƯỢC tự ý tự tạo hay tự ghi file `decision-log.md` khi con người chưa chốt phương án chính thức.
   * Khi con người chỉ chọn phương án cập nhật yêu cầu thông thường, AI chỉ ghi bổ sung vào `requirements.md` và `user-stories.md`, KHÔNG ghi vào `decision-log.md`.
6. **Giới hạn tệp được phép chỉnh sửa trực tiếp trong**:
   * **Các file AI ĐƯỢC PHÉP chỉnh sửa/đồng bộ khi con người chốt quyết định**:
     - `vault/01-Requirements/requirements.md` (Bổ sung BR/REQ mới từ ADR)
     - `vault/04-User-Stories/user-stories.md` (Cập nhật AC mới từ ADR)
     - `vault/07-QA/vault-qa-benchmark.md` (Điền kết quả kiểm thử)
     - `vault/08-Decisions/decision-log.md` (Ghi nhận bản ghi ADR khi có quyết định quan trọng của con người)
     - `docs/AI_USAGE_LOG.md` (Ghi nhận nhật ký AI chuẩn 6 cột)
     - `docs/TRACEABILITY.md` (Đồng bộ ma trận truy vết)
   * **TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý CHỈNH SỬA**: Mã nguồn `frontend/`, `backend/`, hoặc bất kỳ file nào ngoài danh mục nêu trên.
7. **Kiểm soát phạm vi**: Không tự ý thêm tính năng mới, không tự bịa giá tiền, không can thiệp trạng thái đơn hàng nếu không có trong tài liệu đã duyệt.
8. **Quy tắc Kiểm thử Mù (Blind Benchmark Rule)**:
   - Khi trả lời các câu hỏi kiểm chuẩn trong `vault/07-QA/vault-qa-benchmark.md`, AI **TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỌC TRƯỚC** cột *"Kỳ vọng chuẩn (Expected Answer)"*.
   - AI chỉ được phép đọc các tài liệu nguồn cho phép (`requirements.md`, `glossary.md`, `source-priority.md`...) để tự sinh câu trả lời tự nhiên dựa trên Vault context.
9.  **Tuân thủ đúng Output Schema của Giảng viên**: Mỗi phản hồi phải xuất ra đúng mẫu cấu trúc, liệt kê rõ mã ID (`REQ-RO-xx`, `BR-RO-xx`) và file nguồn trích dẫn.

10. **Quy tắc Giới hạn Phạm vi Chỉnh sửa Code (Scope Discipline Rule - BẮT BUỘC, ban hành bởi Lê Thị Thanh Nhàn 2026-10-06)**:
   * Khi được yêu cầu chỉnh sửa code/giao diện, AI **CHỈ ĐƯỢC THAY ĐỔI ĐÚNG NHỮNG NỘI DUNG / ELEMENT / FILE mà người dùng nêu trong yêu cầu**.
   * Mọi phần khác (markup, style, logic, copy, file lân cận) **PHẢI GIỮ NGUYÊN TUYỆT ĐỐI** — không "tiện tay" refactor, không đổi命名, không dọn dẹp phần không liên quan.
   * Nếu thấy vấn đề nằm ngoài phạm vi yêu cầu: chỉ **LIỆT KÊ** để người dùng quyết, KHÔNG tự sửa.

### 2. Các giới hạn nghiêm ngặt – AI KHÔNG được tự quyết định:
1. **Yêu cầu kinh doanh hoặc thay đổi scope** khi chưa có sự xác nhận từ con người.
2. **Dữ liệu nghiệp vụ quan trọng** (Giá, tồn kho, tổng tiền, quyền truy cập, trạng thái đơn hàng): AI không được phép override nguồn dữ liệu chuẩn (source-of-truth) của hệ thống.
3. **Trạng thái kỹ thuật**: Tuyệt đối không tự ý khẳng định *"test pass"*, *"deploy thành công"*, hay *"bug đã fix"* nếu chưa có bằng chứng (evidence) thực thi mới nhất.
4. **Phê duyệt mã nguồn (Merge code)**: Không merge code chỉ dựa vào nhận xét *"looks good"* của AI; bắt buộc phải chạy đầy đủ test/lint/build và có người thật review diff trước khi merge.

---

## ĐIỀU HƯỚNG ARTIFACT THEO THÀNH VIÊN (để báo cáo — giáo trình §16)

> Mỗi thành viên thêm 1 mục cho story mình sở hữu theo cùng mẫu. Link tính từ thư mục `vault/`.

### Nhã — US-03 KDS Bếp & AI Batching (+ US-08 Kiểm kê, trừ kho tự động)

**Live:** KDS staging `https://smart-orderding.vercel.app/pages/kitchen.html` · backend `https://group06-restaurant-api.onrender.com/health`

| Bước báo cáo | Artifact |
|---|---|
| Story + AC | [US-03](../docs/04-Backlog/user%20stories/US-03.md) · [US-08](../docs/04-Backlog/user%20stories/US-08.md) |
| Story Spec | [KDS](06-Engineering/story-spec-us03-kds.md) · [Trừ kho tự động](06-Engineering/story-spec-tru-kho-tu-dong.md) · [Kiểm kê US-08](06-Engineering/story-spec-us08-inventory.md) |
| Kiến trúc / API / dữ liệu | [architecture.md](06-Engineering/architecture.md) (ADR-ARCH-003, -004) · [api-contract.md](06-Engineering/api-contract.md) Mục 5–8 · [data-model.md](06-Engineering/data-model.md) |
| Quyết định | [decision_log_Nha.md](08-Decisions/decision_log_Nha.md) (ADR-NA01…11) |
| Code | KDS `frontend/fe_ofc/pages/kitchen.html`, `assets/js/kds-logic.js`, `assets/js/realtime.js` · backend `backend/app/routers/kds.py`, `services/kds.py`, `services/stock.py`, `routers/ingredients.py`, `services/inventory.py`, `logging_setup.py` |
| Commit / PR | Commit có Story ID `US-03` (vd. `4cd7adf`, `4cabf1c`, `ba696de`, `b3f8012`); lên `main` qua PR #5, #6 |
| Test case + kết quả | [test-cases-US03.md](../testing/test_cases/test-cases-US03.md) · [test-cases-US08.md](../testing/test_cases/test-cases-US08.md) · [Báo cáo test](../testing/reports/US-03/README.md) (độ phủ, số đo, mutation check) |
| Code test | `backend/tests/unit/`, `backend/tests/routers/test_kds.py`, `test_stock.py`, `test_inventory.py`, `test_logging.py`, `backend/tests/pg/` · `frontend/tests/kds-logic.test.js` · `testing/test_scripts/tests/us03-kds.spec.ts`, `us08-inventory.spec.ts`, `us03-smoke.spec.ts` |
| Bug + regression | [testing/bug-reports/](../testing/bug-reports/) — BUG-US03-001…005, BUG-US08-001 |
| Traceability | [traceability-matrix.md](../testing/traceability-matrix.md) — mục "Chi tiết truy vết US-03 / US-08" |
| Vận hành / log | [RUNBOOK](../docs/RUNBOOK.md) Mục 7 (xem log backend) |
| AI log | [AI_USAGE_LOG.md](../docs/AI_USAGE_LOG.md) (A-01…) |
| Kịch bản viva | [viva-script-us03.md](06-Engineering/viva-script-us03.md) |

**Còn mở:** AC4 (chờ JWT) · chớp đỏ 15 phút (REQ-08, chờ PO) · Q1–Q6 trừ kho + migration 011 (chờ nhóm duyệt).
