/**
 * Image Loader with Timeout
 * Task 1.2: Load channel images asynchronously with 5-second timeout
 */

/**
 * Loads an image with timeout
 * @param {string} url - Image URL
 * @param {number} timeout - Timeout in milliseconds (default 5000)
 * @returns {Promise<HTMLImageElement>} - Loaded image element
 */
function loadImageWithTimeout(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS
    
    const timer = setTimeout(() => {
      reject(new Error(`Image load timeout: ${url}`));
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Image load failed: ${url}`));
    };
    
    img.src = url;
  });
}

/**
 * Loads multiple channel images in parallel
 * @param {Array<Channel>} channels - List of channel objects
 * @param {number} timeout - Timeout per image
 * @returns {Promise<Array<ImageLoadResult>>} - Results for each channel
 */
async function loadChannelImages(channels, timeout = 5000) {
  const promises = channels.map(async (channel) => {
    try {
      const image = await loadImageWithTimeout(channel.displayPicture, timeout);
      return { success: true, image, channel, loadTime: Date.now() };
    } catch (error) {
      return { 
        success: false, 
        error, 
        channel, 
        fallback: createFallbackPlaceholder(channel) 
      };
    }
  });
  
  return Promise.all(promises);
}

/**
 * Creates a fallback placeholder canvas with channel's first letter
 * @param {Channel} channel - Channel object
 * @param {number} size - Canvas size in pixels (default 116)
 * @returns {HTMLCanvasElement} - Fallback canvas
 */
function createFallbackPlaceholder(channel, size = 116) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Background (use CSS variable value)
  const bgColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-tertiary').trim() || '#E5E5EA';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  
  // Text (first letter of channel name)
  const firstLetter = (channel.channelName || '?')[0].toUpperCase();
  const textColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-secondary').trim() || '#636366';
  ctx.fillStyle = textColor;
  ctx.font = `bold ${size * 0.4}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(firstLetter, size / 2, size / 2);
  
  return canvas;
}
