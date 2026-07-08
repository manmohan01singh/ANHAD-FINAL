import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the channel initialization to use cleaner avatars
old_init = '''    // Initialize channels with profile pictures
    function initializeChannelsWithProfilePictures() {
      FALLBACK_CHANNELS.forEach(channel => {
        if (!channel.thumbnail) {
          // Use a reliable placeholder service that generates consistent avatars based on channel ID
          channel.thumbnail = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.channelName)}&background=random&size=88&bold=true`;
        }
      });
    }'''

new_init = '''    // Initialize channels with profile pictures
    function initializeChannelsWithProfilePictures() {
      FALLBACK_CHANNELS.forEach(channel => {
        if (!channel.thumbnail) {
          // Use clean, professional avatars with neutral colors
          channel.thumbnail = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.channelName)}&background=E5E5EA&color=636366&size=88&bold=true`;
        }
      });
    }'''

content = content.replace(old_init, new_init)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated channel initialization to use cleaner avatars')
