/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD Learning & Library — Premium Knowledge Hub
 * Famous for Gursikhi Knowledge
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA — 31 Classical Raags
    // ═══════════════════════════════════════════════════════════════════════════

    const RAAGS = [
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

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA — 35 Contributors
    // ═══════════════════════════════════════════════════════════════════════════

    const CONTRIBUTORS = [
        { name: "Guru Nanak Dev Ji", type: "Guru", shabads: 974, emoji: "🙏" },
        { name: "Guru Angad Dev Ji", type: "Guru", shabads: 62, emoji: "🙏" },
        { name: "Guru Amar Das Ji", type: "Guru", shabads: 907, emoji: "🙏" },
        { name: "Guru Ram Das Ji", type: "Guru", shabads: 679, emoji: "🙏" },
        { name: "Guru Arjan Dev Ji", type: "Guru", shabads: 2218, emoji: "🙏" },
        { name: "Guru Tegh Bahadur Ji", type: "Guru", shabads: 116, emoji: "🙏" },
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
        { name: "Bhatt Kal Sahar", type: "Bhatt", shabads: 54, emoji: "✨" },
        { name: "Bhatt Gyand", type: "Bhatt", shabads: 13, emoji: "✨" },
        { name: "Bhatt Balh", type: "Bhatt", shabads: 5, emoji: "✨" },
        { name: "Bhai Mardana Ji", type: "Sikh", shabads: 3, emoji: "🎵" },
        { name: "Bhai Satta Ji", type: "Sikh", shabads: 1, emoji: "🎵" },
        { name: "Bhai Sundar Ji", type: "Sikh", shabads: 6, emoji: "🎵" }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA — Spiritual Themes
    // ═══════════════════════════════════════════════════════════════════════════

    const THEMES = [
        { title: "Divine Love (ਪ੍ਰੇਮ)", emoji: "💕", desc: "The profound spiritual love between the soul and Waheguru. True love transcends attachment and ego." },
        { title: "Devotion (ਭਗਤੀ)", emoji: "🙏", desc: "Complete surrender to the One through naam simran, kirtan, and seva." },
        { title: "Divine Wisdom (ਗਿਆਨ)", emoji: "💎", desc: "Spiritual knowledge that reveals the nature of reality and the soul." },
        { title: "Humility (ਨਿਮਰਤਾ)", emoji: "🪷", desc: "The foundation of all virtues. True greatness lies in serving others." },
        { title: "Contentment (ਸੰਤੋਖ)", emoji: "☮️", desc: "Finding peace in Waheguru's will. Freedom from endless desires." },
        { title: "Compassion (ਦਇਆ)", emoji: "❤️", desc: "Kindness and care for all creation. Seeing Waheguru in every being." },
        { title: "Truth (ਸਤ)", emoji: "✨", desc: "Living in truthfulness of thought, word, and deed." },
        { title: "Detachment (ਵੈਰਾਗ)", emoji: "🕊️", desc: "Freedom from worldly attachments while living in the world." }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA — 10 Guru Sahibaan
    // ═══════════════════════════════════════════════════════════════════════════

    const GURU_SAHIBAAN = [
        { name: "ਸ੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ", english: "Sri Guru Nanak Dev Ji", years: "1469–1539", desc: "Founder of Sikhi. Taught the Oneness of God, equality of all humanity, and the practice of honest living." },
        { name: "ਸ੍ਰੀ ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ", english: "Sri Guru Angad Dev Ji", years: "1504–1552", desc: "Standardized the Gurmukhi script, promoted physical fitness through Mall Akhara." },
        { name: "ਸ੍ਰੀ ਗੁਰੂ ਅਮਰ ਦਾਸ ਜੀ", english: "Sri Guru Amar Das Ji", years: "1479–1574", desc: "Established the Manji system, abolished sati, and instituted the Langar tradition." },
        { name: "ਸ੍ਰੀ ਗੁਰੂ ਰਾਮ ਦਾਸ ਜੀ", english: "Sri Guru Ram Das Ji", years: "1534–1581", desc: "Founded the city of Amritsar, composed the Laavan for Anand Karaj." },
        { name: "ਸ੍ਰੀ ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ", english: "Sri Guru Arjan Dev Ji", years: "1563–1606", desc: "Compiled the Adi Granth, built Sri Harmandir Sahib Ji. First Sikh martyr." },
        { name: "ਸ੍ਰੀ ਗੁਰੂ ਹਰਗੋਬਿੰਦ ਸਾਹਿਬ ਜੀ", english: "Sri Guru Hargobind Sahib Ji", years: "1595–1644", desc: "Introduced Miri-Piri concept, wore two swords of spiritual and temporal authority." },
        { name: "ਸ੍ਰੀ ਗੁਰੂ ਹਰ ਰਾਇ ਸਾਹਿਬ ਜੀ", english: "Sri Guru Har Rai Sahib Ji", years: "1630–1661", desc: "Known for compassion, maintained a large cavalry, ran free medical clinics." },
        { name: "ਸ੍ਰੀ ਗੁਰੂ ਹਰ ਕ੍ਰਿਸ਼ਨ ਸਾਹਿਬ ਜੀ", english: "Sri Guru Har Krishan Sahib Ji", years: "1656–1664", desc: "Youngest Guru, healed the sick during a smallpox epidemic in Delhi." },
        { name: "ਸ੍ਰੀ ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਸਾਹਿਬ ਜੀ", english: "Sri Guru Tegh Bahadur Sahib Ji", years: "1621–1675", desc: "Hind Di Chadar — gave his life to protect religious freedom for all." },
        { name: "ਸ੍ਰੀ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਸਾਹਿਬ ਜੀ", english: "Sri Guru Gobind Singh Sahib Ji", years: "1666–1708", desc: "Created the Khalsa, finalized Sri Guru Granth Sahib Ji as the eternal Guru." }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA — Famous Sakhis (Stories)
    // ═══════════════════════════════════════════════════════════════════════════

    const SAKHIS = [
        { title: "ਸੱਚਾ ਸੌਦਾ — The True Deal", guru: "Guru Nanak Dev Ji", desc: "Young Nanak was given 20 rupees by his father to make a profitable trade. Instead, he spent it feeding hungry sadhus, calling it the truest deal of all." },
        { title: "ਮੱਕੇ ਵਿੱਚ ਪੈਰ — Feet Towards Mecca", guru: "Guru Nanak Dev Ji", desc: "When asked why his feet pointed towards the Kaaba, Guru Ji replied: 'Turn my feet where God is not.' The Kaaba appeared wherever they turned his feet." },
        { title: "ਮਲਿਕ ਭਾਗੋ ਅਤੇ ਲਾਲੋ — Rich vs Honest", guru: "Guru Nanak Dev Ji", desc: "Guru Ji squeezed Malik Bhago's food (blood dripped) and Bhai Lalo's (milk dripped), showing honest earnings are more sacred than ill-gotten wealth." },
        { title: "ਬਾਬਾ ਬੁੱਢਾ ਜੀ ਦੀ ਅਸੀਸ", guru: "Guru Hargobind Sahib Ji", desc: "Baba Buddha Ji blessed the sixth Guru with both swords of Miri and Piri, prophesying that Guru Hargobind Sahib Ji would be a warrior-saint." },
        { title: "ਚਾਰ ਸਾਹਿਬਜ਼ਾਦੇ — The Four Princes", guru: "Guru Gobind Singh Ji", desc: "The supreme sacrifice of Guru Gobind Singh Ji's four sons — two eldest martyred in battle at Chamkaur, two youngest bricked alive at Sirhind." },
        { title: "ਅੰਮ੍ਰਿਤ ਸੰਚਾਰ — Birth of Khalsa (1699)", guru: "Guru Gobind Singh Ji", desc: "At Vaisakhi 1699, Guru Ji asked for heads. Five beloved ones (Panj Pyare) stepped forward. The Khalsa was born — baptized with Amrit." },
        { title: "ਬੰਦਾ ਸਿੰਘ ਬਹਾਦਰ", guru: "Khalsa", desc: "After Guru Gobind Singh Ji, Banda Singh Bahadur led the Khalsa army to establish the first Sikh rule, punishing the oppressors of Sirhind." },
        { title: "ਭਾਈ ਤਾਰੂ ਸਿੰਘ ਜੀ", guru: "Khalsa", desc: "Rather than cut his hair, Bhai Taru Singh Ji chose to have his scalp removed. His faith remained unshaken, inspiring generations." }
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA — History (Multi-language)
    // ═══════════════════════════════════════════════════════════════════════════

    const HISTORY = {
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

    window.openModal = function (type) {
        const modal = document.getElementById('insightModal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');
        const langSwitch = document.getElementById('langSwitch');
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
                title.textContent = '💕 Spiritual Themes';
                body.innerHTML = renderThemes();
                break;
            case 'history':
                title.textContent = '📜 Sikh History';
                langSwitch.style.display = 'flex';
                body.innerHTML = renderHistory(currentLang);
                setupLangSwitch();
                break;
            case 'sakhis':
                title.textContent = '📕 Famous Sakhis';
                body.innerHTML = renderSakhis();
                break;
            case 'guruSahibs':
                title.textContent = '🙏 10 Guru Sahib Ji';
                body.innerHTML = renderGuruSahibaan();
                break;
        }

        modal.classList.add('insight-modal--active');
        document.body.style.overflow = 'hidden';
    };

    window.closeModal = function () {
        const modal = document.getElementById('insightModal');
        modal.classList.remove('insight-modal--active');
        document.body.style.overflow = '';
    };

    function renderRaags() {
        return `<div class="modal-list">${RAAGS.map(r => `
            <div class="modal-list-item">
                <div><div class="modal-list-item__name">🎵 ${r.name}</div></div>
                <span class="modal-list-item__count">${r.shabads} shabads</span>
            </div>`).join('')}</div>`;
    }

    function renderContributors() {
        const groups = { Guru: [], Bhagat: [], Bhatt: [], Sikh: [] };
        CONTRIBUTORS.forEach(c => (groups[c.type] || []).push(c));
        return Object.entries(groups).map(([type, items]) => `
            <h4 style="margin: 16px 0 8px; color: var(--gold-400);">${type === 'Guru' ? '🙏 Gurus' : type === 'Bhagat' ? '📿 Bhagats' : type === 'Bhatt' ? '✨ Bhatts' : '🎵 Sikhs'}</h4>
            <div class="modal-list">${items.map(c => `
                <div class="modal-list-item">
                    <div><div class="modal-list-item__name">${c.emoji} ${c.name}</div><div class="modal-list-item__info">${c.type}</div></div>
                    <span class="modal-list-item__count">${c.shabads}</span>
                </div>`).join('')}</div>`).join('');
    }

    function renderThemes() {
        return THEMES.map(t => `
            <div class="theme-card">
                <div class="theme-card__title">${t.emoji} ${t.title}</div>
                <div class="theme-card__desc">${t.desc}</div>
            </div>`).join('');
    }

    function renderHistory(lang) {
        return `<div class="history-content">${HISTORY[lang]}</div>`;
    }

    function renderSakhis() {
        return SAKHIS.map(s => `
            <div class="theme-card" style="margin-bottom: 12px;">
                <div class="theme-card__title">${s.title}</div>
                <div style="font-size: 12px; color: var(--gold-400); margin: 4px 0 8px;">${s.guru}</div>
                <div class="theme-card__desc">${s.desc}</div>
            </div>`).join('');
    }

    function renderGuruSahibaan() {
        return GURU_SAHIBAAN.map((g, i) => `
            <div class="theme-card" style="margin-bottom: 12px;">
                <div class="theme-card__title">🙏 ${g.english}</div>
                <div style="font-size: 14px; font-weight: 600; color: var(--gold-400); margin: 2px 0;">${g.name}</div>
                <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 6px;">${g.years}</div>
                <div class="theme-card__desc">${g.desc}</div>
            </div>`).join('');
    }

    function setupLangSwitch() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('lang-btn--active'));
                btn.classList.add('lang-btn--active');
                currentLang = btn.dataset.lang;
                document.getElementById('modalBody').innerHTML = renderHistory(currentLang);
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
        if (m) m.textContent = `📖 Ang ${q.ang}`;
    }

    function loadDailyWisdom() {
        const dayIndex = new Date().getDate() % DAILY_WISDOM.length;
        const w = DAILY_WISDOM[dayIndex];
        const icon = document.querySelector('.wisdom-icon');
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
            
            // Toggle the class
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark-mode');
            } else {
                document.documentElement.classList.remove('dark-mode');
            }
            
            // Save to localStorage
            localStorage.setItem('anhad_theme', newTheme);
            
            // Dispatch theme change event
            window.dispatchEvent(new CustomEvent('themechange'));
            
            updateIcon();
            
            // Also try global theme if available
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

        // Merge Sehaj Paath angs from both sources
        const sehajAngs = sehajStats.totalAngsRead || (stats.sehajPaath?.totalAngsRead) || 0;
        const weeklyAngs = sehajStats.todayAngsRead || Math.round((sehajAngs / Math.max(totalDays, 7)) * 7);
        
        // Best streak from Sehaj Paath or general streak
        const bestStreak = Math.max(
            sehajStats.currentStreak || 0,
            streak.currentStreak || 0,
            stats.sehajPaath?.currentStreak || 0
        );

        const wl = document.getElementById('weeklyListening');
        const wa = document.getElementById('weeklyAngs');
        const cs = document.getElementById('currentStreak');
        if (wl) wl.textContent = weeklyHours;
        if (wa) wa.textContent = weeklyAngs;
        if (cs) cs.textContent = bestStreak;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHABAD NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════

    function setupShabadCards() {
        document.querySelectorAll('.shabad-card').forEach(card => {
            card.addEventListener('click', () => {
                const ang = card.dataset.ang;
                if (ang) window.location.href = `../SehajPaath/reader.html?ang=${ang}&source=learning`;
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
            const shareText = `"${text}"\n\n${trans}\n\n— Sri Guru Granth Sahib Ji | ANHAD`;

            if (navigator.share) {
                try { await navigator.share({ title: 'Gurbani', text: shareText }); } catch (e) {}
            } else {
                try { await navigator.clipboard.writeText(shareText); alert('Copied to clipboard!'); } catch (e) {}
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BACK NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════

    function setupNavigation() {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.history.length > 1) window.history.back();
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

        // Check scroll position on load
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        }

        // Add scroll listener with throttling
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

        setupNavigation();
        setupThemeToggle();
        setupHeaderScroll();
        loadRandomQuote();
        loadDailyWisdom();
        loadQuickStats();
        setupShabadCards();
        setupShareQuote();

        console.log('✅ Learning & Library loaded');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
