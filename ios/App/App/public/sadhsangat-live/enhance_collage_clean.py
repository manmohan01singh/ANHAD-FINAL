import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Enhance the collage to make channel logos more prominent with cleaner design
old_enhanced_css = '''    /* Channel collage styling for 'All' button */
    .channel-logo-circle .collage-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      width: 100%;
      height: 100%;
      gap: 2px;
      border-radius: 50%;
      overflow: hidden;
      background: var(--bg-tertiary);
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }

    .channel-logo-circle .collage-item {
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
      border-radius: 4px;
      background: var(--bg-secondary);
    }

    .channel-logo-circle .collage-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .channel-logo-circle:hover .collage-item img {
      transform: scale(1.1);
    }

    .channel-logo-circle .collage-placeholder {
      background: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: var(--text-secondary);
      font-weight: 600;
      border-radius: 4px;
    }

    /* Add subtle border to collage items for better separation */
    .channel-logo-circle .collage-item:not(:last-child) {
      border-right: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
    }'''

new_enhanced_css = '''    /* Channel collage styling for 'All' button */
    .channel-logo-circle .collage-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      width: 100%;
      height: 100%;
      gap: 3px;
      border-radius: 50%;
      overflow: hidden;
      background: transparent;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .channel-logo-circle .collage-item {
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
      border-radius: 8px;
      background: var(--bg-secondary);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .channel-logo-circle .collage-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .channel-logo-circle:hover .collage-item img {
      transform: scale(1.08);
    }

    .channel-logo-circle .collage-placeholder {
      background: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: var(--text-tertiary);
      font-weight: 400;
      border-radius: 8px;
      border: 1px dashed var(--border-color);
    }

    /* Add subtle border to collage items for better separation */
    .channel-logo-circle .collage-item:not(:last-child) {
      border-right: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
    }'''

content = content.replace(old_enhanced_css, new_enhanced_css)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Enhanced collage for cleaner, more prominent channel logos')
