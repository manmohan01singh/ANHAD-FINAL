// PASTE THIS IN CONSOLE TO CHECK SPARKLES STATUS
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 SPARKLES DIAGNOSTIC');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check activation status
console.log('1. Festival Mode Active:', FestivalMode?.isActive());
console.log('2. HTML has gurpurab-active class:', document.documentElement.classList.contains('gurpurab-active'));
console.log('3. HTML has gurpurab-scrolled class:', document.documentElement.classList.contains('gurpurab-scrolled'));

// Check sparkles element
const sparklesContainer = document.querySelector('.gurpurab-sparkles-top');
console.log('4. Sparkles container exists:', !!sparklesContainer);

if (sparklesContainer) {
  const styles = window.getComputedStyle(sparklesContainer);
  console.log('5. Container display:', styles.display);
  console.log('6. Container opacity:', styles.opacity);
  console.log('7. Container z-index:', styles.zIndex);
  console.log('8. Container position:', styles.position);
  console.log('9. Container top:', styles.top);
  
  const sparkles = document.querySelectorAll('.gurpurab-sparkle-top');
  console.log('10. Number of sparkles:', sparkles.length);
  
  if (sparkles.length > 0) {
    console.log('11. First sparkle:', sparkles[0]);
    console.log('12. First sparkle text:', sparkles[0].textContent);
    console.log('13. First sparkle color:', window.getComputedStyle(sparkles[0]).color);
  }
} else {
  console.log('❌ Sparkles container NOT FOUND - creating now...');
  
  // Create it manually
  const container = document.createElement('div');
  container.className = 'gurpurab-sparkles-top';
  
  for (let i = 1; i <= 5; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'gurpurab-sparkle-top';
    sparkle.textContent = '✦';
    container.appendChild(sparkle);
  }
  
  document.body.appendChild(container);
  console.log('✅ Sparkles container created!');
  console.log('👀 Look at the TOP of the page now!');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
