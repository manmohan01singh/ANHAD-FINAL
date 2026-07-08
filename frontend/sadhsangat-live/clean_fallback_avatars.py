import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the fallback avatar styling to be cleaner and less gold-focused
old_fallback = '''    .circle-fallback {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--gold-accent) 0%, var(--gold-warm) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      color: #FFFFFF;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      border-radius: 50%;
    }'''

new_fallback = '''    .circle-fallback {
      width: 100%;
      height: 100%;
      background: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      color: var(--text-secondary);
      border-radius: 50%;
      border: 2px solid var(--border-color);
    }'''

content = content.replace(old_fallback, new_fallback)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated fallback avatars to be cleaner and less gold-focused')
