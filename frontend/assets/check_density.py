import os
from PIL import Image

def analyze_density(img_path):
    if not os.path.exists(img_path):
        print(f"{img_path} does not exist")
        return
    
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    
    # Divide the image into 4 quadrants: TL, TR, BL, BR
    # Count non-transparent pixels in each quadrant
    tl_count = 0
    tr_count = 0
    bl_count = 0
    br_count = 0
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = img.getpixel((x, y))
            if a > 30: # solid pixel
                if x < w / 2 and y < h / 2:
                    tl_count += 1
                elif x >= w / 2 and y < h / 2:
                    tr_count += 1
                elif x < w / 2 and y >= h / 2:
                    bl_count += 1
                else:
                    br_count += 1
                    
    total = tl_count + tr_count + bl_count + br_count
    if total == 0:
        print(f"{os.path.basename(img_path)} is completely transparent")
        return
        
    print(f"\nAnalysis for {os.path.basename(img_path)} ({w}x{h}):")
    print(f"  Top-Left quadrant:  {tl_count} ({tl_count/total*100:.1f}%)")
    print(f"  Top-Right quadrant: {tr_count} ({tr_count/total*100:.1f}%)")
    print(f"  Bottom-Left quadrant: {bl_count} ({bl_count/total*100:.1f}%)")
    print(f"  Bottom-Right quadrant: {br_count} ({br_count/total*100:.1f}%)")
    
    # Determine the corner orientation based on the highest density
    densities = {
        "TL": tl_count,
        "TR": tr_count,
        "BL": bl_count,
        "BR": br_count
    }
    dense_corner = max(densities, key=densities.get)
    print(f"  => Most dense quadrant: {dense_corner}")

if __name__ == "__main__":
    assets_dir = r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\assets"
    corners = [
        "royal_rose_corner.png",
        "lotus_grace_corner.png",
        "golden_marigold_corner.png",
        "blue_blossom_corner.png"
    ]
    for c in corners:
        analyze_density(os.path.join(assets_dir, c))
