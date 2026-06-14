content = open('index.html', 'r', encoding='utf-8').read()
old = '''            const thumb = CE('div');
            thumb.className = 'search-result-thumb';
            thumb.style.background = `url(https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg) center/cover`;
            thumb.style.width = '64px';
            thumb.style.height = '36px';
            thumb.style.borderRadius = '6px';
            videoRow.appendChild(thumb);'''
new = '''            const thumb = CE('img');
            thumb.className = 'search-result-thumb';
            thumb.src = `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`;
            thumb.alt = v.title;
            thumb.onerror = () => {
              thumb.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect fill="%23d1d5db" width="24" height="24"/></svg>';
            };
            videoRow.appendChild(thumb);'''
content = content.replace(old, new)
open('index.html', 'w', encoding='utf-8').write(content)
