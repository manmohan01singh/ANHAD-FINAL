const fs = require('fs');

const dataFile = 'c:\\right\\ANHAD\\frontend\\data\\gurpurab-events-2026.json';
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

data.years['2026'].forEach(event => {
    if (!event.description_en) {
        if (event.type === 'prakash') {
            event.description_en = `This auspicious day marks the Prakash Purab (birth anniversary) of ${event.name_en}. This day is celebrated with devotion, reading of Gurbani, and Kirtan in Gurdwaras globally.`;
        } else if (event.type === 'shaheedi') {
            event.description_en = `This day is observed as the Shaheedi Purab (martyrdom day) of ${event.name_en}. It honors their supreme sacrifice for truth, righteousness, and the Sikh panth.`;
        } else if (event.type === 'gurgaddi') {
            event.description_en = `This sacred day commemorates the Gurgaddi Diwas (ascension to Guruship) of ${event.name_en}. It marks the passing of the divine light of Guru Nanak to the successive Guru.`;
        } else if (event.type === 'sangrand') {
            event.description_en = `Sangrand marks the beginning of the new month in the Nanakshahi solar calendar. Sikh devotees gather and read the spiritual hymns of the respective month.`;
        } else {
            event.description_en = `This historical day commemorates ${event.name_en}. It holds significant spiritual and historical importance in Sikh history, reflecting the core teachings of Sikhism.`;
        }
    }
});

fs.writeFileSync(dataFile, JSON.stringify(data, null, 4), 'utf8');
console.log('Descriptions added to gurpurab-events-2026.json');
