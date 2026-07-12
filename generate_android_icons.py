"""
Android Launcher Icon Generator
Generates high-quality launcher icons with proper scaling and adaptive icon support
"""

from PIL import Image, ImageDraw
import os

# Source icon path - using the highest resolution available
SOURCE_ICON = r"C:\Users\Manmohan Singh\OneDrive\Desktop\APP\ANHAD-FINAL\frontend\assets\icon-1024x1024.png"
ANDROID_RES_PATH = r"C:\Users\Manmohan Singh\OneDrive\Desktop\APP\ANHAD-FINAL\android\app\src\main\res"

# Android density configurations
# For adaptive icons, foreground should be 108dp with 72dp safe zone (66.67% scaling)
# For legacy icons, we'll use 80% scaling to fill better while maintaining some padding
DENSITIES = {
    'mdpi': 48,      # 1x
    'hdpi': 72,      # 1.5x
    'xhdpi': 96,     # 2x
    'xxhdpi': 144,   # 3x
    'xxxhdpi': 192   # 4x
}

# Adaptive icon sizes (108dp for foreground/background layers)
ADAPTIVE_DENSITIES = {
    'mdpi': 108,
    'hdpi': 162,
    'xhdpi': 216,
    'xxhdpi': 324,
    'xxxhdpi': 432
}

def create_white_background(size):
    """Create a white background image"""
    return Image.new('RGBA', (size, size), (255, 255, 255, 255))

def resize_icon_centered(source_img, target_size, scale_factor=0.85):
    """
    Resize icon and center it in target canvas with proper scaling
    scale_factor: How much of the canvas the logo should fill (0.85 = 85%)
    """
    # Calculate the logo size (it should fill scale_factor of the canvas)
    logo_size = int(target_size * scale_factor)
    
    # Resize the source image maintaining aspect ratio
    source_img.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Create target canvas
    target_img = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    
    # Calculate position to center the logo
    x = (target_size - source_img.width) // 2
    y = (target_size - source_img.height) // 2
    
    # Paste the resized logo
    target_img.paste(source_img, (x, y), source_img if source_img.mode == 'RGBA' else None)
    
    return target_img

def generate_legacy_icons():
    """Generate legacy launcher icons (ic_launcher.png and ic_launcher_round.png)"""
    print("Generating legacy launcher icons...")
    
    # Load source icon
    source = Image.open(SOURCE_ICON).convert('RGBA')
    
    for density, size in DENSITIES.items():
        mipmap_dir = os.path.join(ANDROID_RES_PATH, f'mipmap-{density}')
        os.makedirs(mipmap_dir, exist_ok=True)
        
        # Generate regular launcher icon with 85% scaling (better fill)
        icon = resize_icon_centered(source.copy(), size, scale_factor=0.85)
        
        # Convert to RGB with white background
        final_icon = Image.new('RGB', (size, size), (255, 255, 255))
        final_icon.paste(icon, (0, 0), icon)
        
        # Save regular icon
        icon_path = os.path.join(mipmap_dir, 'ic_launcher.png')
        final_icon.save(icon_path, 'PNG', optimize=True, quality=95)
        print(f"  Created {density}: {icon_path}")
        
        # Generate round launcher icon
        round_icon = create_round_icon(final_icon)
        round_path = os.path.join(mipmap_dir, 'ic_launcher_round.png')
        round_icon.save(round_path, 'PNG', optimize=True, quality=95)
        print(f"  Created {density} round: {round_path}")

def create_round_icon(square_icon):
    """Create a round icon from a square icon"""
    size = square_icon.size[0]
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    
    result = Image.new('RGBA', (size, size))
    result.paste(square_icon, (0, 0))
    result.putalpha(mask)
    
    # Convert back to RGB with white background
    final = Image.new('RGB', (size, size), (255, 255, 255))
    final.paste(result, (0, 0), result)
    return final

def generate_adaptive_icons():
    """Generate adaptive icon layers (foreground and background)"""
    print("\nGenerating adaptive icon layers...")
    
    # Load source icon
    source = Image.open(SOURCE_ICON).convert('RGBA')
    
    for density, size in ADAPTIVE_DENSITIES.items():
        mipmap_dir = os.path.join(ANDROID_RES_PATH, f'mipmap-{density}')
        os.makedirs(mipmap_dir, exist_ok=True)
        
        # Background layer - solid white
        bg = create_white_background(size)
        bg_path = os.path.join(mipmap_dir, 'ic_launcher_background.png')
        bg.save(bg_path, 'PNG', optimize=True, quality=95)
        print(f"  Created {density} background: {bg_path}")
        
        # Foreground layer - logo scaled to fit safe zone
        # Android adaptive icons: 108dp total, 72dp safe zone (66.67%)
        # We'll use 70% to be safe and well-centered
        fg = resize_icon_centered(source.copy(), size, scale_factor=0.70)
        
        # Convert to RGB with transparency preserved
        fg_final = Image.new('RGBA', (size, size), (255, 255, 255, 0))
        fg_final.paste(fg, (0, 0), fg)
        
        fg_path = os.path.join(mipmap_dir, 'ic_launcher_foreground.png')
        fg_final.save(fg_path, 'PNG', optimize=True, quality=95)
        print(f"  Created {density} foreground: {fg_path}")

def verify_source():
    """Verify the source icon exists and is high quality"""
    if not os.path.exists(SOURCE_ICON):
        print(f"ERROR: Source icon not found at {SOURCE_ICON}")
        return False
    
    img = Image.open(SOURCE_ICON)
    print(f"\nSource icon details:")
    print(f"  Path: {SOURCE_ICON}")
    print(f"  Size: {img.size}")
    print(f"  Mode: {img.mode}")
    print(f"  Format: {img.format}")
    
    if img.size[0] < 512 or img.size[1] < 512:
        print("WARNING: Source icon resolution is less than 512x512")
        return False
    
    return True

def main():
    print("=" * 60)
    print("ANHAD Android Launcher Icon Generator")
    print("=" * 60)
    
    # Verify source
    if not verify_source():
        return
    
    print("\nStarting icon generation...")
    print(f"Output directory: {ANDROID_RES_PATH}")
    
    # Generate all icon types
    generate_legacy_icons()
    generate_adaptive_icons()
    
    print("\n" + "=" * 60)
    print("✓ Icon generation complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Rebuild your Android project")
    print("2. Reinstall the APK on your device")
    print("3. The new icons should appear sharp and properly scaled")
    print("\nNote: If using Capacitor, run: npx cap sync android")

if __name__ == '__main__':
    main()
