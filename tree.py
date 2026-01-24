import os

ROOT_DIR = r"C:\MY PROJECTS\New folder (3)\gurbani-radio"
OUTPUT_FILE = "directory_tree.txt"

with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
    for root, dirs, files in os.walk(ROOT_DIR):
        level = root.replace(ROOT_DIR, "").count(os.sep)
        indent = "    " * level
        out.write(f"{indent}📁 {os.path.basename(root)}\n")
        for file in files:
            out.write(f"{indent}    📄 {file}\n")

print("✅ Directory tree generated")
