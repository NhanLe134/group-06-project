import os

base_dir = r"E:\MIS3032\group-06-project\frontend\fe_ofc\pages"

notes = {
    "customer.html": """
        <!-- BẢNG PHÂN CÔNG NHIỆM VỤ -->
        <div style="margin-top: 15px; padding: 15px; background: #fff8e6; border-left: 4px solid #f59f00; border-radius: 8px;">
            <h4 style="margin-top:0; margin-bottom: 8px; color: #d9480f;">📋 Nhiệm vụ trang Khách hàng (Customer)</h4>
            <ul style="margin-left: 20px; font-size: 14px; line-height: 1.6; color: #495057;">
                <li><b>Nhàn (US-01):</b> Code giao diện danh sách món ăn (E-Menu), thanh phân loại (Combo, Đồ uống...), và chức năng Giỏ hàng.</li>
                <li><b>Ny (US-02):</b> Code giao diện Trợ lý Voice AI (Nút micro), popup chat bằng giọng nói và phần AI gợi ý món theo sở thích (Preference).</li>
            </ul>
        </div>
""",
    "kitchen.html": """
        <!-- BẢNG PHÂN CÔNG NHIỆM VỤ -->
        <div style="margin-top: 15px; padding: 15px; background: #fff8e6; border-left: 4px solid #f59f00; border-radius: 8px;">
            <h4 style="margin-top:0; margin-bottom: 8px; color: #d9480f;">📋 Nhiệm vụ trang Bếp (Kitchen KDS)</h4>
            <ul style="margin-left: 20px; font-size: 14px; line-height: 1.6; color: #495057;">
                <li><b>Nhã (US-03):</b> Code giao diện KDS theo dạng cột Kanban (Chờ nấu -> Đang nấu -> Xong), nút bấm chuyển trạng thái món và thông báo hết nguyên liệu.</li>
            </ul>
        </div>
""",
    "waiter.html": """
        <!-- BẢNG PHÂN CÔNG NHIỆM VỤ -->
        <div style="margin-top: 15px; padding: 15px; background: #fff8e6; border-left: 4px solid #f59f00; border-radius: 8px;">
            <h4 style="margin-top:0; margin-bottom: 8px; color: #d9480f;">📋 Nhiệm vụ trang Phục vụ (Waiter)</h4>
            <ul style="margin-left: 20px; font-size: 14px; line-height: 1.6; color: #495057;">
                <li><b>Trang (US-04):</b> Code giao diện hiển thị danh sách bàn, nhận thông báo (alert) khi Bếp làm xong món, và nút bấm xác nhận "Đã phục vụ món".</li>
            </ul>
        </div>
""",
    "cashier.html": """
        <!-- BẢNG PHÂN CÔNG NHIỆM VỤ -->
        <div style="margin-top: 15px; padding: 15px; background: #fff8e6; border-left: 4px solid #f59f00; border-radius: 8px;">
            <h4 style="margin-top:0; margin-bottom: 8px; color: #d9480f;">📋 Nhiệm vụ trang Thu ngân (Cashier)</h4>
            <ul style="margin-left: 20px; font-size: 14px; line-height: 1.6; color: #495057;">
                <li><b>Nhàn (US-05):</b> Code giao diện danh sách hóa đơn các bàn đang ăn, chi tiết hóa đơn (bill), nút bấm "Thanh toán" và "Đóng bàn (Close)".</li>
            </ul>
        </div>
""",
    "manager.html": """
        <!-- BẢNG PHÂN CÔNG NHIỆM VỤ -->
        <div style="margin-top: 15px; padding: 15px; background: #fff8e6; border-left: 4px solid #f59f00; border-radius: 8px;">
            <h4 style="margin-top:0; margin-bottom: 8px; color: #d9480f;">📋 Nhiệm vụ trang Quản lý (Manager)</h4>
            <p style="font-size: 13px; color: #868e96; margin-bottom: 8px;">*Trang này cần có 3 Tab/Nút để chuyển đổi qua lại giữa 3 chức năng dưới đây:</p>
            <ul style="margin-left: 20px; font-size: 14px; line-height: 1.6; color: #495057;">
                <li><b>Trang (US-06):</b> Code phần Tab <b>Dashboard</b>, vẽ biểu đồ doanh thu, thống kê món bán chạy.</li>
                <li><b>Ny (US-07):</b> Code phần Tab <b>CMS Menu</b>, giao diện dạng bảng để thêm/sửa/xóa món ăn và cập nhật giá.</li>
                <li><b>Nhã (US-08):</b> Code phần Tab <b>Tồn kho (Inventory)</b>, giao diện đối soát số lượng nguyên liệu bị trừ cuối ngày.</li>
            </ul>
        </div>
"""
}

for file_name, note_html in notes.items():
    file_path = os.path.join(base_dir, file_name)
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        target = '<div class="info">'
        if target in content:
            new_content = content.replace(target, target + "\n" + note_html, 1)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
print("Notes added")
