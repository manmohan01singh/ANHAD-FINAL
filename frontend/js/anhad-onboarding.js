/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD GUIDED ONBOARDING SYSTEM — High-Premium Zero-Blur Edition
 * 4-Div Sliding Spotlight Overlay System, Dynamic Resize/Scroll Listeners,
 * Premium Glassmorphic Language Selector & Rich Multilingual Copy
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const TOUR_KEY = 'anhad_onboarding_v9_completed';
    const LANG_KEY = 'anhad_tour_lang';

    // Multilingual Step Content for all 14 core index.html widgets (including Guide button)
    const tourContent = {
        en: [
            { selector: '#homeBackBtn', title: '📻 Enter Gurdwara Sahib', text: 'Tapping this elegant radio button enters the main Gurdwara Sahib interface where you can listen to live Gurbani broadcasts perfectly synchronized across all devices in real-time.', position: 'bottom-left', badges: ['📻 Live Broadcast', '🔄 Auto-Sync', '✨ Divine Sound'] },
            { selector: '#guideStartBtn', title: 'ℹ️ Re-run App Tour', text: 'Click this information button at any time to re-run this complete guided tour, select your language, or get a quick glimpse of ANHAD\'s beautiful capabilities.', position: 'bottom-left', badges: ['ℹ️ On-Demand', '🗣️ Multi-Language', '✨ Guided Tour'] },
            { selector: '#themeToggleBtn', title: '✨ Choose Magic Themes', text: 'Cycle between three exquisite theme presets: crisp Light mode, deep Dark mode, or our premium auto-dynamic Time-of-Day theme which updates background artwork and colors according to the local hour.', position: 'bottom-right', badges: ['☀️ Light', '🌙 Dark', '⏳ Time Dynamic'] },
            { selector: '.hero-carousel', title: '🎵 Virtual Live Streams', text: 'Swipe horizontally to browse live broadcasts. Tap the play controls to instantly load audio feeds for Sri Harmandir Sahib, Amritvela prayers, or peaceful Waheguru Simran.', position: 'center', badges: ['📻 Live Kirtan', '🎧 Play Controls', '🔄 Synchronized'] },
            { selector: '#eventCard', title: '📅 Gurpurab Calendar', text: 'Keep track of upcoming historical Gurpurabs and significant Sikh dates with an active countdown timer, ensuring you never miss holy historical reminders.', position: 'top-center', badges: ['📅 Historical Dates', '⏳ Countdown', '🔔 Reminders'] },
            { selector: '#nitnemPractice', title: '📿 Daily Nitnem Prayers', text: 'Open your daily devotional Banis in an ultra-premium reader with adjustable sizing, transliterations, translations, and beautiful progressive task completion.', position: 'top-center', badges: ['📿 Devotions', '📖 Adjust Size', '✅ Track Progress'] },
            { selector: '#sehajPractice', title: '📖 Sehaj Paath Reader', text: 'Start, resume, and track your personal reading of Sri Guru Granth Sahib Ji at your own comfortable pace, complete with completed Ang and percentage tracking.', position: 'top-center', badges: ['📖 SGGS Ji', '📈 Percentage', '✨ Save Ang'] },
            { selector: '#hukamPractice', title: '📜 Today\'s Hukamnama', text: 'Read the daily divine Hukamnama command issued from Sri Harmandir Sahib, complete with detailed Punjabi and English translations and high-quality audio recitation.', position: 'top-center', badges: ['📜 Daily Command', '🗣️ Translations', '🔊 Audio Recitation'] },
            { selector: '#nitnemTrackerCard', title: '🔥 Nitnem Tracker', text: 'Monitor your spiritual consistency with active devotions tracking, check-in calendars, streak numbers, and detailed analytics inside your spiritual dashboard.', position: 'top-center', badges: ['🔥 Consistency', '📆 Calendar Check-in', '📊 Detailed Stats'] },
            { selector: '#naamCard', title: '🙏 Naam Abhyas Simran', text: 'Set a beautiful schedule for the whole day: every single hour, dedicate 2 minutes to peaceful Simran. Leave everything else aside for those 2 minutes to connect. This daily discipline keeps Waheguru in your consciousness each and every second, fulfilling the true motive of Naam Abhyas.', position: 'top-center', badges: ['🙏 2 Min Simran', '⏰ Every Hour', '✨ Remember Waheguru'] },
            { selector: '#shabadVicharCard', title: '🪔 Daily Shabad Vichar', text: 'Contemplate and reflect on deep theological and spiritual meanings of selected Gurbani Shabads updated every single day to guide your spiritual learning.', position: 'top-center', badges: ['🪔 Daily Shabad', '💡 Theology', '✨ Deep Meanings'] },
            { selector: '#searchCard', title: '🔍 Advanced Gurbani Khoj', text: 'An incredibly powerful search tool that allows you to instantly search for any Shabad inside Sri Guru Granth Sahib Ji by first-letter initials or keywords.', position: 'top-center', badges: ['🔍 Multi-Search', '🔤 Initials/Keywords', '⚡ Instant'] },
            { selector: '#notesCard', title: '📝 Spiritual Notes', text: 'Jot down, edit, and safely store your personal spiritual inspirations, reflections, and notes as you read Gurbani or contemplate your devotions.', position: 'top-center', badges: ['📝 Personal Notes', '💾 Safe Save', '✏️ Edit/View'] },
            { selector: '#mainNav', title: '📈 Navigation & Dashboard', text: 'Easily transition between the home dashboard, your personal favorites list, the learning library (Insights), or open your complete stats dashboard.', position: 'top-center', badges: ['📈 4 Core Pages', '📊 Devotional Stats', '⭐ Favorites'] }
        ],
        pa: [
            { selector: '#homeBackBtn', title: '📻 ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ ਪ੍ਰਵੇਸ਼', text: 'ਇਸ ਖੂਬਸੂਰਤ ਬਟਨ ਤੇ ਕਲਿੱਕ ਕਰਕੇ ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ ਦੇ ਮੁੱਖ ਪੇਜ \'ਤੇ ਜਾਓ, ਜਿੱਥੇ ਤੁਸੀਂ ਸਾਰੇ ਯੰਤਰਾਂ \'ਤੇ ਇੱਕੋ ਸਮੇਂ ਇੱਕਸਾਰ (synchronized) ਲਾਈਵ ਗੁਰਬਾਣੀ ਕੀਰਤਨ ਸੁਣ ਸਕਦੇ ਹੋ।', position: 'bottom-left', badges: ['📻 ਲਾਈਵ ਕੀਰਤਨ', '🔄 ਆਟੋ-ਸਿੰਕ', '✨ ਇਲਾਹੀ ਬਾਣੀ'] },
            { selector: '#guideStartBtn', title: 'ℹ️ ਗਾਈਡ ਟੂਰ ਦੁਬਾਰਾ ਚਲਾਓ', text: 'ਐਪ ਦੇ ਇਸ ਗਾਈਡ ਟੂਰ ਨੂੰ ਕਿਸੇ ਵੀ ਸਮੇਂ ਦੁਬਾਰਾ ਚਲਾਉਣ, ਭਾਸ਼ਾ ਬਦਲਣ, ਜਾਂ ਐਪ ਦੀਆਂ ਬਿਹਤਰੀਨ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ ਨੂੰ ਸਮਝਣ ਲਈ ਇਸ ਬਟਨ ਤੇ ਕਲਿੱਕ ਕਰੋ।', position: 'bottom-left', badges: ['ℹ️ ਆਨ-ਡਿਮਾਂਡ', '🗣️ ਬਹੁ-ਭਾਸ਼ਾਈ', '✨ ਗਾਈਡ ਟੂਰ'] },
            { selector: '#themeToggleBtn', title: '✨ ਜਾਦੂਈ ਥੀਮ ਚੁਣੋ', text: 'ਸਾਡੇ ਤਿੰਨ ਸ਼ਾਨਦਾਰ ਥੀਮ ਚੁਣੋ! ਲਾਈਟ, ਡਾਰਕ, ਜਾਂ ਸਾਡਾ ਸਭ ਤੋਂ ਪ੍ਰੀਮੀਅਮ ਡਾਇਨਾਮਿਕ ਸਮੇਂ-ਅਨੁਸਾਰ ਥੀਮ, ਜੋ ਦਿਨ ਦੇ ਸਮੇਂ ਮੁਤਾਬਿਕ ਬੈਕਗ੍ਰਾਊਂਡ ਤਸਵੀਰਾਂ ਅਤੇ ਰੰਗਾਂ ਨੂੰ ਆਪਣੇ ਆਪ ਬਦਲ ਦਿੰਦਾ ਹੈ।', position: 'bottom-right', badges: ['☀️ ਲਾਈਟ ਥੀਮ', '🌙 ਡਾਰਕ ਥੀਮ', '⏳ ਡਾਇਨਾਮਿਕ ਥੀਮ'] },
            { selector: '.hero-carousel', title: '🎵 ਵਰਚੁਅਲ ਲਾਈਵ ਕੀਰਤਨ', text: 'ਲਾਈਵ ਪ੍ਰਸਾਰਣ ਦੇਖਣ ਲਈ ਖੱਬੇ/ਸੱਜੇ ਸਵਾਈਪ ਕਰੋ। ਸ੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ, ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਪਾਠ, ਜਾਂ ਵਾਹਿਗੁਰੂ ਸਿਮਰਨ ਦਾ ਆਡੀਓ ਚਲਾਉਣ ਲਈ ਪਲੇਅ ਬਟਨ ਦਬਾਓ।', position: 'center', badges: ['📻 ਲਾਈਵ ਪ੍ਰਸਾਰਣ', '🎧 ਪਲੇਅ ਕੰਟਰੋਲ', '🔄 ਇਕਸਾਰ ਧੁਨੀ'] },
            { selector: '#eventCard', title: '📅 ਗੁਰਪੁਰਬ ਕੈਲੰਡਰ', text: 'ਆਉਣ ਵਾਲੇ ਇਤਿਹਾਸਕ ਗੁਰਪੁਰਬਾਂ ਅਤੇ ਸਿੱਖ ਇਤਿਹਾਸ ਦੇ ਮਹੱਤਵਪੂਰਨ ਦਿਹਾੜਿਆਂ ਦੀ ਲਾਈਵ ਉਲਟੀ ਗਿਣਤੀ (countdown) ਟਰੈਕਰ ਨਾਲ ਜਾਣਕਾਰੀ ਪ੍ਰਾਪਤ ਕਰੋ।', position: 'top-center', badges: ['📅 ਇਤਿਹਾਸਕ ਦਿਹਾੜੇ', '⏳ ਕਾਊਂਟਡਾਊਨ', '🔔 ਰੀਮਾਈਂਡਰ'] },
            { selector: '#nitnemPractice', title: '📿 ਰੋਜ਼ਾਨਾ ਨਿਤਨੇਮ ਪਾਠ', text: 'ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਨਿਤਨੇਮ ਦੀਆਂ ਬਾਣੀਆਂ ਨੂੰ ਪ੍ਰੀਮੀਅਮ ਪਾਠਕ (reader) ਵਿੱਚ ਅੱਖਰਾਂ ਦੇ ਆਕਾਰ, ਅਨੁਵਾਦ ਅਤੇ ਲਾਈਵ ਪ੍ਰਗਤੀ ਟਰੈਕਿੰਗ ਨਾਲ ਪੜ੍ਹੋ।', position: 'top-center', badges: ['📿 ਰੋਜ਼ਾਨਾ ਬਾਣੀਆਂ', '📖 ਆਕਾਰ ਬਦਲੋ', '✅ ਲਾਈਵ ਪ੍ਰਗਤੀ'] },
            { selector: '#sehajPractice', title: '📖 ਸਹਿਜ ਪਾਠ ਰੀਡਰ', text: 'ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਦੇ ਸਹਿਜ ਪਾਠ ਦੀ ਸ਼ੁਰੂਆਤ ਕਰੋ ਅਤੇ ਆਪਣੀ ਸਹੂਲਤ ਅਨੁਸਾਰ ਪੜ੍ਹੋ। ਇਹ ਤੁਹਾਡੇ ਪੜ੍ਹੇ ਅੰਗਾਂ ਅਤੇ ਫ਼ੀਸਦੀ ਪ੍ਰਗਤੀ ਨੂੰ ਟਰੈਕ ਕਰਦਾ ਹੈ।', position: 'top-center', badges: ['📖 ਸਹਿਜ ਪਾਠ', '📈 ਪ੍ਰਗਤੀ ਫ਼ੀਸਦੀ', '✨ ਅੰਗ ਟਰੈਕਰ'] },
            { selector: '#hukamPractice', title: '📜 ਅੱਜ ਦਾ ਮੁੱਖਵਾਕ (ਹੁਕਮਨਾਮਾ)', text: 'ਸ੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਤੋਂ ਅੱਜ ਦਾ ਰੋਜ਼ਾਨਾ ਪਵਿੱਤਰ ਹੁਕਮਨਾਮਾ ਸਾਹਿਬ, ਪੰਜਾਬੀ ਅਤੇ ਅੰਗਰੇਜ਼ੀ ਵਿਆਖਿਆ ਅਤੇ ਉੱਚ-ਗੁਣਵੱਤਾ ਵਾਲੇ ਆਡੀਓ ਪਾਠ ਨਾਲ ਸਰਵਣ ਕਰੋ।', position: 'top-center', badges: ['📜 ਮੁੱਖਵਾਕ', '🗣️ ਵਿਆਖਿਆ', '🔊 ਆਡੀਓ ਪਾਠ'] },
            { selector: '#nitnemTrackerCard', title: '🔥 ਨਿਤਨੇਮ ਟਰੈਕਰ', text: 'ਆਪਣੀ ਰੋਜ਼ਾਨਾ ਭਗਤੀ ਦੀ ਪ੍ਰਗਤੀ ਨੂੰ ਮਾਨੀਟਰ ਕਰੋ। ਇਹ ਕੈਲੰਡਰ, ਭਗਤੀ ਦੇ ਦਿਨ, ਨੇਮ ਦੇ ਲਗਾਤਾਰ ਦਿਨ (streaks) ਅਤੇ ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਵਿਸ਼ਲੇਸ਼ਣ ਦਿਖਾਉਂਦਾ ਹੈ।', position: 'top-center', badges: ['🔥 ਰੋਜ਼ਾਨਾ ਨੇਮ', '📆 ਕੈਲੰਡਰ ਚੈੱਕ-ਇਨ', '📊 ਅਨਾਲਿਟਿਕਸ'] },
            { selector: '#naamCard', title: '🙏 ਨਾਮ ਅਭਿਆਸ ਸਿਮਰਨ', text: 'ਸਾਰਾ ਦਿਨ ਸਿਮਰਨ ਦਾ ਇੱਕ ਖੂਬਸੂਰਤ ਨਿਯਮ ਬਣਾਓ: ਹਰ ਇੱਕ ਘੰਟੇ ਬਾਅਦ, ਸਿਰਫ਼ 2 ਮਿੰਟ ਲਈ ਸ਼ਾਂਤਮਈ ਸਿਮਰਨ ਕਰੋ। ਉਨ੍ਹਾਂ 2 ਮਿੰਟਾਂ ਲਈ ਦੁਨੀਆ ਦੇ ਸਾਰੇ ਕੰਮ ਛੱਡ ਦਿਓ। ਇਹ ਅਭਿਆਸ ਹਰ ਪਲ ਵਾਹਿਗੁਰੂ ਜੀ ਨੂੰ ਚੇਤੇ ਰੱਖਣ ਵਿੱਚ ਮਦਦ ਕਰੇਗਾ, ਜੋ ਕਿ ਨਾਮ ਅਭਿਆਸ ਦਾ ਅਸਲ ਮਨੋਰਥ ਹੈ।', position: 'top-center', badges: ['🙏 ਹਰ ਘੰਟੇ 2 ਮਿੰਟ', '⏰ ਸਿਮਰਨ ਅਭਿਆਸ', '✨ ਵਾਹਿਗੁਰੂ ਚੇਤੇ ਰੱਖੋ'] },
            { selector: '#shabadVicharCard', title: '🪔 ਰੋਜ਼ਾਨਾ ਸ਼ਬਦ ਵਿਚਾਰ', text: 'ਹਰ ਰੋਜ਼ ਚੁਣੇ ਗਏ ਗੁਰਬਾਣੀ ਸ਼ਬਦਾਂ ਦੇ ਡੂੰਘੇ ਰੂਹਾਨੀ ਅਤੇ ਅਧਿਆਤਮਿਕ ਅਰਥਾਂ ਨੂੰ ਪੜ੍ਹ ਕੇ ਆਪਣੇ ਰੂਹਾਨੀ ਗਿਆਨ ਵਿੱਚ ਵਾਧਾ ਕਰੋ।', position: 'top-center', badges: ['🪔 ਰੋਜ਼ਾਨਾ ਵਿਚਾਰ', '💡 ਰੂਹਾਨੀ ਗਿਆਨ', '✨ ਡੂੰਘੇ ਅਰਥ'] },
            { selector: '#searchCard', title: '🔍 ਗੁਰਬਾਣੀ ਖੋਜ', text: 'ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਵਿੱਚੋਂ ਕਿਸੇ ਵੀ ਸ਼ਬਦ ਨੂੰ ਪਹਿਲੇ ਅੱਖਰ (initials) ਜਾਂ ਕੀਵਰਡ ਨਾਲ ਸਕਿੰਟਾਂ ਵਿੱਚ ਲੱਭਣ ਲਈ ਇੱਕ ਸ਼ਕਤੀਸ਼ਾਲੀ ਖੋਜ ਇੰਜਣ।', position: 'top-center', badges: ['🔍 ਗੁਰਬਾਣੀ ਖੋਜ', '🔤 ਅੱਖਰ/ਕੀਵਰਡ', '⚡ ਤੁਰੰਤ ਖੋਜ'] },
            { selector: '#notesCard', title: '📝 ਗੁਰਬਾਣੀ ਨੋਟਸ', text: 'ਪਾਠ ਕਰਦੇ ਸਮੇਂ ਜਾਂ ਵਿਚਾਰ ਸੁਣਦੇ ਸਮੇਂ ਆਪਣੇ ਮਨ ਵਿੱਚ ਆਏ ਰੂਹਾਨੀ ਵਿਚਾਰਾਂ, ਪ੍ਰੇਰਨਾਵਾਂ ਅਤੇ ਨਿੱਜੀ ਨੋਟਸ ਨੂੰ ਲਿਖ ਕੇ ਸੁਰੱਖਿਅਤ ਰੱਖੋ।', position: 'top-center', badges: ['📝 ਨਿੱਜੀ ਨੋਟਸ', '💾 ਸੁਰੱਖਿਅਤ ਸੇਵ', '✏️ ਲਿਖੋ/ਸੋਧੋ'] },
            { selector: '#mainNav', title: '📈 ਨੇਵੀਗੇਸ਼ਨ ਅਤੇ ਡੈਸ਼ਬੋਰਡ', text: 'ਹੋਮ ਪੇਜ, ਪਸੰਦੀਦਾ (favorites) ਸ਼ਬਦਾਂ ਦੀ ਸੂਚੀ, ਲਾਇਬ੍ਰੇਰੀ (Insights), ਜਾਂ ਆਪਣੀ ਭਗਤੀ ਦੇ ਵਿਸ਼ਲੇਸ਼ਣ ਡੈਸ਼ਬੋਰਡ ਦੇ ਵਿਚਕਾਰ ਆਸਾਨੀ ਨਾਲ ਬਦਲੋ।', position: 'top-center', badges: ['📈 4 ਮੁੱਖ ਪੰਨੇ', '📊 ਭਗਤੀ ਦੇ ਅੰਕੜੇ', '⭐ ਪਸੰਦੀਦਾ'] }
        ],
        hi: [
            { selector: '#homeBackBtn', title: '📻 गुरुद्वारा साहिब प्रवेश', text: 'इस सुंदर बटन पर क्लिक करके गुरुद्वारा साहिब की मुख्य स्क्रीन पर जाएं, जहां आप सभी उपकरणों पर एक साथ लाइव गुरबाणी कीर्तन का आनंद ले सकते हैं।', position: 'bottom-left', badges: ['📻 लाइव कीर्तन', '🔄 ऑटो-सिंक', '✨ अलौकिक वाणी'] },
            { selector: '#guideStartBtn', title: 'ℹ️ गाइड टूर पुनः चलाएं', text: 'इस ऐप गाइड टूर को किसी भी समय दोबारा चलाने, भाषा चुनने, या ऐप की अद्भुत विशेषताओं को संक्षेप में समझने के लिए इस बटन पर क्लिक करें।', position: 'bottom-left', badges: ['ℹ️ ऑन-डिमांड', '🗣️ बहु-भाषीय', '✨ गाइड टूर'] },
            { selector: '#themeToggleBtn', title: '✨ जादुई थीम चुनें', text: 'हमारे तीन शानदार थीम चुनें! लाइट, डार्क, या हमारा प्रीमियम ऑटो-डायनामिक टाइम-ऑफ-डे थीम, जो दिन के समय के अनुसार वॉलपेपर और रंगों को स्वचालित रूप से बदलता है।', position: 'bottom-right', badges: ['☀️ लाइट थीम', '🌙 डार्क थीम', '⏳ डायनेमिक थीम'] },
            { selector: '.hero-carousel', title: '🎵 वर्चुअल लाइव कीर्तन', text: 'लाइव प्रसारण ब्राउज़ करने के लिए दाएं/बाएं स्वाइप करें। श्री हरिमंदिर साहिब, अमृत वेला पाठ, या वाहेगुरु सिमरन का ऑडियो सुनने के लिए प्ले दबाएं।', position: 'center', badges: ['📻 लाइव कीर्तन', '🎧 प्ले कंट्रोल्स', '🔄 एकसमान ध्वनि'] },
            { selector: '#eventCard', title: '📅 गुरपुरब कैलेंडर', text: 'आने वाले ऐतिहासिक गुरपुरबों और ऐतिहासिक तिथियों की जानकारी लाइव उल्टी गिनती (countdown) ट्रैकर के साथ प्राप्त करें।', position: 'top-center', badges: ['📅 ऐतिहासिक तिथियां', '⏳ काउंटडाउन', '🔔 रिमाइंडर'] },
            { selector: '#nitnemPractice', title: '📿 दैनिक नियम (नितनेम)', text: 'अपने दैनिक नितनेम की बाणियों को प्रीमियम पाठक (reader) में अक्षरों के आकार, अनुवाद और लाइव प्रगति ट्रैकिंग के साथ पढ़ें।', position: 'top-center', badges: ['📿 दैनिक बाणियां', '📖 आकार बदलें', '✅ लाइव प्रगति'] },
            { selector: '#sehajPractice', title: '📖 सहज पाठ रीडर', text: 'श्री गुरु ग्रंथ साहिब जी के सहज पाठ की शुरुआत करें और अपनी सुविधा अनुसार आगे बढ़ें। यह आपके पढ़े गए अंग और समग्र प्रतिशत प्रगति को ट्रैक करता है।', position: 'top-center', badges: ['📖 सहज पाठ', '📈 प्रगति प्रतिशत', '✨ अंग ट्रैकर'] },
            { selector: '#hukamPractice', title: '📜 आज का हुकमनामा', text: 'श्री हरिमंदिर साहिब से आज का पवित्र हुकमनामा, विस्तृत हिंदी और अंग्रेजी अनुवाद तथा उच्च गुणवत्ता वाले ऑडियो पाठ के साथ सुनें।', position: 'top-center', badges: ['📜 मुखवाक', '🗣️ व्याख्या', '🔊 ऑडियो पाठ'] },
            { selector: '#nitnemTrackerCard', title: '🔥 नितनेम ट्रैकर', text: 'अपनी दैनिक भक्ति की निरंतरता की जांच करें। यह कैलेंडर, भक्ति दिवस, निरंतर दिनों के नियम (streaks) और विश्लेषण दिखाता है।', position: 'top-center', badges: ['🔥 दैनिक नियम', '📆 कैलेंडर चेक-इन', '📊 विश्लेषण'] },
            { selector: '#naamCard', title: '🙏 नाम अभ्यास सिमरन', text: 'पूरे दिन के लिए एक सुंदर नियम बनाएं: हर घंटे में केवल 2 मिनट के लिए शांतिपूर्ण सिमरन करें। उन 2 मिनटों के लिए दुनिया के सब काम छोड़ दें। यह दैनिक अभ्यास हर पल वाहेगुरु जी को स्मरण रखने में मदद करेगा, जो कि नाम अभ्यास का मुख्य उद्देश्य है।', position: 'top-center', badges: ['🙏 हर घंटे 2 मिनट', '⏰ सिमरन अभ्यास', '✨ वाहेगुरु स्मरण'] },
            { selector: '#shabadVicharCard', title: '🪔 दैनिक शबद विचार', text: 'प्रतिदिन चुने गए गुरबाणी शबद के गहरे आध्यात्मिक और व्यावहारिक अर्थों को पढ़कर अपने आध्यात्मिक ज्ञान में वृद्धि करें।', position: 'top-center', badges: ['🪔 दैनिक विचार', '💡 आध्यात्मिक ज्ञान', '✨ गहरे अर्थ'] },
            { selector: '#searchCard', title: '🔍 उन्नत गुरबाणी खोज', text: 'श्री गुरु ग्रंथ साहिब जी में से किसी भी शबद को पहले अक्षर या कीवर्ड के माध्यम से तुरंत खोजने के लिए एक अत्यंत शक्तिशाली खोज उपकरण।', position: 'top-center', badges: ['🔍 गुरबाणी खोज', '🔤 अक्षर/कीवर्ड', '⚡ त्वरित खोज'] },
            { selector: '#notesCard', title: '📝 आध्यात्मिक नोट्स', text: 'पाठ करते समय या ध्यान लगाते समय अपने मन में उठने वाले आध्यात्मिक विचारों, प्रेरणाओं और व्यक्तिगत नोट्स को लिखकर सुरक्षित रखें।', position: 'top-center', badges: ['📝 व्यक्तिगत नोट्स', '💾 सुरक्षित सेव', '✏️ लिखें/संशोधित'] },
            { selector: '#mainNav', title: '📈 नेविगेशन और डैशबोर्ड', text: 'होम पेज, पसंदीदा (favorites) शबद सूची, लाइब्रेरी (Insights), या अपनी भक्ति की प्रगति के पूर्ण डैशबोर्ड के बीच आसानी से नेविगेट करें।', position: 'top-center', badges: ['📈 4 मुख्य पृष्ठ', '📊 भक्ति आंकड़े', '⭐ पसंदीदा'] }
        ]
    };

    let selectedLang = 'en';
    let currentStepIndex = 0;

    // UI Elements
    let langModal = null;
    let overlayContainer = null;
    let popover = null;
    let tapPrompt = null;

    // Inject styles dynamically (Elite Apple-style Glassmorphic Design System)
    function injectStyles() {
        if (document.getElementById('anhad-tour-styles-v9')) return;

        const style = document.createElement('style');
        style.id = 'anhad-tour-styles-v9';
        style.textContent = `
            /* 4-Div Sliding Spotlight Overlay System */
            .anhad-tour-overlay-edge {
                position: fixed;
                background: rgba(10, 10, 12, 0.55);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                z-index: 999999;
                opacity: 0;
                transition: 
                    top 0.45s cubic-bezier(0.25, 1, 0.3, 1), 
                    left 0.45s cubic-bezier(0.25, 1, 0.3, 1), 
                    width 0.45s cubic-bezier(0.25, 1, 0.3, 1), 
                    height 0.45s cubic-bezier(0.25, 1, 0.3, 1),
                    opacity 0.3s ease;
                pointer-events: auto;
                will-change: top, left, width, height, opacity;
            }
            .anhad-tour-overlay-edge.active {
                opacity: 1;
            }
            
            /* Premium Apple-style Glassmorphic Popover */
            .anhad-tour-popover {
                position: fixed;
                background: rgba(255, 255, 255, 0.88);
                backdrop-filter: blur(22px) saturate(190%);
                -webkit-backdrop-filter: blur(22px) saturate(190%);
                border: 1px solid rgba(255, 255, 255, 0.45);
                box-shadow: 
                    0 15px 45px rgba(184, 134, 11, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6);
                border-radius: 24px;
                padding: 24px 26px;
                width: 345px;
                z-index: 1000001;
                transform: scale(0.9) translateY(12px);
                opacity: 0;
                transition: 
                    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), 
                    opacity 0.3s ease,
                    top 0.45s cubic-bezier(0.25, 1, 0.3, 1), 
                    left 0.45s cubic-bezier(0.25, 1, 0.3, 1);
                color: #3D2914;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                box-sizing: border-box;
                will-change: transform, opacity, top, left;
            }
            html.dark-mode .anhad-tour-popover,
            [data-theme="dark"] .anhad-tour-popover {
                background: rgba(28, 28, 31, 0.88);
                border-color: rgba(255, 255, 255, 0.08);
                color: #FAF8F5;
                box-shadow: 
                    0 15px 45px rgba(0, 0, 0, 0.45),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
            }
            .anhad-tour-popover.active {
                transform: scale(1) translateY(0);
                opacity: 1;
            }
            .anhad-tour-popover-title {
                font-weight: 900;
                font-size: 18px;
                margin-bottom: 10px;
                color: #D4943A;
                letter-spacing: 0.25px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            /* Premium Badges UI */
            .anhad-tour-popover-badges {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 12px;
            }
            .anhad-tour-popover-badge {
                font-size: 11px;
                font-weight: 700;
                padding: 4px 10px;
                border-radius: 30px;
                letter-spacing: 0.2px;
                display: inline-flex;
                align-items: center;
                background: rgba(212, 148, 58, 0.08) !important;
                color: #A06E25 !important;
                border: 1px solid rgba(212, 148, 58, 0.15) !important;
                transition: all 0.3s ease;
            }
            html.dark-mode .anhad-tour-popover-badge,
            [data-theme="dark"] .anhad-tour-popover-badge {
                background: rgba(212, 148, 58, 0.15) !important;
                color: #F8CB7E !important;
                border: 1px solid rgba(212, 148, 58, 0.3) !important;
            }
            .anhad-tour-popover-text {
                font-size: 14px;
                line-height: 1.6;
                opacity: 0.95;
                margin-bottom: 18px;
            }
            .anhad-tour-popover-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .anhad-tour-popover-dots {
                display: flex;
                gap: 5px;
                max-width: 130px;
                flex-wrap: wrap;
            }
            .anhad-tour-popover-dot {
                width: 5px;
                height: 5px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.15);
                transition: all 0.3s ease;
            }
            html.dark-mode .anhad-tour-popover-dot,
            [data-theme="dark"] .anhad-tour-popover-dot {
                background: rgba(255, 255, 255, 0.15);
            }
            .anhad-tour-popover-dot.active {
                background: #D4943A;
                transform: scale(1.3);
                box-shadow: 0 0 6px rgba(212, 148, 58, 0.5);
            }
            .anhad-tour-popover-btn {
                border: none;
                background: linear-gradient(135deg, #D4943A 0%, #B8860B 100%);
                color: white;
                padding: 7px 15px;
                border-radius: 12px;
                font-weight: 700;
                font-size: 12px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(212, 148, 58, 0.3);
                transition: all 0.3s ease;
            }
            .anhad-tour-popover-btn:active {
                transform: scale(0.95);
            }
            .anhad-tour-skip-btn {
                border: none;
                background: transparent;
                color: #8E8E93;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                padding: 4px;
                margin-right: 8px;
                transition: color 0.2s ease;
            }
            .anhad-tour-skip-btn:hover {
                color: #D4943A;
            }
            
            /* Tap Anywhere Hint */
            .anhad-tour-tap-anywhere {
                position: fixed;
                bottom: calc(115px + env(safe-area-inset-bottom, 24px));
                left: 50%;
                transform: translateX(-50%);
                color: rgba(255, 255, 255, 0.95);
                text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.5px;
                z-index: 1000000;
                pointer-events: none;
                animation: tourPulse 2s infinite;
                background: rgba(15, 15, 20, 0.6);
                padding: 8px 18px;
                border-radius: 20px;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.15);
            }
            @keyframes tourPulse {
                0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(0.97); }
                50% { opacity: 1; transform: translateX(-50%) scale(1.03); }
            }
            
            /* Premium Glassmorphic Language Picker */
            .anhad-lang-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(10, 10, 12, 0.4);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                z-index: 1000002;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.35s ease;
                pointer-events: auto;
            }
            .anhad-lang-modal.active {
                opacity: 1;
            }
            .anhad-lang-content {
                background: rgba(255, 255, 255, 0.88);
                border: 1px solid rgba(255, 255, 255, 0.45);
                box-shadow: 
                    0 20px 50px rgba(184, 134, 11, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6);
                border-radius: 32px;
                padding: 36px 28px;
                width: 320px;
                text-align: center;
                transform: scale(0.9) translateY(15px);
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                color: #3D2914;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                box-sizing: border-box;
            }
            html.dark-mode .anhad-lang-content,
            [data-theme="dark"] .anhad-lang-content {
                background: rgba(26, 26, 29, 0.9);
                border-color: rgba(255, 255, 255, 0.08);
                color: #FAF8F5;
                box-shadow: 
                    0 20px 50px rgba(0, 0, 0, 0.4),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
            }
            .anhad-lang-modal.active .anhad-lang-content {
                transform: scale(1) translateY(0);
            }
            .anhad-lang-title {
                font-weight: 900;
                font-size: 22px;
                margin-bottom: 8px;
                color: #D4943A;
                letter-spacing: 0.5px;
            }
            .anhad-lang-subtitle {
                font-size: 13px;
                opacity: 0.75;
                margin-bottom: 28px;
                line-height: 1.45;
            }
            .anhad-lang-options {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .anhad-lang-btn {
                border: 1px solid rgba(212, 148, 58, 0.25);
                background: rgba(255, 255, 255, 0.5);
                padding: 16px 20px;
                border-radius: 18px;
                font-weight: 700;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
                color: inherit;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
                box-sizing: border-box;
            }
            html.dark-mode .anhad-lang-btn,
            [data-theme="dark"] .anhad-lang-btn {
                background: rgba(255, 255, 255, 0.02);
                border-color: rgba(255, 255, 255, 0.08);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
            }
            .anhad-lang-btn:hover, .anhad-lang-btn:active {
                background: linear-gradient(135deg, #D4943A 0%, #B8860B 100%);
                color: white;
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 8px 20px rgba(212, 148, 58, 0.35);
                border-color: transparent;
            }
            .anhad-lang-btn-arrow {
                font-size: 14px;
                opacity: 0.7;
                transition: transform 0.2s ease;
            }
            .anhad-lang-btn:hover .anhad-lang-btn-arrow {
                transform: translateX(3px);
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }

    // Displays the language selector pop-up dialog
    function showLanguagePicker() {
        injectStyles();

        langModal = document.createElement('div');
        langModal.className = 'anhad-lang-modal';

        langModal.innerHTML = `
            <div class="anhad-lang-content">
                <div class="anhad-lang-title">ੴ Welcome to ANHAD</div>
                <div class="anhad-lang-subtitle">Choose your tour language<br>ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ • भाषा चुनें</div>
                <div class="anhad-lang-options">
                    <button class="anhad-lang-btn" data-lang="pa">
                        <span>☬ ਪੰਜਾਬੀ (Punjabi)</span>
                        <span class="anhad-lang-btn-arrow">➔</span>
                    </button>
                    <button class="anhad-lang-btn" data-lang="en">
                        <span>🇬🇧 English (English)</span>
                        <span class="anhad-lang-btn-arrow">➔</span>
                    </button>
                    <button class="anhad-lang-btn" data-lang="hi">
                        <span>🙏 हिंदी (Hindi)</span>
                        <span class="anhad-lang-btn-arrow">➔</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(langModal);

        // Add listeners to language buttons
        langModal.querySelectorAll('.anhad-lang-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                selectedLang = this.dataset.lang;
                localStorage.setItem(LANG_KEY, selectedLang);

                // Close Modal & Begin Tour
                langModal.classList.remove('active');
                setTimeout(() => {
                    langModal.remove();
                    startTour();
                }, 350);
            });
        });

        // Trigger reflow & show
        setTimeout(() => langModal.classList.add('active'), 50);
    }

    // Initialize layout overlay elements
    function initOverlay() {
        overlayContainer = document.createElement('div');
        overlayContainer.id = 'anhad-tour-overlay-container';

        // Create 4 edge overlays
        const edges = ['top', 'bottom', 'left', 'right'];
        edges.forEach(edge => {
            const el = document.createElement('div');
            el.className = 'anhad-tour-overlay-edge';
            el.id = `anhad-tour-overlay-${edge}`;
            overlayContainer.appendChild(el);

            // Advance on overlay click anywhere
            el.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                advanceTour();
            });
        });

        popover = document.createElement('div');
        popover.className = 'anhad-tour-popover';

        tapPrompt = document.createElement('div');
        tapPrompt.className = 'anhad-tour-tap-anywhere';
        
        // Custom prompts based on chosen language
        if (selectedLang === 'pa') {
            tapPrompt.innerHTML = '👆 ਅਗਲਾ ਦੇਖਣ ਲਈ ਕਿਤੇ ਵੀ ਕਲਿੱਕ ਕਰੋ';
        } else if (selectedLang === 'hi') {
            tapPrompt.innerHTML = '👆 अगला देखने के लिए कहीं भी क्लिक करें';
        } else {
            tapPrompt.innerHTML = '👆 Tap anywhere to continue';
        }

        document.body.appendChild(overlayContainer);
        document.body.appendChild(popover);
        document.body.appendChild(tapPrompt);

        // Bind resize and scroll recalculation events
        window.addEventListener('resize', handleResizeAndScroll);
        window.addEventListener('scroll', handleResizeAndScroll);
    }

    // Handles viewport updates dynamically
    function handleResizeAndScroll() {
        const steps = tourContent[selectedLang] || tourContent['en'];
        if (currentStepIndex >= steps.length) return;
        const step = steps[currentStepIndex];
        const element = document.querySelector(step.selector);
        if (element) {
            updateSpotlight(element);
            positionPopover(element, step);
        }
    }

    // Recalculates spotlight size and applies positions to the 4 overlay divs (Zero-Blur Spotlight)
    function updateSpotlight(element) {
        const padding = 10;
        const w = window.innerWidth;
        const h = window.innerHeight;

        let rect = null;
        if (element) {
            rect = element.getBoundingClientRect();
        } else {
            rect = { left: w / 2 - 50, top: h / 2 - 50, width: 100, height: 100 };
        }

        // Target boundaries with padding included
        const l = Math.max(0, rect.left - padding);
        const t = Math.max(0, rect.top - padding);
        const r = Math.min(w, rect.left + rect.width + padding);
        const b = Math.min(h, rect.top + rect.height + padding);

        // Apply coordinates dynamically to create the perfect physical spotlight hole
        const topEl = document.getElementById('anhad-tour-overlay-top');
        const bottomEl = document.getElementById('anhad-tour-overlay-bottom');
        const leftEl = document.getElementById('anhad-tour-overlay-left');
        const rightEl = document.getElementById('anhad-tour-overlay-right');

        if (topEl) {
            topEl.style.top = '0px';
            topEl.style.left = '0px';
            topEl.style.width = '100vw';
            topEl.style.height = `${t}px`;
        }
        if (bottomEl) {
            bottomEl.style.top = `${b}px`;
            bottomEl.style.left = '0px';
            bottomEl.style.width = '100vw';
            bottomEl.style.height = `${h - b}px`;
        }
        if (leftEl) {
            leftEl.style.top = `${t}px`;
            leftEl.style.left = '0px';
            leftEl.style.width = `${l}px`;
            leftEl.style.height = `${b - t}px`;
        }
        if (rightEl) {
            rightEl.style.top = `${t}px`;
            rightEl.style.left = `${r}px`;
            rightEl.style.width = `${w - r}px`;
            rightEl.style.height = `${b - t}px`;
        }
    }

    // Handles the positioning of the tooltip popover box mathematically
    function positionPopover(element, step) {
        const popoverWidth = 345;
        const popoverHeight = popover.offsetHeight || 150;
        let popoverTop = 0;
        let popoverLeft = 0;

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        let rect = { left: screenWidth / 2 - 50, top: screenHeight / 2 - 50, width: 100, height: 100 };
        if (element) {
            rect = element.getBoundingClientRect();
        }

        const l = rect.left;
        const t = rect.top;
        const w = rect.width;
        const h = rect.height;

        // Custom positions with safety paddings
        if (step.position === 'bottom-left') {
            popoverTop = t + h + 14;
            popoverLeft = Math.max(12, l);
        } else if (step.position === 'bottom-right') {
            popoverTop = t + h + 14;
            popoverLeft = Math.min(screenWidth - popoverWidth - 12, l + w - popoverWidth);
        } else if (step.position === 'top-center') {
            popoverTop = t - popoverHeight - 14;
            popoverLeft = (screenWidth - popoverWidth) / 2;
        } else { // Center or auto-adapt
            popoverTop = t + h + 16;
            popoverLeft = (screenWidth - popoverWidth) / 2;
            if (popoverTop + popoverHeight > screenHeight - 65) {
                popoverTop = t - popoverHeight - 16;
            }
        }

        // Enforce safety boundary containment inside the viewport
        popoverTop = Math.max(16, Math.min(screenHeight - popoverHeight - 20, popoverTop));
        popoverLeft = Math.max(12, Math.min(screenWidth - popoverWidth - 12, popoverLeft));

        popover.style.top = `${popoverTop}px`;
        popover.style.left = `${popoverLeft}px`;
    }

    // Handles the rendering of the active step
    function renderStep() {
        const steps = tourContent[selectedLang] || tourContent['en'];
        if (currentStepIndex >= steps.length) {
            endTour();
            return;
        }

        const step = steps[currentStepIndex];
        const element = document.querySelector(step.selector);

        // Perform smooth-scrolling first if element is below viewport fold
        if (element) {
            const rect = element.getBoundingClientRect();
            const isInViewport = (
                rect.top >= 60 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - 60
            );

            if (!isInViewport) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Delay rendering step until scroll settles completely
                setTimeout(performHighlight, 550);
                return;
            }
        }

        performHighlight();

        function performHighlight() {
            let rect = { top: window.innerHeight / 2 - 50, left: window.innerWidth / 2 - 100, width: 200, height: 100 };
            if (element) {
                rect = element.getBoundingClientRect();

                // Clear previous classes to maintain clean DOM
                document.querySelectorAll('.anhad-tour-target').forEach(el => {
                    el.classList.remove('anhad-tour-target');
                });
                element.classList.add('anhad-tour-target');
            }

            // Apply physical overlays
            updateSpotlight(element);

            // Populate tooltip popover with premium design and visual badges
            popover.innerHTML = `
                <div class="anhad-tour-popover-title">${step.title}</div>
                ${step.badges ? `
                <div class="anhad-tour-popover-badges">
                    ${step.badges.map(badge => `<span class="anhad-tour-popover-badge">${badge}</span>`).join('')}
                </div>
                ` : ''}
                <div class="anhad-tour-popover-text">${step.text}</div>
                <div class="anhad-tour-popover-footer">
                    <div class="anhad-tour-popover-dots">
                        ${steps.map((_, i) => `<span class="anhad-tour-popover-dot ${i === currentStepIndex ? 'active' : ''}"></span>`).join('')}
                    </div>
                    <div>
                        <button class="anhad-tour-skip-btn" id="tourSkipBtn">${selectedLang === 'pa' ? 'ਛੱਡੋ' : selectedLang === 'hi' ? 'छोड़ें' : 'Skip'}</button>
                        <button class="anhad-tour-popover-btn" id="tourNextBtn">${currentStepIndex === steps.length - 1 ? (selectedLang === 'pa' ? 'ਸਮਾਪਤ' : selectedLang === 'hi' ? 'समाप्त' : 'Finish') : (selectedLang === 'pa' ? 'ਅਗਲਾ' : selectedLang === 'hi' ? 'अगला' : 'Next')}</button>
                    </div>
                </div>
            `;

            // Action button bindings
            popover.querySelector('#tourSkipBtn').addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                endTour();
            });

            popover.querySelector('#tourNextBtn').addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                advanceTour();
            });

            // Adjust popover placement mathematically with safe delay
            popover.classList.remove('active');
            setTimeout(() => {
                positionPopover(element, step);
                popover.classList.add('active');
            }, 60);
        }
    }

    function advanceTour() {
        currentStepIndex++;
        const steps = tourContent[selectedLang] || tourContent['en'];
        if (currentStepIndex >= steps.length) {
            endTour();
        } else {
            renderStep();
        }
    }

    function startTour() {
        injectStyles();
        initOverlay();

        setTimeout(() => {
            // Activate overlays smoothly
            document.querySelectorAll('.anhad-tour-overlay-edge').forEach(el => {
                el.classList.add('active');
            });
            renderStep();
        }, 100);
    }

    function endTour() {
        console.log('🏁 Upgraded onboarding tour successfully completed.');
        localStorage.setItem(TOUR_KEY, 'true');

        // Unbind resize and scroll events
        window.removeEventListener('resize', handleResizeAndScroll);
        window.removeEventListener('scroll', handleResizeAndScroll);

        // Animate off
        document.querySelectorAll('.anhad-tour-overlay-edge').forEach(el => {
            el.classList.remove('active');
        });
        if (popover) popover.classList.remove('active');
        if (tapPrompt) tapPrompt.style.opacity = '0';

        // Remove high Z-indexes or style tweaks from targets
        document.querySelectorAll('.anhad-tour-target').forEach(el => {
            el.classList.remove('anhad-tour-target');
        });

        // Safe DOM cleanup
        setTimeout(() => {
            if (overlayContainer) overlayContainer.remove();
            if (popover) popover.remove();
            if (tapPrompt) tapPrompt.remove();

            const style = document.getElementById('anhad-tour-styles-v9');
            if (style) style.remove();
        }, 450);
    }

    // Auto-launch trigger
    window.addEventListener('load', () => {
        // Only run on the main home screen (index.html), not sub-pages
        const isMainPage = window.location.pathname.endsWith('index.html') ||
                           window.location.pathname.endsWith('/') ||
                           document.getElementById('guruSlider') !== null;

        if (isMainPage) {
            // Register click handler for Guide Start Button (frosted glass info button in header left)
            const guideStartBtn = document.getElementById('guideStartBtn');
            if (guideStartBtn) {
                guideStartBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // If a tour is already active, close it first
                    endTour();
                    
                    // Reset to first step
                    currentStepIndex = 0;
                    
                    // Force display language picker for fresh selection
                    setTimeout(showLanguagePicker, 100);
                });
            }

            // Check if onboarding is completed
            const completed = localStorage.getItem(TOUR_KEY);
            if (completed !== 'true') {
                selectedLang = localStorage.getItem(LANG_KEY);
                if (!selectedLang) {
                    setTimeout(showLanguagePicker, 1500);
                } else {
                    setTimeout(startTour, 1500);
                }
            }
        }
    });

})();
