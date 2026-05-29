/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD GUIDED ONBOARDING SYSTEM — Premium Frosted Glass Edition
 * 4-Div Sliding Spotlight Overlay System, Dynamic Resize/Scroll Listeners,
 * Premium Glassmorphic Language Selector, Glimpse Badges & Enlarged Copy
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const TOUR_KEY = 'anhad_onboarding_v9_completed';
    const LANG_KEY = 'anhad_tour_lang';

    // Multilingual Step Content for all 13 core index.html widgets
    const tourContent = {
        en: [
            { selector: '#homeBackBtn', title: '📻 Enter Gurdwara Sahib', text: 'Tapping this elegant radio button enters the main Gurdwara Sahib interface where you can listen to live Gurbani broadcasts perfectly synchronized across all devices in real-time.', position: 'bottom-left' },
            { selector: '#themeToggleBtn', title: '✨ Choose Magic Themes', text: 'Cycle between three exquisite theme presets: crisp Light mode, deep Dark mode, or our premium auto-dynamic Time-of-Day theme which updates background artwork and colors according to the local hour.', position: 'bottom-right' },
            { selector: '.hero-carousel', title: '🎵 Virtual Live Streams', text: 'Swipe horizontally to browse live broadcasts. Tap the play controls to instantly load audio feeds for Sri Harmandir Sahib, Amritvela prayers, or peaceful Waheguru Simran.', position: 'center' },
            { selector: '#eventCard', title: '📅 Gurpurab Calendar', text: 'Keep track of upcoming historical Gurpurabs and significant Sikh dates with an active countdown timer, ensuring you never miss holy historical reminders.', position: 'top-center' },
            { selector: '#nitnemPractice', title: '📿 Daily Nitnem Prayers', text: 'Open your daily devotional Banis in an ultra-premium reader with adjustable sizing, transliterations, translations, and beautiful progressive task completion.', position: 'top-center' },
            { selector: '#sehajPractice', title: '📖 Sehaj Paath Reader', text: 'Start, resume, and track your personal reading of Sri Guru Granth Sahib Ji at your own comfortable pace, complete with completed Ang and percentage tracking.', position: 'top-center' },
            { selector: '#hukamPractice', title: '📜 Today\'s Hukamnama', text: 'Read the daily divine Hukamnama command issued from Sri Harmandir Sahib, complete with detailed Punjabi and English translations and high-quality audio recitation.', position: 'top-center' },
            { selector: '#nitnemTrackerCard', title: '🔥 Nitnem Tracker', text: 'Monitor your spiritual consistency with active devotions tracking, check-in calendars, streak numbers, and detailed analytics inside your spiritual dashboard.', position: 'top-center' },
            { selector: '#naamCard', title: '🙏 Naam Abhyas: 2-Min Hourly Simran', text: 'Schedule your entire day to pause everything for just 2 minutes every single hour for deep Simran. This powerful spiritual discipline helps you remember Waheguru in every single second and with every breath.', position: 'top-center' },
            { selector: '#shabadVicharCard', title: '🪔 Daily Shabad Vichar', text: 'Contemplate and reflect on deep theological and spiritual meanings of selected Gurbani Shabads updated every single day to guide your spiritual learning.', position: 'top-center' },
            { selector: '#searchCard', title: '🔍 Advanced Gurbani Khoj', text: 'An incredibly powerful search tool that allows you to instantly search for any Shabad inside Sri Guru Granth Sahib Ji by first-letter initials or keywords.', position: 'top-center' },
            { selector: '#notesCard', title: '📝 Spiritual Notes', text: 'Jot down, edit, and safely store your personal spiritual inspirations, reflections, and notes as you read Gurbani or contemplate your devotions.', position: 'top-center' },
            { selector: '#mainNav', title: '📈 Navigation & Dashboard', text: 'Easily transition between the home dashboard, your personal favorites list, the learning library (Insights), or open your complete stats dashboard.', position: 'top-center' }
        ],
        pa: [
            { selector: '#homeBackBtn', title: '📻 ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ ਪ੍ਰਵੇਸ਼', text: 'ਇਸ ਖੂਬਸੂਰਤ ਬਟਨ ਤੇ ਕਲਿੱਕ ਕਰਕੇ ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ ਦੇ ਮੁੱਖ ਪੇਜ \'ਤੇ ਜਾਓ, ਜਿੱਥੇ ਤੁਸੀਂ ਸਾਰੇ ਯੰਤਰਾਂ \'ਤੇ ਇੱਕੋ ਸਮੇਂ ਇੱਕਸਾਰ (synchronized) ਲਾਈਵ ਗੁਰਬਾਣੀ ਕੀਰਤਨ ਸੁਣ ਸਕਦੇ ਹੋ।', position: 'bottom-left' },
            { selector: '#themeToggleBtn', title: '✨ ਜਾਦੂਈ ਥੀਮ ਚੁਣੋ', text: 'ਸਾਡੇ ਤਿੰਨ ਸ਼ਾਨਦਾਰ ਥੀਮ ਚੁਣੋ! ਲਾਈਟ, ਡਾਰਕ, ਜਾਂ ਸਾਡਾ ਸਭ ਤੋਂ ਪ੍ਰੀਮੀਅਮ ਡਾਇਨਾਮਿਕ ਸਮੇਂ-ਅਨੁਸਾਰ ਥੀਮ, ਜੋ ਦਿਨ ਦੇ ਸਮੇਂ ਮੁਤਾਬਿਕ ਬੈਕਗ੍ਰਾਊਂਡ ਤਸਵੀਰਾਂ ਅਤੇ ਰੰਗਾਂ ਨੂੰ ਆਪਣੇ ਆਪ ਬਦਲ ਦਿੰਦਾ ਹੈ।', position: 'bottom-right' },
            { selector: '.hero-carousel', title: '🎵 ਵਰਚੁਅਲ ਲਾਈਵ ਕੀਰਤਨ', text: 'ਲਾਈਵ ਪ੍ਰਸਾਰਣ ਦੇਖਣ ਲਈ ਖੱਬੇ/ਸੱਜੇ ਸਵਾਈਪ ਕਰੋ। ਸ੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ, ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਪਾਠ, ਜਾਂ ਵਾਹਿਗੁਰੂ ਸਿਮਰਨ ਦਾ ਆਡੀਓ ਚਲਾਉਣ ਲਈ ਪਲੇਅ ਬਟਨ ਦਬਾਓ।', position: 'center' },
            { selector: '#eventCard', title: '📅 ਗੁਰਪੁਰਬ ਕੈਲੰਡਰ', text: 'ਆਉਣ ਵਾਲੇ ਇਤਿਹਾਸਕ ਗੁਰਪੁਰਬਾਂ ਅਤੇ ਸਿੱਖ ਇਤਿਹਾਸ ਦੇ ਮਹੱਤਵਪੂਰਨ ਦਿਹਾੜਿਆਂ ਦੀ ਲਾਈਵ ਉਲਟੀ ਗਿਣਤੀ (countdown) ਟਰੈਕਰ ਨਾਲ ਜਾਣਕਾਰੀ ਪ੍ਰਾਪਤ ਕਰੋ।', position: 'top-center' },
            { selector: '#nitnemPractice', title: '📿 ਰੋਜ਼ਾਨਾ ਨਿਤਨੇਮ ਪਾਠ', text: 'ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਨਿਤਨੇਮ ਦੀਆਂ ਬਾਣੀਆਂ ਨੂੰ ਪ੍ਰੀਮੀਅਮ ਪਾਠਕ (reader) ਵਿੱਚ ਅੱਖਰਾਂ ਦੇ ਆਕਾਰ, ਅਨੁਵਾਦ ਅਤੇ ਲਾਈਵ ਪ੍ਰਗਤੀ ਟਰੈਕਿੰਗ ਨਾਲ ਪੜ੍ਹੋ।', position: 'top-center' },
            { selector: '#sehajPractice', title: '📖 ਸਹਿਜ ਪਾਠ ਰੀਡਰ', text: 'ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਦੇ ਸਹਿਜ ਪਾਠ ਦੀ ਸ਼ੁਰੂਆਤ ਕਰੋ ਅਤੇ ਆਪਣੀ ਸਹੂਲਤ ਅਨੁਸਾਰ ਪੜ੍ਹੋ। ਇਹ ਤੁਹਾਡੇ ਪੜ੍ਹੇ ਅੰਗਾਂ ਅਤੇ ਫ਼ੀਸਦੀ ਪ੍ਰਗਤੀ ਨੂੰ ਟਰੈਕ ਕਰਦਾ ਹੈ।', position: 'top-center' },
            { selector: '#hukamPractice', title: '📜 ਅੱਜ ਦਾ ਮੁੱਖਵਾਕ (ਹੁਕਮਨਾਮਾ)', text: 'ਸ੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਤੋਂ ਅੱਜ ਦਾ ਰੋਜ਼ਾਨਾ ਪਵਿੱਤਰ ਹੁਕਮਨਾਮਾ ਸਾਹਿਬ, ਪੰਜਾਬੀ ਅਤੇ ਅੰਗਰੇਜ਼ੀ ਵਿਆਖਿਆ ਅਤੇ ਉੱਚ-ਗੁਣਵੱਤਾ ਵਾਲੇ ਆਡੀਓ ਪਾਠ ਨਾਲ ਸਰਵਣ ਕਰੋ।', position: 'top-center' },
            { selector: '#nitnemTrackerCard', title: '🔥 ਨਿਤਨੇਮ ਟਰੈਕਰ', text: 'ਆਪਣੀ ਰੋਜ਼ਾਨਾ ਭਗਤੀ ਦੀ ਪ੍ਰਗਤੀ ਨੂੰ ਮਾਨੀਟਰ ਕਰੋ। ਇਹ ਕੈਲੰਡਰ, ਭਗਤੀ ਦੇ ਦਿਨ, ਨੇਮ ਦੇ ਲਗਾਤਾਰ ਦਿਨ (streaks) ਅਤੇ ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਵਿਸ਼ਲੇਸ਼ਣ ਦਿਖਾਉਂਦਾ ਹੈ।', position: 'top-center' },
            { selector: '#naamCard', title: '🙏 ਨਾਮ ਅਭਿਆਸ: ਹਰ ਘੰਟੇ 2 ਮਿੰਟ ਸਿਮਰਨ', text: 'ਆਪਣੇ ਪੂਰੇ ਦਿਨ ਨੂੰ ਇਸ ਤਰ੍ਹਾਂ ਨਿਯਤ ਕਰੋ ਕਿ ਹਰ ਘੰਟੇ ਬਾਅਦ 2 ਮਿੰਟ ਲਈ ਸਭ ਕੁਝ ਰੋਕ ਕੇ ਸਿਮਰਨ ਕੀਤਾ ਜਾਵੇ। ਇਹ ਮਹਾਨ ਰੂਹਾਨੀ ਅਭਿਆਸ ਤੁਹਾਨੂੰ ਹਰ ਸਾਸ ਅਤੇ ਹਰ ਸਕਿੰਟ ਵਾਹਿਗੁਰੂ ਨੂੰ ਚੇਤੇ ਰੱਖਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।', position: 'top-center' },
            { selector: '#shabadVicharCard', title: '🪔 ਰੋਜ਼ਾਨਾ ਸ਼ਬਦ ਵਿਚਾਰ', text: 'ਹਰ ਰੋਜ਼ ਚੁਣੇ ਗਏ ਗੁਰਬਾਣੀ ਸ਼ਬਦਾਂ ਦੇ ਡੂੰਘੇ ਰੂਹਾਨੀ ਅਤੇ ਅਧਿਆਤਮਿਕ ਅਰਥਾਂ ਨੂੰ ਪੜ੍ਹ ਕੇ ਆਪਣੇ ਰੂਹਾਨੀ ਗਿਆਨ ਵਿੱਚ ਵਾਧਾ ਕਰੋ।', position: 'top-center' },
            { selector: '#searchCard', title: '🔍 ਗੁਰਬਾਣੀ ਖੋਜ', text: 'ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਵਿੱਚੋਂ ਕਿਸੇ ਵੀ ਸ਼ਬਦ ਨੂੰ ਪਹਿਲੇ ਅੱਖਰ (initials) ਜਾਂ ਕੀਵਰਡ ਨਾਲ ਸਕਿੰਟਾਂ ਵਿੱਚ ਲੱਭਣ ਲਈ ਇੱਕ ਸ਼ਕਤੀਸ਼ਾਲੀ ਖੋਜ ਇੰਜਣ।', position: 'top-center' },
            { selector: '#notesCard', title: '📝 ਗੁਰਬਾਣੀ ਨੋਟਸ', text: 'ਪਾਠ ਕਰਦੇ ਸਮੇਂ ਜਾਂ ਵਿਚਾਰ ਸੁਣਦੇ ਸਮੇਂ ਆਪਣੇ ਮਨ ਵਿੱਚ ਆਏ ਰੂਹਾਨੀ ਵਿਚਾਰਾਂ, ਪ੍ਰੇਰਨਾਵਾਂ ਅਤੇ ਨਿੱਜੀ ਨੋਟਸ ਨੂੰ ਲਿਖ ਕੇ ਸੁਰੱਖਿਅਤ ਰੱਖੋ।', position: 'top-center' },
            { selector: '#mainNav', title: '📈 ਨੇਵੀਗੇਸ਼ਨ ਅਤੇ ਡੈਸ਼ਬੋਰਡ', text: 'ਹੋਮ ਪੇਜ, ਪਸੰਦੀਦਾ (favorites) ਸ਼ਬਦਾਂ ਦੀ ਸੂਚੀ, ਲਾਇਬ੍ਰੇਰੀ (Insights), ਜਾਂ ਆਪਣੀ ਭਗਤੀ ਦੇ ਵਿਸ਼ਲੇਸ਼ਣ ਡੈਸ਼ਬੋਰਡ ਦੇ ਵਿਚਕਾਰ ਆਸਾਨੀ ਨਾਲ ਬਦਲੋ।', position: 'top-center' }
        ],
        hi: [
            { selector: '#homeBackBtn', title: '📻 गुरुद्वारा साहिब प्रवेश', text: 'इस सुंदर बटन पर क्लिक करके गुरुद्वारा साहिब की मुख्य स्क्रीन पर जाएं, जहां आप सभी उपकरणों पर एक साथ लाइव गुरबाणी कीर्तन का आनंद ले सकते हैं।', position: 'bottom-left' },
            { selector: '#themeToggleBtn', title: '✨ जादुई थीम चुनें', text: 'हमारे तीन शानदार थीम चुनें! लाइट, डार्क, या हमारा प्रीमियम ऑटो-डायनामिक टाइम-ऑफ-डे थीम, जो दिन के समय के अनुसार वॉलपेपर और रंगों को स्वचालित रूप से बदलता है।', position: 'bottom-right' },
            { selector: '.hero-carousel', title: '🎵 वर्चुअल लाइव कीर्तन', text: 'लाइव प्रसारण ब्राउज़ करने के लिए दाएं/बाएं स्वाइप करें। श्री हरिमंदिर साहिब, अमृत वेला पाठ, या वाहेगुरु सिमरन का ऑडियो सुनने के लिए प्ले दबाएं।', position: 'center' },
            { selector: '#eventCard', title: '📅 गुरपुरब कैलेंडर', text: 'आने वाले ऐतिहासिक गुरपुरबों और ऐतिहासिक तिथियों की जानकारी लाइव उल्टी गिनती (countdown) ट्रैकर के साथ प्राप्त करें।', position: 'top-center' },
            { selector: '#nitnemPractice', title: '📿 दैनिक नितनेम पाठ', text: 'अपने दैनिक नितनेम की बाणियों को प्रीमियम पाठक (reader) में अक्षरों के आकार, अनुवाद और लाइव प्रगति ट्रैकिंग के साथ पढ़ें।', position: 'top-center' },
            { selector: '#sehajPractice', title: '📖 सहज पाठ रीडर', text: 'श्री गुरु ग्रंथ साहिब जी के सहज पाठ की शुरुआत करें और अपनी सुविधा अनुसार आगे बढ़ें। यह आपके पढ़े गए अंग और समग्र प्रतिशत प्रगति को ट्रैक करता है।', position: 'top-center' },
            { selector: '#hukamPractice', title: '📜 आज का हुकमनामा', text: 'श्री हरिमंदिर साहिब से आज का पवित्र हुकमनामा, विस्तृत हिंदी और अंग्रेजी अनुवाद तथा उच्च गुणवत्ता वाले ऑडियो पाठ के साथ सुनें।', position: 'top-center' },
            { selector: '#nitnemTrackerCard', title: '🔥 नितनेम ट्रैकर', text: 'अपनी दैनिक भक्ति की निरंतरता की जांच करें। यह कैलेंडर, भक्ति दिवस, निरंतर दिनों के नियम (streaks) और विश्लेषण दिखाता है।', position: 'top-center' },
            { selector: '#naamCard', title: '🙏 नाम अभ्यास: हर घंटे 2 मिनट सिमरन', text: 'अपने पूरे दिन को इस प्रकार अनुसूचित करें कि हर घंटे 2 मिनट के लिए सब कुछ रोककर सिमरन किया जाए। यह महान आध्यात्मिक अभ्यास आपको हर सांस और हर सेकंड वाहेगुरु को याद रखने में मदद करता है।', position: 'top-center' },
            { selector: '#shabadVicharCard', title: '🪔 दैनिक शबद विचार', text: 'प्रतिदिन चुने गए गुरबाणी शबद के गहरे आध्यात्मिक और व्यावहारिक अर्थों को पढ़कर अपने आध्यात्मिक ज्ञान में वृद्धि करें।', position: 'top-center' },
            { selector: '#searchCard', title: '🔍 उन्नत गुरबाणी खोज', text: 'श्री गुरु ग्रंथ साहिब जी में से किसी भी शबद को पहले अक्षर या कीवर्ड के माध्यम से तुरंत खोजने के लिए एक अत्यंत शक्तिशाली खोज उपकरण।', position: 'top-center' },
            { selector: '#notesCard', title: '📝 आध्यात्मिक नोट्स', text: 'पाठ करते समय या ध्यान लगाते समय अपने मन में उठने वाले आध्यात्मिक विचारों, प्रेरणाओं और व्यक्तिगत नोट्स को लिखकर सुरक्षित रखें।', position: 'top-center' },
            { selector: '#mainNav', title: '📈 नेविगेशन और डैशबोर्ड', text: 'होम पेज, पसंदीदा (favorites) शबद सूची, लाइब्रेरी (Insights), या अपनी प्रगति के पूर्ण डैशबोर्ड के बीच आसानी से नेविगेट करें।', position: 'top-center' }
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
            
            /* Premium Apple-style Glassmorphic Popover - Enlarged Edition */
            .anhad-tour-popover {
                position: fixed;
                background: rgba(255, 255, 255, 0.88);
                backdrop-filter: blur(22px) saturate(190%);
                -webkit-backdrop-filter: blur(22px) saturate(190%);
                border: 1px solid rgba(255, 255, 255, 0.45);
                box-shadow: 
                    0 15px 45px rgba(184, 134, 11, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6);
                border-radius: 28px;
                padding: 24px;
                width: 330px;
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
                font-weight: 850;
                font-size: 18.5px;
                margin-bottom: 10px;
                color: #D4943A;
                letter-spacing: 0.25px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .anhad-tour-popover-text {
                font-size: 15px;
                line-height: 1.6;
                opacity: 0.95;
                margin-bottom: 16px;
                font-weight: 450;
            }
            
            /* Visual Glimpse Badges */
            .anhad-tour-badges {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 4px;
                margin-bottom: 18px;
            }
            .anhad-badge {
                font-size: 11.5px;
                font-weight: 700;
                padding: 4.5px 11px;
                border-radius: 12px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                letter-spacing: -0.1px;
                transition: all 0.25s ease;
            }
            .badge-gold {
                background: rgba(212, 148, 58, 0.12);
                color: #B8860B;
                border: 1px solid rgba(212, 148, 58, 0.25);
            }
            .badge-blue {
                background: rgba(0, 122, 255, 0.1);
                color: #007AFF;
                border: 1px solid rgba(0, 122, 255, 0.2);
            }
            .badge-green {
                background: rgba(52, 199, 89, 0.1);
                color: #34C759;
                border: 1px solid rgba(52, 199, 89, 0.2);
            }
            .badge-red {
                background: rgba(255, 59, 48, 0.1);
                color: #FF3B30;
                border: 1px solid rgba(255, 59, 48, 0.2);
            }
            .badge-purple {
                background: rgba(175, 82, 222, 0.1);
                color: #AF52DE;
                border: 1px solid rgba(175, 82, 222, 0.2);
            }
            .badge-light {
                background: rgba(255, 214, 10, 0.15);
                color: #AF7D14;
                border: 1px solid rgba(255, 214, 10, 0.3);
            }
            .badge-dark {
                background: rgba(142, 142, 147, 0.15);
                color: #8E8E93;
                border: 1px solid rgba(142, 142, 147, 0.25);
            }
            .badge-dynamic {
                background: linear-gradient(135deg, rgba(212, 148, 58, 0.1) 0%, rgba(175, 82, 222, 0.1) 100%);
                color: #B8860B;
                border: 1px solid rgba(212, 148, 58, 0.2);
            }
            .badge-simran {
                background: linear-gradient(135deg, rgba(212, 148, 58, 0.15) 0%, rgba(255, 59, 48, 0.15) 100%);
                color: #DC143C;
                border: 1.5px solid rgba(212, 148, 58, 0.35);
                box-shadow: 0 2px 6px rgba(220, 20, 60, 0.1);
            }
            
            html.dark-mode .badge-gold, [data-theme="dark"] .badge-gold {
                background: rgba(255, 204, 0, 0.1);
                color: #FFCC00;
                border-color: rgba(255, 204, 0, 0.25);
            }
            html.dark-mode .badge-blue, [data-theme="dark"] .badge-blue {
                background: rgba(10, 132, 255, 0.15);
                color: #0A84FF;
                border-color: rgba(10, 132, 255, 0.25);
            }
            html.dark-mode .badge-green, [data-theme="dark"] .badge-green {
                background: rgba(48, 209, 88, 0.15);
                color: #30D158;
                border-color: rgba(48, 209, 88, 0.25);
            }
            html.dark-mode .badge-red, [data-theme="dark"] .badge-red {
                background: rgba(255, 69, 58, 0.15);
                color: #FF453A;
                border-color: rgba(255, 69, 58, 0.25);
            }
            html.dark-mode .badge-purple, [data-theme="dark"] .badge-purple {
                background: rgba(191, 90, 242, 0.15);
                color: #BF5AF2;
                border-color: rgba(191, 90, 242, 0.25);
            }
            html.dark-mode .badge-light, [data-theme="dark"] .badge-light {
                background: rgba(255, 214, 10, 0.15);
                color: #FFD60A;
                border-color: rgba(255, 214, 10, 0.25);
            }
            html.dark-mode .badge-dark, [data-theme="dark"] .badge-dark {
                background: rgba(255, 255, 255, 0.1);
                color: #FAF8F5;
                border-color: rgba(255, 255, 255, 0.15);
            }
            html.dark-mode .badge-dynamic, [data-theme="dark"] .badge-dynamic {
                background: linear-gradient(135deg, rgba(255, 204, 0, 0.15) 0%, rgba(191, 90, 242, 0.15) 100%);
                color: #FFCC00;
                border-color: rgba(255, 204, 0, 0.25);
            }
            html.dark-mode .badge-simran, [data-theme="dark"] .badge-simran {
                background: linear-gradient(135deg, rgba(255, 204, 0, 0.15) 0%, rgba(255, 69, 58, 0.15) 100%);
                color: #FF453A;
                border-color: rgba(255, 204, 0, 0.35);
            }

            .anhad-tour-popover-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .anhad-tour-popover-dots {
                display: flex;
                gap: 5px;
                max-width: 120px;
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
                padding: 8px 18px;
                border-radius: 12px;
                font-weight: 700;
                font-size: 13px;
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
                font-size: 13px;
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

            /* Golden spotlight ring */
            .anhad-tour-spotlight-ring {
                position: fixed;
                border: 2px solid #D4943A;
                box-shadow: 0 0 15px rgba(212, 148, 58, 0.4), 0 0 0 4px rgba(212, 148, 58, 0.15);
                z-index: 1000000;
                pointer-events: none;
                transition: 
                    top 0.45s cubic-bezier(0.25, 1, 0.3, 1), 
                    left 0.45s cubic-bezier(0.25, 1, 0.3, 1), 
                    width 0.45s cubic-bezier(0.25, 1, 0.3, 1), 
                    height 0.45s cubic-bezier(0.25, 1, 0.3, 1),
                    opacity 0.3s ease;
                opacity: 0;
                will-change: top, left, width, height, opacity;
                animation: ringPulse 2s infinite ease-in-out;
            }
            .anhad-tour-spotlight-ring.active {
                opacity: 1;
            }
            @keyframes ringPulse {
                0%, 100% { box-shadow: 0 0 10px rgba(212, 148, 58, 0.3), 0 0 0 2px rgba(212, 148, 58, 0.1); }
                50% { box-shadow: 0 0 20px rgba(212, 148, 58, 0.6), 0 0 0 6px rgba(212, 148, 58, 0.2); }
            }

            /* Progress Bar & Step Counter */
            .anhad-tour-progress-container {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
                margin-right: 12px;
            }
            .anhad-tour-step-counter {
                font-size: 11.5px;
                font-weight: 700;
                color: #8E8E93;
                font-variant-numeric: tabular-nums;
            }
            .anhad-tour-progress-bar-wrap {
                flex: 1;
                height: 4px;
                background: rgba(0, 0, 0, 0.08);
                border-radius: 99px;
                overflow: hidden;
                position: relative;
            }
            html.dark-mode .anhad-tour-progress-bar-wrap,
            [data-theme="dark"] .anhad-tour-progress-bar-wrap {
                background: rgba(255, 255, 255, 0.08);
            }
            .anhad-tour-progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #D4943A 0%, #B8860B 100%);
                border-radius: 99px;
                transition: width 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
            }

            /* Premium Shimmer Button effect */
            .anhad-tour-popover-btn.shimmer-btn {
                position: relative;
                overflow: hidden;
            }
            .anhad-tour-popover-btn.shimmer-btn::after {
                content: '';
                position: absolute;
                top: -50%;
                left: -60%;
                width: 30%;
                height: 200%;
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(30deg);
                animation: shimmerEffect 3s infinite linear;
            }
            @keyframes shimmerEffect {
                0% { left: -60%; }
                30% { left: 160%; }
                100% { left: 160%; }
            }

            /* Celebration card */
            .anhad-celebration-card {
                position: fixed;
                bottom: -100%;
                left: 50%;
                transform: translateX(-50%);
                width: 90%;
                max-width: 400px;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(25px) saturate(200%);
                -webkit-backdrop-filter: blur(25px) saturate(200%);
                border: 1px solid rgba(255, 255, 255, 0.5);
                border-radius: 32px;
                padding: 32px 24px;
                box-shadow: 
                    0 30px 60px rgba(184, 134, 11, 0.25),
                    0 0 100px rgba(0,0,0,0.1),
                    inset 0 1px 0 rgba(255,255,255,0.7);
                z-index: 2000003;
                transition: bottom 0.6s cubic-bezier(0.19, 1, 0.22, 1);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                text-align: center;
                color: #3D2914;
                box-sizing: border-box;
            }
            html.dark-mode .anhad-celebration-card {
                background: rgba(28, 28, 31, 0.92);
                border-color: rgba(255, 255, 255, 0.08);
                color: #FAF8F5;
                box-shadow: 
                    0 30px 60px rgba(0, 0, 0, 0.6),
                    0 0 100px rgba(0,0,0,0.2),
                    inset 0 1px 0 rgba(255,255,255,0.05);
            }
            .anhad-celebration-card.active {
                bottom: calc(24px + env(safe-area-inset-bottom, 0px));
            }
            .anhad-celebration-emoji {
                font-size: 52px;
                margin-bottom: 16px;
                display: inline-block;
                animation: emojiWiggle 1.5s ease infinite;
            }
            @keyframes emojiWiggle {
                0%, 100% { transform: rotate(0deg) scale(1); }
                50% { transform: rotate(15deg) scale(1.1); }
            }
            .anhad-celebration-title {
                font-size: 24px;
                font-weight: 900;
                margin-bottom: 12px;
                color: #D4943A;
                letter-spacing: -0.3px;
            }
            .anhad-celebration-text {
                font-size: 15px;
                line-height: 1.6;
                margin-bottom: 24px;
                opacity: 0.9;
            }
            .anhad-celebration-btn {
                width: 100%;
                border: none;
                background: linear-gradient(135deg, #D4943A 0%, #B8860B 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 20px;
                font-weight: 800;
                font-size: 16px;
                cursor: pointer;
                box-shadow: 0 8px 24px rgba(212, 148, 58, 0.4);
                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            .anhad-celebration-btn:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 12px 30px rgba(212, 148, 58, 0.5);
            }
            .anhad-celebration-btn:active {
                transform: translateY(0) scale(0.98);
            }
        `;
        document.head.appendChild(style);
    }

    // Dynamic Glimpse Badge Ingestion helper
    function getBadgesHtml(selector) {
        if (selector === '#homeBackBtn') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-gold">📻 Live Radio</span>
                    <span class="anhad-badge badge-blue">⚡ Sync Play</span>
                </div>
            `;
        }
        if (selector === '#themeToggleBtn') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-light">☀️ Light</span>
                    <span class="anhad-badge badge-dark">🌙 Dark</span>
                    <span class="anhad-badge badge-dynamic">✨ Dynamic Theme</span>
                </div>
            `;
        }
        if (selector === '.hero-carousel') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-gold">🎵 Live Kirtan</span>
                    <span class="anhad-badge badge-blue">📿 Simran Stream</span>
                </div>
            `;
        }
        if (selector === '#eventCard') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-gold">📅 Active Countdown</span>
                    <span class="anhad-badge badge-green">☬ Sikh History</span>
                </div>
            `;
        }
        if (selector === '#nitnemPractice') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-gold">📿 Devotional Banis</span>
                    <span class="anhad-badge badge-blue">📈 Read & Complete</span>
                </div>
            `;
        }
        if (selector === '#sehajPractice') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-gold">📖 Sri Guru Granth Sahib</span>
                    <span class="anhad-badge badge-purple">📊 Ang Progress %</span>
                </div>
            `;
        }
        if (selector === '#hukamPractice') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-gold">📜 Today's Hukamnama</span>
                    <span class="anhad-badge badge-blue">🔊 Translation & Audio</span>
                </div>
            `;
        }
        if (selector === '#nitnemTrackerCard') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-red">🔥 Streaks & Milestones</span>
                    <span class="anhad-badge badge-gold">📅 Active Calendar</span>
                </div>
            `;
        }
        if (selector === '#naamCard') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-simran">🙏 2-Min Hourly Simran</span>
                    <span class="anhad-badge badge-gold">📿 Mala Counter</span>
                </div>
            `;
        }
        if (selector === '#shabadVicharCard') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-gold">🪔 Daily Reflection</span>
                    <span class="anhad-badge badge-green">💡 Gurbani Meaning</span>
                </div>
            `;
        }
        if (selector === '#searchCard') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-gold">🔍 Advanced Gurbani Khoj</span>
                    <span class="anhad-badge badge-blue">⚡ Instant Search</span>
                </div>
            `;
        }
        if (selector === '#notesCard') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-gold">📝 Devotional Notes</span>
                    <span class="anhad-badge badge-purple">💾 Safe Storage</span>
                </div>
            `;
        }
        if (selector === '#mainNav') {
            return `
                <div class="anhad-tour-badges">
                    <span class="anhad-badge badge-gold">📊 Journey Stats</span>
                    <span class="anhad-badge badge-red">❤️ Favorites</span>
                </div>
            `;
        }
        return '';
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

        let spotlightRing = document.createElement('div');
        spotlightRing.className = 'anhad-tour-spotlight-ring';
        spotlightRing.id = 'anhad-tour-spotlight-ring';
        document.body.appendChild(spotlightRing);

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

        // Dynamic Spotlight Ring
        const ring = document.getElementById('anhad-tour-spotlight-ring');
        if (ring) {
            if (element) {
                ring.style.top = `${rect.top - padding}px`;
                ring.style.left = `${rect.left - padding}px`;
                ring.style.width = `${rect.width + padding * 2}px`;
                ring.style.height = `${rect.height + padding * 2}px`;
                const style = window.getComputedStyle(element);
                ring.style.borderRadius = style.borderRadius || '12px';
                ring.classList.add('active');
            } else {
                ring.classList.remove('active');
            }
        }
    }

    // Handles the positioning of the tooltip popover box mathematically
    function positionPopover(element, step) {
        const popoverWidth = 330;
        const popoverHeight = popover.offsetHeight || 220;
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

            // Glimpse Badges
            const badgesHtml = getBadgesHtml(step.selector);

            // Populate tooltip popover
            popover.innerHTML = `
                <div class="anhad-tour-popover-title">${step.title}</div>
                ${badgesHtml}
                <div class="anhad-tour-popover-text">${step.text}</div>
                <div class="anhad-tour-popover-footer">
                    <div class="anhad-tour-progress-container">
                        <span class="anhad-tour-step-counter">${currentStepIndex + 1} / ${steps.length}</span>
                        <div class="anhad-tour-progress-bar-wrap">
                            <div class="anhad-tour-progress-bar-fill" style="width: ${((currentStepIndex + 1) / steps.length) * 100}%"></div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; flex-shrink: 0;">
                        <button class="anhad-tour-skip-btn" id="tourSkipBtn">${selectedLang === 'pa' ? 'ਛੱਡੋ' : selectedLang === 'hi' ? 'छोड़ें' : 'Skip'}</button>
                        <button class="anhad-tour-popover-btn shimmer-btn" id="tourNextBtn">${currentStepIndex === steps.length - 1 ? (selectedLang === 'pa' ? 'ਸਮਾਪਤ' : selectedLang === 'hi' ? 'समाप्त' : 'Finish') : (selectedLang === 'pa' ? 'ਅਗਲਾ' : selectedLang === 'hi' ? 'अगला' : 'Next')}</button>
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

        // FORCE default dynamic theme if not already explicitly configured!
        if (!localStorage.getItem('anhad_theme')) {
            localStorage.setItem('anhad_theme', 'auto');
            if (window.AnhadTheme) window.AnhadTheme.apply('auto');
        }

        // Unbind resize and scroll events
        window.removeEventListener('resize', handleResizeAndScroll);
        window.removeEventListener('scroll', handleResizeAndScroll);

        // Animate off
        document.querySelectorAll('.anhad-tour-overlay-edge').forEach(el => {
            el.classList.remove('active');
        });
        const spotlightRing = document.getElementById('anhad-tour-spotlight-ring');
        if (spotlightRing) spotlightRing.classList.remove('active');
        if (popover) popover.classList.remove('active');
        if (tapPrompt) tapPrompt.style.opacity = '0';

        // Remove high Z-indexes or style tweaks from targets
        document.querySelectorAll('.anhad-tour-target').forEach(el => {
            el.classList.remove('anhad-tour-target');
        });

        // Show celebration bottom card modal
        const celebrationCard = document.createElement('div');
        celebrationCard.className = 'anhad-celebration-card';
        
        let titleHtml = '✨ Dynamic Theme Active!';
        let textHtml = 'ANHAD is configured with our premium <b>Auto-Dynamic Theme</b> by default. Your background artwork and card colors will adapt beautifully with the local hour (Amritvela, Day, Evening, and Night).';
        let btnHtml = 'Begin Journey';
        
        if (selectedLang === 'pa') {
            titleHtml = '✨ ਡਾਇਨਾਮਿਕ ਥੀਮ ਸਰਗਰਮ!';
            textHtml = 'ANHAD ਨੂੰ ਡਿਫੌਲਟ ਰੂਪ ਵਿੱਚ ਸਾਡੇ ਪ੍ਰੀਮੀਅਮ <b>ਆਟੋ-ਡਾਇਨਾਮਿਕ ਥੀਮ</b> ਤੇ ਸੈੱਟ ਕੀਤਾ ਗਿਆ ਹੈ। ਤੁਹਾਡਾ ਬੈਕਗ੍ਰਾਊਂਡ ਅਤੇ ਰੰਗ ਦਿਨ ਦੇ ਸਮੇਂ (ਅੰਮ੍ਰਿਤ ਵੇਲਾ, ਦਿਨ, ਸ਼ਾਮ ਅਤੇ ਰਾਤ) ਅਨੁਸਾਰ ਆਪਣੇ ਆਪ ਬਦਲਣਗੇ।';
            btnHtml = 'ਯਾਤਰਾ ਸ਼ੁਰੂ ਕਰੋ';
        } else if (selectedLang === 'hi') {
            titleHtml = '✨ डायनामिक थीम सक्रिय!';
            textHtml = 'ANHAD को डिफ़ॉल्ट रूप से हमारे प्रीमियम <b>ऑटो-डायनामिक थीम</b> पर सेट किया गया है। आपका बैकग्राउंड और रंग दिन के समय (अमृतवेला, दिन, शाम और रात) के अनुसार प्राकृतिक रूप से बदलेंगे।';
            btnHtml = 'यात्रा शुरू करें';
        }

        celebrationCard.innerHTML = `
            <div class="anhad-celebration-emoji">🎉</div>
            <div class="anhad-celebration-title">${titleHtml}</div>
            <div class="anhad-celebration-text">${textHtml}</div>
            <button class="anhad-celebration-btn" id="celebrationCloseBtn">${btnHtml}</button>
        `;
        document.body.appendChild(celebrationCard);
        
        // Trigger active class
        setTimeout(() => celebrationCard.classList.add('active'), 100);

        document.getElementById('celebrationCloseBtn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            celebrationCard.classList.remove('active');
            setTimeout(() => {
                celebrationCard.remove();
                if (overlayContainer) overlayContainer.remove();
                if (popover) popover.remove();
                if (tapPrompt) tapPrompt.remove();
                if (spotlightRing) spotlightRing.remove();
                const style = document.getElementById('anhad-tour-styles-v9');
                if (style) style.remove();
            }, 600);
        });
    }

    // Expose public method to trigger onboarding from header Guide button
    window.startAnhadOnboardingTour = function (forceLangSelect = false) {
        // Prevent launching multiple tours concurrently
        if (document.getElementById('anhad-tour-overlay-container')) return;

        currentStepIndex = 0;
        if (forceLangSelect) {
            showLanguagePicker();
        } else {
            selectedLang = localStorage.getItem(LANG_KEY) || 'en';
            startTour();
        }
    };

    // Auto-launch trigger
    window.addEventListener('load', () => {
        // Only run on the main home screen (index.html), not sub-pages
        const isMainPage = window.location.pathname.endsWith('index.html') ||
                           window.location.pathname.endsWith('/') ||
                           document.getElementById('guruSlider') !== null;

        if (isMainPage) {
            // Bind manual trigger to guide button in header
            const guideBtn = document.getElementById('tourGuideBtn');
            if (guideBtn) {
                guideBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.startAnhadOnboardingTour(true); // force language select on manual click
                });
            }

            // Check if user has already completed the onboarding
            if (localStorage.getItem(TOUR_KEY) !== 'true') {
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
