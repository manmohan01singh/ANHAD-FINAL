import os

path = r"c:\Users\Manmohan Singh\OneDrive\Desktop\letsdoit\ANHAD-FINAL\frontend\Notes\notes.html"
if not os.path.exists(path):
    print("File not found!")
    exit(1)

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_script_pattern = """  <script>
(function() {
  try {
    const theme = localStorage.getItem('anhad_theme') || 'auto';
    let effectiveTheme = theme;
    let timeOfDay = localStorage.getItem('anhad_forced_time_of_day');
    if (theme === 'auto') {
      if (timeOfDay && ['morning', 'day', 'evening', 'night'].includes(timeOfDay)) {
        effectiveTheme = (timeOfDay === 'night') ? 'dark' : 'light';
      } else {
        const hour = new Date().getHours();
        effectiveTheme = (hour >= 5 && hour < 20) ? 'light' : 'dark';
        if (hour >= 5 && hour < 9) timeOfDay = 'morning';
        else if (hour >= 9 && hour < 16) timeOfDay = 'day';
        else if (hour >= 16 && hour < 20) timeOfDay = 'evening';
        else timeOfDay = 'night';
      }
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.setAttribute('data-theme-mode', theme);
    if (theme === 'auto') {
      document.documentElement.setAttribute('data-time-of-day', timeOfDay);
    }
    document.documentElement.style.colorScheme = effectiveTheme;
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark', 'dark-mode');
      document.documentElement.style.backgroundColor = '#0D0D0F';
    } else {
      document.documentElement.classList.remove('dark', 'dark-mode');
      document.documentElement.style.backgroundColor = '#FAF8F5';
    }
  } catch (e) {}
})();
  </script>"""

new_script = """  <script>
(function() {
  try {
    var theme = localStorage.getItem('anhad_theme') || 'auto';
    var effectiveTheme = theme;
    if (theme === 'auto') {
      var hour = new Date().getHours();
      effectiveTheme = (hour >= 5 && hour < 20) ? 'light' : 'dark';
    }
    var html = document.documentElement;
    html.setAttribute('data-theme', effectiveTheme);
    html.setAttribute('data-theme-mode', theme);
    html.style.colorScheme = effectiveTheme;
    
    var isDark = (effectiveTheme === 'dark');
    html.style.backgroundColor = isDark ? '#0D0D0F' : '#FAF8F5';
    
    if (isDark) {
      html.classList.add('dark', 'dark-mode');
    } else {
      html.classList.remove('dark', 'dark-mode');
    }
    
    var observer = new MutationObserver(function() {
      if (document.body) {
        if (isDark) {
          document.body.classList.add('dark', 'dark-mode');
          document.body.style.backgroundColor = '#0D0D0F';
        } else {
          document.body.classList.remove('dark', 'dark-mode');
          document.body.style.backgroundColor = '#FAF8F5';
        }
        observer.disconnect();
      }
    });
    observer.observe(html, { childList: true, subtree: true });
  } catch(e) {}
})();
  </script>"""

# Normalize line endings to do search-and-replace
normalized_content = content.replace("\r\n", "\n")
normalized_old_pattern = old_script_pattern.replace("\r\n", "\n")
normalized_new_script = new_script.replace("\r\n", "\n")

if normalized_old_pattern in normalized_content:
    print("Found exact script match in normalized content. Replacing...")
    new_content = normalized_content.replace(normalized_old_pattern, normalized_new_script)
    
    # Write back with system line endings
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content.replace("\n", "\r\n"))
    print("Replacement successful!")
else:
    print("Exact script pattern NOT found in content. Let's do a substring check.")
    # Fallback to a simpler regex or direct substring replacement if needed
    start_marker = "const theme = localStorage.getItem('anhad_theme') || 'auto';"
    end_marker = "  </script>"
    
    start_idx = normalized_content.find(start_marker)
    if start_idx != -1:
        # Find the script tag around it
        script_start = normalized_content.rfind("<script>", 0, start_idx)
        script_end = normalized_content.find("</script>", start_idx)
        if script_start != -1 and script_end != -1:
            full_old = normalized_content[script_start - 2:script_end + 9] # include indentation
            print("Found block via boundaries!")
            new_content = normalized_content.replace(full_old, normalized_new_script)
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content.replace("\n", "\r\n"))
            print("Replacement via boundaries successful!")
        else:
            print("Could not find script tags around marker.")
    else:
        print("Marker not found either!")
