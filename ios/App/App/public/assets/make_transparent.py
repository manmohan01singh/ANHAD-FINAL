import os
import sys

try:
    from PIL import Image
except ImportError:
    import subprocess
    print("Installing pillow...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
    from PIL import Image

def make_transparent(img_path):
    if not os.path.exists(img_path):
        print(f"Skipping {img_path}: does not exist")
        return
    
    print(f"Opening {img_path}...")
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixdata = img.load()
    
    # We want to replace grey/white checkerboard or solid light backgrounds.
    # Typically, backgrounds are white (255, 255, 255) or light grey (200-240).
    # Also, some generated images have checkerboards of white and grey.
    # Let's check for pixels where R, G, B are all high and very close to each other (neutral).
    changed = 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixdata[x, y]
            
            # Match near-white, light grey, and standard checkerboard colors
            # (e.g. 255/255/255, 204/204/204, etc.)
            is_white = (r > 240 and g > 240 and b > 240)
            is_grey = (r > 190 and g > 190 and b > 190 and abs(r - g) < 8 and abs(g - b) < 8 and abs(r - b) < 8)
            
            # Also check for classic Photoshop/PNG transparent grid backgrounds:
            # typically alternating squares of #ffffff (255) and #cccccc (204) or #efefef (239)
            is_checkerboard_grey = (195 <= r <= 210 and 195 <= g <= 210 and 195 <= b <= 210)
            
            if is_white or is_grey or is_checkerboard_grey:
                pixdata[x, y] = (255, 255, 255, 0)
                changed += 1
                
    if changed > 0:
        img.save(img_path, "PNG")
        print(f"Processed {os.path.basename(img_path)}: made {changed} pixels transparent.")
    else:
        print(f"No background pixels detected to change in {os.path.basename(img_path)}")

if __name__ == "__main__":
    assets_dir = r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\assets"
    corners = [
        "royal_rose_corner.png",
        "lotus_grace_corner.png",
        "golden_marigold_corner.png",
        "blue_blossom_corner.png"
    ]
    for c in corners:
        make_transparent(os.path.join(assets_dir, c))
    print("Done processing all corner images!")
