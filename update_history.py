import json

data = {
  "version": 2,
  "lastUpdated": "2026-07-23",
  "sections": {
    "guruSahibaan": {
      "en": {
        "title": "☬ Dhan Dhan Sri Guru Sahibaan (11 Living Gurus)",
        "intro": "ੴ Satgur Prasad. From Dhan Dhan Sri Guru Nanak Dev Ji Maharaj to Dhan Dhan Sri Guru Gobind Singh Ji Sahib, the ten divine lights illuminated humanity with eternal truth, divine love, and supreme sacrifice. In 1708, Sri Guru Gobind Singh Ji Sahib bestowed the eternal Guruship upon Dhan Dhan Sri Guru Granth Sahib Ji Maharaj, the eternal living light for all eternity."
      },
      "pa": {
        "title": "☬ ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਸਾਹਿਬਾਨ (੧੧ ਪਾਵਨ ਗੁਰੂ ਜੋਤਿ)",
        "intro": "ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ॥ ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਮਹਾਰਾਜ ਤੋਂ ਲੈ ਕੇ ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ ਸਾਹਿਬ ਤੱਕ, ਦਸੇ ਗੁਰੂ ਜੋਤਾਂ ਨੇ ਮਾਨਵਤਾ ਨੂੰ ਨਾਮ ਸਿਮਰਨ, ਪਰਮ ਪਵਿੱਤਰ ਲੰਗਰ, ਅਤੇ ਰੂਹਾਨੀ ਗਿਆਨ ਦਾ ਮਾਰਗ ਬਖਸ਼ਿਆ। ੧੭੦੮ ਈ: ਵਿੱਚ ਸਾਹਿਬ ਸ਼੍ਰੀ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ ਨੇ ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਮਹਾਰਾਜ ਨੂੰ ਸਦੀਵੀ ਗੁਰਗੱਦੀ ਬਖਸ਼ ਕੇ ਜੁਗੋ ਜੁਗ ਅਟੱਲ ਗੁਰੂ ਥਾਪਿਆ।"
      },
      "hi": {
        "title": "☬ धन्य धन्य श्री गुरु साहिबान (११ पावन गुरु जोति)",
        "intro": "ੴ सतिगुर प्रसादि ॥ धन्य धन्य श्री गुरु नानक देव जी महाराज से लेकर धन्य धन्य श्री गुरु गोबिंद सिंह जी साहिब तक, दसों गुरु जोतों ने मानवता को नाम सुमिरन, परम पवित्र लंगर और रूहानी ज्ञान का मार्ग बख्शा। १७०८ ईस्वी में साहिब श्री गुरु गोबिंद सिंह जी ने धन्य धन्य श्री गुरु ग्रंथ साहिब जी महाराज को सदीवी गुरुगद्दी बख्श कर जुगो जुग अटल गुरु स्थापित किया।"
      }
    },
    "sikhHistory": {
      "en": {
        "title": "☬ Sacred Sikh History & Divine Heritage",
        "intro": "The history of Gursikhi is a sacred saga of divine devotion, unshakeable faith, supreme martyrdom (Shaheedi), and eternal grace. Every page of Sikh history shines with the blessings of Dhan Dhan Sri Guru Granth Sahib Ji Maharaj and the sacrifice of beloved Gursikhs.",
        "chapters": [
          {
            "title": "🙏 The Divine Manifestation of Sri Guru Nanak Dev Ji (1469)",
            "titlePa": "🙏 ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਮਹਾਰਾਜ ਦਾ ਪਾਵਨ ਅਵਤਾਰ (੧੪੬੯)",
            "titleHi": "🙏 धन्य धन्य श्री गुरु नानक देव जी महाराज का पावन अवतार (१४६९)",
            "desc": "Dhan Dhan Sri Guru Nanak Dev Ji Maharaj manifested in Rai Bhoi Di Talwandi (Nankana Sahib). Guru Ji traveled thousands of miles across four sacred Udasis to dissipate darkness and bestow Ik Onkar, Naam Japna, Kirat Karna, and Vand Chhakna to humanity.",
            "descPa": "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਮਹਾਰਾਜ ਨੇ ਰਾਇ ਭੋਈ ਦੀ ਤਲਵੰਡੀ (ਨਨਕਾਣਾ ਸਾਹਿਬ) ਅਵਤਾਰ ਧਾਰਿਆ। ਸਤਿਗੁਰੂ ਜੀ ਨੇ ਚਾਰ ਪਾਵਨ ਉਦਾਸੀਆਂ ਰਾਹੀਂ ਧਰਤੀ ਦਾ ਉੱਧਾਰ ਕੀਤਾ ਅਤੇ ਮਾਨਵਤਾ ਨੂੰ 'ਇੱਕ ਓਅੰਕਾਰ', ਨਾਮ ਜਪਣਾ, ਕਿਰਤ ਕਰਨਾ ਅਤੇ ਵੰਡ ਛਕਣਾ ਬਖਸ਼ਿਆ।",
            "descHi": "धन्य धन्य श्री गुरु नानक देव जी महाराज ने राय भोई दी तलवंडी (ननकाना साहिब) अवतार धारा। सतिगुरु जी ने चार पावन उदासियों द्वारा धरती का उद्धार किया और मानवता को 'इक ओंकार', नाम जपना, किरत करना और वंड छकना बख्शा।"
          },
          {
            "title": "📖 Compilation of Adi Granth Sahib Ji by Sri Guru Arjan Dev Ji (1604)",
            "titlePa": "📖 ਸ਼੍ਰੀ ਆਦਿ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਦਾ ਪਾਵਨ ਸੰਕਲਨ (੧੬੦੪)",
            "titleHi": "📖 श्री आदि ग्रंथ साहिब जी का पावन संकलन (१६०४)",
            "desc": "Dhan Dhan Sri Guru Arjan Dev Ji Maharaj compiled the sacred Adi Granth Sahib Ji at Sri Amritsar Sahib, enshrining the divine hymns of the Gurus, Bhagats, and Bhatts. The Holy Granth was reverently installed at Sri Harmandir Sahib with Baba Buddha Ji as first Granthi Sahib.",
            "descPa": "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ ਮਹਾਰਾਜ ਨੇ ਸ਼੍ਰੀ ਅੰਮ੍ਰਿਤਸਰ ਸਾਹਿਬ ਵਿਖੇ ਪਾਵਨ ਆਦਿ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਦਾ ਸੰਕਲਨ ਕੀਤਾ। ਪਾਵਨ ਬੀੜ ਨੂੰ ਪਰਮ ਅਦਬ ਨਾਲ ਸ਼੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਵਿਖੇ ਪ੍ਰਕਾਸ਼ਿਤ ਕੀਤਾ ਗਿਆ ਅਤੇ ਬਾਬਾ ਬੁੱਢਾ ਜੀ ਪਹਿਲੇ ਹੈੱਡ ਗ੍ਰੰਥੀ ਸਾਹਿਬ ਥਾਪੇ ਗਏ।",
            "descHi": "धन्य धन्य श्री गुरु अर्जन देव जी महाराज ने श्री अमृतसर साहिब में पावन आदि ग्रंथ साहिब जी का संकलन किया। पावन बीड़ को परम अदब के साथ श्री हरिमंदिर साहिब में प्रकाशित किया गया और बाबा बुड्ढा जी प्रथम हेड ग्रंथी साहिब स्थापित किए गए।"
          },
          {
            "title": "🛡️ Miri-Piri & Akal Takht Sahib by Sri Guru Hargobind Sahib Ji (1606)",
            "titlePa": "🛡️ ਮੀਰੀ-ਪੀਰੀ ਅਤੇ ਸ਼੍ਰੀ ਅਕਾਲ ਤਖ਼ਤ ਸਾਹਿਬ ਜੀ ਦੀ ਸਿਰਜਣਾ (੧੬੦੬)",
            "titleHi": "🛡️ मीरी-पीरी और श्री अकाल तख्त साहिब जी की सृजना (१६०६)",
            "desc": "Dhan Dhan Sri Guru Hargobind Sahib Ji Maharaj donned the two sacred swords of Miri (temporal responsibility) and Piri (spiritual wisdom), establishing Sri Akal Takht Sahib as the supreme throne of sovereignty and justice for the Khalsa.",
            "descPa": "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਹਰਿਗੋਬਿੰਦ ਸਾਹਿਬ ਜੀ ਮਹਾਰਾਜ ਨੇ ਮੀਰੀ ਅਤੇ ਪੀਰੀ ਦੀਆਂ ਦੋ ਪਾਵਨ ਕਿਰਪਾਨਾਂ ਧਾਰਨ ਕੀਤੀਆਂ ਅਤੇ ਸ਼੍ਰੀ ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਦੇ ਸਨਮੁਖ ਸ਼੍ਰੀ ਅਕਾਲ ਤਖ਼ਤ ਸਾਹਿਬ ਜੀ ਦੀ ਸਥਾਪਨਾ ਕਰਕੇ ਭਗਤੀ ਅਤੇ ਸ਼ਕਤੀ ਦਾ ਸੁਮੇਲ ਕੀਤਾ।",
            "descHi": "धन्य धन्य श्री गुरु हरगोबिंद साहिब जी महाराज ने मीरी और पीरी की दो पावन कृपाणें धारण कीं और श्री हरिमंदिर साहिब के समक्ष श्री अकाल तख्त साहिब जी की स्थापना करके भक्ति और शक्ति का सुमेल किया।"
          },
          {
            "title": "🌸 Supreme Sacrifice of Hind Di Chadar Sri Guru Tegh Bahadur Ji (1675)",
            "titlePa": "🌸 ਹਿੰਦ ਦੀ ਚਾਦਰ ਸ਼੍ਰੀ ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਸਾਹਿਬ ਜੀ ਦੀ ਪਰਮ ਸ਼ਹੀਦੀ (੧੬੭੫)",
            "titleHi": "🌸 हिंद दी चादर श्री गुरु तेग बहादुर साहिब जी की परम शहीदी (१६७५)",
            "desc": "Dhan Dhan Sri Guru Tegh Bahadur Sahib Ji Maharaj gave His sacred head at Chandni Chowk, Delhi, to uphold humanity's right to freedom of conscience and religious belief, immortalized as 'Hind Di Chadar'.",
            "descPa": "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਸਾਹਿਬ ਜੀ ਮਹਾਰਾਜ ਨੇ ਧਰਮ ਅਤੇ ਮਾਨਵਤਾ ਦੀ ਰੱਖਿਆ ਲਈ ਚਾਂਦਨੀ ਚੌਂਕ ਦਿੱਲੀ ਵਿਖੇ ਆਪਣਾ ਸੀਸ ਕੁਰਬਾਨ ਕਰਕੇ 'ਹਿੰਦ ਦੀ ਚਾਦਰ' ਅਖਵਾਏ।",
            "descHi": "धन्य धन्य श्री गुरु तेग बहादुर साहिब जी महाराज ने धर्म और मानवता की रक्षा के लिए चांदनी चौक दिल्ली में अपना शीश कुर्बान करके 'हिंद दी चादर' कहलाए।"
          },
          {
            "title": "⚔️ Creation of Khalsa Panth by Sri Guru Gobind Singh Ji (1699)",
            "titlePa": "⚔️ ਸ਼੍ਰੀ ਅਨੰਦਪੁਰ ਸਾਹਿਬ ਵਿਖੇ ਖਾਲਸਾ ਪੰਥ ਦੀ ਸਾਜਨਾ (੧੬੯੯)",
            "titleHi": "⚔️ श्री आनंदपुर साहिब में खालसा पंथ की स्थापना (१६९९)",
            "desc": "On Vaisakhi 1699 at Takht Sri Keshgarh Sahib, Dhan Dhan Sri Guru Gobind Singh Ji Sahib prepared Khande Di Pahul (Amrit) and created the Khalsa Panth, bestowing 5 Kakars and the names Singh and Kaur.",
            "descPa": "ਵਿਸਾਖੀ ੧੬੯੯ ਨੂੰ ਤਖ਼ਤ ਸ਼੍ਰੀ ਕੇਸਗੜ੍ਹ ਸਾਹਿਬ ਵਿਖੇ ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ ਸਾਹਿਬ ਨੇ ਖੰਡੇ ਬਾਟੇ ਦੀ ਪਾਹੁਲ (ਅੰਮ੍ਰਿਤ) ਤਿਆਰ ਕਰਕੇ ਪੰਜ ਪਿਆਰਿਆਂ ਨੂੰ ਛਕਾਇਆ ਅਤੇ ਖਾਲਸਾ ਪੰਥ ਦੀ ਸਾਜਨਾ ਕੀਤੀ।",
            "descHi": "वैशाखी १६९९ को तख्त श्री केसगढ़ साहिब में धन्य धन्य श्री गुरु गोबिंद सिंह जी साहिब ने खंडे बाटे की पाहुल (अमृत) तैयार करके पंच प्यारों को छकाया और खालसा पंथ की स्थापना की।"
          },
          {
            "title": "☬ Eternal Guruship to Sri Guru Granth Sahib Ji Maharaj (1708)",
            "titlePa": "☬ ਸ਼੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਮਹਾਰਾਜ ਨੂੰ ਸਦੀਵੀ ਗੁਰਗੱਦੀ (੧੭੦੮)",
            "titleHi": "☬ श्री गुरु ग्रंथ साहिब जी महाराज को सदीवी गुरुगद्दी (१७०८)",
            "desc": "At Takht Sri Hazur Sahib (Nanded), Kalgidhar Patshah Sri Guru Gobind Singh Ji Sahib bowed before Sri Guru Granth Sahib Ji Maharaj and proclaimed: 'Sab Sikhan Ko Hukama Hai Guru Maneyo Granth.'",
            "descPa": "ਤਖ਼ਤ ਸ਼੍ਰੀ ਹਜ਼ੂਰ ਸਾਹਿਬ ਨਾਂਦੇੜ ਵਿਖੇ ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ ਸਾਹਿਬ ਨੇ ਸ਼੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਮਹਾਰਾਜ ਅੱਗੇ ਮੱਥਾ ਟੇਕ ਕੇ ਹੁਕਮ ਦਿੱਤਾ: 'ਸਭ ਸਿੱਖਨ ਕੋ ਹੁਕਮੁ ਹੈ ਗੁਰੂ ਮਾਨਿਓ ਗ੍ਰੰਥ'॥",
            "descHi": "तख्त श्री हजूर साहिब नांदेड में धन्य धन्य श्री गुरु गोबिंद सिंह जी साहिब ने श्री गुरु ग्रंथ साहिब जी महाराज के आगे माथा टेक कर हुकम दिया: 'सभ सिक्खन को हुकमु है गुरु मानिओ ग्रंथ'॥"
          }
        ]
      }
    }
  }
}

with open('c:/Users/Manmohan Singh/OneDrive/Desktop/APP/ANHAD-FINAL/frontend/Insights/data/sikh-history.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Updated sikh-history.json with rich devotional text')
