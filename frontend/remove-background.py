"""
Background Removal Script
Removes dark/black background from logo and makes it transparent
Run with: python remove-background.py
"""

from PIL import Image
import os

INPUT_LOGO = 'newlogo-removebg-preview.png'
OUTPUT_LOGO = 'newlogo-transparent.png'

def remove_background():
    print('🎨 Removing background from logo...\n')
    
    # Check if input file exists
    if not os.path.exists(INPUT_LOGO):
        print(f'❌ Error: Input logo not found at {INPUT_LOGO}')
        return False
    
    try:
        # Load the image
        img = Image.open(INPUT_LOGO)
        print(f'📸 Loaded logo: {img.size[0]}x{img.size[1]} pixels')
        print(f'   Mode: {img.mode}')
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
            print('   Converted to RGBA')
        
        # Get pixel data
        pixels = img.load()
        width, height = img.size
        
        # Remove ONLY white corners (keep the dark background!)
        white_threshold = 200  # For white pixels (0-255)
        
        transparent_count = 0
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                
                # Only make WHITE pixels transparent (keep dark background)
                is_white = r > white_threshold and g > white_threshold and b > white_threshold
                
                if is_white:
                    pixels[x, y] = (0, 0, 0, 0)  # Fully transparent
                    transparent_count += 1
        
        print(f'\n✅ Made {transparent_count:,} pixels transparent')
        
        # Save the result
        img.save(OUTPUT_LOGO, 'PNG', optimize=True)
        print(f'✅ Saved transparent logo: {OUTPUT_LOGO}')
        
        # Also update the original file
        img.save(INPUT_LOGO, 'PNG', optimize=True)
        print(f'✅ Updated original file: {INPUT_LOGO}')
        
        print(f'\n🎉 Background removal complete!')
        print(f'   Original: {INPUT_LOGO}')
        print(f'   Transparent: {OUTPUT_LOGO}')
        
        return True
        
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

if __name__ == '__main__':
    success = remove_background()
    if success:
        print('\n✅ Now run GENERATE_LOGOS.bat to create all logo sizes!')
    input('\nPress Enter to close...')
