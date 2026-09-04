# Project Vault Index - Group 06 (Restaurant Operations & Smart Ordering)
Hệ thống Single Source of Truth cho con người và AI Agents (Claude Code / VSCode).

## 1. BẢN ĐỒ CẤU TRÚC TÀI LIỆU VAULT:
- `source-priority.md`: Luật phân xử thứ bậc ưu tiên nguồn khi xảy ra mâu thuẫn.
- `01-Requirements/requirements.md`: Danh mục REQ (FR, NFR), Business Rules (BR) và Scope.
- `01-Requirements/glossary.md`: Từ điển thuật ngữ chuẩn cho con người và AI.
- `02-Research/interview-notes.md`: Ghi chép phỏng vấn thô 3 người dùng thực tế.
- `02-Research/user-research.md`: Tổng hợp Persona, JTBD và Pain points.
- `05-Design/DESIGN.md`: Quy chuẩn Hệ thống Thiết kế (Design System Tokens & Rules - Output #16).
- `05-Design/prototype-findings.md`: Báo cáo kết quả kiểm thử Usability & Prototype Findings.
- `07-QA/vault-qa-benchmark.md`: Bảng kiểm chuẩn 18 câu hỏi đánh giá AI.
- `08-Decisions/decision-log.md`: Nhật ký quyết định kiến trúc và thay đổi nghiệp vụ (ADR-001..004).
- `docs/AI_USAGE_LOG.md`: Nhật ký kiểm soát AI và bằng chứng con người can thiệp (A-01..A-13).

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
   * File `vault/08-Decisions/decision-log.md` **CHỈ ĐƯỢC PHÉP GHI NỔI** khi có **QUYẾT ĐỊNH QUAN TRỌNG VỀ KIẾN TRÚC/NGHIỆP VỤ (ADR)** và **DO CON NGƯỜI (NHÀN) TRỰC TIẾP RA QUYẾT ĐỊNH CHỌN PHƯƠNG ÁN**.
   * AI tuyệt đối KHÔNG ĐƯỢC tự ý tự tạo hay tự ghi file `decision-log.md` khi con người chưa chốt phương án chính thức.
   * Khi con người chỉ chọn phương án cập nhật yêu cầu thông thường, AI chỉ ghi bổ sung vào `requirements.md` và `user-stories.md`, KHÔNG ghi vào `decision-log.md`.
6. **Giới hạn tệp được phép chỉnh sửa trực tiếp trong Bài 1 (Exercise 1 Scope & File Access Guardrail)**:
   * **Các file AI ĐƯỢC PHÉP chỉnh sửa/đồng bộ khi con người chốt quyết định**:
     - `vault/01-Requirements/requirements.md` (Bổ sung BR/REQ mới từ ADR)
     - `vault/04-User-Stories/user-stories.md` (Cập nhật AC mới từ ADR)
     - `vault/07-QA/vault-qa-benchmark.md` (Điền kết quả kiểm thử)
     - `vault/08-Decisions/decision-log.md` (Ghi nhận bản ghi ADR khi có quyết định quan trọng của con người)
     - `docs/AI_USAGE_LOG.md` (Ghi nhận nhật ký AI chuẩn 6 cột)
     - `docs/TRACEABILITY.md` (Đồng bộ ma trận truy vết)
   * **TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý CHỈNH SỬA**: Mã nguồn `frontend/`, `backend/`, hoặc bất kỳ file nào ngoài danh mục Bài 1 nêu trên.
7. **Kiểm soát phạm vi (No Scope Creep - Mục 2.3 giáo trình)**: Không tự ý thêm tính năng mới, không tự bịa giá tiền, không can thiệp trạng thái đơn hàng nếu không có trong tài liệu đã duyệt.
8. **Quy tắc Kiểm thử Mù (Blind Benchmark Rule)**:
   - Khi trả lời các câu hỏi kiểm chuẩn trong `vault/07-QA/vault-qa-benchmark.md`, AI **TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỌC TRƯỚC** cột *"Kỳ vọng chuẩn (Expected Answer)"*.
   - AI chỉ được phép đọc các tài liệu nguồn cho phép (`requirements.md`, `glossary.md`, `source-priority.md`...) để tự sinh câu trả lời tự nhiên dựa trên Vault context.
9.  **Tuân thủ đúng Output Schema của Giảng viên**: Mỗi phản hồi phải xuất ra đúng mẫu cấu trúc, liệt kê rõ mã ID (`REQ-RO-xx`, `BR-RO-xx`) và file nguồn trích dẫn.

### 2. Các giới hạn nghiêm ngặt – AI KHÔNG được tự quyết định:
1. **Yêu cầu kinh doanh hoặc thay đổi scope** khi chưa có sự xác nhận từ con người.
2. **Dữ liệu nghiệp vụ quan trọng** (Giá, tồn kho, tổng tiền, quyền truy cập, trạng thái đơn hàng): AI không được phép override nguồn dữ liệu chuẩn (source-of-truth) của hệ thống.
3. **Trạng thái kỹ thuật**: Tuyệt đối không tự ý khẳng định *"test pass"*, *"deploy thành công"*, hay *"bug đã fix"* nếu chưa có bằng chứng (evidence) thực thi mới nhất.
4. **Phê duyệt mã nguồn (Merge code)**: Không merge code chỉ dựa vào nhận xét *"looks good"* của AI; bắt buộc phải chạy đầy đủ test/lint/build và có người thật review diff trước khi merge.
