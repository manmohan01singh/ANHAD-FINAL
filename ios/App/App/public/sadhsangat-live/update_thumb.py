content = open('index.html', 'r', encoding='utf-8').read()
old = '''    .search-result-thumb {
      width: 64px;
      height: 36px;
      border-radius: 6px;
      background: var(--gold-gradient);
      flex-shrink: 0;
      position: relative;
    }'''
new = '''    .search-result-thumb {
      width: 120px;
      height: 68px;
      border-radius: 10px;
      background: var(--gold-gradient);
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }
    .search-result-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }'''
content = content.replace(old, new)
open('index.html', 'w', encoding='utf-8').write(content)
