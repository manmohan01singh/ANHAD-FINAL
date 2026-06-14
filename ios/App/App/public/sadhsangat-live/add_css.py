content = open('index.html', 'r', encoding='utf-8').read()
old = '''    .search-preset-pill:active {
      transform: scale(0.96);
    }
    .search-overlay-content {'''
new = '''    .search-preset-pill:active {
      transform: scale(0.96);
    }
    .filter-option {
      padding: 10px 12px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .filter-option:hover {
      background: var(--bg-secondary);
    }
    .filter-option.active {
      background: var(--gold-accent);
      color: white;
    }
    .search-overlay-content {'''
content = content.replace(old, new)
open('index.html', 'w', encoding='utf-8').write(content)
