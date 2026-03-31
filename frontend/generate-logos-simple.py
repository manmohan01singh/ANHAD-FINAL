"""
Logo Generator Script (Python)
Generates all required logo sizes from newlogo-removebg-preview.png
Run with: python generate-logos-simple.py

Requirements: pip install Pillow
"""

from PIL import Image
import os
import sys

# Paths
INPUT_LOGO = 'newlogo-removebg-preview.png'
ASSETS_DIR = 'assets'
ICONS_DIR = 'assets/icons'
ANDROID_ASSETS_DIR = '../android/app/src/main/assets/public/assets'
ANDROID_ICONS_DIR = '../android/app/src/main/assets/public/assets/icons'

# Logo configurations
LOGO_CONFIGS = [
    # Favicon sizes
    {'name': 'favicon-16x16.png', 'size': 16, 'dir': ASSETS_DIR},
    {'name': 'favicon-32x32.png', 'size': 32, 'dir': ASSETS_DIR},
    
    # Apple touch icon
    {'name': 'apple-touch-icon.png', 'size': 180, 'dir': ASSETS_DIR},
    
    # App logos (various sizes)
    {'name': 'app-logo.png', 'size': 512, 'dir': ASSETS_DIR},
    {'name': 'app-logo-96.png', 'size': 96, 'dir': ASSETS_DIR},
    {'name': 'app-logo-128.png', 'size': 128, 'dir': ASSETS_DIR},
    {'name': 'app-logo-144.png', 'size': 144, 'dir': ASSETS_DIR},
    {'name': 'app-logo-384.png', 'size': 384, 'dir': ASSETS_DIR},
    
    # PWA icons
    {'name': 'pwa-icon-192.png', 'size': 192, 'dir': ASSETS_DIR},
    {'name': 'pwa-icon-512.png', 'size': 512, 'dir': ASSETS_DIR},
    
    # Pure logo
    {'name': 'pure-logo.png', 'size': 512, 'dir': ASSETS_DIR},
    
    # Icons directory (for manifest.json references)
    {'name': 'icon-72x72.png', 'size': 72, 'dir': ICONS_DIR},
    {'name': 'icon-152x152.png', 'size': 152, 'dir': ICONS_DIR},
    {'name': 'icon-192x192.png', 'size': 192, 'dir': ICONS_DIR},
    {'name': 'icon-512x512.png', 'size': 512, 'dir': ICONS_DIR},
    {'name': 'icon-1024x1024.png', 'size': 1024, 'dir': ICONS_DIR},
]

def generate_logos():
    print('🎨 Starting logo generation...\n')
    
    # Check if input file exists
    if not os.path.exists(INPUT_LOGO):
        print(f'❌ Error: Input logo not found at {INPUT_LOGO}')
        sys.exit(1)
    
    # Ensure directories exist
    os.makedirs(ASSETS_DIR, exist_ok=True)
    os.makedirs(ICONS_DIR, exist_ok=True)
    
    # Load the original logo
    try:
        original = Image.open(INPUT_LOGO)
        print(f'📸 Loaded original logo: {original.size[0]}x{original.size[1]} pixels')
        print(f'   Mode: {original.mode}\n')
    except Exception as e:
        print(f'❌ Error loading logo: {e}')
        sys.exit(1)
    
    success_count = 0
    error_count = 0
    
    for config in LOGO_CONFIGS:
        try:
            size = config['size']
            name = config['name']
            target_dir = config.get('dir', ASSETS_DIR)
            output_path = os.path.join(target_dir, name)
            
            # Resize with high quality
            resized = original.resize((size, size), Image.Resampling.LANCZOS)
            
            # Save as PNG
            resized.save(output_path, 'PNG', optimize=True)
            print(f'✅ Generated: {name} ({size}x{size})')
            success_count += 1
            
            # Copy to Android assets if directory exists
            if target_dir == ICONS_DIR and os.path.exists(ANDROID_ICONS_DIR):
                android_path = os.path.join(ANDROID_ICONS_DIR, name)
                resized.save(android_path, 'PNG', optimize=True)
                print(f'   📱 Copied to Android icons')
            elif target_dir == ASSETS_DIR and os.path.exists(ANDROID_ASSETS_DIR):
                android_path = os.path.join(ANDROID_ASSETS_DIR, name)
                resized.save(android_path, 'PNG', optimize=True)
                print(f'   📱 Copied to Android assets')
            
        except Exception as e:
            print(f'❌ Error generating {name}: {e}')
            error_count += 1
    
    # Generate WebP versions
    webp_configs = [
        {'name': 'app-logo.webp', 'size': 512, 'dir': ASSETS_DIR},
        {'name': 'pure-logo.webp', 'size': 512, 'dir': ASSETS_DIR},
        {'name': 'new.webp', 'size': 512, 'dir': ASSETS_DIR},  # Used in install banner
    ]
    
    for config in webp_configs:
        try:
            size = config['size']
            name = config['name']
            target_dir = config.get('dir', ASSETS_DIR)
            output_path = os.path.join(target_dir, name)
            
            resized = original.resize((size, size), Image.Resampling.LANCZOS)
            resized.save(output_path, 'WEBP', quality=95)
            print(f'✅ Generated: {name} ({size}x{size})')
            success_count += 1
            
            if os.path.exists(ANDROID_ASSETS_DIR):
                android_path = os.path.join(ANDROID_ASSETS_DIR, name)
                resized.save(android_path, 'WEBP', quality=95)
                print(f'   📱 Copied to Android assets')
                
        except Exception as e:
            print(f'❌ Error generating {name}: {e}')
            error_count += 1
    
    # Generate favicon.ico
    try:
        favicon_sizes = [(16, 16), (32, 32), (48, 48)]
        favicon_path = 'favicon.ico'
        
        # Create multi-size ICO
        original.save(
            favicon_path,
            format='ICO',
            sizes=favicon_sizes
        )
        print(f'✅ Generated: favicon.ico (multi-size)')
        success_count += 1
        
    except Exception as e:
        print(f'❌ Error generating favicon.ico: {e}')
        error_count += 1
    
    print(f'\n📊 Summary:')
    print(f'   ✅ Success: {success_count}')
    print(f'   ❌ Errors: {error_count}')
    print(f'\n🎉 Logo generation complete!')

if __name__ == '__main__':
    generate_logos()
