# DECISION LOG (ADR - Architecture & Business Decision Log)

## ADR-001: Quy tắc xử lý món chuyển Out of Stock khi đang nằm trong Order Draft
- **Ngày quyết định**: 2026-09-01
- **Người quyết định**: Lê Thị Thanh Nhàn (Role: AI/Vault & UX/UI)
- **Bối cảnh**: AI Vault phát hiện lỗ hổng tri thức (Missing Data) khi món chuyển Out of Stock (`REQ-09`) trong lúc khách đang giữ trong Order Draft nhưng chưa bấm xác nhận (`REQ-02`).
- **Quyết định chính thức (Human Decision)**:
  1. Khi món chuyển OOS, item đó trong Order Draft của khách sẽ tự động **chuyển sang màu xám (Grayed-out)** kèm nhãn đỏ *"Món đã hết"*.
  2. Nút "Xác nhận gửi bếp" (Explicit Confirmation) sẽ **bị khóa (Disabled)** cho đến khi khách xóa món OOS đó ra khỏi Order Draft.
  3. AI Assistant sẽ hiển thị thông báo nhẹ nhàng: *"Dạ món [Tên món] vừa hết hàng, anh/chị vui lòng bỏ món khỏi danh sách để chốt đơn nhé!"*.
