import math
from PIL import Image, ImageDraw

def process_logo(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # AI generated app icons typically have a squircle that is about 75% of the image size in the center.
    # Let's find the bounds by looking for columns/rows that are not uniform white.
    
    bg_color = pixels[0, 0]
    
    min_x, max_x = width, 0
    min_y, max_y = height, 0
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # calculate distance from background color
            dist = math.sqrt((r - bg_color[0])**2 + (g - bg_color[1])**2 + (b - bg_color[2])**2)
            if dist > 8: # If it deviates from background by more than a small noise threshold
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y

    print(f"Detected bounds: ({min_x}, {min_y}, {max_x}, {max_y})")
    
    # In case detection fails or is very close to edges because of gradient noise, we can enforce a heuristic:
    if max_x - min_x > width * 0.95:
        # It means gradient noise is everywhere. Let's force a 20% crop on all sides.
        margin_x = int(width * 0.18)
        margin_y = int(height * 0.18)
        min_x, max_x = margin_x, width - margin_x
        min_y, max_y = margin_y, height - margin_y
        print(f"Fallback bounds: ({min_x}, {min_y}, {max_x}, {max_y})")
    
    # Crop to the squircle
    cropped = img.crop((min_x, min_y, max_x, max_y))
    
    # Resize back to 1024x1024
    cropped = cropped.resize((1024, 1024), Image.Resampling.BICUBIC)
    
    # Now let's apply a perfect transparent squircle mask to the corners!
    # Apple squircle corner radius is generally 22.5% of the size.
    mask = Image.new("L", (1024, 1024), 0)
    draw = ImageDraw.Draw(mask)
    
    # Draw rounded rectangle for the mask
    radius = int(1024 * 0.225)
    
    # Left rect
    draw.rectangle([(0, radius), (1024, 1024 - radius)], fill=255)
    # Top rect
    draw.rectangle([(radius, 0), (1024 - radius, 1024)], fill=255)
    
    # Four corners
    draw.pieslice([(0, 0), (radius * 2, radius * 2)], 180, 270, fill=255)
    draw.pieslice([(1024 - radius * 2, 0), (1024, radius * 2)], 270, 360, fill=255)
    draw.pieslice([(0, 1024 - radius * 2), (radius * 2, 1024)], 90, 180, fill=255)
    draw.pieslice([(1024 - radius * 2, 1024 - radius * 2), (1024, 1024)], 0, 90, fill=255)
    
    # Apply anti-aliased mask
    cropped.putalpha(mask)
    
    cropped.save(out_path)
    print("Saved final logo to", out_path)

if __name__ == "__main__":
    process_logo("C:\\right\\ANHAD\\anhad_logo_ultimate_2_1776059540364.png", "C:\\right\\ANHAD\\anhad_logo_ultimate_cropped_transparent.png")
