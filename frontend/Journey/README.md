# The Journey - ANHAD

This is the "Journey" page that tells the story behind ANHAD and shares the development experience with users.

## 📝 Customization Guide

### 1. Add Your Photo
Replace the placeholder icon with your actual photo:
- Take a clear, professional photo (512x512px recommended)
- Save it as `photo.jpg` or `photo.png` in this folder
- Update line in `journey.html`:
```html
<!-- Replace this: -->
<div class="photo-placeholder">...</div>

<!-- With this: -->
<img src="photo.jpg" alt="Manmohan Singh" class="creator-photo-img">
```

### 2. Update Timeline Dates
If your actual development timeline is different, update the dates in the Timeline section of `journey.html`:
- The current timeline shows January-July 2025
- Adjust months and milestones based on your actual journey

### 3. Update Statistics
Modify the stats in the "Project Statistics" section:
- Development time
- Lines of code (you can count with `cloc` or similar tools)
- Features count
- Any other metrics you want to highlight

### 4. Add Contact Information
Update the contact buttons with your actual links:

In `journey.html`, find the contact section and update:
```html
<a href="mailto:your-email@example.com" class="contact-btn">
<!-- Change to your actual email -->

<!-- Add your GitHub link -->
<a href="https://github.com/yourusername" class="contact-btn">

<!-- Add your bug report form or email -->
<a href="mailto:bugs@yourdomain.com" class="contact-btn">
```

### 5. Customize Your Story
Edit the "My Journey" section to reflect your actual experience:
- Why you started ANHAD
- Challenges you faced
- What you learned
- How it evolved

### 6. Update Special Thanks
Modify the "Special Thanks" section to include anyone specific you want to thank.

### 7. Optional: Add Support Section
If you want to accept donations in the future, uncomment or add a support section:
```html
<section class="content-section support-section">
    <div class="section-icon">☕</div>
    <h2>Support Development</h2>
    <div class="support-content">
        <p>If you'd like to support continued development:</p>
        <div class="support-buttons">
            <a href="upi://pay?pa=your-upi@bank" class="support-btn">
                UPI Payment
            </a>
            <a href="https://buymeacoffee.com/yourname" class="support-btn">
                Buy Me a Coffee
            </a>
        </div>
    </div>
</section>
```

## 🎨 Theme Support

The page automatically adapts to the user's selected theme (light/dark) by reading from `localStorage`.

## 🔗 Adding to Navigation

To add this page to your app's navigation:

### In Settings Page:
```html
<div class="setting-item" onclick="window.location.href='../Journey/journey.html'">
    <div class="setting-icon">🌿</div>
    <div class="setting-content">
        <div class="setting-title">The Journey</div>
        <div class="setting-description">Learn about ANHAD's story</div>
    </div>
</div>
```

### In Profile Page:
```html
<button class="profile-btn" onclick="window.location.href='../Journey/journey.html'">
    <span class="btn-icon">📖</span>
    <span>The Journey</span>
</button>
```

### In Footer (if you have one):
```html
<a href="./Journey/journey.html" class="footer-link">About ANHAD</a>
```

## 📱 Responsive Design

The page is fully responsive and works beautifully on:
- Desktop (900px+ width)
- Tablet (768px - 900px)
- Mobile (320px - 768px)

## ✨ Features

- **Smooth Animations**: Fade-in effects as you scroll
- **Interactive Timeline**: Hover effects on timeline dots
- **Floating Logo**: Subtle animation on the cover logo
- **Parallax Effect**: Cover section moves with scroll
- **Theme Support**: Automatically matches app theme
- **Keyboard Navigation**: ESC key to go back
- **Accessibility**: Proper ARIA labels and semantic HTML

## 🙏 Philosophy

This page is designed to:
1. **Tell the story** - Not just "what" but "why"
2. **Show the journey** - The process, not just the result
3. **Express gratitude** - Thank those who helped
4. **Stay humble** - Focus on seva, not self-promotion
5. **Inspire others** - Show that one person can make a difference

## 📄 Files

- `journey.html` - Main HTML structure
- `journey.css` - All styling and animations
- `journey.js` - Interactive features and animations
- `README.md` - This customization guide

## 🎯 Alternative Titles

If you want to use a different title, here are the suggestions again:
- 🌿 The Journey
- 🙏 Behind ANHAD
- 💛 Why ANHAD Exists
- ✨ Built With Seva
- 📖 The Story of ANHAD

To change the title, update:
1. Page title in `<title>` tag
2. Header `.journey-title` text
3. Any navigation links pointing to this page

---

**Built with ❤️ and Seva**

ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਿਹ
