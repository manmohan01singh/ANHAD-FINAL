/**
 * QUICK ACTIVATE SPARKLES
 * Paste this into browser console to immediately see sparkles
 */

console.log('🚀 Activating Festival Mode...');

// Wait for FestivalMode to be available
function activateSparkles() {
  if (typeof FestivalMode === 'undefined') {
    console.log('⏳ Waiting for FestivalMode to load...');
    setTimeout(activateSparkles, 100);
    return;
  }

  console.log('✅ FestivalMode loaded!');

  // Create test event
  const testEvent = {
    id: 'test-parkash-gurpurab',
    type: 'prakash',
    name_en: 'Parkash Gurpurab - Guru Nanak Dev Ji',
    name_pa: 'ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦਾ ਪ੍ਰਕਾਸ਼ ਪੁਰਬ'
  };

  // Activate
  FestivalMode.activate(testEvent);

  // Verify activation
  setTimeout(() => {
    const isActive = FestivalMode.isActive();
    const hasClass = document.documentElement.classList.contains('gurpurab-active');
    const sparklesEl = document.querySelector('.gurpurab-sparkles-top');
    const sparkleCount = document.querySelectorAll('.gurpurab-sparkle-top').length;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ FESTIVAL MODE STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Is Active:', isActive ? '✅ YES' : '❌ NO');
    console.log('Has .gurpurab-active class:', hasClass ? '✅ YES' : '❌ NO');
    console.log('Sparkles container exists:', sparklesEl ? '✅ YES' : '❌ NO');
    console.log('Number of sparkles:', sparkleCount);
    
    if (sparklesEl) {
      const styles = window.getComputedStyle(sparklesEl);
      console.log('Sparkles display:', styles.display);
      console.log('Sparkles opacity:', styles.opacity);
      console.log('Sparkles z-index:', styles.zIndex);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (isActive && hasClass && sparklesEl && sparkleCount === 5) {
      console.log('🎉 SUCCESS! Look at the TOP of the page for sparkles!');
      console.log('📜 Scroll down to see them fade away');
      console.log('📜 Scroll back up to see them reappear');
      
      // Add a visual indicator
      const indicator = document.createElement('div');
      indicator.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #D4AF37;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-family: sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.5s ease;
      `;
      indicator.textContent = '✨ Look at the TOP for sparkles!';
      document.body.appendChild(indicator);
      
      setTimeout(() => {
        indicator.style.transition = 'opacity 0.5s';
        indicator.style.opacity = '0';
        setTimeout(() => indicator.remove(), 500);
      }, 3000);
      
    } else {
      console.error('❌ Something went wrong. Debug info above.');
      
      // Try to force activation
      console.log('🔧 Attempting manual fix...');
      document.documentElement.classList.add('gurpurab-active');
      
      if (!sparklesEl) {
        console.log('Creating sparkles manually...');
        const container = document.createElement('div');
        container.className = 'gurpurab-sparkles-top';
        for (let i = 0; i < 5; i++) {
          const sparkle = document.createElement('div');
          sparkle.className = 'gurpurab-sparkle-top';
          sparkle.textContent = '✦';
          container.appendChild(sparkle);
        }
        document.body.appendChild(container);
        console.log('✅ Sparkles created manually');
      }
    }
  }, 500);
}

// Start activation
activateSparkles();
