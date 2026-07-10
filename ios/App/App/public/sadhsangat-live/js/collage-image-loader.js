/**
 * Image Loader Module for Channel Collage
 * Handles asynchronous loading of channel display pictures with timeout and fallback support
 */

/**
 * Loads an image with timeout
 * @param {string} url - Image URL
 * @param {number} timeout - Timeout in milliseconds (default 5000)
 * @returns {Promise<HTMLImageElement>} - Loaded image element
 * @throws {Error} - If image fails to load or times out
 */
function loadImageWithTimeout(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS
    
    const timer = setTimeout(() => {
      img.src = ''; // Cancel the request
      reject(new Error(`Image load timeout after ${timeout}ms: ${url}`));
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    
    img.onerror = (error) => {
      clearTimeout(timer);
      reject(new Error(`Image load failed: ${url}`));
    };
    
    img.src = url;
  });
}

/**
 * ImageLoadResult interface
 * @typedef {Object} ImageLoadResult
 * @property {boolean} success - True if image loaded successfully
 * @property {HTMLImageElement} [image] - Loaded image element (present if success=true)
 * @property {Error} [error] - Error object (present if success=false)
 * @property {HTMLCanvasElement} [fallback] - Fallback canvas (present if success=false)
 * @property {Object} channel - Source channel object
 * @property {number} loadTime - Time taken to load/fail in milliseconds
 */

/**
 * Loads multiple channel images in parallel
 * @param {Array<Channel>} channels - List of channel objects with displayPicture URLs
 * @param {number} timeout - Timeout per image in milliseconds (default 5000)
 * @returns {Promise<Array<ImageLoadResult>>} - Results for each channel
 */
async function loadChannelImages(channels, timeout = 5000) {
  const startTime = Date.now();
  
  const promises = channels.map(async (channel, index) => {
    const channelStartTime = Date.now();
    
    try {
      const image = await loadImageWithTimeout(channel.displayPicture, timeout);
      const loadTime = Date.now() - channelStartTime;
      
      return {
        success: true,
        image: image,
        channel: channel,
        loadTime: loadTime
      };
    } catch (error) {
      const loadTime = Date.now() - channelStartTime;
      
      // Create fallback placeholder for failed image
      // Note: createFallbackPlaceholder will be defined in collage-fallback-generator.js
      const fallback = typeof createFallbackPlaceholder === 'function' 
        ? createFallbackPlaceholder(channel) 
        : null;
      
      console.warn(`[Collage Image Loader] Failed to load image for channel ${channel.channelId}: ${error.message}`);
      
      return {
        success: false,
        error: error,
        fallback: fallback,
        channel: channel,
        loadTime: loadTime
      };
    }
  });
  
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  const successCount = results.filter(r => r.success).length;
  console.log(`[Collage Image Loader] Loaded ${successCount}/${channels.length} images in ${totalTime}ms`);
  
  return results;
}

// Export for use in other modules and tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadImageWithTimeout,
    loadChannelImages
  };
}
