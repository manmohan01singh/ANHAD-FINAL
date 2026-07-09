/**
 * Canvas Renderer for Collage
 * Task 1.4: Renders channel images into a grid with circular clipping
 */

/**
 * Renders collage to canvas
 * @param {Array<ImageLoadResult>} imageResults - Loaded images and fallbacks
 * @param {GridLayout} layout - Grid layout configuration
 * @returns {HTMLCanvasElement} - Rendered canvas
 */
function renderCollageToCanvas(imageResults, layout) {
  const canvasSize = 116;
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  
  // Enable antialiasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Background
  const bgColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-tertiary').trim() || '#E5E5EA';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  
  // Draw images in grid
  const cellSize = layout.cellSize;
  imageResults.slice(0, layout.channelsToShow).forEach((result, index) => {
    const row = Math.floor(index / layout.cols);
    const col = index % layout.cols;
    const x = col * cellSize;
    const y = row * cellSize;
    
    if (result.success && result.image) {
      ctx.drawImage(result.image, x, y, cellSize, cellSize);
    } else if (result.fallback) {
      ctx.drawImage(result.fallback, x, y, cellSize, cellSize);
    }
  });
  
  // Apply circular clipping mask
  return applyCircularMask(canvas);
}

/**
 * Applies circular clipping mask to canvas
 * @param {HTMLCanvasElement} canvas - Input canvas
 * @returns {HTMLCanvasElement} - Clipped canvas
 */
function applyCircularMask(canvas) {
  const size = canvas.width;
  const clippedCanvas = document.createElement('canvas');
  clippedCanvas.width = size;
  clippedCanvas.height = size;
  const ctx = clippedCanvas.getContext('2d');
  
  // Create circular clipping path
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  
  // Draw original canvas within clip
  ctx.drawImage(canvas, 0, 0);
  
  return clippedCanvas;
}

// Export for use in other modules and tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderCollageToCanvas,
    applyCircularMask
  };
}
