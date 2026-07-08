/**
 * Grid Layout Calculator for Channel Collage
 * Determines optimal grid layout based on number of monitored channels
 */

/**
 * GridLayout interface
 * @typedef {Object} GridLayout
 * @property {number} rows - Number of rows in grid
 * @property {number} cols - Number of columns in grid
 * @property {number} cellSize - Size of each cell in pixels
 * @property {number} totalCells - Total grid cells (rows × cols)
 * @property {number} channelsToShow - Actual channels to display (min(channels.length, totalCells))
 */

/**
 * Calculates grid layout based on channel count
 * @param {number} channelCount - Number of channels to display
 * @returns {GridLayout} - Grid layout configuration
 * @throws {Error} - If channelCount is zero or negative
 */
function calculateGridLayout(channelCount) {
  if (channelCount <= 0) {
    throw new Error('Channel count must be positive');
  }
  
  if (channelCount === 1) {
    return { 
      rows: 1, 
      cols: 1, 
      cellSize: 116, 
      totalCells: 1, 
      channelsToShow: 1 
    };
  } else if (channelCount <= 4) {
    return { 
      rows: 2, 
      cols: 2, 
      cellSize: 58, 
      totalCells: 4, 
      channelsToShow: Math.min(channelCount, 4) 
    };
  } else if (channelCount <= 9) {
    return { 
      rows: 3, 
      cols: 3, 
      cellSize: 38.67, 
      totalCells: 9, 
      channelsToShow: Math.min(channelCount, 9) 
    };
  } else {
    return { 
      rows: 4, 
      cols: 4, 
      cellSize: 29, 
      totalCells: 16, 
      channelsToShow: Math.min(channelCount, 16) 
    };
  }
}

// Export for use in other modules (if module system is used)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateGridLayout };
}
