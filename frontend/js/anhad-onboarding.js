/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD GUIDED ONBOARDING SYSTEM — Multilingual Zero-Blur Edition
 * Dynamic Language Selector (EN, PA, HI), 13 Steps, Smooth-Scroll & clip-path Mask
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    const TOUR_KEY = 'anhad_onboarding_completed';
    const LANG_KEY = 'anhad_tour_lang';

    // Don't run if already completed or if on desktop/non-main screens
    if (localStorage.getItem(TOUR_KEY) === 'true') {
        return;
    }

    // Multilingual Step Content
    const tourContent = {
        en: [
            { selector: '#homeBackBtn', title: '📻 Enter Gurdwara Sahib', text: 'Click here to enter the Gurdwara Sahib welcome screen and play live streams synchronized across all devices.', position: 'bottom-left' },
            { selector: '#themeToggleBtn', title: '✨ Choose Magic Themes', text: 'We have three gorgeous themes! Click here to cycle between Light, Dark, and Dynamic Time-of-Day auto modes.', position: 'bottom-right' },
            { selector: '.hero-carousel', title: '🎵 Virtual Live Streams', text: 'Swipe left/right and tap the play buttons to play live broadcasts from Sri Harmandir Sahib, Amritvela, or Waheguru Simran.', position: 'center' },
            { selector: '#eventCard', title: '📅 Gurpurab Calendar', text: 'Track upcoming historic Gurpurab events and historical dates with an active countdown timer.', position: 'top-center' },
            { selector: '#nitnemPractice', title: '📿 Daily Nitnem', text: 'Read your daily Nitnem prayers (Banis) with interactive tracking and completions.', position: 'top-center' },
            { selector: '#sehajPractice', title: '📖 Sehaj Paath', text: 'Start or continue your personal Sehaj Paath reading journey of Sri Guru Granth Sahib Ji at your own pace.', position: 'top-center' },
            { selector: '#hukamPractice', title: '📜 Today\'s Hukamnama', text: 'Read the daily divine Hukamnama command from Sri Harmandir Sahib with translations.', position: 'top-center' },
            { selector: '#nitnemTrackerCard', title: '🔥 Nitnem Tracker', text: 'Track your devotional streaks, active days, completed prayers, and historical stats.', position: 'top-center' },
            { selector: '#naamCard', title: '🙏 Naam Abhyas', text: 'Begin peaceful meditation and Simran with a highly optimized counting interface.', position: 'top-center' },
            { selector: '#shabadVicharCard', title: '🪔 Shabad Vichar', text: 'Contemplate and reflect on deep spiritual meanings of selected Gurbani Shabads daily.', position: 'top-center' },
            { selector: '#searchCard', title: '🔍 Gurbani Khoj', text: 'Search for any Shabad inside Sri Guru Granth Sahib Ji by first-letter initials or keywords.', position: 'top-center' },
            { selector: '#notesCard', title: '📝 Gurbani Notes', text: 'Pen down and save your personal spiritual thoughts, inspirations, and notes while reading.', position: 'top-center' },
            { selector: '#mainNav', title: '📈 Devotions & Dashboard', text: 'Switch to the Learning library, view saved Favorites, or open the Dashboard to track your progress.', position: 'top-center' }
        ],
        pa: [
            { selector: '#homeBackBtn', title: '📻 ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ ਪ੍ਰਵੇਸ਼', text: 'ਗੁਰਦੁਆਰਾ ਸਾਹਿਬ ਦੇ ਮੁੱਖ ਸਕ੍ਰੀਨ \'ਤੇ ਜਾਣ ਅਤੇ ਸਾਰੇ ਯੰਤਰਾਂ \'ਤੇ ਇੱਕਸਾਰ ਲਾਈਵ ਕੀਰਤਨ ਸੁਣਨ ਲਈ ਇੱਥੇ ਕਲਿੱਕ ਕਰੋ।', position: 'bottom-left' },
            { selector: '#themeToggleBtn', title: '✨ ਜਾਦੂਈ ਥੀਮ ਚੁਣੋ', text: 'ਸਾਡੇ ਕੋਲ ਤਿੰਨ ਖੂਬਸੂਰਤ ਥੀਮ ਹਨ! ਲਾਈਟ, ਡਾਰਕ ਅਤੇ ਡਾਇਨਾਮਿਕ ਸਮੇਂ-ਅਨੁਸਾਰ ਆਟੋ ਥੀਮ ਬਦਲਣ ਲਈ ਇੱਥੇ ਕਲਿੱਕ ਕਰੋ।', position: 'bottom-right' },
            { selector: '.hero-carousel', title: '🎵 ਵਰਚੁਅਲ ਲਾਈਵ ਕੀਰਤਨ', text: 'ਸ੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ, ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਕੀਰਤਨ ਜਾਂ ਵਾਹਿਗੁਰੂ ਸਿਮਰਨ ਦੇ ਲਾਈਵ ਪ੍ਰਸਾਰਣ ਚਲਾਉਣ ਲਈ ਖੱਬੇ/ਸੱਜੇ ਸਵਾਈਪ ਕਰੋ।', position: 'center' },
            { selector: '#eventCard', title: '📅 ਗੁਰਪੁਰਬ ਕੈਲੰਡਰ', text: 'ਆਉਣ ਵਾਲੇ ਇਤਿਹਾਸਕ ਗੁਰਪੁਰਬਾਂ ਅਤੇ ਦਿਹਾੜਿਆਂ ਦੀ ਜਾਣਕਾਰੀ ਇੱਕ ਲਾਈਵ ਉਲਟੀ ਗਿਣਤੀ (ਕਾਊਂਟਡਾਊਨ) ਦੇ ਨਾਲ ਦੇਖੋ।', position: 'top-center' },
            { selector: '#nitnemPractice', title: '📿 ਰੋਜ਼ਾਨਾ ਨਿਤਨੇਮ', text: 'ਆਪਣੇ ਰੋਜ਼ਾਨਾ ਨਿਤਨੇਮ ਦੀਆਂ ਬਾਣੀਆਂ ਨੂੰ ਸੁੰਦਰ ਪਾਠਕ (ਰੀਡਰ) ਅਤੇ ਲਾਈਵ ਪ੍ਰਗਤੀ ਟਰੈਕਿੰਗ ਦੇ ਨਾਲ ਪੜ੍ਹੋ।', position: 'top-center' },
            { selector: '#sehajPractice', title: '📖 ਸਹਿਜ ਪਾਠ', text: 'ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਦੇ ਸਹਿਜ ਪਾਠ ਦੀ ਸ਼ੁਰੂਆਤ ਕਰੋ ਅਤੇ ਆਪਣੀ ਸਹੂਲਤ ਅਨੁਸਾਰ ਅੱਗੇ ਵਧੋ।', position: 'top-center' },
            { selector: '#hukamPractice', title: '📜 ਰੋਜ਼ਾਨਾ ਹੁਕਮਨਾਮਾ', text: 'ਸ੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਤੋਂ ਅੱਜ ਦਾ ਮੁੱਖ ਵਾਕ (ਹੁਕਮਨਾਮਾ) ਅਰਥਾਂ ਅਤੇ ਵਿਆਖਿਆ ਸਮੇਤ ਪੜ੍ਹੋ।', position: 'top-center' },
            { selector: '#nitnemTrackerCard', title: '🔥 ਨਿਤਨੇਮ ਟਰੈਕਰ', text: 'ਆਪਣੀ ਰੋਜ਼ਾਨਾ ਭਗਤੀ ਦੇ ਨੇਮ, ਸਰਗਰਮ ਦਿਨ ਅਤੇ ਇਤਿਹਾਸਕ ਪ੍ਰਗਤੀ ਦਾ ਰਿਕਾਰਡ ਰੱਖੋ।', position: 'top-center' },
            { selector: '#naamCard', title: '🙏 ਨਾਮ ਅਭਿਆਸ', text: 'ਨਾਮ ਸਿਮਰਨ ਅਤੇ ਮੈਡੀਟੇਸ਼ਨ ਲਈ ਵਿਸ਼ੇਸ਼ ਤੌਰ \'ਤੇ ਤਿਆਰ ਕੀਤੇ ਗਏ ਜਾਪ ਕਾਊਂਟਰ ਦੀ ਵਰਤੋਂ ਕਰੋ।', position: 'top-center' },
            { selector: '#shabadVicharCard', title: '🪔 ਸ਼ਬਦ ਵਿਚਾਰ', text: 'ਰੋਜ਼ਾਨਾ ਚੁਣੇ ਹੋਏ ਗੁਰਬਾਣੀ ਸ਼ਬਦਾਂ ਦੇ ਡੂੰਘੇ ਰੂਹਾਨੀ ਅਰਥਾਂ ਅਤੇ ਵਿਚਾਰਾਂ ਨੂੰ ਪੜ੍ਹੋ।', position: 'top-center' },
            { selector: '#searchCard', title: '🔍 ਗੁਰਬਾਣੀ ਖੋਜ', text: 'ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਵਿੱਚੋਂ ਕਿਸੇ ਵੀ ਸ਼ਬਦ ਨੂੰ ਪਹਿਲੇ ਅੱਖਰ ਜਾਂ ਕੀਵਰਡ ਨਾਲ ਆਸਾਨੀ ਨਾਲ ਲੱਭੋ।', position: 'top-center' },
            { selector: '#notesCard', title: '📝 ਗੁਰਬਾਣੀ ਨੋਟਸ', text: 'ਪਾਠ ਕਰਦੇ ਸਮੇਂ ਆਪਣੇ ਨਿੱਜੀ ਰੂਹਾਨੀ ਵਿਚਾਰਾਂ, ਪ੍ਰੇਰਨਾਵਾਂ ਅਤੇ ਨੋਟਸ ਨੂੰ ਲਿਖ ਕੇ ਸੁਰੱਖਿਅਤ ਕਰੋ।', position: 'top-center' },
            { selector: '#mainNav', title: '📈 ਲਾਇਬ੍ਰੇਰੀ ਅਤੇ ਡੈਸ਼ਬੋਰਡ', text: 'ਲਾਇਬ੍ਰੇਰੀ ਪੜ੍ਹਨ, ਪਸੰਦੀਦਾ (ਫ਼ੇਵਰੇਟ) ਸ਼ਬਦ ਦੇਖਣ, ਜਾਂ ਆਪਣੀ ਪ੍ਰਗਤੀ ਦਾ ਡੈਸ਼ਬੋਰਡ ਖੋਲ੍ਹਣ ਲਈ ਇੱਥੋਂ ਨੇਵੀਗੇਟ ਕਰੋ।', position: 'top-center' }
        ],
        hi: [
            { selector: '#homeBackBtn', title: '📻 गुरुद्वारा साहिब प्रवेश', text: 'गुरुद्वारा साहिब की मुख्य स्क्रीन पर जाने और सभी उपकरणों पर एक साथ लाइव कीर्तन सुनने के लिए यहां क्लिक करें।', position: 'bottom-left' },
            { selector: '#themeToggleBtn', title: '✨ जादुई थीम चुनें', text: 'हमारे पास तीन खूबसूरत थीम हैं! लाइट, डार्क और डायनामिक समय-अनुसार ऑटो थीम बदलने के लिए यहां क्लिक करें।', position: 'bottom-right' },
            { selector: '.hero-carousel', title: '🎵 वर्चुअल लाइव कीर्तन', text: 'श्री हरिमंदिर साहिब, अमृत वेला कीर्तन या वाहेगुरु सिमरन के लाइव प्रसारण चलाने के लिए बाएं/दाएं स्वाइप करें।', position: 'center' },
            { selector: '#eventCard', title: '📅 गुरपुरब कैलेंडर', text: 'आने वाले ऐतिहासिक गुरपुरबों और ऐतिहासिक तिथियों की जानकारी लाइव उलटी गिनती (काउंटडाउन) के साथ देखें।', position: 'top-center' },
            { selector: '#nitnemPractice', title: '📿 दैनिक नितनेम', text: 'अपने दैनिक नितनेम की बाणियों को सुंदर पाठक (रीडर) और लाइव प्रगति ट्रैकिंग के साथ पढ़ें।', position: 'top-center' },
            { selector: '#sehajPractice', title: '📖 सहज पाठ', text: 'श्री गुरु ग्रंथ साहिब जी के सहज पाठ की शुरुआत करें और अपनी सुविधा अनुसार आगे बढ़ें।', position: 'top-center' },
            { selector: '#hukamPractice', title: '📜 दैनिक हुकमनामा', text: 'श्री हरिमंदिर साहिब से आज का मुख्य वाक्य (हुकमनामा) अर्थों और व्याख्या सहित पढ़ें।', position: 'top-center' },
            { selector: '#nitnemTrackerCard', title: '🔥 नितनेम ट्रैकर', text: 'अपनी दैनिक भक्ति के नियम, सक्रिय दिन और ऐतिहासिक प्रगति का रिकॉर्ड रखें।', position: 'top-center' },
            { selector: '#naamCard', title: '🙏 नाम अभ्यास', text: 'नाम सिमरन और मेडिटेशन के लिए विशेष रूप से तैयार किए गए जाप काउंटर का उपयोग करें।', position: 'top-center' },
            { selector: '#shabadVicharCard', title: '🪔 शबद विचार', text: 'दैनिक चुने हुए गुरबाणी शबद के गहरे आध्यात्मिक अर्थों और विचारों को पढ़ें।', position: 'top-center' },
            { selector: '#searchCard', title: '🔍 गुरबाणी खोज', text: 'श्री गुरु ग्रंथ साहिब जी में से किसी भी शबद को पहले अक्षर या कीवर्ड से आसानी से खोजें।', position: 'top-center' },
            { selector: '#notesCard', title: '📝 गुरबाणी नोट्स', text: 'पाठ करते समय अपने निजी आध्यात्मिक विचारों, प्रेरणाओं और नोट्स को लिखकर सुरक्षित करें।', position: 'top-center' },
            { selector: '#mainNav', title: '📈 लाइब्रेरी और डैशबोर्ड', text: 'लाइब्रेरी पढ़ने, पसंदीदा (फेवरेट) शबद देखने, या अपनी प्रगति का डैशबोर्ड खोलने के लिए यहाँ से नेविगेट करें।', position: 'top-center' }
        ]
    };

    let selectedLang = 'en';
    let currentStepIndex = 0;
    
    // UI Elements
    let langModal = null;
    let overlay = null;
    let popover = null;
    let tapPrompt = null;

    // Inject styles dynamically (iOS Premium Glassmorphism)
    function injectStyles() {
        if (document.getElementById('anhad-tour-styles-v8')) return;
        
        const style = document.createElement('style');
        style.id = 'anhad-tour-styles-v8';
        style.textContent = `
            .anhad-tour-blur-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.45);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                z-index: 999999;
                opacity: 0;
                transition: opacity 0.3s ease, clip-path 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                pointer-events: auto;
            }
            .anhad-tour-blur-overlay.active {
                opacity: 1;
            }
            .anhad-tour-popover {
                position: absolute;
                background: rgba(255, 255, 255, 0.88);
                backdrop-filter: blur(20px) saturate(190%);
                -webkit-backdrop-filter: blur(20px) saturate(190%);
                border: 1px solid rgba(255, 255, 255, 0.4);
                box-shadow: 
                    0 8px 32px rgba(139, 105, 20, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6);
                border-radius: 24px;
                padding: 20px 24px;
                width: 290px;
                z-index: 1000001;
                transform: scale(0.9) translateY(10px);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                color: #3D2914;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                box-sizing: border-box;
            }
            html.dark-mode .anhad-tour-popover,
            [data-theme="dark"] .anhad-tour-popover {
                background: rgba(28, 28, 31, 0.88);
                border-color: rgba(255, 255, 255, 0.08);
                color: #FAF8F5;
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.5),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
            }
            .anhad-tour-popover.active {
                transform: scale(1) translateY(0);
                opacity: 1;
            }
            .anhad-tour-popover-title {
                font-weight: 800;
                font-size: 16px;
                margin-bottom: 8px;
                color: #D4943A;
                text-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            .anhad-tour-popover-text {
                font-size: 13.5px;
                line-height: 1.5;
                opacity: 0.95;
                margin-bottom: 16px;
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
            }
            .anhad-tour-popover-btn {
                border: none;
                background: linear-gradient(135deg, #D4943A 0%, #B8860B 100%);
                color: white;
                padding: 6px 14px;
                border-radius: 12px;
                font-weight: 700;
                font-size: 12px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(212, 148, 58, 0.25);
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
            .anhad-tour-tap-anywhere {
                position: fixed;
                bottom: calc(120px + env(safe-area-inset-bottom, 24px));
                left: 50%;
                transform: translateX(-50%);
                color: rgba(255, 255, 255, 0.9);
                text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.5px;
                z-index: 1000000;
                pointer-events: none;
                animation: tourPulse 2s infinite;
                background: rgba(0, 0, 0, 0.5);
                padding: 8px 18px;
                border-radius: 16px;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.15);
            }
            @keyframes tourPulse {
                0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(0.98); }
                50% { opacity: 1; transform: translateX(-50%) scale(1.02); }
            }
            
            /* Language Picker Modal */
            .anhad-lang-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                z-index: 1000002;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: auto;
            }
            .anhad-lang-modal.active {
                opacity: 1;
            }
            .anhad-lang-content {
                background: rgba(255, 255, 255, 0.88);
                border: 1px solid rgba(255, 255, 255, 0.4);
                box-shadow: 0 12px 40px rgba(0,0,0,0.15);
                border-radius: 28px;
                padding: 28px 24px;
                width: 310px;
                text-align: center;
                transform: scale(0.9);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                color: #3D2914;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            html.dark-mode .anhad-lang-content,
            [data-theme="dark"] .anhad-lang-content {
                background: rgba(28, 28, 31, 0.9);
                border-color: rgba(255, 255, 255, 0.08);
                color: #FAF8F5;
            }
            .anhad-lang-modal.active .anhad-lang-content {
                transform: scale(1);
            }
            .anhad-lang-title {
                font-weight: 900;
                font-size: 20px;
                margin-bottom: 8px;
                color: #D4943A;
            }
            .anhad-lang-subtitle {
                font-size: 13.5px;
                opacity: 0.8;
                margin-bottom: 24px;
                line-height: 1.4;
            }
            .anhad-lang-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .anhad-lang-btn {
                border: 1px solid rgba(212, 148, 58, 0.25);
                background: rgba(255, 255, 255, 0.6);
                padding: 14px;
                border-radius: 16px;
                font-weight: 700;
                font-size: 14.5px;
                cursor: pointer;
                transition: all 0.25s ease;
                color: inherit;
            }
            html.dark-mode .anhad-lang-btn,
            [data-theme="dark"] .anhad-lang-btn {
                background: rgba(255, 255, 255, 0.03);
            }
            .anhad-lang-btn:hover, .anhad-lang-btn:active {
                background: linear-gradient(135deg, #D4943A 0%, #B8860B 100%);
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(212, 148, 58, 0.3);
                border-color: transparent;
            }
            
            /* Highlight target helper to bypass scroll hides */
            .anhad-tour-target {
                position: relative;
                z-index: 1000002 !important;
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
                    <button class="anhad-lang-btn" data-lang="en">English</button>
                    <button class="anhad-lang-btn" data-lang="pa">ਪੰਜਾਬੀ (Punjabi)</button>
                    <button class="anhad-lang-btn" data-lang="hi">हिंदी (Hindi)</button>
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
                }, 300);
            });
        });

        // Trigger reflow & show
        setTimeout(() => langModal.classList.add('active'), 50);
    }

    // Initialize layout overlay elements
    function initOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'anhad-tour-blur-overlay';
        
        popover = document.createElement('div');
        popover.className = 'anhad-tour-popover';
        
        tapPrompt = document.createElement('div');
        tapPrompt.className = 'anhad-tour-tap-anywhere';
        tapPrompt.innerHTML = selectedLang === 'pa' ? '👆 ਅਗਲਾ ਕਦਮ ਦੇਖਣ ਲਈ ਕਿਤੇ ਵੀ ਕਲਿੱਕ ਕਰੋ' : selectedLang === 'hi' ? '👆 अगला कदम देखने के लिए कहीं भी क्लिक करें' : '👆 Tap anywhere to continue';
        
        document.body.appendChild(overlay);
        document.body.appendChild(popover);
        document.body.appendChild(tapPrompt);

        // Advance on overlay click anywhere
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            advanceTour();
        });
    }

    // Recalculates spotlight size and applies crisp clip-path mask cutout
    function applySpotlightMask(rect) {
        const padding = 8;
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // Viewport relative bounds
        const l = Math.max(0, rect.left - padding);
        const t = Math.max(0, rect.top - padding);
        const r = Math.min(w, rect.left + rect.width + padding);
        const b = Math.min(h, rect.top + rect.height + padding);

        // Complex polygon masking to cut a rectangular hole in the overlay
        // Draws outer frame clockwise, then inner spotlight cutout counter-clockwise
        overlay.style.clipPath = `polygon(
            0px 0px, ${w}px 0px, ${w}px ${h}px, 0px ${h}px, 0px 0px,
            ${l}px ${t}px, ${l}px ${b}px, ${r}px ${b}px, ${r}px ${t}px, ${l}px ${t}px
        )`;
        
        // Webkit clip-path support
        overlay.style.webkitClipPath = `polygon(
            0px 0px, ${w}px 0px, ${w}px ${h}px, 0px ${h}px, 0px 0px,
            ${l}px ${t}px, ${l}px ${b}px, ${r}px ${b}px, ${r}px ${t}px, ${l}px ${t}px
        )`;
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
                rect.top >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
            );
            
            if (!isInViewport) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Delay rendering step until scroll settles
                setTimeout(performHighlight, 550);
                return;
            }
        }

        performHighlight();

        function performHighlight() {
            // Retrieve current viewport bounds
            let rect = { top: window.innerHeight / 2 - 50, left: window.innerWidth / 2 - 100, width: 200, height: 100 };
            if (element) {
                rect = element.getBoundingClientRect();
                
                // Clear any previous highlights
                document.querySelectorAll('.anhad-tour-target').forEach(el => {
                    el.classList.remove('anhad-tour-target');
                });
                // Add highlight class
                element.classList.add('anhad-tour-target');
            }

            // Apply clip-path mask to leave spotlight unblurred
            applySpotlightMask(rect);

            // Populate tooltip popover
            popover.innerHTML = `
                <div class="anhad-tour-popover-title">${step.title}</div>
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
            popover.querySelector('#tourSkipBtn').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                endTour();
            });

            popover.querySelector('#tourNextBtn').addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                advanceTour();
            });

            // Adjust popover placement mathematically
            popover.classList.remove('active');
            
            setTimeout(() => {
                const popoverWidth = 280;
                const popoverHeight = popover.offsetHeight || 140;
                let popoverTop = 0;
                let popoverLeft = 0;

                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                
                const l = rect.left;
                const t = rect.top;
                const w = rect.width;
                const h = rect.height;

                // Layout placements
                if (step.position === 'bottom-left') {
                    popoverTop = t + h + 14;
                    popoverLeft = Math.max(12, l);
                } else if (step.position === 'bottom-right') {
                    popoverTop = t + h + 14;
                    popoverLeft = Math.min(screenWidth - popoverWidth - 12, l + w - popoverWidth);
                } else if (step.position === 'top-center') {
                    popoverTop = t - popoverHeight - 14;
                    popoverLeft = (screenWidth - popoverWidth) / 2;
                } else { // Center or automatic placement
                    popoverTop = t + h + 16;
                    popoverLeft = (screenWidth - popoverWidth) / 2;
                    // If clipping off bottom, shift to top
                    if (popoverTop + popoverHeight > screenHeight - 60) {
                        popoverTop = t - popoverHeight - 16;
                    }
                }

                // Final safety containment boundaries
                popoverTop = Math.max(16, Math.min(screenHeight - popoverHeight - 20, popoverTop));
                popoverLeft = Math.max(12, Math.min(screenWidth - popoverWidth - 12, popoverLeft));

                popover.style.top = `${popoverTop}px`;
                popover.style.left = `${popoverLeft}px`;
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
            overlay.classList.add('active');
            renderStep();
        }, 100);
    }

    function endTour() {
        console.log('🏁 Onboarding tour successfully completed.');
        localStorage.setItem(TOUR_KEY, 'true');
        
        // Animate off
        if (overlay) overlay.classList.remove('active');
        if (popover) popover.classList.remove('active');
        if (tapPrompt) tapPrompt.style.opacity = '0';
        
        // Remove high Z-indexes from targets
        document.querySelectorAll('.anhad-tour-target').forEach(el => {
            el.classList.remove('anhad-tour-target');
        });

        // Safe DOM cleanup
        setTimeout(() => {
            if (overlay) overlay.remove();
            if (popover) popover.remove();
            if (tapPrompt) tapPrompt.remove();
            
            const style = document.getElementById('anhad-tour-styles-v8');
            if (style) style.remove();
        }, 400);
    }

    // Auto-launch trigger
    window.addEventListener('load', () => {
        // Only run on the main home screen (index.html), not sub-pages
        const isMainPage = window.location.pathname.endsWith('index.html') || 
                           window.location.pathname.endsWith('/') || 
                           document.getElementById('guruSlider') !== null;
                           
        if (isMainPage) {
            // Check language preference
            selectedLang = localStorage.getItem(LANG_KEY);
            
            if (!selectedLang) {
                setTimeout(showLanguagePicker, 1500);
            } else {
                setTimeout(startTour, 1500);
            }
        }
    });

})();
