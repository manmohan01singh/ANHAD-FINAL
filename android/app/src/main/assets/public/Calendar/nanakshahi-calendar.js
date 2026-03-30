(function () {
  'use strict';

  class NanakshahiCalendar {
    constructor() {
      this.months = [
        { name: 'Chet', punjabi: 'ਚੇਤ', startDay: 14, startMonth: 2, days: 31 },
        { name: 'Vaisakh', punjabi: 'ਵੈਸਾਖ', startDay: 14, startMonth: 3, days: 31 },
        { name: 'Jeth', punjabi: 'ਜੇਠ', startDay: 15, startMonth: 4, days: 31 },
        { name: 'Harh', punjabi: 'ਹਾੜ', startDay: 15, startMonth: 5, days: 31 },
        { name: 'Sawan', punjabi: 'ਸਾਵਣ', startDay: 16, startMonth: 6, days: 31 },
        { name: 'Bhadon', punjabi: 'ਭਾਦੋਂ', startDay: 16, startMonth: 7, days: 30 },
        { name: 'Assu', punjabi: 'ਅੱਸੂ', startDay: 15, startMonth: 8, days: 30 },
        { name: 'Kattak', punjabi: 'ਕੱਤਕ', startDay: 15, startMonth: 9, days: 30 },
        { name: 'Maghar', punjabi: 'ਮੱਘਰ', startDay: 14, startMonth: 10, days: 30 },
        { name: 'Poh', punjabi: 'ਪੋਹ', startDay: 14, startMonth: 11, days: 30 },
        { name: 'Magh', punjabi: 'ਮਾਘ', startDay: 13, startMonth: 0, days: 30 },
        { name: 'Phagan', punjabi: 'ਫੱਗਣ', startDay: 12, startMonth: 1, days: 30 }
      ];
    }

    getNanakshahiYearForGregorian(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const day = d.getDate();

      let nsYear = year - 1468;
      if (month < 2 || (month === 2 && day < 14)) {
        nsYear -= 1;
      }
      return nsYear;
    }

    gregorianToNanakshahi(date) {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return null;

      const year = d.getFullYear();
      const startOfNsYear = new Date(year, 2, 14);

      let nsYear;
      let dayOffset;
      if (d >= startOfNsYear) {
        nsYear = year - 1468;
        dayOffset = Math.floor((d.getTime() - startOfNsYear.getTime()) / (24 * 60 * 60 * 1000));
      } else {
        nsYear = year - 1469;
        const prevStart = new Date(year - 1, 2, 14);
        dayOffset = Math.floor((d.getTime() - prevStart.getTime()) / (24 * 60 * 60 * 1000));
      }

      let monthIndex = 0;
      while (monthIndex < this.months.length && dayOffset >= this.months[monthIndex].days) {
        dayOffset -= this.months[monthIndex].days;
        monthIndex += 1;
      }

      const m = this.months[Math.min(monthIndex, this.months.length - 1)];
      return {
        year: nsYear,
        month: m.name,
        monthPunjabi: m.punjabi,
        day: dayOffset + 1
      };
    }

    nanakshahiToGregorian(nsYear, nsMonth, nsDay) {
      const year = Number(nsYear);
      const day = Number(nsDay);
      if (!Number.isFinite(year) || !Number.isFinite(day) || day < 1) return null;

      const monthIndex = this.resolveMonthIndex(nsMonth);
      if (monthIndex == null) return null;

      const gregYearStart = year + 1468;
      const start = new Date(gregYearStart, 2, 14);

      let offsetDays = day - 1;
      for (let i = 0; i < monthIndex; i += 1) {
        offsetDays += this.months[i].days;
      }

      const out = new Date(start);
      out.setDate(start.getDate() + offsetDays);
      return out;
    }

    resolveMonthIndex(nsMonth) {
      if (typeof nsMonth === 'number') {
        const idx = nsMonth - 1;
        return idx >= 0 && idx < 12 ? idx : null;
      }

      const key = String(nsMonth || '').trim().toLowerCase();
      if (!key) return null;

      const idx = this.months.findIndex((m) => m.name.toLowerCase() === key);
      return idx >= 0 ? idx : null;
    }

    formatISODate(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    }

    // For a given Gregorian year, try to map a Nanakshahi month/day to a date
    // that lies within that Gregorian year.
    nanakshahiMonthDayToGregorianInYear(gregorianYear, nsMonth, nsDay) {
      const nsYearA = gregorianYear - 1468;
      const nsYearB = gregorianYear - 1469;

      const a = this.nanakshahiToGregorian(nsYearA, nsMonth, nsDay);
      if (a && a.getFullYear() === gregorianYear) return a;

      const b = this.nanakshahiToGregorian(nsYearB, nsMonth, nsDay);
      if (b && b.getFullYear() === gregorianYear) return b;

      return null;
    }
  }

  window.NanakshahiCalendar = NanakshahiCalendar;
})();
