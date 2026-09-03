# Báo cáo Thẩm định AI (Verification Report 4)
**Ngày thực hiện:** 03/09/2026
**Nhiệm vụ:** Kiểm duyệt Logic Nghiệp vụ (Business Rules) trong Acceptance Criteria.

## 1. Phát hiện lỗi Vi phạm Business Rule
AI đã tự ý định nghĩa sai nghiệp vụ trong Acceptance Criteria của User Story đặt món:
- **AC sai (Nháp):** `GIVEN khách đồng ý với gợi ý của AI, WHEN khách nhắn "Ok", THEN hệ thống tự động chốt đơn và đẩy thẳng xuống bếp.`
- **Lý do sai:** Vi phạm nghiêm trọng Business Rule về Explicit Confirmation. Đơn hàng ăn uống liên quan đến tiền bạc, AI không được quyền tự động quyết định chốt bill thay khách. Bắt buộc phải qua màn hình Order Draft (Nháp) để con người tự bấm nút "Xác nhận".

## 2. Kết luận & Hành động
BA đã bác bỏ AC nháp của AI, ép buộc AI phải viết lại AC theo chuẩn: `GIVEN Order Draft có món, WHEN khách muốn chốt, THEN hệ thống bắt buộc hiển thị popup tổng tiền và nút "Xác nhận đặt món"`. Lỗi đã được khắc phục hoàn toàn trong file `user-stories.md`.
