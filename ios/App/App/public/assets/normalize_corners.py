import os
from PIL import Image

def normalize_corner(img_path, natural_orientation):
    if not os.path.exists(img_path):
        print(f"Skipping {img_path}: does not exist")
        return
    
    img = Image.open(img_path)
    print(f"Normalizing {os.path.basename(img_path)} (natural: {natural_orientation}) to Top-Left...")
    
    if natural_orientation == "BL":
        # Bottom-Left to Top-Left: Flip vertically (Top-Bottom)
        normalized = img.transpose(Image.FLIP_TOP_BOTTOM)
    elif natural_orientation == "TR":
        # Top-Right to Top-Left: Flip horizontally (Left-Right)
        normalized = img.transpose(Image.FLIP_LEFT_RIGHT)
    elif natural_orientation == "BR":
        # Bottom-Right to Top-Left: Flip both (Rotate 180)
        normalized = img.transpose(Image.ROTATE_180)
    else:
        print(f"  Already Top-Left. No flip needed.")
        return
        
    normalized.save(img_path, "PNG")
    print(f"  Successfully normalized and saved {os.path.basename(img_path)}")

if __name__ == "__main__":
    assets_dir = r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\assets"
    
    # Map each corner asset to its natural orientation as analyzed
    corner_configs = {
        "royal_rose_corner.png": "BL",
        "lotus_grace_corner.png": "TL",
        "golden_marigold_corner.png": "TL",
        "blue_blossom_corner.png": "TR"
    }
    
    for filename, orientation in corner_configs.items():
        normalize_corner(os.path.join(assets_dir, filename), orientation)
        
    print("\nCorner normalization complete!")
