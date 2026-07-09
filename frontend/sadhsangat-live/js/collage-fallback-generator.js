/**
 * Fallback Placeholder Generator for Channel Collage
 * Creates placeholder canvases with channel's first letter for failed image loads
 */

/**
 * Creates a fallback placeholder canvas with channel's first letter
 * @param {Channel} channel - Channel object with channelName property
 * @param {number} size - Canvas size in pixels (default 116 for 2x resolution)
 * @returns {HTMLCanvasElement} - Fallback canvas with letter
 */
function createFallbackPlaceholder(channel, size = 116) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Background color (use CSS variable value or fallback)
  const bgColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-tertiary').trim() || '#E5E5EA';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  
  // Text (first letter of channel name, uppercased)
  const firstLetter = channel && channel.channelName 
    ? channel.channelName[0].toUpperCase() 
    : '?';
  
  const textColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-secondary').trim() || '#636366';
  ctx.fillStyle = textColor;
  ctx.font = `bold ${size * 0.4}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(firstLetter, size / 2, size / 2);
  
  return canvas;
}

// Export for use in other modules and tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createFallbackPlaceholder };
}
