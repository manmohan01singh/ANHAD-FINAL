import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

def enhance_icon_with_zoom(input_path, output_path, zoom_factor=1.1, sharpness_factor=1.3):
    """
    Enhance icon with better sharpness and subtle zoom effect
    """
    # Open the image
    img = Image.open(input_path)
    
    # Get original dimensions
    original_size = img.size
    new_size = (int(original_size[0] * zoom_factor), int(original_size[1] * zoom_factor))
    
    # Resize with zoom (make it slightly larger)
    img_zoomed = img.resize(new_size, Image.Resampling.LANCZOS)
    
    # Crop back to original size (centered crop for zoom effect)
    left = (new_size[0] - original_size[0]) // 2
    top = (new_size[1] - original_size[1]) // 2
    right = left + original_size[0]
    bottom = top + original_size[1]
    
    img_cropped = img_zoomed.crop((left, top, right, bottom))
    
    # Enhance sharpness
    enhancer = ImageEnhance.Sharpness(img_cropped)
    img_sharp = enhancer.enhance(sharpness_factor)
    
    # Enhance contrast slightly for better clarity
    contrast_enhancer = ImageEnhance.Contrast(img_sharp)
    img_enhanced = contrast_enhancer.enhance(1.1)
    
    # Apply slight sharpening filter
    img_final = img_enhanced.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))
    
    # Save the enhanced image
    img_final.save(output_path, "PNG", quality=100, optimize=True)
    print(f"Enhanced icon saved to: {output_path}")

if __name__ == "__main__":
    input_path = "assets/icon.png"
    output_path = "assets/icon_enhanced.png"
    
    enhance_icon_with_zoom(input_path, output_path, zoom_factor=1.05, sharpness_factor=1.4)
    print("Icon enhancement complete!")
