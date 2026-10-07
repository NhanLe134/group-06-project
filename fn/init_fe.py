import os
import shutil

base_dir = r"E:\MIS3032\group-06-project\frontend\fe_ofc"
proto_dir = r"E:\MIS3032\group-06-project\frontend\prototype"

directories = [
    "assets/css",
    "assets/js",
    "assets/images",
    "pages"
]

for d in directories:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

# 1. Copy global assets
shutil.copy(os.path.join(proto_dir, "css", "styles.css"), os.path.join(base_dir, "assets", "css", "global.css"))
shutil.copy(os.path.join(proto_dir, "js", "data.js"), os.path.join(base_dir, "assets", "js", "mock-data.js"))

with open(os.path.join(base_dir, "assets", "js", "utils.js"), "w", encoding="utf-8") as f:
    f.write("/* Chứa các hàm tiện ích chung (format tiền, thời gian, gọi API mock) */\n")
    f.write("const fmtVND = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);\n")

# 2. Create Portal index.html
portal_html = """<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Restaurant - Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/@phosphor-icons/web"></script>
  <link rel="stylesheet" href="assets/css/global.css">
</head>
<body>
  <div class="phone splash-wrap">
    <div class="splash" style="padding-top: 40px;">
      <div class="splash-logo"><i class="ph-duotone ph-storefront"></i></div>
      <h1>Smart Restaurant Ordering</h1>
      <p class="splash-sub">Cổng Phân chia Màn hình (FE Workspace)</p>
      
      <p class="splash-q" style="margin-top: 10px;">Bạn là vai trò nào?</p>
      
      <a href="pages/customer.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-user"></i></span>
          <span class="rc-text"><b>Khách gọi món</b><small>Phụ trách: Nhàn & Ny</small></span>
        </button>
      </a>

      <a href="pages/kitchen.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-chef-hat"></i></span>
          <span class="rc-text"><b>Bếp KDS</b><small>Phụ trách: Nhã</small></span>
        </button>
      </a>

      <a href="pages/waiter.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-bell-ringing"></i></span>
          <span class="rc-text"><b>Phục vụ Waiter</b><small>Phụ trách: Trang</small></span>
        </button>
      </a>

      <a href="pages/cashier.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-wallet"></i></span>
          <span class="rc-text"><b>Thu ngân Cashier</b><small>Phụ trách: Nhàn</small></span>
        </button>
      </a>

      <a href="pages/manager.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-chart-bar"></i></span>
          <span class="rc-text"><b>Quản lý Manager</b><small>Phụ trách: Trang, Ny, Nhã</small></span>
        </button>
      </a>

    </div>
  </div>
</body>
</html>
"""
with open(os.path.join(base_dir, "index.html"), "w", encoding="utf-8") as f:
    f.write(portal_html)

# 3. Delete old directories if they exist
old_dirs = ["pages/customer", "pages/staff", "pages/manager"]
for d in old_dirs:
    p = os.path.join(base_dir, d)
    if os.path.exists(p):
        shutil.rmtree(p)

# 4. Create individual pages
pages = {
    "pages/customer.html": "Màn hình Khách hàng (Nhàn & Ny)",
    "pages/kitchen.html": "Màn hình Bếp KDS (Nhã)",
    "pages/waiter.html": "Màn hình Phục vụ Waiter (Trang)",
    "pages/cashier.html": "Màn hình Thu ngân Cashier (Nhàn)",
    "pages/manager.html": "Màn hình Quản lý Manager (Trang, Ny, Nhã)"
}

boilerplate = """<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/@phosphor-icons/web"></script>
  <link rel="stylesheet" href="../assets/css/global.css">
</head>
<body>
  <header class="topbar">
    <div class="brand-row">
      <span class="brand">Smart Ordering</span>
      <b>{title}</b>
      <a href="../index.html"><button class="btn-logout"><i class="ph-bold ph-house"></i> Về Portal</button></a>
    </div>
  </header>
  
  <div class="screen">
    <div class="card">
      <div class="info">
        <h2>Không gian code của {title}</h2>
        <p style="margin-top: 10px; color: var(--muted);">Bắt đầu thiết kế giao diện của bạn tại đây bằng cách sử dụng các class từ <b>global.css</b>.</p>
        <div style="margin-top: 15px; padding: 10px; background: var(--primary-soft); border-radius: 8px;">
            <p style="color: var(--primary); font-weight: 600;">*Lưu ý về "Code cũ đâu rồi?":</p>
            <p style="margin-top: 5px; font-size: 14px;">Mớ code giao diện (HTML) cũ của bản Demo Prototype nằm trọn vẹn trong file <b>frontend/prototype/js/app.js</b> (trong các hàm render...). Bạn hãy mở file đó lên, copy các đoạn HTML tương ứng vứt thẳng vào đây là có ngay giao diện cũ nhé!</p>
        </div>
      </div>
    </div>
  </div>

  <script src="../assets/js/mock-data.js"></script>
  <script src="../assets/js/utils.js"></script>
</body>
</html>
"""

for path, title in pages.items():
    with open(os.path.join(base_dir, path), "w", encoding="utf-8") as f:
        f.write(boilerplate.replace("{title}", title))

print("fe_ofc restructured to 5 roles!")
