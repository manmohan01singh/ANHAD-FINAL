/**
 * Debounce Utility
 * Task 2.2: Debounces function calls by 500ms
 */

function debounce(func, delay = 500) {
  let timeoutId = null;
  
  return function debounced(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}
