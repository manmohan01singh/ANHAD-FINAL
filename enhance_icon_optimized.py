import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

def enhance_icon_optimized(input_path, output_path, zoom_factor=1.18, sharpness_factor=1.5):
    """
    Create optimized icon with more zoom and better text visibility
    """
    # Open the image
    img = Image.open(input_path).convert('RGBA')
    
    # Get original dimensions
    width, height = img.size
    original_size = (width, height)
    
    # Calculate new size with more zoom
    new_size = (int(width * zoom_factor), int(height * zoom_factor))
    
    # Resize with zoom (make it larger)
    img_zoomed = img.resize(new_size, Image.Resampling.LANCZOS)
    
    # Calculate crop coordinates to center the zoomed image
    left = (new_size[0] - width) // 2
    top = (new_size[1] - height) // 2
    right = left + width
    bottom = top + height
    
    # Crop back to original size
    img_cropped = img_zoomed.crop((left, top, right, bottom))
    
    # Apply stronger sharpening for better clarity
    enhancer = ImageEnhance.Sharpness(img_cropped)
    img_sharp = enhancer.enhance(sharpness_factor)
    
    # Enhance contrast for better text visibility
    contrast_enhancer = ImageEnhance.Contrast(img_sharp)
    img_contrast = contrast_enhancer.enhance(1.2)
    
    # Enhance brightness slightly
    brightness_enhancer = ImageEnhance.Brightness(img_contrast)
    img_bright = brightness_enhancer.enhance(1.05)
    
    # Apply unsharp mask for crisp edges
    img_final = img_bright.filter(ImageFilter.UnsharpMask(radius=1.8, percent=150, threshold=2))
    
    # Save the enhanced image
    img_final.save(output_path, "PNG", quality=100, optimize=True)
    print(f"Optimized icon saved to: {output_path}")

def create_ios_style_optimized(input_path, output_path, corner_radius=0.22):
    """
    Create iOS-style rounded icon with optimized zoom
    """
    img = Image.open(input_path).convert('RGBA')
    
    # Make square if needed
    width, height = img.size
    size = min(width, height)
    
    if width != height:
        left = (width - size) // 2
        top = (height - size) // 2
        img = img.crop((left, top, left + size, top + size))
    
    # Enhance colors
    color_enhancer = ImageEnhance.Color(img)
    img = color_enhancer.enhance(1.3)
    
    # Enhance brightness
    brightness_enhancer = ImageEnhance.Brightness(img)
    img = brightness_enhancer.enhance(1.08)
    
    # Enhance contrast
    contrast_enhancer = ImageEnhance.Contrast(img)
    img = contrast_enhancer.enhance(1.15)
    
    # Create rounded corners mask
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    
    radius = int(size * corner_radius)
    draw.rounded_rectangle(
        [(0, 0), (size, size)],
        radius=radius,
        fill=255
    )
    
    # Apply mask
    img.putalpha(mask)
    
    # Create final with transparent background
    final_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    final_img.paste(img, (0, 0), img)
    
    final_img.save(output_path, "PNG", quality=100, optimize=True)
    print(f"iOS-style optimized icon saved to: {output_path}")

if __name__ == "__main__":
    input_path = "frontend/assets/icon-1024x1024.png"
    optimized_path = "assets/icon_optimized.png"
    final_path = "assets/icon_best.png"
    
    # Create optimized version with more zoom
    enhance_icon_optimized(input_path, optimized_path, zoom_factor=1.18, sharpness_factor=1.6)
    
    # Create iOS-style version
    create_ios_style_optimized(optimized_path, final_path, corner_radius=0.20)
    
    print("Best optimized icon created!")
