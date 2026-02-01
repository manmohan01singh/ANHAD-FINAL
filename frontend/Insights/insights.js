/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD Gurbani Insights Page - Enhanced Version
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA - 31 Classical Raags
    // ═══════════════════════════════════════════════════════════════════════════

    const RAAGS = [
        { name: "Sri Raag", shabads: 158 },
        { name: "Raag Maajh", shabads: 173 },
        { name: "Raag Gauri", shabads: 347 },
        { name: "Raag Aasa", shabads: 435 },
        { name: "Raag Gujri", shabads: 78 },
        { name: "Raag Devgandhari", shabads: 51 },
        { name: "Raag Bihagra", shabads: 47 },
        { name: "Raag Wadhans", shabads: 92 },
        { name: "Raag Sorath", shabads: 164 },
        { name: "Raag Dhanasri", shabads: 111 },
        { name: "Raag Jaitsri", shabads: 48 },
        { name: "Raag Todi", shabads: 43 },
        { name: "Raag Bairari", shabads: 16 },
        { name: "Raag Tilang", shabads: 38 },
        { name: "Raag Suhi", shabads: 128 },
        { name: "Raag Bilawal", shabads: 135 },
        { name: "Raag Gond", shabads: 60 },
        { name: "Raag Ramkali", shabads: 120 },
        { name: "Raag Nat Narain", shabads: 44 },
        { name: "Raag Mali Gaura", shabads: 15 },
        { name: "Raag Maru", shabads: 175 },
        { name: "Raag Tukhari", shabads: 21 },
        { name: "Raag Kedara", shabads: 19 },
        { name: "Raag Bhairav", shabads: 27 },
        { name: "Raag Basant", shabads: 43 },
        { name: "Raag Sarang", shabads: 78 },
        { name: "Raag Malhar", shabads: 37 },
        { name: "Raag Kanra", shabads: 24 },
        { name: "Raag Kalyan", shabads: 28 },
        { name: "Raag Prabhati", shabads: 54 },
        { name: "Raag Jaijawanti", shabads: 4 }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA - 35 Contributors
    // ═══════════════════════════════════════════════════════════════════════════

    const CONTRIBUTORS = [
        // Gurus
        { name: "Guru Nanak Dev Ji", type: "Guru", shabads: 974, emoji: "🙏" },
        { name: "Guru Angad Dev Ji", type: "Guru", shabads: 62, emoji: "🙏" },
        { name: "Guru Amar Das Ji", type: "Guru", shabads: 907, emoji: "🙏" },
        { name: "Guru Ram Das Ji", type: "Guru", shabads: 679, emoji: "🙏" },
        { name: "Guru Arjan Dev Ji", type: "Guru", shabads: 2218, emoji: "🙏" },
        { name: "Guru Tegh Bahadur Ji", type: "Guru", shabads: 116, emoji: "🙏" },
        // Bhagats
        { name: "Bhagat Kabir Ji", type: "Bhagat", shabads: 541, emoji: "📿" },
        { name: "Bhagat Farid Ji", type: "Bhagat", shabads: 134, emoji: "📿" },
        { name: "Bhagat Namdev Ji", type: "Bhagat", shabads: 60, emoji: "📿" },
        { name: "Bhagat Ravidas Ji", type: "Bhagat", shabads: 41, emoji: "📿" },
        { name: "Bhagat Trilochan Ji", type: "Bhagat", shabads: 4, emoji: "📿" },
        { name: "Bhagat Dhanna Ji", type: "Bhagat", shabads: 4, emoji: "📿" },
        { name: "Bhagat Beni Ji", type: "Bhagat", shabads: 3, emoji: "📿" },
        { name: "Bhagat Sain Ji", type: "Bhagat", shabads: 1, emoji: "📿" },
        { name: "Bhagat Pipa Ji", type: "Bhagat", shabads: 1, emoji: "📿" },
        { name: "Bhagat Sadhna Ji", type: "Bhagat", shabads: 1, emoji: "📿" },
        { name: "Bhagat Ramanand Ji", type: "Bhagat", shabads: 1, emoji: "📿" },
        { name: "Bhagat Parmanand Ji", type: "Bhagat", shabads: 1, emoji: "📿" },
        { name: "Bhagat Surdas Ji", type: "Bhagat", shabads: 2, emoji: "📿" },
        { name: "Bhagat Jaidev Ji", type: "Bhagat", shabads: 2, emoji: "📿" },
        // Bhatts
        { name: "Bhatt Kal Sahar", type: "Bhatt", shabads: 54, emoji: "✨" },
        { name: "Bhatt Gyand", type: "Bhatt", shabads: 13, emoji: "✨" },
        { name: "Bhatt Balh", type: "Bhatt", shabads: 5, emoji: "✨" },
        { name: "Bhatt Bhalh", type: "Bhatt", shabads: 1, emoji: "✨" },
        { name: "Bhatt Bhika", type: "Bhatt", shabads: 2, emoji: "✨" },
        { name: "Bhatt Harbans", type: "Bhatt", shabads: 2, emoji: "✨" },
        { name: "Bhatt Jalap", type: "Bhatt", shabads: 4, emoji: "✨" },
        { name: "Bhatt Kirat", type: "Bhatt", shabads: 8, emoji: "✨" },
        { name: "Bhatt Mathura", type: "Bhatt", shabads: 14, emoji: "✨" },
        { name: "Bhatt Nalh", type: "Bhatt", shabads: 16, emoji: "✨" },
        { name: "Bhatt Salh", type: "Bhatt", shabads: 3, emoji: "✨" },
        // Sikhs
        { name: "Bhai Mardana Ji", type: "Sikh", shabads: 3, emoji: "🎵" },
        { name: "Bhai Satta Ji", type: "Sikh", shabads: 1, emoji: "🎵" },
        { name: "Bhai Balwand Ji", type: "Sikh", shabads: 1, emoji: "🎵" },
        { name: "Bhai Sundar Ji", type: "Sikh", shabads: 6, emoji: "🎵" }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA - Spiritual Themes
    // ═══════════════════════════════════════════════════════════════════════════

    const THEMES = [
        { title: "Divine Love (Prem)", emoji: "💕", desc: "The profound spiritual love between the soul and Waheguru. Gurbani teaches that true love transcends attachment and ego, leading to union with the Divine." },
        { title: "Devotion (Bhakti)", emoji: "🙏", desc: "Complete surrender and dedication to the One. Through naam simran, kirtan, and seva, devotees cultivate unwavering faith and connection with Waheguru." },
        { title: "Divine Wisdom (Gyan)", emoji: "💎", desc: "Spiritual knowledge that illuminates the path to liberation. The Guru's teachings reveal the nature of reality, the self, and the purpose of human life." },
        { title: "Humility (Nimrata)", emoji: "🪷", desc: "The foundation of all virtues. Gurbani emphasizes that true greatness lies in humility, serving others, and recognizing the Divine in all beings." },
        { title: "Contentment (Santokh)", emoji: "☮️", desc: "Finding peace in whatever Waheguru provides. Contentment frees the mind from endless desires and brings inner tranquility." },
        { title: "Compassion (Daya)", emoji: "❤️", desc: "Kindness and care for all creation. Sikhs are taught to see Waheguru in every being and act with compassion towards all." },
        { title: "Truth (Sat)", emoji: "✨", desc: "Living in alignment with divine truth. Truthfulness in thought, word, and deed is essential to spiritual growth and liberation." },
        { title: "Detachment (Vairag)", emoji: "🕊️", desc: "Freedom from worldly attachments while living in the world. The householder's path of spirituality embraces life while remaining unattached." }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA - Historical Context (Multi-language)
    // ═══════════════════════════════════════════════════════════════════════════

    const HISTORY = {
        en: `<h3>The Origin of Sri Guru Granth Sahib Ji</h3>
<p>Sri Guru Granth Sahib Ji is the central religious scripture of Sikhism, regarded by Sikhs as the final, sovereign, and eternal living Guru. It is a voluminous text of 1430 pages, compiled and composed during the period of Sikh Gurus, from 1469 to 1708.</p>

<h3>Compilation by Guru Arjan Dev Ji (1604)</h3>
<p>The first version was compiled by Guru Arjan Dev Ji, the fifth Sikh Guru, in 1604 at Amritsar. He collected hymns of the first four Gurus along with various saints and poets (Bhagats) whose writings were consistent with Sikh philosophy. This original version was called the Adi Granth.</p>

<h3>Completion by Guru Gobind Singh Ji (1708)</h3>
<p>Guru Gobind Singh Ji, the tenth Guru, added hymns of Guru Tegh Bahadur Ji (ninth Guru) and finalized the sacred text in 1708. Before his passing, he declared that there would be no more human Gurus and that the Sikhs should regard the Granth as their eternal Guru.</p>

<h3>Language and Structure</h3>
<p>The hymns are written in various languages including Punjabi, Hindi, Sanskrit, Persian, and regional dialects, using the Gurmukhi script. The text is organized by raag (musical mode) rather than by author, emphasizing the musical nature of the compositions.</p>

<h3>Respect and Reverence</h3>
<p>Sri Guru Granth Sahib Ji is treated with the utmost respect. It is placed on a raised platform (Manji Sahib), covered with beautiful cloths, and attended by a granthi who waves a chaur (ceremonial fan) over it. The eternal light (Jot) is kept burning nearby.</p>`,

        pa: `<h3>ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਦਾ ਇਤਿਹਾਸ</h3>
<p>ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਸਿੱਖ ਧਰਮ ਦਾ ਕੇਂਦਰੀ ਧਾਰਮਿਕ ਗ੍ਰੰਥ ਹੈ, ਜਿਸਨੂੰ ਸਿੱਖ ਅੰਤਿਮ, ਸਰਬੱਤ ਅਤੇ ਸਦੀਵੀ ਜੀਵਿਤ ਗੁਰੂ ਮੰਨਦੇ ਹਨ। ਇਹ 1430 ਪੰਨਿਆਂ ਦਾ ਵਿਸ਼ਾਲ ਗ੍ਰੰਥ ਹੈ।</p>

<h3>ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ ਦੁਆਰਾ ਸੰਕਲਨ (1604)</h3>
<p>ਪਹਿਲਾ ਸੰਸਕਰਣ ਪੰਜਵੇਂ ਸਿੱਖ ਗੁਰੂ, ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ ਨੇ 1604 ਵਿੱਚ ਅੰਮ੍ਰਿਤਸਰ ਵਿਖੇ ਸੰਕਲਿਤ ਕੀਤਾ। ਉਹਨਾਂ ਨੇ ਪਹਿਲੇ ਚਾਰ ਗੁਰੂਆਂ ਅਤੇ ਵੱਖ-ਵੱਖ ਸੰਤਾਂ ਅਤੇ ਭਗਤਾਂ ਦੀ ਬਾਣੀ ਇਕੱਠੀ ਕੀਤੀ।</p>

<h3>ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ ਦੁਆਰਾ ਮੁਕੰਮਲ (1708)</h3>
<p>ਦਸਵੇਂ ਗੁਰੂ, ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ ਨੇ ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਜੀ ਦੀ ਬਾਣੀ ਸ਼ਾਮਲ ਕੀਤੀ ਅਤੇ 1708 ਵਿੱਚ ਪਵਿੱਤਰ ਗ੍ਰੰਥ ਨੂੰ ਮੁਕੰਮਲ ਕੀਤਾ। ਉਹਨਾਂ ਨੇ ਐਲਾਨ ਕੀਤਾ ਕਿ ਅੱਗੇ ਤੋਂ ਕੋਈ ਦੇਹਧਾਰੀ ਗੁਰੂ ਨਹੀਂ ਹੋਵੇਗਾ।</p>

<h3>ਭਾਸ਼ਾ ਅਤੇ ਬਣਤਰ</h3>
<p>ਬਾਣੀ ਪੰਜਾਬੀ, ਹਿੰਦੀ, ਸੰਸਕ੍ਰਿਤ, ਫ਼ਾਰਸੀ ਅਤੇ ਖੇਤਰੀ ਬੋਲੀਆਂ ਵਿੱਚ ਗੁਰਮੁਖੀ ਲਿਪੀ ਵਿੱਚ ਲਿਖੀ ਗਈ ਹੈ।</p>`,

        hi: `<h3>श्री गुरु ग्रंथ साहिब जी का इतिहास</h3>
<p>श्री गुरु ग्रंथ साहिब जी सिख धर्म का केंद्रीय धार्मिक ग्रंथ है, जिसे सिख अंतिम, संप्रभु और शाश्वत जीवित गुरु मानते हैं। यह 1430 पृष्ठों का विशाल ग्रंथ है।</p>

<h3>गुरु अर्जन देव जी द्वारा संकलन (1604)</h3>
<p>पहला संस्करण पांचवें सिख गुरु, गुरु अर्जन देव जी ने 1604 में अमृतसर में संकलित किया। उन्होंने पहले चार गुरुओं और विभिन्न संतों और भक्तों की बाणी एकत्र की।</p>

<h3>गुरु गोबिंद सिंह जी द्वारा पूर्ण (1708)</h3>
<p>दसवें गुरु, गुरु गोबिंद सिंह जी ने गुरु तेग बहादुर जी की बाणी जोड़ी और 1708 में पवित्र ग्रंथ को पूर्ण किया। उन्होंने घोषणा की कि अब कोई देहधारी गुरु नहीं होगा।</p>

<h3>भाषा और संरचना</h3>
<p>बाणी पंजाबी, हिंदी, संस्कृत, फारसी और क्षेत्रीय भाषाओं में गुरमुखी लिपि में लिखी गई है।</p>`
    };

    // Sample inspirational quotes from Gurbani
    const inspirationalQuotes = [
        {
            gurmukhi: "ਸਤਿਗੁਰ ਕੀ ਜਿਸ ਨੋ ਮਤਿ ਆਵੈ ਸੋ ਸਤਿਗੁਰ ਮਾਹਿ ਸਮਾਨਾ ॥",
            translation: "One who is blessed with the Teachings of the True Guru, merges in the True Guru.",
            ang: 797
        },
        {
            gurmukhi: "ਜੋ ਤਿਸੁ ਭਾਵੈ ਸੋ ਥੀਐ ਹੁਕਮਿ ਰਜਾਈ ਚਲਣਾ ॥",
            translation: "Whatever pleases Him comes to pass. Accept His Will, O brothers.",
            ang: 1
        },
        {
            gurmukhi: "ਨਾਨਕ ਨਾਮੁ ਮਿਲੈ ਤਾਂ ਜੀਵਾਂ ਤਨੁ ਮਨੁ ਥੀਵੈ ਹਰਿਆ ॥",
            translation: "O Nanak, if I receive the Naam, I live; my body and mind blossom forth.",
            ang: 660
        },
        {
            gurmukhi: "ਸਭੁ ਕਿਛੁ ਘਰ ਮਹਿ ਬਾਹਰਿ ਨਾਹੀ ॥ ਬਾਹਰਿ ਟੋਲੈ ਸੋ ਭਰਮਿ ਭੁਲਾਹੀ ॥",
            translation: "Everything is within the home of your own self; there is nothing beyond. One who searches outside is deluded by doubt.",
            ang: 102
        },
        {
            gurmukhi: "ਭੈ ਕਾਹੂ ਕਉ ਦੇਤ ਨਹਿ ਨਹਿ ਭੈ ਮਾਨਤ ਆਨ ॥",
            translation: "One who does not frighten anyone, and who is not afraid of anyone else - say, he is truly wise.",
            ang: 1427
        },
        {
            gurmukhi: "ਮਨ ਤੂੰ ਜੋਤਿ ਸਰੂਪੁ ਹੈ ਆਪਣਾ ਮੂਲੁ ਪਛਾਣੁ ॥",
            translation: "O my mind, you are the embodiment of the Divine Light - recognize your own origin.",
            ang: 441
        }
    ];

    // Current language state
    let currentLang = 'en';

    // ═══════════════════════════════════════════════════════════════════════════
    // MODAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function openModal(type) {
        const modal = document.getElementById('insightModal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');
        const langSwitch = document.getElementById('langSwitch');

        // Hide language switch by default
        langSwitch.style.display = 'none';

        switch (type) {
            case 'raags':
                title.textContent = '🎵 31 Classical Raags';
                body.innerHTML = renderRaags();
                break;
            case 'composers':
                title.textContent = '📝 35 Contributors';
                body.innerHTML = renderContributors();
                break;
            case 'themes':
                title.textContent = '💎 Spiritual Themes';
                body.innerHTML = renderThemes();
                break;
            case 'history':
                title.textContent = '📜 Historical Context';
                langSwitch.style.display = 'flex';
                body.innerHTML = renderHistory(currentLang);
                setupLangSwitch();
                break;
        }

        modal.classList.add('insight-modal--active');
        document.body.style.overflow = 'hidden';
    }

    window.closeModal = function () {
        const modal = document.getElementById('insightModal');
        modal.classList.remove('insight-modal--active');
        document.body.style.overflow = '';
    };

    function renderRaags() {
        return `<div class="modal-list">
            ${RAAGS.map(raag => `
                <div class="modal-list-item">
                    <div>
                        <div class="modal-list-item__name">🎵 ${raag.name}</div>
                    </div>
                    <span class="modal-list-item__count">${raag.shabads} shabads</span>
                </div>
            `).join('')}
        </div>`;
    }

    function renderContributors() {
        const groups = {
            'Guru': CONTRIBUTORS.filter(c => c.type === 'Guru'),
            'Bhagat': CONTRIBUTORS.filter(c => c.type === 'Bhagat'),
            'Bhatt': CONTRIBUTORS.filter(c => c.type === 'Bhatt'),
            'Sikh': CONTRIBUTORS.filter(c => c.type === 'Sikh')
        };

        return Object.entries(groups).map(([type, items]) => `
            <h4 style="margin: 16px 0 8px; color: var(--gold-400);">${type === 'Guru' ? '🙏 Gurus' : type === 'Bhagat' ? '📿 Bhagats' : type === 'Bhatt' ? '✨ Bhatts' : '🎵 Sikhs'}</h4>
            <div class="modal-list">
                ${items.map(c => `
                    <div class="modal-list-item">
                        <div>
                            <div class="modal-list-item__name">${c.emoji} ${c.name}</div>
                            <div class="modal-list-item__info">${c.type}</div>
                        </div>
                        <span class="modal-list-item__count">${c.shabads}</span>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    function renderThemes() {
        return THEMES.map(theme => `
            <div class="theme-card">
                <div class="theme-card__title">${theme.emoji} ${theme.title}</div>
                <div class="theme-card__desc">${theme.desc}</div>
            </div>
        `).join('');
    }

    function renderHistory(lang) {
        return `<div class="history-content">${HISTORY[lang]}</div>`;
    }

    function setupLangSwitch() {
        const buttons = document.querySelectorAll('.lang-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('lang-btn--active'));
                btn.classList.add('lang-btn--active');
                currentLang = btn.dataset.lang;
                document.getElementById('modalBody').innerHTML = renderHistory(currentLang);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TOPIC CARD SETUP
    // ═══════════════════════════════════════════════════════════════════════════

    function setupTopicCards() {
        const topicCards = document.querySelectorAll('.topic-card');
        topicCards.forEach(card => {
            card.addEventListener('click', () => {
                const topic = card.dataset.topic;
                if (topic) {
                    openModal(topic);
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // THEME TOGGLE
    // ═══════════════════════════════════════════════════════════════════════════

    function setupThemeToggle() {
        const themeBtn = document.getElementById('themeToggleBtn');
        const themeIcon = document.getElementById('themeIcon');

        if (!themeBtn || !themeIcon) return;

        function updateIcon() {
            const isDark = document.documentElement.classList.contains('dark-mode');
            themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }

        updateIcon();

        themeBtn.addEventListener('click', () => {
            if (window.AnhadTheme && typeof window.AnhadTheme.toggle === 'function') {
                window.AnhadTheme.toggle();
            } else {
                document.documentElement.classList.toggle('dark-mode');
                localStorage.setItem('anhad_theme',
                    document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light');
            }
            updateIcon();
        });

        window.addEventListener('themechange', updateIcon);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INSPIRATIONAL QUOTES
    // ═══════════════════════════════════════════════════════════════════════════

    function loadRandomQuote() {
        const quote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];

        const textEl = document.querySelector('.inspiration-quote__text');
        const translationEl = document.querySelector('.inspiration-quote__translation');
        const metaEl = document.querySelector('.inspiration-meta span');

        if (textEl) textEl.textContent = quote.gurmukhi;
        if (translationEl) translationEl.textContent = quote.translation;
        if (metaEl) metaEl.innerHTML = `<i class="fas fa-book-open"></i> Ang ${quote.ang}`;
    }

    function setupQuoteRefresh() {
        const refreshBtn = document.getElementById('refreshInspirationBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                refreshBtn.querySelector('i').style.transform = 'rotate(360deg)';
                refreshBtn.querySelector('i').style.transition = 'transform 0.3s ease';
                setTimeout(() => {
                    refreshBtn.querySelector('i').style.transform = 'rotate(0deg)';
                }, 300);
                loadRandomQuote();
            });
        }
    }

    function setupShareQuote() {
        const shareBtn = document.getElementById('shareQuoteBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                const text = document.querySelector('.inspiration-quote__text')?.textContent || '';
                const translation = document.querySelector('.inspiration-quote__translation')?.textContent || '';

                const shareText = `"${text}"\n\n${translation}\n\n— Sri Guru Granth Sahib Ji`;

                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'Gurbani Inspiration',
                            text: shareText
                        });
                    } catch (e) {
                        console.log('Share cancelled');
                    }
                } else {
                    try {
                        await navigator.clipboard.writeText(shareText);
                        showToast('Quote copied to clipboard!');
                    } catch (e) {
                        console.log('Could not copy');
                    }
                }
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUICK STATS
    // ═══════════════════════════════════════════════════════════════════════════

    function loadQuickStats() {
        let stats = {};
        let streak = {};

        try {
            stats = JSON.parse(localStorage.getItem('anhad_user_stats') || '{}');
            streak = JSON.parse(localStorage.getItem('anhad_streak_data') || '{}');
        } catch (e) {
            console.warn('Error loading stats:', e);
        }

        const totalMinutes = stats.totalListeningMinutes || 0;
        const totalDays = stats.totalDaysActive || 1;
        const weeklyHours = Math.round((totalMinutes / Math.max(totalDays, 7)) * 7 / 60 * 10) / 10;

        const totalPages = stats.totalPagesRead || 0;
        const weeklyAngs = Math.round((totalPages / Math.max(totalDays, 7)) * 7);

        const currentStreak = streak.currentStreak || 0;

        const weeklyListeningEl = document.getElementById('weeklyListening');
        const weeklyAngsEl = document.getElementById('weeklyAngs');
        const streakEl = document.getElementById('currentStreak');

        if (weeklyListeningEl) weeklyListeningEl.textContent = weeklyHours;
        if (weeklyAngsEl) weeklyAngsEl.textContent = weeklyAngs;
        if (streakEl) streakEl.textContent = currentStreak;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHABAD CARDS
    // ═══════════════════════════════════════════════════════════════════════════

    function setupShabadCards() {
        const shabadCards = document.querySelectorAll('.shabad-card');

        shabadCards.forEach(card => {
            card.addEventListener('click', () => {
                const ang = card.dataset.ang;
                if (ang) {
                    window.location.href = `../SehajPaath/reader.html?ang=${ang}&source=insight`;
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════

    function setupNavigation() {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = '../index.html';
                }
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TOAST
    // ═══════════════════════════════════════════════════════════════════════════

    function showToast(message) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 24px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';

        setTimeout(() => {
            toast.style.opacity = '0';
        }, 2000);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        console.log('💡 ANHAD Insights Page initializing (Enhanced)...');

        setupNavigation();
        setupThemeToggle();
        loadRandomQuote();
        setupQuoteRefresh();
        setupShareQuote();
        loadQuickStats();
        setupShabadCards();
        setupTopicCards();

        console.log('✅ Insights page loaded successfully');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
