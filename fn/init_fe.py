import os
import shutil

base_dir = r"E:\MIS3032\group-06-project\frontend\fe_ofc"
proto_dir = r"E:\MIS3032\group-06-project\frontend\prototype"

directories = [
    "assets/css",
    "assets/js",
    "assets/images",
    "pages/customer",
    "pages/staff",
    "pages/manager"
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
      <h1>Hệ Thống Smart Ordering</h1>
      <p class="splash-sub">Cổng phân chia Workspace (Frontend Mới)</p>
      
      <p class="splash-q" style="margin-top: 10px;">Dành cho Khách hàng</p>
      <a href="pages/customer/emenu.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-device-mobile"></i></span>
          <span class="rc-text"><b>Khách: E-Menu</b><small>US-01: Nhàn</small></span>
        </button>
      </a>
      <a href="pages/customer/voice.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-microphone"></i></span>
          <span class="rc-text"><b>Khách: Voice AI</b><small>US-02: Ny</small></span>
        </button>
      </a>

      <p class="splash-q">Dành cho Vận hành</p>
      <a href="pages/staff/kds.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-cooking-pot"></i></span>
          <span class="rc-text"><b>Bếp: KDS</b><small>US-03: Nhã</small></span>
        </button>
      </a>
      <a href="pages/staff/waiter.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-bell-ringing"></i></span>
          <span class="rc-text"><b>Phục vụ: Waiter</b><small>US-04: Trang</small></span>
        </button>
      </a>
      <a href="pages/staff/cashier.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-money"></i></span>
          <span class="rc-text"><b>Thu ngân: Cashier</b><small>US-05: Nhàn</small></span>
        </button>
      </a>

      <p class="splash-q">Dành cho Quản lý</p>
      <a href="pages/manager/dashboard.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-chart-line-up"></i></span>
          <span class="rc-text"><b>Quản lý: Dashboard</b><small>US-06: Trang</small></span>
        </button>
      </a>
      <a href="pages/manager/menu-cms.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-list-dashes"></i></span>
          <span class="rc-text"><b>Quản lý: CMS Menu</b><small>US-07: Ny</small></span>
        </button>
      </a>
      <a href="pages/manager/inventory.html" style="text-decoration:none; color:inherit;">
        <button class="role-card">
          <span class="rc-emoji"><i class="ph-duotone ph-archive"></i></span>
          <span class="rc-text"><b>Quản lý: Tồn kho</b><small>US-08: Nhã</small></span>
        </button>
      </a>
    </div>
  </div>
</body>
</html>
"""
with open(os.path.join(base_dir, "index.html"), "w", encoding="utf-8") as f:
    f.write(portal_html)

# 3. Create individual pages
pages = {
    "pages/customer/emenu.html": "Khách: E-Menu (US-01) - Nhàn",
    "pages/customer/voice.html": "Khách: Voice AI (US-02) - Ny",
    "pages/staff/kds.html": "Bếp: KDS (US-03) - Nhã",
    "pages/staff/waiter.html": "Phục vụ: Waiter (US-04) - Trang",
    "pages/staff/cashier.html": "Thu ngân: Cashier (US-05) - Nhàn",
    "pages/manager/dashboard.html": "Quản lý: Dashboard (US-06) - Trang",
    "pages/manager/menu-cms.html": "Quản lý: CMS Menu (US-07) - Ny",
    "pages/manager/inventory.html": "Quản lý: Tồn kho (US-08) - Nhã"
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
  <link rel="stylesheet" href="../../assets/css/global.css">
</head>
<body>
  <header class="topbar">
    <div class="brand-row">
      <span class="brand">Smart Ordering</span>
      <b>{title}</b>
      <a href="../../index.html"><button class="btn-logout"><i class="ph-bold ph-house"></i> Về Portal</button></a>
    </div>
  </header>
  
  <div class="screen">
    <div class="card">
      <div class="info">
        <h2>Không gian code của {title}</h2>
        <p style="margin-top: 10px; color: var(--muted);">Bắt đầu thiết kế giao diện của bạn tại đây bằng cách sử dụng các class từ <b>global.css</b> (ví dụ: btn-primary, card, status-pill, v.v.)</p>
      </div>
    </div>
  </div>

  <script src="../../assets/js/mock-data.js"></script>
  <script src="../../assets/js/utils.js"></script>
</body>
</html>
"""

for path, title in pages.items():
    with open(os.path.join(base_dir, path), "w", encoding="utf-8") as f:
        f.write(boilerplate.replace("{title}", title))

print("fe_ofc initialized!")
