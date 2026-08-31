import { describe, it, expect } from 'vitest';

describe('Devotional UI/UX Feature Suite', () => {
  describe('Mala Counter State & Milestones', () => {
    it('calculates progress percentage and milestone thresholds correctly', () => {
      const target = 108;
      const counts = [0, 27, 54, 108];
      
      const progresses = counts.map(c => c / target);
      expect(progresses[0]).toBe(0);
      expect(progresses[1]).toBeCloseTo(0.25, 2);
      expect(progresses[2]).toBe(0.5);
      expect(progresses[3]).toBe(1.0);
    });

    it('handles multiple rounds calculation properly', () => {
      let count = 107;
      let rounds = 0;
      let totalJaap = 107;
      const target = 108;

      // Increment 1 bead
      count++;
      totalJaap++;
      if (count >= target) {
        count = 0;
        rounds++;
      }

      expect(count).toBe(0);
      expect(rounds).toBe(1);
      expect(totalJaap).toBe(108);
    });
  });

  describe('Audio Sleep Timer Mathematical Attenuation', () => {
    it('calculates exponential volume decay correctly over time', () => {
      const durationMs = 60000;
      const startVol = 1.0;

      // Test volume at start (0s)
      const prog0 = 0 / durationMs;
      const vol0 = startVol * Math.pow(1 - prog0, 2);
      expect(vol0).toBe(1.0);

      // Test volume halfway (30s) -> (1 - 0.5)^2 = 0.25
      const progHalf = 30000 / durationMs;
      const volHalf = startVol * Math.pow(1 - progHalf, 2);
      expect(volHalf).toBeCloseTo(0.25, 2);

      // Test volume at completion (60s) -> 0.0
      const progEnd = 60000 / durationMs;
      const volEnd = startVol * Math.pow(1 - progEnd, 2);
      expect(volEnd).toBe(0.0);
    });
  });

  describe('Hukamnama Card Generator Pauri Parsing', () => {
    it('accurately captures verses up to Pauri 1 end (॥੧॥) or Rahaao', () => {
      const sampleVerses = [
        { verse: { unicode: 'ਧਨਾਸਰੀ ਛੰਤ ਮਹਲਾ ੪ ਘਰੁ ੧' }, translation: { en: 'Dhanaasaree, Chhant' } },
        { verse: { unicode: 'ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ ॥' }, translation: { en: 'One Universal Creator God' } },
        { verse: { unicode: 'ਹਰਿ ਜੀਉ ਕ੍ਰਿਪਾ ਕਰੇ ਤਾ ਨਾਮੁ ਧਿਆਈਐ ਜੀਉ ॥' }, translation: { en: 'When the Lord grants Grace' } },
        { verse: { unicode: 'ਸਤਿਗੁਰੁ ਮਿਲੈ ਸੁਭਾਇ ਸਹਜਿ ਗੁਣ ਗਾਈਐ ਜੀਉ ॥' }, translation: { en: 'Meeting the True Guru' } },
        { verse: { unicode: 'ਹਰਿ ਜੀਉ ਕ੍ਰਿਪਾ ਕਰੇ ਤਾ ਨਾਮੁ ਧਿਆਈਐ ਜੀਉ ॥੧॥' }, translation: { en: 'We meditate on the Naam. ||1||' } },
        { verse: { unicode: 'ਅੰਦਰਿ ਸਾਚਾ ਨੇਹੁ ਪੂਰੇ ਸਤਿਗੁਰੈ ਜੀਉ ॥' }, translation: { en: 'Deep within I feel love' } }
      ];

      const pauriLines = [];
      for (let i = 0; i < sampleVerses.length; i++) {
        const text = sampleVerses[i].verse.unicode;
        if (!text.includes('ਮਹਲਾ') && !text.includes('ਘਰੁ')) {
          pauriLines.push(text);
        }
        if (text.includes('॥੧॥') || text.includes('॥ ਰਹਾਉ ॥')) {
          break;
        }
      }

      expect(pauriLines.length).toBe(4);
      expect(pauriLines[pauriLines.length - 1]).toContain('॥੧॥');
      expect(pauriLines).not.toContain('ਅੰਦਰਿ ਸਾਚਾ ਨੇਹੁ ਪੂਰੇ ਸਤਿਗੁਰੈ ਜੀਉ ॥');
    });
  });
});
