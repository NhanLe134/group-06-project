import os
import re

app_path = r"E:\MIS3032\group-06-project\frontend\prototype\js\app.js"
data_path = r"E:\MIS3032\group-06-project\frontend\prototype\js\data.js"
css_path = r"E:\MIS3032\group-06-project\frontend\prototype\css\styles.css"
html_path = r"E:\MIS3032\group-06-project\frontend\prototype\index.html"

# 1. HTML
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()
    
fonts = """  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/@phosphor-icons/web"></script>
"""
if "fonts.googleapis.com" not in html:
    html = html.replace("<link rel=\"stylesheet\"", fonts + '  <link rel="stylesheet"')
    html = html.replace("🍽️", "<i class='ph-fill ph-fork-knife'></i>")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

# 2. DATA.JS
with open(data_path, "r", encoding="utf-8") as f:
    data = f.read()

data = re.sub(r'const SVG_BOWL = `.*?`;', 'const SVG_BOWL = `<i class="ph-duotone ph-bowl-food" style="font-size:32px; color:var(--primary)"></i>`;', data)
data = re.sub(r'const SVG_MEAT = `.*?`;', 'const SVG_MEAT = `<i class="ph-duotone ph-meat" style="font-size:32px; color:var(--primary)"></i>`;', data)
data = re.sub(r'const SVG_DRINK = `.*?`;', 'const SVG_DRINK = `<i class="ph-duotone ph-brandy" style="font-size:32px; color:var(--primary)"></i>`;', data)
data = re.sub(r'const SVG_USER = `.*?`;', 'const SVG_USER = `<i class="ph-duotone ph-user" style="font-size:28px"></i>`;', data)
data = re.sub(r'const SVG_CHEF = `.*?`;', 'const SVG_CHEF = `<i class="ph-duotone ph-chef-hat" style="font-size:28px"></i>`;', data)
data = re.sub(r'const SVG_BELL = `.*?`;', 'const SVG_BELL = `<i class="ph-duotone ph-bell" style="font-size:28px"></i>`;', data)
data = re.sub(r'const SVG_CASH = `.*?`;', 'const SVG_CASH = `<i class="ph-duotone ph-wallet" style="font-size:28px"></i>`;', data)
data = re.sub(r'const SVG_CHART = `.*?`;', 'const SVG_CHART = `<i class="ph-duotone ph-chart-bar" style="font-size:28px"></i>`;', data)

with open(data_path, "w", encoding="utf-8") as f:
    f.write(data)

# 3. APP.JS emojis
emojis = {
    '🍽️': '<i class="ph-duotone ph-fork-knife"></i>',
    '🤖': '<i class="ph-duotone ph-robot"></i>',
    '🛒': '<i class="ph-duotone ph-shopping-cart"></i>',
    '🎙️': '<i class="ph-duotone ph-microphone"></i>',
    '✕': '<i class="ph-bold ph-x"></i>',
    '🍳': '<i class="ph-duotone ph-cooking-pot"></i>',
    '🧹': '<i class="ph-duotone ph-broom"></i>',
    '🧾': '<i class="ph-duotone ph-receipt"></i>',
    '📋': '<i class="ph-duotone ph-clipboard-text"></i>',
    '🔔': '<i class="ph-duotone ph-bell-ringing"></i>',
    '💳': '<i class="ph-duotone ph-credit-card"></i>',
    '🔒': '<i class="ph-duotone ph-lock-key"></i>',
    '💵': '<i class="ph-duotone ph-money"></i>',
    '📊': '<i class="ph-duotone ph-chart-bar"></i>',
    '👨‍🍳': '<i class="ph-duotone ph-chef-hat"></i>',
    '⚠️': '<i class="ph-fill ph-warning-circle" style="color:var(--red)"></i>',
    '🔥': '<i class="ph-fill ph-fire" style="color:var(--primary)"></i>',
    '✨': '<i class="ph-fill ph-sparkle"></i>',
    '✓': '<i class="ph-bold ph-check"></i>',
    '➤': '<i class="ph-bold ph-paper-plane-right"></i>',
    '＋': '<i class="ph-bold ph-plus"></i>',
    '−': '<i class="ph-bold ph-minus"></i>',
    '🗑': '<i class="ph-duotone ph-trash"></i>',
    '›': '<i class="ph-bold ph-caret-right"></i>',
    '▶': '<i class="ph-bold ph-play"></i>'
}

with open(app_path, "r", encoding="utf-8") as f:
    app = f.read()

for em, icon in emojis.items():
    app = app.replace(em, icon)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app)

# 4. STYLES.CSS
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Replace root
new_root = """:root {
  --primary: #FF5A36;
  --primary-soft: #FFF0ED;
  --bg: #F8FAFC;
  --card: #FFFFFF;
  --ink: #0F172A;
  --muted: #64748B;
  --line: #E2E8F0;
  --red: #EF4444;
  --red-soft: #FEF2F2;
  --green: #10B981;
  --green-soft: #ECFDF5;
  --radius: 20px;
  --shadow-sm: 0 4px 12px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 12px 32px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 24px 48px rgba(15, 23, 42, 0.12);
}"""
css = re.sub(r':root\s*\{[^}]+\}', new_root, css)

# Replace font
css = re.sub(r'font-family:[^;]+;', "font-family: 'Outfit', sans-serif;", css)
# Ensure any other hardcoded fonts are gone
css = css.replace("font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;", "font-family: 'Outfit', sans-serif;")

# Glassmorphism on topbar & sticky bar
css = css.replace('.topbar { background: #fff;', '.topbar { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); box-shadow: var(--shadow-sm);')
css = css.replace('.sticky-bar { background: #fff;', '.sticky-bar { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(16px); box-shadow: 0 -4px 24px rgba(0,0,0,0.06); border-top: 1px solid rgba(255,255,255,0.5);')

# Smooth shadows and hover on cards
css = css.replace('.card {\n  display: flex;', '.card {\n  box-shadow: var(--shadow-sm); transition: all 0.3s ease;\n  display: flex;')

# Thumb style
css = css.replace('.thumb { width: 60px; height: 60px; background: var(--bg); border-radius: 12px;',
                  '.thumb { width: 72px; height: 72px; background: var(--primary-soft); border-radius: 16px;')

# Buttons upgrade
css = css.replace('border-radius: 999px;', 'border-radius: 12px;')

# Splash screen premium
css = css.replace('.splash-wrap { background: linear-gradient(160deg, #fff4e6, #ffe8cc 60%, #ffd8a8); }', 
                  '.splash-wrap { background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%); }')
css = css.replace('.splash-logo { font-size: 50px; margin-bottom: 20px;',
                  '.splash-logo { font-size: 56px; margin-bottom: 24px; color: var(--primary);')
css = css.replace('.role-card {', '.role-card { box-shadow: var(--shadow-sm); transition: all 0.3s ease;')
css = css.replace('.rc-emoji { font-size: 28px; }', '.rc-emoji { display:flex; align-items:center; justify-content:center; width:48px; height:48px; background:var(--primary-soft); color:var(--primary); border-radius:12px; font-size: 24px; }')
css = css.replace('.rc-arrow { font-size: 24px;', '.rc-arrow { font-size: 20px; color: var(--primary);')
css = css.replace('h1 { font-weight: 800; font-size: 24px;', 'h1 { font-weight: 800; font-size: 28px; letter-spacing: -0.03em;')
css = css.replace('h2 { font-size: 18px; }', 'h2 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }')

# Append hovers
css += "\n.card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--primary); }\n"
css += ".role-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--primary); }\n"
css += "button { cursor: pointer; transition: all 0.2s; }\n"
css += ".btn-add:hover { background: var(--primary); color: #fff; }\n"

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("UI Upgraded!")
