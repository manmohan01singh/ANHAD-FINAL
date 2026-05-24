import re
import os

print("=" * 60)
print("  ANHAD Bottom Nav Bar Fixer")
print("=" * 60)

# 1. Update Dashboard
f_dash = 'ANHAD-FINAL/frontend/Dashboard/dashboard.html'
if os.path.exists(f_dash):
    c_dash = open(f_dash, encoding='utf-8', errors='ignore').read()
    c_dash_norm = c_dash.replace('\r\n', '\n')
    t_dash = '<nav class="tab-bar" id="mainNav" aria-label="Main Navigation">\n<a href="../index.html" class="tab-item">\n<span class="tab-icon">??</span>\n<span class="tab-label">Home</span>\n</a>\n<a href="../Insights/insights.html" class="tab-item">\n<span class="tab-icon">??</span>\n<span class="tab-label">Learning</span>\n</a>\n<a href="../Favorites/favorites.html" class="tab-item">\n<span class="tab-icon">??</span>\n<span class="tab-label">Favorites</span>\n</a>\n<a href="dashboard.html" class="tab-item active">\n<span class="tab-icon">??</span>\n<span class="tab-label">Dashboard</span>\n</a>\n</nav>'
    r_dash = '<nav class="tab-bar" id="mainNav" aria-label="Main Navigation">\n  <a href="../index.html" class="tab-item">\n    <span class="tab-icon">\U0001f3e0</span>\n    <span class="tab-label">Home</span>\n  </a>\n  <a href="../Insights/insights.html" class="tab-item">\n    <span class="tab-icon">\U0001f4da</span>\n    <span class="tab-label">Learning</span>\n  </a>\n  <a href="../Favorites/favorites.html" class="tab-item">\n    <span class="tab-icon">\u2764\ufe0f</span>\n    <span class="tab-label">Favorites</span>\n  </a>\n  <a href="dashboard.html" class="tab-item active">\n    <span class="tab-icon">\U0001f4c8</span>\n    <span class="tab-label">Dashboard</span>\n  </a>\n</nav>'
    
    if t_dash in c_dash_norm:
        c_dash_norm = c_dash_norm.replace(t_dash, r_dash)
        open(f_dash, 'w', encoding='utf-8').write(c_dash_norm)
        print('[+] Updated Dashboard tab-bar successfully')
    else:
        # Fallback check
        print('[!] Exact Dashboard match not found, attempting loose match...')
        pattern = r'<nav class="tab-bar" id="mainNav"[^>]*>.*?</nav>'
        c_dash_norm, count = re.subn(pattern, r_dash, c_dash_norm, flags=re.DOTALL)
        if count > 0:
            open(f_dash, 'w', encoding='utf-8').write(c_dash_norm)
            print('[+] Updated Dashboard tab-bar via regex successfully')
        else:
            print('[!] Dashboard match failed completely')

# 2. Update Favorites
f_fav = 'ANHAD-FINAL/frontend/Favorites/favorites.html'
if os.path.exists(f_fav):
    c_fav = open(f_fav, encoding='utf-8', errors='ignore').read()
    c_fav_norm = c_fav.replace('\r\n', '\n')
    t_fav = '<nav class="tab-bar" id="mainNav" aria-label="Main Navigation">\n<a href="../index.html" class="tab-item">\n<span class="tab-icon">??</span>\n<span class="tab-label">Home</span>\n</a>\n<a href="../Insights/insights.html" class="tab-item">\n<span class="tab-icon">??</span>\n<span class="tab-label">Learning</span>\n</a>\n<a href="favorites.html" class="tab-item active">\n<span class="tab-icon">??</span>\n<span class="tab-label">Favorites</span>\n</a>\n<a href="../Dashboard/dashboard.html" class="tab-item">\n<span class="tab-icon">??</span>\n<span class="tab-label">Dashboard</span>\n</a>\n</nav>'
    r_fav = '<nav class="tab-bar" id="mainNav" aria-label="Main Navigation">\n  <a href="../index.html" class="tab-item">\n    <span class="tab-icon">\U0001f3e0</span>\n    <span class="tab-label">Home</span>\n  </a>\n  <a href="../Insights/insights.html" class="tab-item">\n    <span class="tab-icon">\U0001f4da</span>\n    <span class="tab-label">Learning</span>\n  </a>\n  <a href="favorites.html" class="tab-item active">\n    <span class="tab-icon">\u2764\ufe0f</span>\n    <span class="tab-label">Favorites</span>\n  </a>\n  <a href="../Dashboard/dashboard.html" class="tab-item">\n    <span class="tab-icon">\U0001f4c8</span>\n    <span class="tab-label">Dashboard</span>\n  </a>\n</nav>'
    
    if t_fav in c_fav_norm:
        c_fav_norm = c_fav_norm.replace(t_fav, r_fav)
        open(f_fav, 'w', encoding='utf-8').write(c_fav_norm)
        print('[+] Updated Favorites tab-bar successfully')
    else:
        print('[!] Exact Favorites match not found, attempting loose match...')
        pattern = r'<nav class="tab-bar" id="mainNav"[^>]*>.*?</nav>'
        c_fav_norm, count = re.subn(pattern, r_fav, c_fav_norm, flags=re.DOTALL)
        if count > 0:
            open(f_fav, 'w', encoding='utf-8').write(c_fav_norm)
            print('[+] Updated Favorites tab-bar via regex successfully')
        else:
            print('[!] Favorites match failed completely')

# 3. Update Insights
f_ins = 'ANHAD-FINAL/frontend/Insights/insights.html'
if os.path.exists(f_ins):
    c_ins = open(f_ins, encoding='utf-8', errors='ignore').read()
    c_ins_norm = c_ins.replace('\r\n', '\n')
    pattern = r'<nav class="tab-bar" id="mainNav"[^>]*>.*?</nav>'
    r_ins = '<nav class="tab-bar" id="mainNav" aria-label="Main Navigation">\n  <a href="../index.html" class="tab-item" data-set-session="1" data-anhad-back="../index.html">\n    <span class="tab-icon">\U0001f3e0</span>\n    <span class="tab-label">Home</span>\n  </a>\n  <a href="insights.html" class="tab-item active">\n    <span class="tab-icon">\U0001f4da</span>\n    <span class="tab-label">Learning</span>\n  </a>\n  <a href="../Favorites/favorites.html" class="tab-item">\n    <span class="tab-icon">\u2764\ufe0f</span>\n    <span class="tab-label">Favorites</span>\n  </a>\n  <a href="../Dashboard/dashboard.html" class="tab-item">\n    <span class="tab-icon">\U0001f4c8</span>\n    <span class="tab-label">Dashboard</span>\n  </a>\n</nav>'
    
    c_ins_new, count = re.subn(pattern, r_ins, c_ins_norm, flags=re.DOTALL)
    if count > 0:
        open(f_ins, 'w', encoding='utf-8').write(c_ins_new)
        print('[+] Updated Insights tab-bar successfully')
    else:
        print('[!] Insights match failed')

print("=" * 60)
print("  All Navigation fixes executed!")
print("=" * 60)
