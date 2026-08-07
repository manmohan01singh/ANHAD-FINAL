import json

file_path = 'c:/Users/Manmohan Singh/OneDrive/Desktop/APP/ANHAD-FINAL/frontend/Insights/data/guru-sahibaan.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

gurus = data.get('guruSahibaan', {}).get('en', {}).get('gurus', [])

title_map_en = {
    1: "Dhan Dhan Sri Guru Nanak Dev Ji Maharaj",
    2: "Dhan Dhan Sri Guru Angad Dev Ji Maharaj",
    3: "Dhan Dhan Sri Guru Amar Das Ji Maharaj",
    4: "Dhan Dhan Sri Guru Ram Das Ji Maharaj",
    5: "Dhan Dhan Sri Guru Arjan Dev Ji Maharaj",
    6: "Dhan Dhan Sri Guru Hargobind Sahib Ji Maharaj",
    7: "Dhan Dhan Sri Guru Har Rai Sahib Ji Maharaj",
    8: "Dhan Dhan Sri Guru Har Krishan Sahib Ji Maharaj",
    9: "Dhan Dhan Sri Guru Tegh Bahadur Sahib Ji Maharaj",
    10: "Dhan Dhan Sri Guru Gobind Singh Ji Sahib",
    11: "Dhan Dhan Sri Guru Granth Sahib Ji Maharaj"
}

title_map_pa = {
    1: "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਨਾਨਕ ਦੇਵ ਜੀ ਮਹਾਰਾਜ",
    2: "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਅੰਗਦ ਦੇਵ ਜੀ ਮਹਾਰਾਜ",
    3: "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਅਮਰ ਦਾਸ ਜੀ ਮਹਾਰਾਜ",
    4: "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਰਾਮ ਦਾਸ ਜੀ ਮਹਾਰਾਜ",
    5: "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ ਮਹਾਰਾਜ",
    6: "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਹਰਿਗੋਬਿੰਦ ਸਾਹਿਬ ਜੀ ਮਹਾਰਾਜ",
    7: "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਹਰਿ ਰਾਇ ਸਾਹਿਬ ਜੀ ਮਹਾਰਾਜ",
    8: "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਹਰਿ ਕ੍ਰਿਸ਼ਨ ਸਾਹਿਬ ਜੀ ਮਹਾਰਾਜ",
    9: "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਸਾਹਿਬ ਜੀ ਮਹਾਰਾਜ",
    10: "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ ਸਾਹਿਬ",
    11: "ਧੰਨ ਧੰਨ ਸ਼੍ਰੀ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਮਹਾਰਾਜ"
}

title_map_hi = {
    1: "धन्य धन्य श्री गुरु नानक देव जी महाराज",
    2: "धन्य धन्य श्री गुरु अंगद देव जी महाराज",
    3: "धन्य धन्य श्री गुरु अमर दास जी महाराज",
    4: "धन्य धन्य श्री गुरु राम दास जी महाराज",
    5: "धन्य धन्य श्री गुरु अर्जन देव जी महाराज",
    6: "धन्य धन्य श्री गुरु हरगोबिंद साहिब जी महाराज",
    7: "धन्य धन्य श्री गुरु हर राय साहिब जी महाराज",
    8: "धन्य धन्य श्री गुरु हर कृष्ण साहिब जी महाराज",
    9: "धन्य धन्य श्री गुरु तेग बहादुर साहिब जी महाराज",
    10: "धन्य धन्य श्री गुरु गोबिंद सिंह जी साहिब",
    11: "धन्य धन्य श्री गुरु ग्रंथ साहिब जी महाराज"
}

for g in gurus:
    gid = g.get('id', 0)
    if gid in title_map_en:
        g['name'] = title_map_en[gid]
        g['english'] = title_map_en[gid]
        g['namePunjabi'] = title_map_pa[gid]
        g['nameHindi'] = title_map_hi[gid]

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Successfully updated guru-sahibaan.json with respectful Gurmukh titles')
