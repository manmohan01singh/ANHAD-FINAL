"""
Logo Verification Script
Checks if all required logos were generated correctly
"""

import os
from PIL import Image

# Expected files
EXPECTED_FILES = {
    'assets/favicon-16x16.png': (16, 16),
    'assets/favicon-32x32.png': (32, 32),
    'assets/apple-touch-icon.png': (180, 180),
    'assets/app-logo.png': (512, 512),
    'assets/app-logo.webp': (512, 512),
    'assets/app-logo-96.png': (96, 96),
    'assets/app-logo-128.png': (128, 128),
    'assets/app-logo-144.png': (144, 144),
    'assets/app-logo-384.png': (384, 384),
    'assets/pwa-icon-192.png': (192, 192),
    'assets/pwa-icon-512.png': (512, 512),
    'assets/pure-logo.png': (512, 512),
    'assets/pure-logo.webp': (512, 512),
    'assets/new.webp': (512, 512),
    'assets/icons/icon-72x72.png': (72, 72),
    'assets/icons/icon-152x152.png': (152, 152),
    'assets/icons/icon-192x192.png': (192, 192),
    'assets/icons/icon-512x512.png': (512, 512),
    'assets/icons/icon-1024x1024.png': (1024, 1024),
    'favicon.ico': None,  # ICO files can have multiple sizes
}

def verify_logos():
    print('🔍 Verifying logo generation...\n')
    
    success_count = 0
    error_count = 0
    missing_count = 0
    
    for filepath, expected_size in EXPECTED_FILES.items():
        if not os.path.exists(filepath):
            print(f'❌ MISSING: {filepath}')
            missing_count += 1
            continue
        
        try:
            if filepath.endswith('.ico'):
                # ICO files are special
                file_size = os.path.getsize(filepath)
                if file_size > 0:
                    print(f'✅ {filepath} ({file_size} bytes)')
                    success_count += 1
                else:
                    print(f'⚠️  {filepath} is empty')
                    error_count += 1
            else:
                # Check image dimensions
                img = Image.open(filepath)
                actual_size = img.size
                
                if actual_size == expected_size:
                    print(f'✅ {filepath} ({actual_size[0]}×{actual_size[1]})')
                    success_count += 1
                else:
                    print(f'⚠️  {filepath} - Expected {expected_size}, got {actual_size}')
                    error_count += 1
                    
        except Exception as e:
            print(f'❌ ERROR reading {filepath}: {e}')
            error_count += 1
    
    print(f'\n📊 Verification Summary:')
    print(f'   ✅ Correct: {success_count}')
    print(f'   ⚠️  Issues: {error_count}')
    print(f'   ❌ Missing: {missing_count}')
    print(f'   📁 Total expected: {len(EXPECTED_FILES)}')
    
    if error_count == 0 and missing_count == 0:
        print(f'\n🎉 All logos generated successfully!')
        return True
    else:
        print(f'\n⚠️  Some issues found. Please review above.')
        return False

if __name__ == '__main__':
    verify_logos()
    input('\nPress Enter to close...')
