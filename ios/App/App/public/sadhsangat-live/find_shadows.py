import re

file_path = r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\sadhsangat-live\index.html"
out_path = r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\sadhsangat-live\find_shadows.txt"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

output = []
for i, line in enumerate(lines):
    if 'shadow' in line or 'bottom-nav' in line:
        output.append(f"Line {i+1}: {line.strip()}")

with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(output))
print("Done")
