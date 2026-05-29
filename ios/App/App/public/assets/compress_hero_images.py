"""
ANHAD Hero Card Image Compressor — Ultimate Power Edition
Converts all 12 hero card PNGs + morning background PNG to WebP.
Target: <200 KB each (from 2-3 MB originals).
Clean filenames, no spaces, no typos.
"""
from PIL import Image
import os

ASSETS = os.path.dirname(os.path.abspath(__file__))
HERO_DIR = os.path.join(ASSETS, "HERO CARD IMAGES")

# Map: original messy filename -> clean target basename (no spaces, clean naming)
HERO_IMAGES = {
    # MORNING
    "MORNING DARBAR SAHIB CARD IMAGE .png":       "morning-darbar-sahib.webp",
    "MORNING AMRITVELA KIRTAN CARD IMAGE .png":   "morning-amritvela-kirtan.webp",
    "MORNING WAHEGURU SIMRAN CARD IMAGE .png":    "morning-waheguru-simran.webp",
    # DAY
    "DAY DARABR SAHIB CARD IMAGE.png":            "day-darbar-sahib.webp",
    "DAY AMRITVELA KIRTAN CARD IMAGE.png":        "day-amritvela-kirtan.webp",
    "DAY WAHEGURU SIMRAN CARD IMAGE.png":         "day-waheguru-simran.webp",
    # EVENING
    "EVENEING DARBAR SAHIB CARD IMAGE .png":      "evening-darbar-sahib.webp",
    "EVENEING AMRITVELA KIRTAN CARD IMAGE .png":  "evening-amritvela-kirtan.webp",
    "EVENEING WAHEGURU SIMRAN CARD IMAGE .png.png": "evening-waheguru-simran.webp",
    # NIGHT
    "NIGHT DARBAR SAHIB CARDimage.png":           "night-darbar-sahib.webp",
    "NIGHT AMRITVELA KIRTAN  CARDimage.png":      "night-amritvela-kirtan.webp",
    "NIGHT WAHEGURU SIMRAN CARD IMAGE.png":       "night-waheguru-simran.webp",
}

# Background images (in assets root)
BG_IMAGES = {
    "darbar-sahib-amritvela-morning.png": "darbar-sahib-morning-bg.webp",
    "darbar-sahib-day.jpg":               "darbar-sahib-day-bg.webp",
    "darbar-sahib-evening.jpg":           "darbar-sahib-evening-bg.webp",
    "darbar-sahib-night.jpg":             "darbar-sahib-night-bg.webp",
}

QUALITY = 82  # 82% quality — excellent visual quality at ~10x smaller file size

def convert(src_path, dst_path, label=""):
    try:
        with Image.open(src_path) as img:
            # Convert RGBA -> RGB if needed (WebP supports RGBA but JPGs don't need alpha)
            if img.mode in ("RGBA", "LA"):
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "RGBA":
                    background.paste(img, mask=img.split()[3])
                else:
                    background.paste(img)
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")
            
            img.save(dst_path, "WEBP", quality=QUALITY, method=6)
            
            src_size = os.path.getsize(src_path) / 1024 / 1024
            dst_size = os.path.getsize(dst_path) / 1024
            reduction = (1 - dst_size / 1024 / src_size) * 100
            print(f"  [+] {label or os.path.basename(dst_path)}")
            print(f"     {src_size:.2f} MB  ->  {dst_size:.0f} KB  ({reduction:.0f}% smaller)")
    except Exception as e:
        print(f"  [!] FAILED: {label}: {e}")

print("=" * 60)
print("  ANHAD IMAGE COMPRESSOR - ULTIMATE POWER MODE")
print("=" * 60)

# --- HERO CARD IMAGES ---
print("\n[*] Converting Hero Card Images...")
for orig, clean in HERO_IMAGES.items():
    src = os.path.join(HERO_DIR, orig)
    dst = os.path.join(HERO_DIR, clean)
    if os.path.exists(src):
        convert(src, dst, clean)
    else:
        print(f"  [!] NOT FOUND: {orig}")

# --- BACKGROUND IMAGES ---
print("\n[*] Converting Background Images...")
for orig, clean in BG_IMAGES.items():
    src = os.path.join(ASSETS, orig)
    dst = os.path.join(ASSETS, clean)
    if os.path.exists(src):
        convert(src, dst, clean)
    else:
        print(f"  [!] NOT FOUND: {orig}")

print("\n" + "=" * 60)
print("  ALL DONE! Check sizes above.")
print("=" * 60)
