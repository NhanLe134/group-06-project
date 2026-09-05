# Output #16 - Design System & Handoff (DESIGN.md) - Group 06

> **Tài liệu**: Quy chuẩn Hệ thống Thiết kế & Handoff (Design System & Handoff Specification)  
> **Phiên bản**: 1.0 (Chuẩn theo Mẫu Output #16 của Giảng viên)  
> **Dự án**: Smart Restaurant Ordering — Group 06  
> **Người thực hiện**: Lê Thị Thanh Nhàn (Role UX/UI Designer & AI/Vault Master)  

---

## 1. DESIGN TOKENS (BẢNG TOKENS QUY CHUẨN)

| Token Name | Token Value | Usage / Application (Mục đích sử dụng) |
| :--- | :---: | :--- |
| `color.primary` | `#0D5C75` | Nút bấm chính (Primary CTA), trạng thái hoạt động của Trợ lý Voice AI. |
| `color.success` | `#15803D` | Thông báo thành công, đơn hàng đã chốt, trạng thái "Đã xong/Đã phục vụ". |
| `color.warning` | `#D97706` | Trạng thái làm rõ câu lệnh (Clarification), cảnh báo Bếp chờ quá 15 phút. |
| `color.danger` | `#DC2626` | Trạng thái món hết hàng (Out of Stock), hủy món, báo lỗi mạng. |
| `color.neutral.bg` | `#F8FAFC` | Màu nền ứng dụng di động di động (Mobile App background). |
| `color.neutral.card` | `#FFFFFF` | Nền thẻ món ăn, nền giỏ hàng Order Draft và Modal dialog. |
| `color.text.main` | `#0F172A` | Văn bản chính, tiêu đề món ăn, tổng tiền. |
| `color.text.muted` | `#64748B` | Mô tả phụ, ghi chú dị ứng, thời gian tạo đơn. |
| `radius.md` | `12px` | Bo góc cho Thẻ món ăn (Cards), Ô nhập liệu (Inputs), Modal dialogs. |
| `radius.full` | `9999px` | Bo góc cho Nút bấm Micro (Voice FAB), Nhãn trạng thái (Status Pills). |
| `space.base` | `4px scale` | Hệ tỷ lệ khoảng cách: 4px / 8px / 12px / 16px / 24px / 32px. |
| `type.heading` | `20px / 28px` | Tiêu đề màn hình, tên món ăn nổi bật (Font Weight: 700). |
| `type.body` | `16px / 24px` | Văn bản nội dung chính, danh sách món trong giỏ (Font Weight: 400). |
| `type.caption` | `13px / 18px` | Thông tin phụ, nhãn trạng thái KDS, mã đơn hàng (Font Weight: 500). |

---

## 2. COMPONENT INVENTORY (DANH MỤC LINH KIỆN & TRẠNG THÁI)

| Component Name | Variants / States | Accessibility & Behavior (Tiêu chí tiếp cận & Hành vi) |
| :--- | :--- | :--- |
| **VoiceButton** | `idle`, `listening`, `processing`, `disabled`, `error` | Đổi nhãn nút bấm theo trạng thái; hiển thị viền focus rõ ràng; bấm phím `Escape` hoặc nhấp lại để dừng thu âm. |
| **AssistantMessage** | `text`, `product-list`, `clarification`, `error` | Thiết lập thuộc tính `aria-live="polite"` để trình đọc màn hình phát âm thanh phản hồi AI mới ngay khi xuất hiện. |
| **ProductCard** | `default`, `out-of-stock`, `selected` | Giá tiền và trạng thái tồn kho đọc trực tiếp từ Props/Vault dữ liệu hệ thống; vô hiệu hóa nút bấm khi món mang trạng thái Out of Stock. |
| **CartItem** | `default`, `updating`, `error` | Vô hiệu hóa các thao tác bấm liên tục (Debounce mutation) khi đang cập nhật số lượng món trong giỏ. |
| **OrderDraft** | `review`, `changed`, `expired` | Hiển thị rõ dòng nhãn màu đỏ *"Bản nháp - Chưa gửi bếp"* ở đầu giỏ hàng cho đến khi bấm nút xác nhận chốt đơn. |
| **ConfirmDialog** | `default`, `loading`, `error` | Bẫy con trỏ phím (`Focus trap`); bấm phím `Enter` để xác nhận gửi bếp; bấm phím `Escape` để hủy bỏ modal. |
| **KDSTicketCard** | `pending`, `cooking`, `ready`, `overdue` | Thẻ đơn tại Bếp; tự động đổi nền nhấp nháy Đỏ khi thời gian chờ quá 15 phút (`REQ-08`). |
| **WaiterAlertCard** | `ready`, `served` | Phát âm thanh chuông báo khi có món từ Bếp hoàn tất (`REQ-07`); nút bấm lớn `Đã phục vụ` kích thước $\ge 44\text{px}$. |

---

## 3. DESIGN & RESPONSIVE RULES (QUY TẮC THIẾT KẾ)

1. **Quy tắc Thiết kế Di động (Mobile-First Breakpoint)**:
   - Khung hình di động Khách hàng: `max-width: 430px` (Chiều rộng Smartphone tiêu chuẩn).
   - Khung hình Bếp KDS / Waiter Tablet: `min-width: 768px` (Màn hình Tablet làm việc).
2. **Tiêu chuẩn Tiếp cận (Accessibility Standard - WCAG AA)**:
   - Kích thước vùng chạm cảm ứng (Touch Target Size): Tối thiểu $44 \times 44\text{px}$ cho tất cả nút bấm.
   - Độ tương phản màu sắc (Color Contrast Ratio): Tối thiểu 4.5:1 giữa chữ và nền.
   - Nhãn rõ ràng (Explicit Labels): Mọi nút biểu tượng icon (Micro, 🗑, ＋, −) đều phải chứa thuộc tính `aria-label`.

---

## 2. TYPOGRAPHY SYSTEM (HỆ KIỂU CHỮ)

### 2.1 Font family và nguyên tắc dùng

| Token | Giá trị đề xuất | Dùng cho |
| :--- | :--- | :--- |
| `font.family.sans` | `"Be Vietnam Pro", "Segoe UI", Roboto, Arial, sans-serif` | Font mặc định cho toàn bộ giao diện. Be Vietnam Pro hiển thị dấu tiếng Việt rõ ở cỡ nhỏ; các font sau là fallback hệ thống. |
| `font.family.numeric` | Kế thừa `font.family.sans`; bật `font-variant-numeric: tabular-nums` | Giá, số lượng, mã đơn, đồng hồ KDS và thời gian chờ để các chữ số không nhảy chiều rộng. |
| `font.weight.regular` | `400` | Đoạn nội dung, mô tả và ghi chú dài. |
| `font.weight.medium` | `500` | Caption, thông tin phụ và nhãn không cần nhấn mạnh. |
| `font.weight.semibold` | `600` | Label biểu mẫu, chip, trạng thái và thông tin cần quét nhanh. |
| `font.weight.bold` | `700` | Heading, button và tên món. |
| `font.weight.extrabold` | `800` | Brand, giá tiền, tổng tiền, mã đơn và CTA chính. |

Không dùng quá hai weight trong cùng một card (trừ giá hoặc trạng thái). Tránh dùng `300`, chữ nghiêng và toàn chữ HOA cho nội dung tiếng Việt dài vì giảm khả năng đọc trên màn hình nhỏ.

### 2.2 Type scale chuẩn

Thang chữ dưới đây bám theo prototype 430px: heading màn hình `24px`, section `18px`, card/title `14–15px`, và metadata `10–13px`. Ký hiệu `size / line-height` dùng đơn vị px.

| Token | Size / line-height | Weight | Letter spacing | Áp dụng | Ví dụ |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `type.display` | `28 / 36` | 800 | `-0.02em` | Tiêu đề splash hoặc success state; tối đa 2 dòng. | “Đặt món thật dễ” |
| `type.h1` | `24 / 32` | 800 | `-0.01em` | Tiêu đề chính của một màn hình. | “Thực đơn hôm nay” |
| `type.h2` | `18 / 26` | 700 | `0` | Tiêu đề section, sheet hoặc modal. | “Đơn đã gửi” |
| `type.h3` | `15 / 20` | 700 | `0` | Tên món, mã đơn, tiêu đề card/ticket. | “Cơm gà xối mỡ” |
| `type.body-lg` | `16 / 24` | 400 | `0` | Đoạn nội dung ưu tiên, thông báo modal dài. | “Kiểm tra lại đơn trước khi gửi bếp.” |
| `type.body` | `14 / 20` | 400 | `0` | Paragraph mặc định, chat, nội dung danh sách. | “Không hành, ít cay.” |
| `type.body-sm` | `13 / 18` | 400 | `0` | Mô tả phụ trong card, trạng thái đơn. | “Dự kiến hoàn thành sau 10 phút.” |
| `type.label` | `14 / 20` | 600 | `0` | Nhãn input, chip, nhãn điều khiển. | “Danh mục món” |
| `type.button` | `14 / 20` | 700 | `0` | Nội dung button; không thu nhỏ dưới `14px`. | “Gửi xuống bếp” |
| `type.price` | `14 / 20` | 800 | `0` | Giá món, tổng tiền; dùng số dạng tabular. | “65.000 ₫” |
| `type.caption` | `12 / 16` | 500 | `0` | Timestamp, dòng phụ, ghi chú ngắn. | “Cập nhật lúc 10:42” |
| `type.note` | `12 / 18` | 400 | `0` | Note/hint, hướng dẫn, disclaimer; cho phép 2–3 dòng. | “Bạn có thể thay đổi món trước khi gửi.” |
| `type.badge` | `11 / 14` | 700 | `0.01em` | Status pill, badge, số đếm. | “ĐANG NẤU” |
| `type.overline` | `11 / 16` | 800 | `0.05em`, uppercase | Nhãn nhóm nhỏ như `DEMO`, header bảng. Chỉ dùng cho từ/cụm ngắn. | “TRẠNG THÁI” |
| `type.micro` | `10 / 14` | 700 | `0.02em` | Chỉ cho nhãn timeline, header bảng và metadata cực ngắn; không dùng cho paragraph. | “MỚI” |

### 2.3 Mapping theo thành phần trong prototype

| Vị trí | Token phải dùng | Quy tắc bổ sung |
| :--- | :--- | :--- |
| Brand/top bar | `type.h3` hoặc `15 / 20 / 800` | Một dòng, không truncate tên thương hiệu. |
| Tiêu đề màn hình và splash | `type.h1`; splash có thể dùng `type.display` | Căn giữa chỉ ở splash/success; màn hình nghiệp vụ căn trái. |
| Tên món, mã đơn, ticket KDS | `type.h3` | Tên món dài được xuống tối đa 2 dòng; mã đơn ưu tiên một dòng. |
| Mô tả món, nội dung chat, transcript | `type.body` | Line-height không thấp hơn 1.4 để đọc được tiếng Việt và lời nói chuyển văn bản. |
| Giá, tổng tiền, số lượng, timer | `type.price` hoặc `type.h3` + tabular numbers | Căn phải/căn giữa nhất quán trong bảng; không viết tắt gây mơ hồ. |
| Button CTA và nút thao tác | `type.button` | Câu lệnh bắt đầu bằng động từ; nút icon vẫn có `aria-label`. |
| Badge trạng thái, stock chip, notification count | `type.badge` | Có thể uppercase, nhưng luôn kết hợp màu và/hoặc icon — không truyền đạt trạng thái chỉ bằng màu. |
| Ghi chú, helper text, đơn nháp, timestamp | `type.note` hoặc `type.caption` | Màu muted; note cảnh báo dùng màu semantic nhưng vẫn giữ độ tương phản AA. |
| Header bảng hóa đơn và timeline | `type.overline` hoặc `type.micro` | Không dùng `type.micro` cho thông tin cần người dùng đọc để quyết định. |

### 2.4 Quy tắc paragraph, note và khả năng tiếp cận

- Paragraph mặc định dùng `type.body` (`14 / 20 / 400`), rộng lý tưởng 45–70 ký tự; đoạn dài trong modal dùng `type.body-lg` (`16 / 24`). Không căn đều hai bên (`justify`).
- `type.note` chỉ bổ sung ngữ cảnh, không chứa điều kiện quan trọng duy nhất. Cảnh báo cần hành động dùng tối thiểu `type.body-sm` (`13px`) và một heading/label rõ ràng.
- `type.caption` và `type.micro` không dùng cho nội dung thao tác cốt lõi. Nếu người dùng phải đọc để chọn món, xác nhận hoặc xử lý lỗi, dùng cỡ tối thiểu `13px`.
- Màu chữ chính phải đạt tương phản WCAG AA tối thiểu 4.5:1 với nền. Text dưới `14px` hoặc weight dưới `600` cần được kiểm tra đặc biệt; không dùng `color.text.muted` cho thông tin bắt buộc.
- Giữ tối thiểu `8px` khoảng cách từ heading đến nội dung liền sau, `4px` giữa label và input, và `12px` giữa các paragraph độc lập. Không dùng chữ để bù cho thiếu khoảng trắng.
- Giá, số lượng, timer và mã đơn bật `font-variant-numeric: tabular-nums`; timer KDS không dùng font condensed để tránh khó đọc khi đứng xa.

### 2.5 CSS handoff

```css
:root {
  --font-sans: "Be Vietnam Pro", "Segoe UI", Roboto, Arial, sans-serif;
  --type-h1: 800 24px/32px var(--font-sans);
  --type-h2: 700 18px/26px var(--font-sans);
  --type-h3: 700 15px/20px var(--font-sans);
  --type-body: 400 14px/20px var(--font-sans);
  --type-note: 400 12px/18px var(--font-sans);
  --type-button: 700 14px/20px var(--font-sans);
  --type-badge: 700 11px/14px var(--font-sans);
}

.numeric { font-variant-numeric: tabular-nums; }
```
