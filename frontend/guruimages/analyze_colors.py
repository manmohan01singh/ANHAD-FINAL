"""
Extract dominant color palettes from each Guru Saheb image
Returns 2-3 major colors per image for dynamic orb backgrounds
"""

from PIL import Image
import colorsys
import os
from collections import Counter

def get_dominant_colors(image_path, num_colors=3):
    """Extract dominant colors from an image"""
    try:
        # Open and resize image for faster processing
        img = Image.open(image_path)
        img = img.convert('RGB')
        img.thumbnail((150, 150))
        
        # Get all pixels
        pixels = list(img.getdata())
        
        # Filter out very dark and very light pixels (likely background/noise)
        filtered_pixels = []
        for r, g, b in pixels:
            # Skip very dark or very light pixels
            brightness = (r + g + b) / 3
            if 30 < brightness < 240:
                filtered_pixels.append((r, g, b))
        
        if not filtered_pixels:
            filtered_pixels = pixels
        
        # Count pixel frequencies
        pixel_count = Counter(filtered_pixels)
        
        # Get most common colors
        most_common = pixel_count.most_common(50)
        
        # Cluster similar colors
        color_clusters = []
        for color, count in most_common:
            found_cluster = False
            for cluster in color_clusters:
                # Check if color is similar to cluster
                cluster_color = cluster['color']
                diff = sum(abs(c1 - c2) for c1, c2 in zip(color, cluster_color))
                if diff < 100:  # Similar colors
                    cluster['count'] += count
                    found_cluster = True
                    break
            
            if not found_cluster:
                color_clusters.append({'color': color, 'count': count})
        
        # Sort by frequency
        color_clusters.sort(key=lambda x: x['count'], reverse=True)
        
        # Get top N colors
        dominant_colors = [cluster['color'] for cluster in color_clusters[:num_colors]]
        
        return dominant_colors
    
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return []

def rgb_to_hex(rgb):
    """Convert RGB tuple to hex color"""
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

def analyze_all_guru_images():
    """Analyze all Guru Saheb images in current directory"""
    
    guru_images = [
        'gurunanakdevsahebji.jpeg',
        'guruangaddevsahebji.jpeg',
        'guruamardasji.jpeg',
        'gururamdassahebji.jpeg',
        'guruarjanddevsahebji.jpeg',
        'guruhargobindsahebji.jpeg',
        'guruharraisahebji.jpeg',
        'guruharkrishansahebji.jpeg',
        'gurutegbahadursahebji.jpeg',
        'gurugobindsinghsahebji.jpeg',
        'gurugranthsahebji.jpeg'
    ]
    
    guru_names = [
        'Guru Nanak Dev Sahib Ji',
        'Guru Angad Dev Sahib Ji',
        'Guru Amar Das Sahib Ji',
        'Guru Ram Das Sahib Ji',
        'Guru Arjan Dev Sahib Ji',
        'Guru Hargobind Sahib Ji',
        'Guru Har Rai Sahib Ji',
        'Guru Har Krishan Sahib Ji',
        'Guru Tegh Bahadur Sahib Ji',
        'Guru Gobind Singh Sahib Ji',
        'Guru Granth Sahib Ji'
    ]
    
    results = []
    
    print("\n" + "="*70)
    print("GURU SAHEB IMAGE COLOR PALETTE ANALYSIS")
    print("="*70 + "\n")
    
    for img_file, guru_name in zip(guru_images, guru_names):
        if os.path.exists(img_file):
            colors = get_dominant_colors(img_file, num_colors=3)
            
            print(f"📿 {guru_name}")
            print(f"   Image: {img_file}")
            
            if colors:
                print(f"   Dominant Colors:")
                for i, color in enumerate(colors, 1):
                    hex_color = rgb_to_hex(color)
                    print(f"      Color {i}: {hex_color} - RGB{color}")
                
                results.append({
                    'name': guru_name,
                    'file': img_file,
                    'colors': [rgb_to_hex(c) for c in colors],
                    'rgb': colors
                })
            else:
                print(f"   ⚠️  Could not extract colors")
            
            print()
    
    print("="*70)
    print("JAVASCRIPT COLOR MAP (Copy this to your code)")
    print("="*70 + "\n")
    
    print("const guruColorPalettes = {")
    for result in results:
        guru_id = result['file'].replace('.jpeg', '').replace('guru', 'guru-').replace('sahebji', '').replace('ji', '').replace('saheb', '')
        print(f"  '{guru_id}': {{")
        print(f"    name: '{result['name']}',")
        print(f"    colors: {result['colors']}")
        print(f"  }},")
    print("};")
    
    return results

if __name__ == "__main__":
    analyze_all_guru_images()
