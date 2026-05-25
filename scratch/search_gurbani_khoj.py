import os
import re

files_to_check = [
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\GurbaniKhoj\gurbani-khoj.js",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\GurbaniKhoj\shabad-reader.js",
    r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\GurbaniKhoj\search-history.js"
]

keywords = [
    r"anhad_theme",
    r"theme",
    r"dark",
    r"light",
    r"applyTheme"
]

output_lines = []
for path in files_to_check:
    if not os.path.exists(path):
        output_lines.append(f"File not found: {path}\n")
        continue
    
    output_lines.append(f"\n========================================\nFile: {os.path.basename(path)}\n========================================\n")
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        for idx, line in enumerate(lines, 1):
            for kw in keywords:
                if re.search(kw, line, re.IGNORECASE):
                    # Clean line to prevent unicode/ASCII print problems
                    clean_line = line.strip().encode('ascii', errors='replace').decode('ascii')
                    output_lines.append(f"  Line {idx}: {clean_line[:120]}\n")
                    break
    except Exception as e:
        output_lines.append(f"  Error reading file: {e}\n")

output_path = r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\scratch\theme_search_results.txt"
with open(output_path, "w", encoding="utf-8") as f:
    f.writelines(output_lines)

print(f"Results written to {output_path}")
