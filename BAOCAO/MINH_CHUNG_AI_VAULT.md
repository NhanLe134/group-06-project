# MINH CHỨNG & KỊCH BẢN BÁO CÁO - ROLE AI/VAULT

## 1. Workflow Git (Bước 21 - Quy chuẩn dự án):
- **Tên nhánh thực hiện Giai đoạn 2:** `feature/US-01-project-vault` (tách từ `develop` sau khi merge commit `f3a3368` của bạn Trang - Product/BA).
- **Quy trình Git:** `Taiga Task` -> `Create feature branch` -> `Implement Vault & Benchmark` -> `Commit theo chuẩn Angular` -> `Push & PR into develop`.
- **Định dạng Commit hợp lệ:**
  + `docs(vault): setup vault recommended structure and 00-index.md`
  + `docs(domain): import requirements, glossary and business-rules into vault`
  + `test(vault): add 20 benchmark Q&A questions and evaluation matrix`

## 2. Kịch bản trả lời Viva với Giảng viên (Phần Git & Vault):
- **Câu hỏi:** "Em làm thế nào để đảm bảo không đè code của bạn BA và quản lý phiên bản đúng quy trình?"
- **Trả lời:** "Dạ thưa Thầy, em tuân thủ nghiêm ngặt Workflow Git Bước 21. Em lấy commit mới nhất từ nhánh `feature/trang-ba-tasks` về nhánh `develop`, sau đó checkout nhánh riêng `feature/US-01-project-vault` để làm Giai đoạn 2. Mọi commit đều đánh mã tiền tố rõ ràng (`docs`, `feat`, `test`) và sẽ tạo Pull Request để đồng đội review trước khi merge."

## 3. Tự động hóa Nâng cao với Model Context Protocol (MCP) - ĐIỂM CỘNG DỰ ÁN:
- **Tài liệu đặc tả chi tiết:** `docs/06-Integrations/mcp-setup.md` & `vault/06-Integrations/mcp-setup.md`.
- **Tích hợp Taiga MCP Server (`@modelcontextprotocol/server-taiga`):**
  + AI tự động quét dữ liệu từ `user-stories.md` và khởi tạo 8 User Stories (`US-01` đến `US-08`) kèm điểm WBS Estimate (1-3 pts) lên Taiga Board.
  + AI tự động chuyển đổi trạng thái Sprint Task (`In Progress` ➔ `Closed`) ngay sau khi Git Merge Commit thành công trên `develop`.
- **Tích hợp Figma MCP Server (`@modelcontextprotocol/server-figma`):**
  + AI tự động đọc Design Tokens (Palette HSL, Touch targets $\ge 44\text{px}$) từ trang `1. Foundations` trên Figma Cloud.
  + AI tự động kiểm chứng 100% ánh xạ giữa Component ID (`CMP-VOICE-BTN`, `CMP-PROD-CARD`) với mã User Story (`US-01`, `US-02`).

## 4. Kịch bản trả lời Viva với Giảng viên (Phần MCP Integration):
- **Câu hỏi:** "Nhóm em có ứng dụng Model Context Protocol (MCP) để tự động hóa công việc với các công cụ như Taiga và Figma không?"
- **Trả lời:** "Dạ thưa Thầy, nhóm em đã thiết lập kiến trúc **MCP (Model Context Protocol)** hai chiều giữa AI Assistant với **Taiga API** và **Figma REST API**. AI của nhóm em có thể đọc trực tiếp tài liệu Backlog từ Vault để tự động tạo Task WBS trên Taiga, đồng thời kết nối tới file Figma để truy vấn các Design Tokens và kiểm tra độ tương phản chuẩn WCAG AA của các Component. Chi tiết cấu hình JSON và kịch bản lệnh CLI demo thầy có thể xem tại file `docs/06-Integrations/mcp-setup.md` ạ!"

