# MINH CHỨNG & KỊCH BẢN BÁO CÁO - ROLE AI/VAULT

## 1. Workflow Git (Bước 21 - Quy chuẩn dự án):
- **Tên nhánh thực hiện Giai đoạn 2:** `feature/US-01-project-vault` (tách từ `develop` sau khi merge commit `f3a3368` của bạn Trang - Product/BA).
- **Quy trình Git:** `Taiga Task` -> `Create feature branch` -> `Implement Vault & Benchmark` -> `Commit theo chuẩn Angular` -> `Push & PR into develop`.
- **Định dạng Commit hợp lệ:**
  + `docs(vault): setup vault recommended structure and 00-index.md`
  + `docs(domain): import requirements, glossary and business-rules into vault`
  + `test(vault): add 20 benchmark Q&A questions and evaluation matrix`

## 2. Kịch bản trả lời Viva với Giảng viên:
- **Câu hỏi:** "Em làm thế nào để đảm bảo không đè code của bạn BA và quản lý phiên bản đúng quy trình?"
- **Trả lời:** "Dạ thưa Thầy, em tuân thủ nghiêm ngặt Workflow Git Bước 21. Em lấy commit mới nhất từ nhánh `feature/trang-ba-tasks` về nhánh `develop`, sau đó checkout nhánh riêng `feature/US-01-project-vault` để làm Giai đoạn 2. Mọi commit đều đánh mã tiền tố rõ ràng (`docs`, `feat`, `test`) và sẽ tạo Pull Request để đồng đội review trước khi merge."
