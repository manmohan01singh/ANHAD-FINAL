import os
import re

files_to_check = [
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\ShabadVichar\shabad-vichar.html",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\ShabadVichar\shabad-vichar.js",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\GurbaniKhoj\gurbani-khoj.html",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\GurbaniKhoj\gurbani-khoj.js",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\GurbaniKhoj\shabad-reader.html",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\GurbaniKhoj\shabad-reader.js",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\GurbaniKhoj\search-history.html",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\GurbaniKhoj\search-history.js",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\Notes\notes.html",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\Notes\notes-integration.js",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\Notes\notes-manager.js",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\Notes\notes-ui.js",
]

keywords = [
    r"AnhadTheme",
    r"global-theme",
    r"applyTheme",
    r"toggleTheme",
    r"themechange",
    r"theme-variables",
    r"anhad_theme"
]

print("Scanning files for theme keywords...")
for path in files_to_check:
    if not os.path.exists(path):
        print(f"File not found: {path}")
        continue
    
    print(f"\nFile: {os.path.basename(path)}")
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        for idx, line in enumerate(lines, 1):
            for kw in keywords:
                if re.search(kw, line, re.IGNORECASE):
                    print(f"  Line {idx}: {line.strip()[:100]}")
    except Exception as e:
        print(f"  Error reading file: {e}")
