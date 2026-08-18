/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD Learning & Library — Premium Knowledge Hub
 * Famous for Gursikhi Knowledge
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA LOADING FROM JSON FILES
    // ═══════════════════════════════════════════════════════════════════════════

    let RAAGS = [];
    let CONTRIBUTORS = [];
    let THEMES = [];
    let GURU_SAHIBAAN = [];
    let SAKHIS = [];
    let SIKH_HISTORY = {};

    function getJsonDataUrl(filename) {
        const path = window.location.pathname.toLowerCase();
        const inInsightsDir = path.includes('/insights');
        return inInsightsDir ? `./data/${filename}` : `Insights/data/${filename}`;
    }

    async function loadJsonData() {
        if (RAAGS.length > 0) return; // Already cached
        try {
            const [raagsRes, composersRes, themesRes, guruSahibaanRes, sakhisRes, historyRes] = await Promise.all([
                fetch(getJsonDataUrl('raags.json')),
                fetch(getJsonDataUrl('composers.json')),
                fetch(getJsonDataUrl('spiritual-themes.json')),
                fetch(getJsonDataUrl('guru-sahibaan.json')),
                fetch(getJsonDataUrl('sakhis.json')),
                fetch(getJsonDataUrl('sikh-history.json'))
            ]);

            const raagsData = await raagsRes.json();
            const composersData = await composersRes.json();
            const themesData = await themesRes.json();
            const guruSahibaanData = await guruSahibaanRes.json();
            const sakhisData = await sakhisRes.json();
            const historyData = await historyRes.json();

            RAAGS = raagsData.raags || [];
            CONTRIBUTORS = composersData.composers || [];
            THEMES = themesData.themes || [];
            GURU_SAHIBAAN = guruSahibaanData.guruSahibaan?.en?.gurus || [];
            SAKHIS = sakhisData.sakhis || [];
            SIKH_HISTORY = historyData.sections || {};
        } catch (error) {
            console.error('Error loading JSON data:', error);
            // Fallback to basic data if JSON fails to load
            RAAGS = [
                { name: "Sri Raag", shabads: 158 }, { name: "Raag Maajh", shabads: 173 },
                { name: "Raag Gauri", shabads: 347 }, { name: "Raag Aasa", shabads: 435 },
                { name: "Raag Gujri", shabads: 78 }, { name: "Raag Devgandhari", shabads: 51 },
                { name: "Raag Bihagra", shabads: 47 }, { name: "Raag Wadhans", shabads: 92 },
                { name: "Raag Sorath", shabads: 164 }, { name: "Raag Dhanasri", shabads: 111 },
                { name: "Raag Jaitsri", shabads: 48 }, { name: "Raag Todi", shabads: 43 },
                { name: "Raag Bairari", shabads: 16 }, { name: "Raag Tilang", shabads: 38 },
                { name: "Raag Suhi", shabads: 128 }, { name: "Raag Bilawal", shabads: 135 },
                { name: "Raag Gond", shabads: 60 }, { name: "Raag Ramkali", shabads: 120 },
                { name: "Raag Nat Narain", shabads: 44 }, { name: "Raag Mali Gaura", shabads: 15 },
                { name: "Raag Maru", shabads: 175 }, { name: "Raag Tukhari", shabads: 21 },
                { name: "Raag Kedara", shabads: 19 }, { name: "Raag Bhairav", shabads: 27 },
                { name: "Raag Basant", shabads: 43 }, { name: "Raag Sarang", shabads: 78 },
                { name: "Raag Malhar", shabads: 37 }, { name: "Raag Kanra", shabads: 24 },
                { name: "Raag Kalyan", shabads: 28 }, { name: "Raag Prabhati", shabads: 54 },
                { name: "Raag Jaijawanti", shabads: 4 }
            ];
            CONTRIBUTORS = [
                { name: "Guru Nanak Dev Ji", type: "Guru", shabads: 974, emoji: "🙏" },
                { name: "Guru Angad Dev Ji", type: "Guru", shabads: 62, emoji: "🙏" },
                { name: "Guru Amar Das Ji", type: "Guru", shabads: 907, emoji: "🙏" },
                { name: "Guru Ram Das Ji", type: "Guru", shabads: 679, emoji: "🙏" },
                { name: "Guru Arjan Dev Ji", type: "Guru", shabads: 2218, emoji: "🙏" },
                { name: "Guru Tegh Bahadur Ji", type: "Guru", shabads: 116, emoji: "🙏" },
                { name: "Bhagat Kabir Ji", type: "Bhagat", shabads: 541, emoji: "📿" },
                { name: "Bhagat Namdev Ji", type: "Bhagat", shabads: 60, emoji: "📿" },
                { name: "Bhagat Ravidas Ji", type: "Bhagat", shabads: 41, emoji: "📿" },
                { name: "Bhagat Farid Ji", type: "Bhagat", shabads: 134, emoji: "📿" },
                { name: "Bhagat Ramanand Ji", type: "Bhagat", shabads: 1, emoji: "📿" },
                { name: "Bhagat Beni Ji", type: "Bhagat", shabads: 3, emoji: "📿" },
                { name: "Bhagat Dhanna Ji", type: "Bhagat", shabads: 4, emoji: "📿" },
                { name: "Bhagat Jaidev Ji", type: "Bhagat", shabads: 2, emoji: "📿" },
                { name: "Bhagat Bhikhan Ji", type: "Bhagat", shabads: 2, emoji: "📿" },
                { name: "Bhagat Trilochan Ji", type: "Bhagat", shabads: 4, emoji: "📿" },
                { name: "Bhagat Parmanand Ji", type: "Bhagat", shabads: 1, emoji: "📿" },
                { name: "Bhagat Surdas Ji", type: "Bhagat", shabads: 2, emoji: "📿" },
                { name: "Bhagat Sain Ji", type: "Bhagat", shabads: 1, emoji: "📿" },
                { name: "Bhagat Pipa Ji", type: "Bhagat", shabads: 1, emoji: "📿" },
                { name: "Bhagat Sadhna Ji", type: "Bhagat", shabads: 1, emoji: "📿" },
                { name: "Bhatt Kalshar Ji", type: "Bhatt", shabads: 54, emoji: "✨" },
                { name: "Bhatt Balh Ji", type: "Bhatt", shabads: 5, emoji: "✨" },
                { name: "Bhatt Bhalh Ji", type: "Bhatt", shabads: 1, emoji: "✨" },
                { name: "Bhatt Bhikha Ji", type: "Bhatt", shabads: 2, emoji: "✨" },
                { name: "Bhatt Gayand Ji", type: "Bhatt", shabads: 13, emoji: "✨" },
                { name: "Bhatt Harbans Ji", type: "Bhatt", shabads: 2, emoji: "✨" },
                { name: "Bhatt Jalap Ji", type: "Bhatt", shabads: 5, emoji: "✨" },
                { name: "Bhatt Kirat Ji", type: "Bhatt", shabads: 8, emoji: "✨" },
                { name: "Bhatt Mathura Ji", type: "Bhatt", shabads: 14, emoji: "✨" },
                { name: "Bhatt Nalh Ji", type: "Bhatt", shabads: 16, emoji: "✨" },
                { name: "Bhatt Salh Ji", type: "Bhatt", shabads: 3, emoji: "✨" },
                { name: "Bhai Mardana Ji", type: "Sikh", shabads: 3, emoji: "🎵" },
                { name: "Bhai Satta Ji", type: "Sikh", shabads: 1, emoji: "🎵" },
                { name: "Bhai Balwand Ji", type: "Sikh", shabads: 1, emoji: "🎵" }
            ];
            THEMES = [
                { title: "Divine Love", titlePa: "ਪ੍ਰੇਮ", titleHi: "प्रेम", emoji: "💕", desc: "The profound spiritual love between the soul and Waheguru. True love transcends attachment and ego." },
                { title: "Devotion", titlePa: "ਭਗਤੀ", titleHi: "भक्ति", emoji: "🙏", desc: "Complete surrender to the One through naam simran, kirtan, and seva." },
                { title: "Divine Wisdom", titlePa: "ਗਿਆਨ", titleHi: "ज्ञान", emoji: "💎", desc: "Spiritual knowledge that reveals the nature of reality and the soul." },
                { title: "Humility", titlePa: "ਨਿਮਰਤਾ", titleHi: "नम्रता", emoji: "🪷", desc: "The foundation of all virtues. True greatness lies in serving others." },
                { title: "Contentment", titlePa: "ਸੰਤੋਖ", titleHi: "संतोष", emoji: "☮️", desc: "Finding peace in Waheguru's will. Freedom from endless desires." },
                { title: "Compassion", titlePa: "ਦਇਆ", titleHi: "दया", emoji: "❤️", desc: "Kindness and care for all creation. Seeing Waheguru in every being." },
                { title: "Truth", titlePa: "ਸੱਚ", titleHi: "सत्य", emoji: "✨", desc: "Living in truthfulness of thought, word, and deed." },
                { title: "Detachment", titlePa: "ਵੈਰਾਗ", titleHi: "वैराग्य", emoji: "🕊️", desc: "Freedom from worldly attachments while living in the world." }
            ];
            GURU_SAHIBAAN = [
                {
                    name: "ਸ੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ",
                    namePunjabi: "ਸ੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ",
                    english: "Sri Guru Nanak Dev Ji",
                    years: "1469–1539",
                    majorContributions: "Founder of Sikhism. Traveled extensively on four major Udasis (spiritual journeys) spanning thousands of miles to spread the message of one God. Established the institution of Langar (free community kitchen) and Kartarpur Sahib.",
                    majorContributionsPa: "ਸਿੱਖ ਧਰਮ ਦੇ ਸੰਸਥਾਪਕ। ਇੱਕ ਪ੍ਰਮਾਤਮਾ ਦਾ ਸੰਦੇਸ਼ ਫੈਲਾਉਣ ਲਈ ਚਾਰ ਵੱਡੀਆਂ ਉਦਾਸੀਆਂ (ਰੂਹਾਨੀ ਯਾਤਰਾਵਾਂ) ਕੀਤੀਆਂ। ਕਰਤਾਰਪੁਰ ਸਾਹਿਬ ਦੀ ਸਥਾਪਨਾ ਕੀਤੀ ਅਤੇ ਸਾਂਝੇ ਲੰਗਰ ਪ੍ਰਥਾ ਦੀ ਸ਼ੁਰੂਆਤ ਕੀਤੀ।",
                    keyTeachings: "Three pillars of Sikhism: Kirat Karo (honest living), Naam Japna (remembering God), and Vand Chhako (sharing with others). Preached equality of all, regardless of caste, gender, or status.",
                    keyTeachingsPa: "ਤਿੰਨ ਮੂਲ ਸਿਧਾਂਤ: ਕਿਰਤ ਕਰੋ (ਈਮਾਨਦਾਰੀ ਨਾਲ ਕੰਮ), ਨਾਮ ਜਪੋ (ਪ੍ਰਮਾਤਮਾ ਦਾ ਸਿਮਰਨ), ਅਤੇ ਵੰਡ ਛਕੋ (ਲੋੜਵੰਦਾਂ ਨਾਲ ਸਾਂਝਾ ਕਰਨਾ)। ਜਾਤ-ਪਾਤ ਅਤੇ ਲਿੰਗ ਭੇਦਭਾਵ ਤੋਂ ਉੱਪਰ ਉੱਠ ਕੇ ਬਰਾਬਰੀ ਦਾ ਸੰਦੇਸ਼ ਦਿੱਤਾ।"
                },
                {
                    name: "ਸ੍ਰੀ ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ",
                    namePunjabi: "ਸ੍ਰੀ ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ",
                    english: "Sri Guru Angad Dev Ji",
                    years: "1504–1552",
                    majorContributions: "Standardized and formalized the Gurmukhi script, making spiritual writings accessible to the common people. Established new schools, promoted physical fitness by starting Mall Akhara (wrestling arenas), and collected Guru Nanak Dev Ji's life stories (Sakhis).",
                    majorContributionsPa: "ਗੁਰਮੁਖੀ ਲਿਪੀ ਨੂੰ ਸੁਧਾਰਿਆ ਅਤੇ ਮਿਆਰੀ ਬਣਾਇਆ, ਜਿਸ ਨਾਲ ਆਮ ਲੋਕਾਂ ਲਈ ਵਿੱਦਿਆ ਅਤੇ ਬਾਣੀ ਦਾ ਮਾਰਗ ਖੁੱਲ੍ਹਿਆ। ਮੱਲ ਅਖਾੜਿਆਂ ਦੀ ਸਥਾਪਨਾ ਕਰਕੇ ਸਰੀਰਕ ਤੰਦਰੁਸਤੀ ਨੂੰ ਉਤਸ਼ਾਹਿਤ ਕੀਤਾ ਅਤੇ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਦੇ ਜੀਵਨ ਦੀਆਂ ਸਾਖੀਆਂ ਇਕੱਤਰ ਕੀਤੀਆਂ।",
                    keyTeachings: "Emphasized selfless service (Seva), absolute devotion to the Guru's word, and the importance of physical, mental, and spiritual wellness.",
                    keyTeachingsPa: "ਨਿਸ਼ਕਾਮ ਸੇਵਾ (ਸੇਵਾ), ਗੁਰੂ ਦੇ ਸ਼ਬਦ ਪ੍ਰਤੀ ਪੂਰਨ ਸਮਰਪਣ, ਅਤੇ ਸਰੀਰਕ, ਮਾਨਸਿਕ ਅਤੇ ਰੂਹਾਨੀ ਤੰਦਰੁਸਤੀ ਦੀ ਮਹੱਤਤਾ 'ਤੇ ਜ਼ੋਰ ਦਿੱਤਾ।"
                },
                {
                    name: "ਸ੍ਰੀ ਗੁਰੂ ਅਮਰ ਦਾਸ ਜੀ",
                    namePunjabi: "ਸ੍ਰੀ ਗੁਰੂ ਅਮਰ ਦਾਸ ਜੀ",
                    english: "Sri Guru Amar Das Ji",
                    years: "1479–1574",
                    majorContributions: "Established the 'Manji' and 'Piri' systems of administrative organization to spread the Guru's teachings across India. Greatly expanded the Langar system, making it mandatory to eat together ('Pangat') before meeting the Guru ('Sangat'), and campaigned against social evils like Sati and Purdah.",
                    majorContributionsPa: "ਗੁਰੂ ਸਾਹਿਬ ਦੇ ਸੰਦੇਸ਼ ਨੂੰ ਦੂਰ-ਦੂਰ ਤੱਕ ਪਹੁੰਚਾਉਣ ਲਈ 22 ਮੰਜੀਆਂ ਅਤੇ ਪੀੜੀਆਂ ਦੀ ਪ੍ਰਸ਼ਾਸਕੀ ਪ੍ਰਣਾਲੀ ਸਥਾਪਤ ਕੀਤੀ। ਲੰਗਰ ਪ੍ਰਥਾ ਦਾ ਵਿਸਥਾਰ ਕੀਤਾ ('ਪਹਿਲਾਂ ਪੰਗਤ ਪਾਛੇ ਸੰਗਤ') ਅਤੇ ਸਤੀ ਪ੍ਰਥਾ ਤੇ ਪਰਦਾ ਪ੍ਰਥਾ ਵਰਗੀਆਂ ਸਮਾਜਿਕ ਬੁਰਾਈਆਂ ਵਿਰੁੱਧ ਆਵਾਜ਼ ਬੁਲੰਦ ਕੀਤੀ।",
                    keyTeachings: "Advocated for social equality, women's empowerment, spiritual devotion, and community service. Taught that the true path to God is humility.",
                    keyTeachingsPa: "ਸਮਾਜਿਕ ਬਰਾਬਰੀ, ਇਸਤਰੀ ਸ਼ਕਤੀਕਰਨ, ਨਿਸ਼ਕਾਮ ਸੇਵਾ ਅਤੇ ਰੂਹਾਨੀ ਭਗਤੀ ਦੀ ਵਕਾਲਤ ਕੀਤੀ। ਸਿਖਾਇਆ ਕਿ ਪ੍ਰਮਾਤਮਾ ਨੂੰ ਪਾਉਣ ਦਾ ਸੱਚਾ ਮਾਰਗ ਨਿਮਰਤਾ ਹੈ।"
                },
                {
                    name: "ਸ੍ਰੀ ਗੁਰੂ ਰਾਮ ਦਾਸ ਜੀ",
                    namePunjabi: "ਸ੍ਰੀ ਗੁਰੂ ਰਾਮ ਦਾਸ ਜੀ",
                    english: "Sri Guru Ram Das Ji",
                    years: "1534–1581",
                    majorContributions: "Founded the holy city of Amritsar (originally Ramdaspur) and designed the sacred pool (Sarovar). Composed the 'Laavan' (wedding hymns) which form the core of the Sikh marriage ceremony (Anand Karaj).",
                    majorContributionsPa: "ਪਵਿੱਤਰ ਸ਼ਹਿਰ ਸ਼੍ਰੀ ਅੰਮ੍ਰਿਤਸਰ ਸਾਹਿਬ (ਰਾਮਦਾਸਪੁਰ) ਦੀ ਸਥਾਪਨਾ ਕੀਤੀ ਅਤੇ ਪਵਿੱਤਰ ਸਰੋਵਰ ਦੀ ਖੁਦਾਈ ਕਰਵਾਈ। 'ਲਾਵਾਂ' ਦੀ ਰਚਨਾ ਕੀਤੀ ਜੋ ਸਿੱਖ ਵਿਆਹ ਕਾਰਜ (ਅਨੰਦ ਕਾਰਜ) ਦਾ ਕੇਂਦਰੀ ਹਿੱਸਾ ਹਨ।",
                    keyTeachings: "Taught the importance of daily spiritual discipline, selfless service, building a strong community, and seeking refuge in the holy congregation (Sangat).",
                    keyTeachingsPa: "ਰੋਜ਼ਾਨਾ ਨਿਤਨੇਮ ਦੀ ਰੂਹਾਨੀ ਅਨੁਸ਼ਾਸਨ, ਨਿਸ਼ਕਾਮ ਸੇਵਾ, ਇੱਕ ਮਜ਼ਬੂਤ ਸਮਾਜ ਦੀ ਸਿਰਜਣਾ, ਅਤੇ ਸਾਧ ਸੰਗਤ ਵਿੱਚ ਓਟ ਲੈਣ ਦੀ ਮਹੱਤਤਾ ਸਿਖਾਈ।"
                },
                {
                    name: "ਸ੍ਰੀ ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ",
                    namePunjabi: "ਸ੍ਰੀ ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ",
                    english: "Sri Guru Arjan Dev Ji",
                    years: "1563–1606",
                    majorContributions: "Compiled the first official Sikh scripture, the Adi Granth (later Guru Granth Sahib Ji), and installed it at Sri Harmandir Sahib (Golden Temple), which he designed and constructed. Became the first martyr in Sikh history, standing firm against religious persecution.",
                    majorContributionsPa: "ਪਹਿਲੇ ਪਵਿੱਤਰ ਗ੍ਰੰਥ 'ਆਦਿ ਗ੍ਰੰਥ' (ਸ਼੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ) ਦਾ ਸੰਕਲਨ ਕੀਤਾ ਅਤੇ ਸ਼੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਦੀ ਸਿਰਜਣਾ ਕਰਕੇ ਇਸ ਦਾ ਪ੍ਰਕਾਸ਼ ਕੀਤਾ। ਸਿੱਖ ਇਤਿਹਾਸ ਦੇ ਪਹਿਲੇ ਸ਼ਹੀਦ ਬਣੇ ਅਤੇ ਧਾਰਮਿਕ ਅਜ਼ਾਦੀ ਲਈ ਆਪਣੀ ਸ਼ਹੀਦੀ ਦਿੱਤੀ।",
                    keyTeachings: "Exemplified peaceful resistance, supreme sacrifice, devotion, and acceptance of the Divine Will (Bhana). Composed the blissful 'Sukhmani Sahib' (Prayer of Peace).",
                    keyTeachingsPa: "ਸ਼ਾਂਤਮਈ ਪ੍ਰਤੀਰੋਧ, ਪਰਮ ਕੁਰਬਾਨੀ, ਅਟੁੱਟ ਭਗਤੀ ਅਤੇ ਪ੍ਰਮਾਤਮਾ ਦੇ ਭਾਣੇ ਨੂੰ ਮਿੱਠਾ ਕਰਕੇ ਮੰਨਣ ਦੀ ਮਿਸਾਲ ਕਾਇਮ ਕੀਤੀ। ਸ਼ਾਂਤੀ ਦੇ ਸਰੋਤ 'ਸੁਖਮਨੀ ਸਾਹਿਬ' ਦੀ ਰਚਨਾ ਕੀਤੀ।"
                },
                {
                    name: "ਸ੍ਰੀ ਗੁਰੂ ਹਰਗੋਬਿੰਦ ਸਾਹਿਬ ਜੀ",
                    namePunjabi: "ਸ੍ਰੀ ਗੁਰੂ ਹਰਗੋਬਿੰਦ ਸਾਹਿਬ ਜੀ",
                    english: "Sri Guru Hargobind Sahib Ji",
                    years: "1595–1644",
                    majorContributions: "Introduced the concept of 'Miri-Piri' (wearing two swords representing temporal and spiritual authority). Constructed the Sri Akal Takht Sahib (Throne of the Timeless One) as the center of Sikh temporal affairs, and built a defensive military force.",
                    majorContributionsPa: "ਮੀਰੀ-ਪੀਰੀ (ਧਾਰਮਿਕ ਅਤੇ ਸੰਸਾਰਕ ਅਧਿਕਾਰ ਦੀਆਂ ਦੋ ਤਲਵਾਰਾਂ) ਦਾ ਸਿਧਾਂਤ ਸ਼ੁਰੂ ਕੀਤਾ। ਅਕਾਲੀ ਮਾਮਲਿਆਂ ਦੇ ਕੇਂਦਰ ਵਜੋਂ ਸ਼੍ਰੀ ਅਕਾਲ ਤਖ਼ਤ ਸਾਹਿਬ ਦੀ ਸਿਰਜਣਾ ਕੀਤੀ ਅਤੇ ਜ਼ੁਲਮ ਦੇ ਟਾਕਰੇ ਲਈ ਸਿੱਖ ਫੌਜ ਤਿਆਰ ਕੀਤੀ।",
                    keyTeachings: "A Sikh must be a warrior-saint (Sant-Sipahi)—combining spiritual devotion and meditation with the courage and duty to defend the oppressed against tyranny.",
                    keyTeachingsPa: "ਇੱਕ ਸਿੱਖ ਨੂੰ 'ਸੰਤ-ਸਿਪਾਹੀ' ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ—ਭਾਵ ਰੂਹਾਨੀ ਭਗਤੀ ਦੇ ਨਾਲ-ਨਾਲ ਕਮਜ਼ੋਰਾਂ ਅਤੇ ਦੱਬੇ-ਕੁਚਲੇ ਲੋਕਾਂ ਦੀ ਰੱਖਿਆ ਲਈ ਹਮੇਸ਼ਾ ਤਿਆਰ ਰਹਿਣਾ ਚਾਹੀਦਾ ਹੈ।"
                },
                {
                    name: "ਸ੍ਰੀ ਗੁਰੂ ਹਰ ਰਾਇ ਸਾਹਿਬ ਜੀ",
                    namePunjabi: "ਸ੍ਰੀ ਗੁਰੂ ਹਰ ਰਾਇ ਸਾਹਿਬ ਜੀ",
                    english: "Sri Guru Har Rai Sahib Ji",
                    years: "1630–1661",
                    majorContributions: "Maintained a highly trained cavalry of 2,200 soldiers for defense but avoided armed conflict. Known for great compassion, established extensive botanical gardens, wildlife sanctuaries, and free herbal hospitals for the sick.",
                    majorContributionsPa: "ਰੱਖਿਆ ਲਈ 2200 ਘੋੜਸਵਾਰਾਂ ਦੀ ਫੌਜ ਰੱਖੀ ਪਰ ਹਮੇਸ਼ਾ ਸ਼ਾਂਤੀ ਦਾ ਮਾਰਗ ਚੁਣਿਆ। ਬੇਅੰਤ ਦਿਆਲਤਾ ਦੇ ਮਾਲਕ, ਜੜ੍ਹੀ-ਬੂਟੀਆਂ ਦੇ ਬਾਗ ਲਗਾਏ, ਜੀਵ-ਜੰਤੂਆਂ ਲਈ ਸੁਰੱਖਿਅਤ ਥਾਵਾਂ ਬਣਾਈਆਂ ਅਤੇ ਬਿਮਾਰਾਂ ਲਈ ਮੁਫ਼ਤ ਡਿਸਪੈਂਸਰੀਆਂ ਖੋਲ੍ਹੀਆਂ।",
                    keyTeachings: "Taught that every life-form is sacred and deserves compassion. Emphasized gentle speech, kind actions, and environmental stewardship.",
                    keyTeachingsPa: "ਸਿਖਾਇਆ ਕਿ ਹਰ ਜੀਵ ਪਵਿੱਤਰ ਹੈ ਅਤੇ ਦਇਆ ਦਾ ਹੱਕਦਾਰ ਹੈ। ਮਿੱਠਾ ਬੋਲਣ, ਦੂਜਿਆਂ ਦਾ ਭਲਾ ਕਰਨ ਅਤੇ ਕੁਦਰਤ ਦੀ ਸੰਭਾਲ ਕਰਨ 'ਤੇ ਜ਼ੋਰ ਦਿੱਤਾ।"
                },
                {
                    name: "ਸ੍ਰੀ ਗੁਰੂ ਹਰ ਕ੍ਰਿਸ਼ਨ ਸਾਹਿਬ ਜੀ",
                    namePunjabi: "ਸ੍ਰੀ ਗੁਰੂ ਹਰ ਕ੍ਰਿਸ਼ਨ ਸਾਹਿਬ ਜੀ",
                    english: "Sri Guru Har Krishan Sahib Ji",
                    years: "1656–1664",
                    majorContributions: "The youngest Guru, assumed guruship at age five. Served and healed thousands of smallpox and cholera victims during a severe epidemic in Delhi, eventually catching the illness and giving his life at age eight for the service of humanity.",
                    majorContributionsPa: "ਸਭ ਤੋਂ ਛੋਟੀ ਉਮਰ ਦੇ ਗੁਰੂ, ਪੰਜ ਸਾਲ ਦੀ ਉਮਰ ਵਿੱਚ ਗੁਰਗੱਦੀ ਸੰਭਾਲੀ। ਦਿੱਲੀ ਵਿੱਚ ਚੇਚਕ ਅਤੇ ਹੈਜ਼ੇ ਦੀ ਮਹਾਂਮਾਰੀ ਦੌਰਾਨ ਹਜ਼ਾਰਾਂ ਪੀੜਤਾਂ ਦੀ ਨਿਸ਼ਕਾਮ ਸੇਵਾ ਕੀਤੀ ਅਤੇ ਅਖੀਰ ਅੱਠ ਸਾਲ ਦੀ ਉਮਰ ਵਿੱਚ ਮਾਨਵਤਾ ਲਈ ਆਪਣੀ ਜਾਨ ਨਿਛਾਵਰ ਕੀਤੀ।",
                    keyTeachings: "Demonstrated that spiritual wisdom, compassion, and divine power are not dependent on age. Taught selfless sacrifice and pure love.",
                    keyTeachingsPa: "ਸਾਬਤ ਕੀਤਾ ਕਿ ਆਤਮਿਕ ਗਿਆਨ, ਦਇਆ ਅਤੇ ਰੂਹਾਨੀ ਸ਼ਕਤੀ ਉਮਰ 'ਤੇ ਨਿਰਭਰ ਨਹੀਂ ਕਰਦੀ। ਨਿਸ਼ਕਾਮ ਕੁਰਬਾਨੀ ਅਤੇ ਬਿਨਾਂ ਕਿਸੇ ਭੇਦਭਾਵ ਦੇ ਸਭ ਨੂੰ ਪਿਆਰ ਕਰਨਾ ਸਿਖਾਇਆ।"
                },
                {
                    name: "ਸ੍ਰੀ ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਸਾਹਿਬ ਜੀ",
                    namePunjabi: "ਸ੍ਰੀ ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਸਾਹਿਬ ਜੀ",
                    english: "Sri Guru Tegh Bahadur Sahib Ji",
                    years: "1621–1675",
                    majorContributions: "Known as 'Hind Di Chadar' (Shield of India). Sacrificed his life at Chandni Chowk in Delhi to defend the religious freedom and right to conscience of Kashmiri Hindus who were being forcibly converted. Travelled extensively to establish Sangats.",
                    majorContributionsPa: "ਹਿੰਦ ਦੀ ਚਾਦਰ ਵਜੋਂ ਜਾਣੇ ਜਾਂਦੇ ਹਨ। ਕਸ਼ਮੀਰੀ ਹਿੰਦੂਆਂ ਦੀ ਧਾਰਮਿਕ ਅਜ਼ਾਦੀ ਅਤੇ ਮਨੁੱਖੀ ਅਧਿਕਾਰਾਂ ਦੀ ਰੱਖਿਆ ਲਈ ਦਿੱਲੀ ਦੇ ਚਾਂਦਨੀ ਚੌਕ ਵਿਖੇ ਆਪਣਾ ਸੀਸ ਕੁਰਬਾਨ ਕੀਤਾ। ਸਿੱਖ ਸੰਗਤਾਂ ਦੀ ਸਥਾਪਨਾ ਲਈ ਦੇਸ਼ ਭਰ ਵਿੱਚ ਲੰਮੀ ਯਾਤਰਾ ਕੀਤੀ।",
                    keyTeachings: "Exemplified detachment from wordly desires, fearlessness ('Fear none, frighten none'), and supreme sacrifice for the freedom of conscience of others.",
                    keyTeachingsPa: "ਸੰਸਾਰਕ ਮੋਹ-ਮਾਇਆ ਤੋਂ ਮੁਕਤੀ, ਨਿਰਭੈਤਾ ('ਭੈ ਕਾਹੂ ਕੋ ਦੇਤ ਨਹਿ ਨਹਿ ਭੈ ਮਾਨਤ ਆਨ') ਅਤੇ ਦੂਜਿਆਂ ਦੇ ਹੱਕਾਂ ਲਈ ਆਤਮ-ਬਲੀਦਾਨ ਦੇਣ ਦੀ ਸਿੱਖਿਆ ਦਿੱਤੀ।"
                },
                {
                    name: "ਸ੍ਰੀ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਸਾਹਿਬ ਜੀ",
                    namePunjabi: "ਸ੍ਰੀ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਸਾਹਿਬ ਜੀ",
                    english: "Sri Guru Gobind Singh Sahib Ji",
                    years: "1666–1708",
                    majorContributions: "Created the Khalsa Panth in 1699, introducing the five Kakars (Kesh, Kangha, Kara, Kachera, Kirpan) and the names 'Singh' and 'Kaur'. Finalized the compilation of Sri Guru Granth Sahib Ji, adding Guru Tegh Bahadur Ji's hymns. Sacrificed his entire family, including his four sons (Sahibzade), for the protection of humanity.",
                    majorContributionsPa: "1699 ਵਿੱਚ ਖਾਲਸਾ ਪੰਥ ਦੀ ਸਿਰਜਣਾ ਕੀਤੀ, ਪੰਜ ਕਕਾਰਾਂ ਦੀ ਮਰਿਆਦਾ ਦਿੱਤੀ ਅਤੇ ਸਿੱਖਾਂ ਨੂੰ 'ਸਿੰਘ' ਤੇ 'ਕੌਰ' ਦੇ ਉਪਨਾਮ ਬਖਸ਼ੇ। ਸ਼੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਨੂੰ ਸੰਪੂਰਨ ਕੀਤਾ ਅਤੇ ਗੁਰਗੱਦੀ ਸੌਂਪੀ। ਦੇਸ਼ ਤੇ ਕੌਮ ਦੀ ਰੱਖਿਆ ਲਈ ਆਪਣੇ ਚਾਰੇ ਸਾਹਿਬਜ਼ਾਦਿਆਂ ਸਮੇਤ ਸਰਬੰਸ ਵਾਰ ਦਿੱਤਾ।",
                    keyTeachings: "Taught the ultimate warrior-saint discipline. Preached that all human beings are equal ('Recognize the whole human race as one'), and that weapons should only be drawn as a last resort when all peaceful means have failed.",
                    keyTeachingsPa: "ਸੰਤ-ਸਿਪਾਹੀ ਦੇ ਉੱਚ ਆਚਰਣ ਦੀ ਸਿੱਖਿਆ ਦਿੱਤੀ। ਪ੍ਰਚਾਰਿਆ ਕਿ ਸਮੁੱਚੀ ਮਾਨਵਤਾ ਇੱਕ ਹੈ ('ਮਾਨਸ ਕੀ ਜਾਤ ਸਬੈ ਏਕੈ ਪਹਿਚਾਨਬੋ')। ਸਿਖਾਇਆ ਕਿ ਜਦੋਂ ਸ਼ਾਂਤੀ ਦੇ ਸਾਰੇ ਹੀਲੇ ਖ਼ਤਮ ਹੋ ਜਾਣ, ਉਦੋਂ ਹੀ ਹੱਥ ਵਿੱਚ ਤਲਵਾਰ ਉਠਾਉਣਾ ਜਾਇਜ਼ ਹੈ।"
                },
                {
                    name: "ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ",
                    namePunjabi: "ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ",
                    english: "Sri Guru Granth Sahib Ji",
                    years: "1708–Present",
                    majorContributions: "The eternal, living Guru of Sikhs. A voluminous compilation of 1,430 Angs containing 5,894 hymns from the Sikh Gurus and 30 other Hindu and Muslim saints, Bhagats, and poets, organized in 31 classical musical modes (Raags).",
                    majorContributionsPa: "ਸਿੱਖਾਂ ਦੇ ਸਦੀਵੀ ਜਾਗਦੀ ਜੋਤ ਗੁਰੂ। 1430 ਅੰਗਾਂ ਦਾ ਪਵਿੱਤਰ ਗ੍ਰੰਥ ਜਿਸ ਵਿੱਚ 6 ਗੁਰੂ ਸਾਹਿਬਾਨ, 15 ਭਗਤਾਂ, 11 ਭੱਟਾਂ ਅਤੇ 4 ਗੁਰਸਿੱਖਾਂ ਦੀ ਇਲਾਹੀ ਬਾਣੀ ਦਰਜ ਹੈ, ਜੋ 31 ਸ਼ਾਸਤਰੀ ਰਾਗਾਂ ਵਿੱਚ ਉਚਾਰਨ ਕੀਤੀ ਗਈ ਹੈ।",
                    keyTeachings: "Direct experience of the Divine through the sacred word (Shabad Guru). Promotes universal love, brotherhood, social justice, humility, and constant remembrance of the Creator.",
                    keyTeachingsPa: "ਸ਼ਬਦ ਗੁਰੂ (ਇਲਾਹੀ ਬਾਣੀ) ਰਾਹੀਂ ਪ੍ਰਮਾਤਮਾ ਦਾ ਸਿੱਖਿਆ ਅਤੇ ਸਿੱਧਾ ਅਨੁਭਵ। ਸਰਵ-ਵਿਆਪੀ ਪਿਆਰ, ਮਾਨਵਤਾ ਦੀ ਸਾਂਝ, ਸਮਾਜਿਕ ਨਿਆਂ, ਨਿਮਰਤਾ, ਅਤੇ ਕਰਤਾ ਪੁਰਖ ਦੇ ਨਾਮ ਸਿਮਰਨ ਦਾ ਸੰਦੇਸ਼ ਦਿੰਦਾ ਹੈ।"
                }
            ];
            SAKHIS = [
                { title: "ਸੱਚਾ ਸੌਦਾ — The True Deal", guru: "Guru Nanak Dev Ji", desc: "Young Nanak was given 20 rupees by his father to make a profitable trade. Instead, he spent it feeding hungry sadhus, calling it the truest deal of all." },
                { title: "ਮੱਕੇ ਵਿੱਚ ਪੈਰ — Feet Towards Mecca", guru: "Guru Nanak Dev Ji", desc: "When asked why his feet pointed towards the Kaaba, Guru Ji replied: 'Turn my feet where God is not.' The Kaaba appeared wherever they turned his feet." },
                { title: "ਮਲਿਕ ਭਾਗੋ ਅਤੇ ਲਾਲੋ — Rich vs Honest", guru: "Guru Nanak Dev Ji", desc: "Guru Ji squeezed Malik Bhago's food (blood dripped) and Bhai Lalo's (milk dripped), showing honest earnings are more sacred than ill-gotten wealth." },
                { title: "ਬਾਬਾ ਬੁੱਢਾ ਜੀ ਦੀ ਅਸੀਸ", guru: "Guru Hargobind Sahib Ji", desc: "Baba Buddha Ji blessed the sixth Guru with both swords of Miri and Piri, prophesying that Guru Hargobind Sahib Ji would be a warrior-saint." },
                { title: "ਚਾਰ ਸਾਹਿਬਜ਼ਾਦੇ — The Four Princes", guru: "Guru Gobind Singh Ji", desc: "The supreme sacrifice of Guru Gobind Singh Ji's four sons — two eldest martyred in battle at Chamkaur, two youngest bricked alive at Sirhind." },
                { title: "ਅੰਮ੍ਰਿਤ ਸੰਚਾਰ — Birth of Khalsa (1699)", guru: "Guru Gobind Singh Ji", desc: "At Vaisakhi 1699, Guru Ji asked for heads. Five beloved ones (Panj Pyare) stepped forward. The Khalsa was born — baptized with Amrit." },
                { title: "ਬੰਦਾ ਸਿੰਘ ਬਹਾਦਰ", guru: "Khalsa", desc: "After Guru Gobind Singh Ji, Banda Singh Bahadur led the Khalsa army to establish the first Sikh rule, punishing the oppressors of Sirhind." },
                { title: "ਭਾਈ ਤਾਰੂ ਸਿੰਘ ਜੀ", guru: "Khalsa", desc: "Rather than cut his hair, Bhai Taru Singh Ji chose to have his scalp removed. His faith remained unshaken, inspiring generations." }
            ];
            SIKH_HISTORY = {
                en: `<h3>The Origin of Sri Guru Granth Sahib Ji</h3>
<p>Sri Guru Granth Sahib Ji is the central religious scripture of Sikhism, regarded by Sikhs as the final, sovereign, and eternal living Guru. It is a voluminous text of 1430 pages.</p>
<h3>Compilation by Guru Arjan Dev Ji (1604)</h3>
<p>The first version was compiled by Guru Arjan Dev Ji at Amritsar. He collected hymns of the first four Gurus along with various saints and Bhagats whose writings were consistent with Sikh philosophy.</p>
<h3>Completion by Guru Gobind Singh Ji (1708)</h3>
<p>Guru Gobind Singh Ji added hymns of Guru Tegh Bahadur Ji and finalized the sacred text. He declared the Granth as the eternal Guru for all Sikhs.</p>
<h3>Language and Structure</h3>
<p>The hymns are written in Punjabi, Hindi, Sanskrit, Persian, and regional dialects using the Gurmukhi script. The text is organized by raag (musical mode).</p>
<h3>Key Events in Sikh History</h3>
<p><b>1469:</b> Birth of Guru Nanak Dev Ji<br><b>1604:</b> Compilation of Adi Granth<br><b>1699:</b> Creation of Khalsa<br><b>1708:</b> Guru Granth Sahib Ji declared eternal Guru<br><b>1799:</b> Sikh Empire under Maharaja Ranjit Singh<br><b>1984:</b> Operation Blue Star & November Massacre</p>`,
                pa: `<h3>ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਦਾ ਇਤਿਹਾਸ</h3>
<p>ਸ੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਸਿੱਖ ਧਰਮ ਦਾ ਕੇਂਦਰੀ ਧਾਰਮਿਕ ਗ੍ਰੰਥ ਹੈ। ਇਹ 1430 ਪੰਨਿਆਂ ਦਾ ਵਿਸ਼ਾਲ ਗ੍ਰੰਥ ਹੈ।</p>
<h3>ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ ਦੁਆਰਾ ਸੰਕਲਨ (1604)</h3>
<p>ਪਹਿਲਾ ਸੰਸਕਰਨ ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ ਨੇ ਅੰਮ੍ਰਿਤਸਰ ਵਿਖੇ ਸੰਕਲਿਤ ਕੀਤਾ।</p>
<h3>ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ ਦੁਆਰਾ ਮੁਕੰਮਲ (1708)</h3>
<p>ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ ਨੇ ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਜੀ ਦੀ ਬਾਣੀ ਸ਼ਾਮਲ ਕੀਤੀ ਅਤੇ ਗ੍ਰੰਥ ਨੂੰ ਸਦੀਵੀ ਗੁਰੂ ਘੋਸ਼ਿਤ ਕੀਤਾ।</p>`,
                hi: `<h3>श्री गुरु ग्रंथ साहिब जी का इतिहास</h3>
<p>श्री गुरु ग्रंथ साहिब जी सिख धर्म का केंद्रीय धार्मिक ग्रंथ है। यह 1430 पृष्ठों का विशाल ग्रंथ है।</p>
<h3>गुरु अर्जन देव जी द्वारा संकलन (1604)</h3>
<p>पहला संस्करण गुरु अर्जन देव जी ने अमृतसर में संकलित किया।</p>
<h3>गुरु गोबिंद सिंह जी द्वारा पूर्ण (1708)</h3>
<p>गुरु गोबिंद सिंह जी ने ग्रंथ को अंतिम रूप दिया और इसे शाश्वत गुरु घोषित किया।</p>`
            };
        }
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // DATA — Inspirational Quotes
    // ═══════════════════════════════════════════════════════════════════════════

    const inspirationalQuotes = [
        { gurmukhi: "ਚੇਤਨਾ ਹੈ ਤਉ ਚੇਤ ਲੈ ਨਿਸਿ ਦਿਨਿ ਮੈ ਪ੍ਰਾਨੀ ॥", translation: "If you are going to be conscious, then be conscious; remember Him night and day, O mortal.", ang: 726 },
        { gurmukhi: "ਜਾਗ ਲੇਹੁ ਰੇ ਮਨਾ ਜਾਗ ਲੇਹੁ ਕਹਾ ਗਾਫਲ ਸੋਇਆ ॥", translation: "Wake up, O mind! Wake up! Why are you sleeping unaware?", ang: 726 },
        { gurmukhi: "ਹਰਿ ਕੀ ਵਡਿਆਈ ਦੇਖਹੁ ਸੰਤਹੁ ਹਰਿ ਨਿਮਾਣਿਆ ਮਾਣੁ ਦੇਵਾਏ ॥", translation: "O Saints, behold the glorious greatness of the Lord; the Lord bestows honor upon the dishonored.", ang: 735 },
        { gurmukhi: "ਓਇ ਸਾਜਨ ਓਇ ਮੀਤ ਪਿਆਰੇ ॥", translation: "They are my friends, and they are my beloved companions.", ang: 739 },
        { gurmukhi: "ਕੁਰਬਾਣੁ ਜਾਈ ਉਸੁ ਵੇਲਾ ਸੁਹਾਵੀ ਜਿਤੁ ਤੁਮਰੈ ਦੁਆਰੈ ਆਇਆ ॥", translation: "I am a sacrifice to that beautiful time, when I came to Your Door.", ang: 748 },
        { gurmukhi: "ਪ੍ਰੀਤਮ ਜਾਨਿ ਲੇਹੁ ਮਨ ਮਾਹੀ ॥", translation: "O my mind, know your Beloved Lord.", ang: 634 },
        { gurmukhi: "ਹਉ ਬਲਿਹਾਰੀ ਤਿੰਨ ਕੰਉ ਜੋ ਗੁਰਮੁਖਿ ਸਿਖਾ ॥", translation: "I am a sacrifice to those Sikhs who are Gurmukh.", ang: 650 },
        { gurmukhi: "ਵਿਣੁ ਮਨੁ ਮਾਰੇ ਕੋਇ ਨ ਸਿਝਈ ਵੇਖਹੁ ਕੋ ਲਿਵ ਲਾਇ ॥", translation: "Without subduing the mind, no one succeeds; see this by centering your loving attention.", ang: 650 },
        { gurmukhi: "ਏ ਮਨ ਹਰਿ ਜੀ ਧਿਆਇ ਤੂ ਇਕ ਮਨਿ ਇਕ ਚਿਤਿ ਭਾਇ ॥", translation: "O mind, meditate on the Dear Lord, single-mindedly, with conscious love.", ang: 653 },
        { gurmukhi: "ਜੋ ਮਾਗਹਿ ਠਾਕੁਰ ਅਪੁਨੇ ਤੇ ਸੋਈ ਸੋਈ ਦੇਵੈ ॥", translation: "Whatever one asks from his Lord and Master, he receives that very thing.", ang: 681 },
        { gurmukhi: "ਰੰਗਿ ਰਤਾ ਮੇਰਾ ਸਾਹਿਬੁ ਰਵਿ ਰਹਿਆ ਭਰਪੂਰਿ ॥੧॥ ਰਹਾਉ ॥", translation: "My Lord and Master is imbued with love; He is totally permeating and pervading all. ||1||Pause||", ang: 23 },
        { gurmukhi: "ਏਕੋ ਨਾਮੁ ਹੁਕਮੁ ਹੈ ਨਾਨਕ ਸਤਿਗੁਰਿ ਦੀਆ ਬੁਝਾਇ ਜੀਉ ॥੫॥", translation: "The Naam, the Name of the One Lord, is the Command; O Nanak, the True Guru has given me this understanding. ||5||", ang: 72 },
        { gurmukhi: "ਚੋਜੀ ਮੇਰੇ ਗੋਵਿੰਦਾ ਚੋਜੀ ਮੇਰੇ ਪਿਆਰਿਆ ਹਰਿ ਪ੍ਰਭੁ ਮੇਰਾ ਚੋਜੀ ਜੀਉ ॥", translation: "Playful is my Lord of the Universe; playful is my Beloved; my Lord God is wonderfully playful.", ang: 174 },
        { gurmukhi: "ਮੀਤੁ ਕਰੈ ਸੋਈ ਹਮ ਮਾਨਾ ॥", translation: "Whatever my Friend does, I accept.", ang: 187 },
        { gurmukhi: "ਭਉ ਨ ਵਿਆਪੈ ਤੇਰੀ ਸਰਣਾ ॥", translation: "Fear does not affect those who seek Your Sanctuary.", ang: 192 }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA — Daily Wisdom
    // ═══════════════════════════════════════════════════════════════════════════

    const DAILY_WISDOM = [
        { icon: "💎", title: "Humility (ਨਿਮਰਤਾ)", desc: "The foundation of all virtues. True greatness lies in serving others and recognizing the Divine in all beings.", pankti: "ਨਾਨਕ ਨੀਚਾ ਕਹੁ ਸਭ ਕੋਈ ॥", source: "Guru Nanak Dev Ji" },
        { icon: "🪷", title: "Contentment (ਸੰਤੋਖ)", desc: "True peace comes from accepting Waheguru's will. Freedom from greed and desire leads to lasting happiness.", pankti: "ਸੰਤੋਖੀ ਸਦਾ ਸੁਖੀਐ ॥", source: "Guru Arjan Dev Ji" },
        { icon: "🕊️", title: "Compassion (ਦਇਆ)", desc: "See the light of Waheguru in every heart. True spirituality is showing kindness to all creation.", pankti: "ਦਇਆ ਕਪਾਹ ਸੰਤੋਖੁ ਸੂਤੁ ਜਤੁ ਗੰਢੀ ਸਤੁ ਵਟੁ ॥", source: "Guru Nanak Dev Ji" },
        { icon: "✨", title: "Truth (ਸੱਚ)", desc: "Living truthfully in thought, word, and deed is the highest path. Truth is the ultimate virtue.", pankti: "ਸਚਹੁ ਓਰੈ ਸਭੁ ਕੋ ਉਪਰਿ ਸਚੁ ਆਚਾਰ ॥", source: "Guru Nanak Dev Ji" },
        { icon: "💕", title: "Divine Love (ਪ੍ਰੇਮ)", desc: "The soul longs for union with Waheguru. Through Naam and love, the soul finds its eternal home.", pankti: "ਹਉ ਵਾਰੀ ਜੀਉ ਵਾਰੀ ਹਰਿ ਹਰਿ ਨਾਮੁ ਸੁਣੰਦਿਆ ॥", source: "Guru Ram Das Ji" },
        { icon: "🙏", title: "Devotion (ਭਗਤੀ)", desc: "Remembering Waheguru with every breath. True worship is unbroken remembrance.", pankti: "ਸਿਮਰਿ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖ ਪਾਵਹੁ ॥", source: "Guru Arjan Dev Ji" },
        { icon: "⚔️", title: "Courage (ਬੀਰਤਾ)", desc: "Stand up for truth and justice. A Sikh is a warrior-saint who fights oppression with righteous courage.", pankti: "ਦੇਹ ਸ਼ਿਵਾ ਬਰ ਮੋਹਿ ਇਹੈ ਸ਼ੁਭ ਕਰਮਨ ਤੇ ਕਬਹੂੰ ਨ ਟਰੋ ॥", source: "Guru Gobind Singh Ji" }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // MODAL SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    let currentLang = 'en';
    let currentModalType = '';

    window.openModal = async function (type) {
        currentModalType = type;
        const modal = document.getElementById('insightModal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');
        const langSwitch = document.getElementById('langSwitch');
        
        // Load JSON data if not already loaded
        if (RAAGS.length === 0) {
            await loadJsonData();
        }
        
        langSwitch.style.display = 'none';

        switch (type) {
            case 'raags':
                title.textContent = '🎵 31 Classical Raags';
                body.innerHTML = renderRaags(currentLang);
                langSwitch.style.display = 'flex';
                setupLangSwitch();
                break;
            case 'composers':
                title.textContent = '📝 35 Contributors';
                body.innerHTML = renderContributors(currentLang);
                langSwitch.style.display = 'flex';
                setupLangSwitch();
                break;
            case 'themes':
                title.textContent = '💕 Spiritual Themes';
                body.innerHTML = renderThemes(currentLang);
                langSwitch.style.display = 'flex';
                setupLangSwitch();
                break;
            case 'history':
                title.textContent = '📜 Sikh History';
                langSwitch.style.display = 'flex';
                body.innerHTML = renderHistory(currentLang);
                setupLangSwitch();
                break;
            case 'sakhis':
                title.textContent = '📕 Famous Sakhis';
                body.innerHTML = renderSakhis(currentLang);
                langSwitch.style.display = 'flex';
                setupLangSwitch();
                break;
            case 'guruSahibs':
                title.textContent = '🙏 11 Guru Sahib Ji';
                body.innerHTML = renderGuruSahibaan(currentLang);
                langSwitch.style.display = 'flex';
                setupLangSwitch();
                break;
        }

        modal.classList.add('insight-modal--active');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    };

    window.closeModal = function () {
        const modal = document.getElementById('insightModal');
        modal.classList.remove('insight-modal--active');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    };

    function renderRaags(lang, filter = '') {
        const nameField = lang === 'pa' ? 'namePa' : lang === 'hi' ? 'nameHi' : 'name';
        const timeField = lang === 'pa' ? 'timeOfDayPa' : lang === 'hi' ? 'timeOfDayHi' : 'timeOfDay';
        const descField = lang === 'pa' ? 'descriptionPa' : lang === 'hi' ? 'descriptionHi' : 'description';
        
        let list = RAAGS;
        if (filter) {
            list = list.filter(r => 
                (r[nameField] && r[nameField].toLowerCase().includes(filter)) ||
                (r.name && r.name.toLowerCase().includes(filter)) ||
                (r[timeField] && r[timeField].toLowerCase().includes(filter))
            );
        }
        
        if (list.length === 0) {
            return `<p style="text-align:center; padding: 24px; color: var(--text-tertiary);">No matching Raags found.</p>`;
        }
        
        return `<div class="modal-list">${list.map(r => `
            <div class="modal-list-item">
                <div>
                    <div class="modal-list-item__name">🎵 ${r[nameField] || r.name}</div>
                    <div class="modal-list-item__info">${r[timeField] || r.timeOfDay || ''}</div>
                </div>
                <span class="modal-list-item__count">${r.shabads || 0} shabads</span>
            </div>`).join('')}</div>`;
    }

    function renderContributors(lang, filter = '') {
        const nameField = lang === 'pa' ? 'namePa' : lang === 'hi' ? 'nameHi' : 'name';
        const bioField = lang === 'pa' ? 'biographyPa' : lang === 'hi' ? 'biographyHi' : 'biography';
        
        let list = CONTRIBUTORS;
        if (filter) {
            list = list.filter(c => 
                (c[nameField] && c[nameField].toLowerCase().includes(filter)) ||
                (c.name && c.name.toLowerCase().includes(filter)) ||
                (c.type && c.type.toLowerCase().includes(filter))
            );
        }
        
        if (list.length === 0) {
            return `<p style="text-align:center; padding: 24px; color: var(--text-tertiary);">No matching contributors found.</p>`;
        }
        
        const groups = { Guru: [], Bhagat: [], Bhatt: [], Sikh: [] };
        list.forEach(c => (groups[c.type] || (groups[c.type] = [])).push(c));
        
        return Object.entries(groups).filter(([_, items]) => items.length > 0).map(([type, items]) => `
            <h4 style="margin: 16px 0 8px; color: #D4A03A;">${type === 'Guru' ? '🙏 Gurus' : type === 'Bhagat' ? '📿 Bhagats' : type === 'Bhatt' ? '✨ Bhatts' : '🎵 Sikhs'}</h4>
            <div class="modal-list">${items.map(c => `
                <div class="modal-list-item">
                    <div>
                        <div class="modal-list-item__name">${c.emoji || '🙏'} ${c[nameField] || c.name}</div>
                        <div class="modal-list-item__info">${c.type}</div>
                    </div>
                    <span class="modal-list-item__count">${c.shabads || ''} shabads</span>
                </div>`).join('')}</div>`).join('');
    }

    function renderThemes(lang, filter = '') {
        const titleField = lang === 'pa' ? 'titlePa' : lang === 'hi' ? 'titleHi' : 'title';
        const descField = lang === 'pa' ? 'descriptionPa' : lang === 'hi' ? 'descriptionHi' : 'description';
        
        let list = THEMES;
        if (filter) {
            list = list.filter(t => 
                (t[titleField] && t[titleField].toLowerCase().includes(filter)) ||
                (t.title && t.title.toLowerCase().includes(filter))
            );
        }
        
        if (list.length === 0) {
            return `<p style="text-align:center; padding: 24px; color: var(--text-tertiary);">No matching themes found.</p>`;
        }
        
        return list.map(t => {
            const title = t[titleField] || t.title;
            let desc = t[descField] || t.desc || '';
            if (typeof desc === 'object' && desc !== null) {
                desc = desc[lang] || desc['en'] || '';
            }
            
            return `
            <div class="theme-card" style="margin-bottom: 12px; padding: 16px; border-radius: 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
                <div class="theme-card__title" style="font-size: 16px; font-weight: 700; color: #D4A03A; margin-bottom: 6px;">${t.emoji || '✨'} ${title}</div>
                <div class="theme-card__desc" style="font-size: 13.5px; line-height: 1.5; color: var(--text-secondary);">${desc}</div>
            </div>`;
        }).join('');
    }

    function renderHistory(lang, filter = '') {
        if (SIKH_HISTORY.guruSahibaan) {
            const data = SIKH_HISTORY.guruSahibaan[lang] || SIKH_HISTORY.guruSahibaan['en'];
            let gurusSource = SIKH_HISTORY.guruSahibaan['en'].gurus || [];
            
            if (filter) {
                gurusSource = gurusSource.filter(g => 
                    (g.name && g.name.toLowerCase().includes(filter)) ||
                    (g.namePunjabi && g.namePunjabi.toLowerCase().includes(filter)) ||
                    (g.contributions && g.contributions.toLowerCase().includes(filter))
                );
            }
            
            let html = `<div class="history-content">`;
            if (data.intro && !filter) {
                html += `<p style="margin-bottom: 20px; line-height: 1.6; color: var(--text-secondary);">${data.intro}</p>`;
            }
            
            if (gurusSource.length > 0) {
                html += `<h3 style="margin: 20px 0 12px; color: #D4A03A;">${data.title || 'Guru Sahibaan'}</h3>`;
                gurusSource.forEach(g => {
                    const nameDisp = lang === 'pa' ? (g.namePunjabi || g.name) : lang === 'hi' ? (g.nameHindi || g.name) : g.name;
                    const contribDisp = lang === 'pa' ? (g.contributionsPa || g.contributions) : lang === 'hi' ? (g.contributionsHi || g.contributions) : g.contributions;
                    const teachingsDisp = lang === 'pa' ? (g.teachingsPa || g.teachings) : lang === 'hi' ? (g.teachingsHi || g.teachings) : g.teachings;
                    
                    html += `
                    <div class="theme-card" style="margin-bottom: 14px; padding: 18px; border-radius: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
                        <div class="theme-card__title" style="font-size: 16px; font-weight: 800; color: #D4A03A;">🙏 ${nameDisp}</div>
                        <div style="font-size: 11px; color: var(--text-tertiary); margin: 4px 0 8px;">${lang === 'pa' ? 'ਜੀਵਨ ਕਾਲ' : lang === 'hi' ? 'जीवन काल' : 'Lifetime'}: ${g.years}</div>
                        <div class="theme-card__desc" style="font-size: 13.5px; line-height: 1.55; color: var(--text-secondary);">${contribDisp}</div>
                        ${teachingsDisp ? `
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08);">
                            <strong>${lang === 'pa' ? 'ਮੁੱਖ ਸਿੱਖਿਆਵਾਂ' : lang === 'hi' ? 'मुख्य शिक्षाएं' : 'Key Teachings'}:</strong> ${teachingsDisp}
                        </div>` : ''}
                    </div>`;
                });
            }
            
            if (SIKH_HISTORY.majorEvents) {
                const eventsData = SIKH_HISTORY.majorEvents[lang] || SIKH_HISTORY.majorEvents['en'];
                if (eventsData && eventsData.events) {
                    let evList = eventsData.events;
                    if (filter) {
                        evList = evList.filter(e => (e.event && e.event.toLowerCase().includes(filter)) || (e.description && e.description.toLowerCase().includes(filter)));
                    }
                    if (evList.length > 0) {
                        html += `<h3 style="margin: 24px 0 12px; color: #D4A03A;">${eventsData.title || 'Major Events'}</h3>`;
                        evList.forEach(e => {
                            html += `
                            <div style="margin-bottom: 12px; padding: 14px; background: rgba(255,255,255,0.04); border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);">
                                <div style="font-weight: 800; color: #D4A03A; font-size: 14px;">📅 ${e.year}</div>
                                <div style="font-weight: 600; margin: 4px 0; font-size: 13.5px;">${e.event}</div>
                                <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">${e.description}</div>
                            </div>`;
                        });
                    }
                }
            }
            
            html += `</div>`;
            return html;
        }
        
        return `<div class="history-content">${SIKH_HISTORY[lang] || ''}</div>`;
    }

    function renderSakhis(lang, filter = '') {
        const descField = lang === 'pa' ? 'descPa' : lang === 'hi' ? 'descHi' : 'desc';
        const lessonField = lang === 'pa' ? 'lessonPa' : lang === 'hi' ? 'lessonHi' : 'lesson';
        
        let list = SAKHIS;
        if (filter) {
            list = list.filter(s => 
                (s.title && s.title.toLowerCase().includes(filter)) ||
                (s.guru && s.guru.toLowerCase().includes(filter)) ||
                (s.desc && typeof s.desc === 'string' && s.desc.toLowerCase().includes(filter))
            );
        }
        
        if (list.length === 0) {
            return `<p style="text-align:center; padding: 24px; color: var(--text-tertiary);">No matching Sakhis found.</p>`;
        }
        
        return list.map(s => {
            const desc = s.desc ? (typeof s.desc === 'object' ? (s.desc[lang] || s.desc['en']) : s.desc) : (s[descField] || '');
            const lesson = s.lesson ? (typeof s.lesson === 'object' ? (s.lesson[lang] || s.lesson['en']) : s.lesson) : (s[lessonField] || '');
            
            return `
            <div class="theme-card" style="margin-bottom: 14px; padding: 18px; border-radius: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
                <div class="theme-card__title" style="font-size: 16px; font-weight: 700; color: #D4A03A;">📖 ${s.title}</div>
                <div style="font-size: 12px; color: var(--text-tertiary); margin: 4px 0 8px;">${s.guru}</div>
                <div class="theme-card__desc" style="font-size: 13.5px; line-height: 1.55; color: var(--text-secondary);">${desc}</div>
                ${lesson ? `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08);"><strong>Lesson:</strong> ${lesson}</div>` : ''}
            </div>`;
        }).join('');
    }

    function renderGuruSahibaan(lang, filter = '') {
        const contribField = lang === 'pa' ? 'majorContributionsPa' : lang === 'hi' ? 'majorContributionsHi' : 'majorContributions';
        const teachingField = lang === 'pa' ? 'keyTeachingsPa' : lang === 'hi' ? 'keyTeachingsHi' : 'keyTeachings';
        
        let list = GURU_SAHIBAAN;
        if (filter) {
            list = list.filter(g => 
                (g.name && g.name.toLowerCase().includes(filter)) ||
                (g.namePunjabi && g.namePunjabi.toLowerCase().includes(filter)) ||
                (g.english && g.english.toLowerCase().includes(filter))
            );
        }
        
        if (list.length === 0) {
            return `<p style="text-align:center; padding: 24px; color: var(--text-tertiary);">No matching Guru Sahibaan found.</p>`;
        }
        
        return list.map((g, i) => {
            const contrib = g[contribField] || g.majorContributions || g.desc || g.description || 'Contributions details coming soon.';
            const teachings = g[teachingField] || g.keyTeachings || 'Teachings details coming soon.';
            const nameDisp = lang === 'pa' ? (g.namePunjabi || g.name) : lang === 'hi' ? (g.nameHindi || g.name) : (g.english || g.name);
            const subtitleDisp = lang === 'pa' ? 'ਇਤਿਹਾਸਕ ਜੀਵਨ ਕਾਲ' : lang === 'hi' ? 'ऐतिहासिक जीवन काल' : 'Historical Lifetime';
            
            return `
            <div class="theme-card" style="margin-bottom: 14px; padding: 18px; border-radius: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
                <div class="theme-card__title" style="font-size: 16px; font-weight: 800; color: #D4A03A;">🙏 ${nameDisp}</div>
                <div style="font-size: 12px; color: var(--text-tertiary); margin: 4px 0 8px;">${subtitleDisp}: ${g.years || ''}</div>
                <div class="theme-card__desc" style="font-size: 13.5px; line-height: 1.55; color: var(--text-secondary);">${contrib}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08);"><strong>${lang === 'pa' ? 'ਮੁੱਖ ਸਿੱਖਿਆਵਾਂ' : lang === 'hi' ? 'मुख्य शिक्षाएं' : 'Key Teachings'}:</strong> ${teachings}</div>
            </div>`;
        }).join('');
    }

    let currentModalFilter = '';
    let currentWisdomIndex = 0;

    // ═══════════════════════════════════════════════════════════════════════════
    // QUIZ DATA & ENGINE
    // ═══════════════════════════════════════════════════════════════════════════

    const QUIZ_QUESTIONS = [
        {
            question: "Who compiled the first version of Adi Granth in 1604 at Sri Amritsar Sahib?",
            options: ["Sri Guru Ram Das Ji", "Sri Guru Arjan Dev Ji", "Sri Guru Gobind Singh Ji"],
            correct: 1,
            explanation: "Sri Guru Arjan Dev Ji compiled the Adi Granth in 1604 with Bhai Gurdas Ji as the primary scribe, and installed it at Sri Harmandir Sahib."
        },
        {
            question: "How many classical Raags are present in Sri Guru Granth Sahib Ji?",
            options: ["10 Raags", "22 Raags", "31 Raags"],
            correct: 2,
            explanation: "There are 31 classical Raags utilized throughout Sri Guru Granth Sahib Ji, starting from Sri Raag to Jaijawanti."
        },
        {
            question: "Which Guru Sahib standardized and formalized the Gurmukhi script?",
            options: ["Sri Guru Angad Dev Ji", "Sri Guru Nanak Dev Ji", "Sri Guru Amar Das Ji"],
            correct: 0,
            explanation: "Sri Guru Angad Dev Ji (the 2nd Guru) standardized Gurmukhi script to make the Guru's words universally accessible to all."
        },
        {
            question: "What are the Three Pillars (mool sidhants) established by Sri Guru Nanak Dev Ji?",
            options: ["Naam Japna, Kirat Karo, Vand Chhako", "Seva, Simran, Sangat", "Daya, Santokh, Sach"],
            correct: 0,
            explanation: "Kirat Karo (honest living), Naam Japna (remembering the Divine), and Vand Chhako (sharing with the needy) form the foundational pillars."
        },
        {
            question: "Which Bhagat has the highest number of Shabads in Sri Guru Granth Sahib Ji?",
            options: ["Bhagat Ravidas Ji", "Bhagat Farid Ji", "Bhagat Kabir Ji"],
            correct: 2,
            explanation: "Bhagat Kabir Ji's bani spans 541 sacred Shabads and Saloks across 17 different Raags in Sri Guru Granth Sahib Ji."
        }
    ];

    function setupDailyQuiz() {
        const questionEl = document.getElementById('quizQuestion');
        const optionsEl = document.getElementById('quizOptions');
        const feedbackEl = document.getElementById('quizFeedback');
        if (!questionEl || !optionsEl) return;

        const qIdx = new Date().getDate() % QUIZ_QUESTIONS.length;
        const currentQ = QUIZ_QUESTIONS[qIdx];

        questionEl.textContent = currentQ.question;
        optionsEl.innerHTML = currentQ.options.map((opt, i) => `
            <button class="quiz-option-btn" data-idx="${i}">${opt}</button>
        `).join('');

        const buttons = optionsEl.querySelectorAll('.quiz-option-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedIdx = parseInt(btn.dataset.idx, 10);
                buttons.forEach(b => b.disabled = true);

                if (selectedIdx === currentQ.correct) {
                    btn.classList.add('correct');
                    feedbackEl.style.display = 'block';
                    feedbackEl.innerHTML = `<strong>✨ Correct!</strong> ${currentQ.explanation}`;
                    feedbackEl.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                } else {
                    btn.classList.add('wrong');
                    buttons[currentQ.correct].classList.add('correct');
                    feedbackEl.style.display = 'block';
                    feedbackEl.innerHTML = `<strong>🙏 Good try!</strong> ${currentQ.explanation}`;
                    feedbackEl.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IN-MODAL SEARCH & GLOBAL SEARCH
    // ═══════════════════════════════════════════════════════════════════════════

    function setupSearch() {
        const modalSearchInput = document.getElementById('modalSearchInput');
        const librarySearchInput = document.getElementById('librarySearchInput');

        if (modalSearchInput) {
            modalSearchInput.addEventListener('input', (e) => {
                currentModalFilter = e.target.value.toLowerCase().trim();
                renderCurrentModalBody();
            });
        }

        if (librarySearchInput) {
            librarySearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && librarySearchInput.value.trim()) {
                    window.openModal('history');
                    setTimeout(() => {
                        if (modalSearchInput) {
                            modalSearchInput.value = librarySearchInput.value.trim();
                            currentModalFilter = librarySearchInput.value.toLowerCase().trim();
                            renderCurrentModalBody();
                        }
                    }, 100);
                }
            });
        }
    }

    function renderCurrentModalBody() {
        const body = document.getElementById('modalBody');
        if (!body) return;

        switch (currentModalType) {
            case 'raags':
                body.innerHTML = renderRaags(currentLang, currentModalFilter);
                break;
            case 'composers':
                body.innerHTML = renderContributors(currentLang, currentModalFilter);
                break;
            case 'themes':
                body.innerHTML = renderThemes(currentLang, currentModalFilter);
                break;
            case 'history':
                body.innerHTML = renderHistory(currentLang, currentModalFilter);
                break;
            case 'sakhis':
                body.innerHTML = renderSakhis(currentLang, currentModalFilter);
                break;
            case 'guruSahibs':
                body.innerHTML = renderGuruSahibaan(currentLang, currentModalFilter);
                break;
        }
    }

    function setupLangSwitch() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('lang-btn--active'));
                btn.classList.add('lang-btn--active');
                currentLang = btn.dataset.lang;
                renderCurrentModalBody();
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUOTES & WISDOM
    // ═══════════════════════════════════════════════════════════════════════════

    function loadRandomQuote() {
        const q = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
        const t = document.getElementById('quoteText');
        const tr = document.getElementById('quoteTranslation');
        const m = document.getElementById('quoteMeta');
        if (t) t.textContent = q.gurmukhi;
        if (tr) tr.textContent = q.translation;
        if (m) m.innerHTML = `<i class="fas fa-book-open"></i> Ang ${q.ang}`;
    }

    function setupQuoteRefresh() {
        const btn = document.getElementById('refreshQuoteBtn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            btn.style.transform = 'rotate(180deg)';
            loadRandomQuote();
            setTimeout(() => { btn.style.transform = ''; }, 300);
        });
    }

    function loadDailyWisdom() {
        currentWisdomIndex = new Date().getDate() % DAILY_WISDOM.length;
        renderWisdomCard();
    }

    function renderWisdomCard() {
        const w = DAILY_WISDOM[currentWisdomIndex % DAILY_WISDOM.length];
        const icon = document.getElementById('wisdomIcon');
        const title = document.getElementById('wisdomTitle');
        const desc = document.getElementById('wisdomDesc');
        const pankti = document.getElementById('wisdomPankti');
        const source = document.getElementById('wisdomSource');
        if (icon) icon.textContent = w.icon;
        if (title) title.textContent = w.title;
        if (desc) desc.textContent = w.desc;
        if (pankti) pankti.textContent = w.pankti;
        if (source) source.textContent = `— ${w.source}`;
    }

    function setupWisdomCycler() {
        const btn = document.getElementById('nextWisdomBtn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            currentWisdomIndex = (currentWisdomIndex + 1) % DAILY_WISDOM.length;
            renderWisdomCard();
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // THEME TOGGLE
    // ═══════════════════════════════════════════════════════════════════════════

    function setupThemeToggle() {
        const btn = document.getElementById('themeToggleBtn');
        const icon = document.getElementById('themeIcon');
        if (!btn || !icon) return;

        function updateIcon() {
            const isDark = document.documentElement.classList.contains('dark-mode');
            icon.textContent = isDark ? '☀️' : '🌙';
        }
        updateIcon();

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isDark = document.documentElement.classList.contains('dark-mode');
            const newTheme = isDark ? 'light' : 'dark';
            
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark-mode');
            } else {
                document.documentElement.classList.remove('dark-mode');
            }
            
            localStorage.setItem('anhad_theme', newTheme);
            window.dispatchEvent(new CustomEvent('themechange'));
            updateIcon();
            
            if (window.AnhadTheme && typeof AnhadTheme.setTheme === 'function') {
                AnhadTheme.setTheme(newTheme);
            }
        });
        
        window.addEventListener('themechange', updateIcon);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUICK STATS
    // ═══════════════════════════════════════════════════════════════════════════

    function loadQuickStats() {
        let stats = {}, streak = {}, sehajStats = {};
        try {
            stats = JSON.parse(localStorage.getItem('anhad_user_stats') || '{}');
            streak = JSON.parse(localStorage.getItem('anhad_streak_data') || '{}');
            sehajStats = JSON.parse(localStorage.getItem('sehajPaathStats') || '{}');
        } catch (e) {}

        const totalMin = stats.totalListeningMinutes || 0;
        const totalDays = stats.totalDaysActive || 1;
        const weeklyHours = Math.round((totalMin / Math.max(totalDays, 7)) * 7 / 60 * 10) / 10;

        const sehajAngs = sehajStats.totalAngsRead || (stats.sehajPaath?.totalAngsRead) || 0;
        const weeklyAngs = sehajStats.todayAngsRead || Math.round((sehajAngs / Math.max(totalDays, 7)) * 7);
        
        const bestStreak = Math.max(
            sehajStats.currentStreak || 0,
            streak.currentStreak || 0,
            stats.sehajPaath?.currentStreak || 0,
            1
        );

        const wl = document.getElementById('weeklyListening');
        const wa = document.getElementById('weeklyAngs');
        const cs = document.getElementById('currentStreak');
        if (wl) wl.textContent = `${weeklyHours}h`;
        if (wa) wa.textContent = weeklyAngs;
        if (cs) cs.textContent = `${bestStreak} 🔥`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHABAD NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════

    function setupShabadCards() {
        document.querySelectorAll('.shabad-card').forEach(card => {
            card.addEventListener('click', () => {
                const ang = card.dataset.ang;
                if (ang) {
                    const target = `../SehajPaath/reader.html?ang=${ang}&source=learning`;
                    if (window.navigateTo) window.navigateTo(target);
                    else window.location.href = target;
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHARE
    // ═══════════════════════════════════════════════════════════════════════════

    function setupShareQuote() {
        const btn = document.getElementById('shareQuoteBtn');
        if (!btn) return;
        btn.addEventListener('click', async () => {
            const text = document.getElementById('quoteText')?.textContent || '';
            const trans = document.getElementById('quoteTranslation')?.textContent || '';
            const meta = document.getElementById('quoteMeta')?.textContent || 'Sri Guru Granth Sahib Ji';

            if (window.AnhadShare && typeof AnhadShare.showPreview === 'function') {
                AnhadShare.showPreview({
                    gurmukhi: text,
                    english: trans,
                    source: 'Sri Guru Granth Sahib Ji',
                    ang: meta.replace(/[^0-9]/g, '') || '441'
                });
                return;
            }

            const shareText = `"${text}"\n\n${trans}\n\n— ${meta} | ANHAD App`;
            if (navigator.share) {
                try { await navigator.share({ title: 'ANHAD Gurbani Inspiration', text: shareText }); } catch (e) {}
            } else {
                try { await navigator.clipboard.writeText(shareText); alert('Copied inspirational Shabad to clipboard!'); } catch (e) {}
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BACK NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════

    function setupNavigation() {
        const backBtn = document.getElementById('backBtn');
        if (backBtn && !backBtn._anhadBackWired) {
            backBtn.addEventListener('click', () => {
                if (window.anhadGoBack) window.anhadGoBack('../index.html');
                else if (window.history.length > 1) window.history.back();
                else window.location.href = '../index.html';
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HEADER SCROLL BEHAVIOR
    // ═══════════════════════════════════════════════════════════════════════════

    function setupHeaderScroll() {
        const header = document.getElementById('pageHeader');
        if (!header) return;

        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        }

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > 20) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        console.log('📚 ANHAD Learning & Library initializing...');

        loadJsonData();
        setupNavigation();
        setupThemeToggle();
        setupHeaderScroll();
        loadRandomQuote();
        setupQuoteRefresh();
        loadDailyWisdom();
        setupWisdomCycler();
        setupDailyQuiz();
        setupSearch();
        loadQuickStats();
        setupShabadCards();
        setupShareQuote();
        setupLangSwitch();

        console.log('✅ Learning & Library loaded');
    }

    // Register with smooth-navigation Page Init Lifecycle for 100% reliable SPA entry
    window.__anhadPageInit = window.__anhadPageInit || {};
    window.__anhadPageInit['/Insights/insights.html'] = init;
    window.__anhadPageInit['/Insights/insights'] = init;
    window.__anhadPageInit['/frontend/Insights/insights.html'] = init;
    window.__anhadPageInit['/frontend/Insights/insights'] = init;

    // Window globals for inline HTML event handlers
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.initInsights = init;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
