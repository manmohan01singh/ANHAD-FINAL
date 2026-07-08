import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the collage function to use subtle placeholders instead of gold ones
old_collage_function = '''    // Function to generate a beautiful collage of all channel logos
    function generateChannelCollage(channels) {
      if (!channels || channels.length === 0) {
        // Fallback to default grid icon if no channels
        return `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <circle cx="8" cy="8" r="2.5"/>
            <circle cx="16" cy="8" r="2.5"/>
            <circle cx="8" cy="16" r="2.5"/>
            <circle cx="16" cy="16" r="2.5"/>
          </svg>
        `;
      }

      const channelCount = Math.min(channels.length, 4);
      
      // For single channel, show it full size
      if (channelCount === 1) {
        return getChannelAvatarHTML(channels[0]);
      }
      
      // For 2-4 channels, create a beautiful grid collage
      let collageHTML = '<div class="collage-grid">';
      
      // Add channel logos to the collage
      for (let i = 0; i < channelCount; i++) {
        const channel = channels[i];
        const avatarHTML = getChannelAvatarHTML(channel);
        collageHTML += `<div class="collage-item">${avatarHTML}</div>`;
      }
      
      // Fill remaining grid cells with beautiful placeholders only if we have space
      const remainingCells = 4 - channelCount;
      for (let i = 0; i < remainingCells; i++) {
        collageHTML += `<div class="collage-placeholder">+</div>`;
      }
      
      collageHTML += '</div>';
      return collageHTML;
    }'''

new_collage_function = '''    // Function to generate a beautiful collage of all channel logos
    function generateChannelCollage(channels) {
      if (!channels || channels.length === 0) {
        // Fallback to default grid icon if no channels
        return `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <circle cx="8" cy="8" r="2.5"/>
            <circle cx="16" cy="8" r="2.5"/>
            <circle cx="8" cy="16" r="2.5"/>
            <circle cx="16" cy="16" r="2.5"/>
          </svg>
        `;
      }

      const channelCount = Math.min(channels.length, 4);
      
      // For single channel, show it full size
      if (channelCount === 1) {
        return getChannelAvatarHTML(channels[0]);
      }
      
      // For 2-4 channels, create a clean grid collage
      let collageHTML = '<div class="collage-grid">';
      
      // Add channel logos to the collage
      for (let i = 0; i < channelCount; i++) {
        const channel = channels[i];
        const avatarHTML = getChannelAvatarHTML(channel);
        collageHTML += `<div class="collage-item">${avatarHTML}</div>`;
      }
      
      // Fill remaining grid cells with subtle placeholders only if we have space
      const remainingCells = 4 - channelCount;
      for (let i = 0; i < remainingCells; i++) {
        collageHTML += `<div class="collage-placeholder">•</div>`;
      }
      
      collageHTML += '</div>';
      return collageHTML;
    }'''

content = content.replace(old_collage_function, new_collage_function)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated placeholders to be more subtle')
