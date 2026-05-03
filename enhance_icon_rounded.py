import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

def create_rounded_icon(input_path, output_path, corner_radius=0.15, saturation_factor=1.4, brightness_factor=1.1):
    """
    Create iOS-style rounded icon with enhanced vibrant colors
    """
    # Open the image
    img = Image.open(input_path).convert('RGBA')
    
    # Get original dimensions
    width, height = img.size
    size = min(width, height)
    
    # Make it square if not already
    if width != height:
        # Center crop to square
        left = (width - size) // 2
        top = (height - size) // 2
        img = img.crop((left, top, left + size, top + size))
    
    # Enhance colors - increase saturation for vibrancy
    saturation_enhancer = ImageEnhance.Color(img)
    img = saturation_enhancer.enhance(saturation_factor)
    
    # Enhance brightness
    brightness_enhancer = ImageEnhance.Brightness(img)
    img = brightness_enhancer.enhance(brightness_factor)
    
    # Enhance contrast for better clarity
    contrast_enhancer = ImageEnhance.Contrast(img)
    img = contrast_enhancer.enhance(1.15)
    
    # Apply sharpening
    img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=130, threshold=2))
    
    # Create rounded corners mask
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    
    # Calculate corner radius
    radius = int(size * corner_radius)
    
    # Draw rounded rectangle
    draw.rounded_rectangle(
        [(0, 0), (size, size)],
        radius=radius,
        fill=255
    )
    
    # Apply mask to create rounded corners
    img.putalpha(mask)
    
    # Create final image with transparent background
    final_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    final_img.paste(img, (0, 0), img)
    
    # Save the enhanced rounded image
    final_img.save(output_path, "PNG", quality=100, optimize=True)
    print(f"Rounded vibrant icon saved to: {output_path}")

def apply_ios_style_effect(input_path, output_path):
    """
    Apply additional iOS-style effects like subtle shadow and glow
    """
    img = Image.open(input_path).convert('RGBA')
    
    # Create a slightly larger canvas for shadow effect
    shadow_size = int(img.size[0] * 1.05)
    shadow_img = Image.new('RGBA', (shadow_size, shadow_size), (0, 0, 0, 0))
    
    # Add subtle shadow
    shadow_offset = int(shadow_size * 0.02)
    shadow_pos = ((shadow_size - img.size[0]) // 2 + shadow_offset, 
                  (shadow_size - img.size[1]) // 2 + shadow_offset)
    
    # Create shadow layer
    shadow_layer = Image.new('RGBA', img.size, (0, 0, 0, 50))
    shadow_img.paste(shadow_layer, shadow_pos)
    
    # Paste the main icon on top
    main_pos = ((shadow_size - img.size[0]) // 2, (shadow_size - img.size[1]) // 2)
    shadow_img.paste(img, main_pos, img)
    
    # Save final image
    shadow_img.save(output_path, "PNG", quality=100, optimize=True)
    print(f"iOS-style icon saved to: {output_path}")

if __name__ == "__main__":
    input_path = "assets/icon.png"
    rounded_path = "assets/icon_rounded.png"
    final_path = "assets/icon_final.png"
    
    # Create rounded vibrant icon
    create_rounded_icon(input_path, rounded_path, corner_radius=0.22, saturation_factor=1.5, brightness_factor=1.15)
    
    # Apply iOS-style effects
    apply_ios_style_effect(rounded_path, final_path)
    
    print("iOS-style rounded vibrant icon enhancement complete!")
