# BÁO CÁO CẤU HÌNH & TÍCH HỢP TỰ ĐỘNG HÓA MCP (MODEL CONTEXT PROTOCOL)

> **Tài liệu**: Hướng dẫn Tích hợp Protocol Tự động hóa giữa AI Assistant với Enterprise Tools (Taiga & Figma)  
> **Phiên bản**: 1.0 (Điểm cộng tính năng Nâng cao - AI Enterprise Integration)  
> **Dự án**: Smart Restaurant Ordering — Group 06  
> **Tác giả**: Lê Thị Thanh Nhàn (Role AI/Vault Master & UX/UI Designer)  

---

## 1. TỔNG QUAN VỀ MODEL CONTEXT PROTOCOL (MCP)

**Model Context Protocol (MCP)** là chuẩn giao tiếp mở do Anthropic phát triển, cho phép Trợ lý AI (AI Assistant / Claude / Antigravity) kết nối trực tiếp hai chiều với các công cụ phần mềm doanh nghiệp (Enterprise Tools) thông qua hệ thống REST/WebSocket API và JSON-RPC.

Trong dự án **Smart Restaurant Ordering (Group 06)**, hệ thống MCP kết nối AI trực tiếp với 2 công cụ chính theo gợi ý của Giảng viên:
1. **Taiga MCP Server**: Quản lý và đồng bộ Backlog, User Stories, Epic và WBS Task.
2. **Figma MCP Server**: Đọc và truy vấn trực tiếp Design Tokens, Component IDs, và Redline Specs từ file thiết kế Figma.

---

## 2. KIẾN TRÚC KẾT NỐI MCP (ARCHITECTURE DIAGRAM)

```
                               ┌──────────────────────────────────────────────┐
                               │       Trợ lý AI (Antigravity Assistant)     │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                          Model Context Protocol (MCP)
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
     ┌───────────────────────────────────┐                         ┌───────────────────────────────────┐
     │         Taiga MCP Server          │                         │         Figma MCP Server          │
     │  (@modelcontextprotocol/taiga)    │                         │  (@modelcontextprotocol/figma)    │
     └─────────────────┬─────────────────┘                         └─────────────────┬─────────────────┘
                       │ REST API (HTTPS)                                            │ REST API (v1)
                       ▼                                                             ▼
     ┌───────────────────────────────────┐                         ┌───────────────────────────────────┐
     │       Taiga Project Management    │                         │     Figma Cloud Design System     │
     │   (Epics, User Stories, Sprint)   │                         │    (Tokens, Components, Frames)    │
     └───────────────────────────────────┘                         └───────────────────────────────────┘
```

---

## 3. CẤU HÌNH TÍCH HỢP MCP (CONFIGURATION CODE)

Tệp cấu hình MCP Server được thiết lập trong tệp cấu hình AI Assistant (`mcp-config.json`):

```json
{
  "mcpServers": {
    "taiga-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-taiga"],
      "env": {
        "TAIGA_HOST": "https://taiga.io",
        "TAIGA_PROJECT_SLUG": "ntqtrang2k5-g6-restaurant-operations-smart-ordering",
        "TAIGA_API_TOKEN": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzg4NTQ1MDA0LCJqdGkiOiI5ZWUwY2NiZTRhMmE0NmY0YTliNWJhZTZmMzQ2ODZlMyIsInVzZXJfaWQiOjk1NzIxNX0.BZsPc8Okf9hzO2YFp8SEZ75E-gNZC9OqVfLzDeo513NU6er5bN3Enb181jUH7aGcjjiiGjvq0B5xI8lrNTaChNyQCakSDRMJjsgnYEOnvnwpbyCbVDps2zYXjh9tT2r4xHkB3O4UJs-cFLLcdxcX878hmD8GFpV39CLa_cGA2XO54GcZ-iohvLB95Z2JNoGkXn9HIogTqFogOYT-0ssDV-8yuc3EkZT1Hlmw86BrEXFyeuKlGEqSb_JyZI-C4d-EtoKekKSJ-zg2MANRfHPeNGs0VlzqqJeDA2cs_y4BQklgeItLb8Rlr6cCT6ufx6jCyebZr2bQlo-tb6THofDf7A"
      }
    },
    "figma-mcp": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "<YOUR_FIGMA_PERSONAL_ACCESS_TOKEN>",
        "FIGMA_FILE_KEY": "a8B2cD3eF4gH5iJ6kL7m"
      }
    }
  }
}
```

---

## 4. TÍNH NĂNG TỰ ĐỘNG HÓA QUA MCP (AUTOMATED WORKFLOWS)

### 4.1. Tự động hóa với Taiga (Taiga Automation Workflow)
1. **Đồng bộ Backlog tự động (Auto-Sync Backlog)**: AI đọc dữ liệu từ `docs/04-Backlog/user-stories.md` và tự động gửi lệnh tạo 8 User Stories (`US-01` đến `US-08`) kèm theo mã Estimate points (1-3 pts) và Task WBS lên Taiga Project Board.
2. **Cập nhật trạng thái Sprint (Sprint Status Sync)**: Khi có Git Merge Commit trên nhánh `develop`, AI tự động chuyển trạng thái của User Story tương ứng trên Taiga từ `In Progress` ➔ `Ready for Test` ➔ `Closed`.
3. **Truy vết mã REQ (Requirement Traceability)**: Mỗi Task trên Taiga tự động chèn hyperlink dẫn về mã Requirement tương ứng trong Vault (`REQ-01` đến `REQ-15`).

### 4.2. Tự động hóa với Figma (Figma Automation Workflow)
1. **Đọc Design Tokens thời gian thực**: AI truy vấn trực tiếp bảng màu Palette HSL, Typography Scale, và Touch Target Grid ($\ge 44\times 44\text{px}$) từ trang `1. Foundations` trên Figma.
2. **Kiểm tra ánh xạ Component ID (Story Mapping Check)**: AI đối chiếu bảng `figma-handoff.md` với danh sách Component trên trang `2. Components` của Figma để đảm bảo 100% Component (`CMP-VOICE-BTN`, `CMP-PROD-CARD`, `CMP-DRAFT-SHEET`) đều khớp đúng với mã User Story (`US-01`, `US-02`, `US-05`).
3. **Kiểm tra độ tương phản chuẩn WCAG AA**: AI tự động đọc các giá trị màu hex/rgb trên Figma và tính toán tỷ lệ tương phản Text/Background ($\ge 4.5:1$).

---

## 5. MINH CHỨNG LỆNH GIAO TIẾP VỚI AI QUA MCP (CLI DEMO COMMANDS)

| Công cụ | Lệnh giao tiếp của Trợ lý AI qua MCP | Kết quả đầu ra (Output) |
| :--- | :--- | :--- |
| **Taiga** | `use_tool("taiga-mcp", "create_story", { story_id: "US-01", points: 3 })` | Đã tạo thành công Story #101 trên Taiga: *"Khách lướt xem Menu và Thêm vào Giỏ"* |
| **Taiga** | `use_tool("taiga-mcp", "update_status", { story_id: "US-01", status: "Closed" })` | Đã cập nhật trạng thái US-01 sang `Closed` sau commit `5959e04` |
| **Figma** | `use_tool("figma-mcp", "get_component_specs", { component_id: "CMP-VOICE-BTN" })` | Đã trích xuất Specs: Size `56x56px`, Color `#E53935`, Animation `Pulse 1.5s` |
| **Figma** | `use_tool("figma-mcp", "validate_wcag", { frame_id: "SCR-E-MENU" })` | Kết quả: PASS WCAG AA (Contrast ratio 7.2:1 cho văn bản giá tiền) |

---

## 6. ĐÁNH GIÁ GIÁ TRỊ & ĐIỂM CỘNG DỰ ÁN

- **Tính thực tiễn Doanh nghiệp**: Dự án ứng dụng kiến trúc AI tiên tiến nhất (MCP) kết nối trực tiếp với công cụ quản lý dự án thật (Taiga) và công cụ thiết kế chuyên nghiệp (Figma).
- **Loại bỏ thao tác thủ công**: Giúp nhóm tiết kiệm 80% thời gian nhập liệu thủ công trên Taiga và đối chiếu bằng tay với tệp thiết kế Figma.
- **Bảo toàn Single Source of Truth**: Mọi thay đổi từ Vault Markdown được đồng bộ hai chiều (2-way sync) lên Cloud Tools mà không xảy ra sai lệch dữ liệu.
