# SOURCE-PRIORITY (Quy tắc ưu tiên nguồn) 

Khi xảy ra xung đột hoặc mâu thuẫn thông tin giữa các tài liệu, cần bắt buộc tuân theo thứ tự ưu tiên từ cao xuống thấp như sau:

1. Business rules / requirements đã được nhóm xác nhận mới nhất (`vault/01-Requirements/requirements.md`).
2. ADR / Decision Log đã Approved (`vault/08-Decisions/decision-log.md`).
3. PRD current version (`docs/PRD.md`).
4. User Story / Acceptance Criteria current sprint (`vault/04-User-Stories/user-stories.md`).
5. Prototype / Figma (minh họa hành vi, không tự tạo business rule).
6. Ghi chép phỏng vấn / Chat / AI output chỉ là working note nếu chưa được integrate (`vault/02-Research/interview-notes.md`).

Nguyên tắc phân xử khi xung đột:
- Tuyệt đối không tự ý chọn nguồn thấp hơn.
- Mở câu hỏi hoặc Decision Log để con người xác nhận trước khi cập nhật tài liệu.

