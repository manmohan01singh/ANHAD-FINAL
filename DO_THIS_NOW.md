# 🎯 DO THIS NOW - See Sparkles Immediately

## Quick 3-Step Process

### Step 1: Reload Your Browser
**Hard refresh the page:**
- Press `Ctrl + Shift + R` (Windows)
- Or `Cmd + Shift + R` (Mac)

### Step 2: Open Console
- Press `F12`
- Click "Console" tab

### Step 3: Paste This Code

```javascript
const todayEvent = {
  id: 'prakash-guru-harkrishan-2026',
  type: 'prakash',
  name_en: 'Prakash Gurpurab Sri Guru Harkrishan Sahib Ji',
  name_pa: 'ਪ੍ਰਕਾਸ਼ ਗੁਰਪੁਰਬ ਗੁਰੂ ਹਰਿਕ੍ਰਿਸ਼ਨ ਜੀ'
};

if (typeof FestivalMode !== 'undefined') {
  FestivalMode.activate(todayEvent);
  console.log('✅ ACTIVATED! Look at the TOP of the page for sparkles!');
} else {
  setTimeout(() => {
    FestivalMode.activate(todayEvent);
    console.log('✅ ACTIVATED! Look at the TOP of the page for sparkles!');
  }, 2000);
}
```

---

## 👀 You Should See

**At the very top of the page:**
- 5 golden stars (✦)
- Gentle glow animation
- Semi-transparent golden color

**Scroll test:**
- Scroll down → sparkles fade away
- Scroll up → sparkles reappear

---

## 🚨 If Still Nothing Appears

### Emergency Force Creation:

```javascript
document.documentElement.classList.add('gurpurab-active');
const c = document.createElement('div');
c.className = 'gurpurab-sparkles-top';
c.style.cssText = 'position:fixed;top:0;left:0;right:0;height:80px;z-index:9999;display:block;pointer-events:none;';
['15%','35%','50%','65%','85%'].forEach((p,i) => {
  const s = document.createElement('div');
  s.className = 'gurpurab-sparkle-top';
  s.textContent = '✦';
  s.style.cssText = `position:absolute;left:${p};top:${20+i*2}px;font-size:24px;color:rgba(212,175,55,0.9);`;
  c.appendChild(s);
});
document.body.appendChild(c);
console.log('✅ FORCED! Look at top now!');
```

---

## ✅ Done!

Look at the **very top** of your browser window now. You should see the sparkles! 🌟
