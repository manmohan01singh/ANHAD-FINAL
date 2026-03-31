"""
Add Dark Background Script
Adds a solid dark background with rounded corners to the logo
"""

from PIL import Image, ImageDraw
import os

INPUT_LOGO = 'newlogo-removebg-preview.png'
OUTPUT_LOGO = 'newlogo-with-background.png'

def add_dark_background():
    print('🎨 Adding dark background to logo...\n')
    
    if not os.path.exists(INPUT_LOGO):
        print(f'❌ Error: Input logo not found at {INPUT_LOGO}')
        return False
    
    try:
        # Load the transparent logo
        logo = Image.open(INPUT_LOGO).convert('RGBA')
        width, height = logo.size
        print(f'📸 Loaded logo: {width}x{height} pixels')
        
        # Create a new image with dark background
        background = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        
        # Create rounded rectangle mask
        mask = Image.new('L', (width, height), 0)
        draw = ImageDraw.Draw(mask)
        
        # Draw rounded rectangle (adjust radius as needed)
        corner_radius = 100  # Adjust this for more/less rounded corners
        draw.rounded_rectangle(
            [(0, 0), (width, height)],
            radius=corner_radius,
            fill=255
        )
        
        # Create dark background layer
        dark_bg = Image.new('RGBA', (width, height), (20, 20, 20, 255))  # Very dark gray/black
        
        # Apply mask to dark background
        dark_bg.putalpha(mask)
        
        # Composite: dark background + logo on top
        result = Image.alpha_composite(dark_bg, logo)
        
        # Save result
        result.save(OUTPUT_LOGO, 'PNG', optimize=True)
        print(f'✅ Saved logo with dark background: {OUTPUT_LOGO}')
        
        # Also update the original
        result.save(INPUT_LOGO, 'PNG', optimize=True)
        print(f'✅ Updated original file: {INPUT_LOGO}')
        
        print(f'\n🎉 Dark background added successfully!')
        return True
        
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

if __name__ == '__main__':
    success = add_dark_background()
    if success:
        print('\n✅ Now run GENERATE_LOGOS.bat to create all logo sizes!')
    input('\nPress Enter to close...')
