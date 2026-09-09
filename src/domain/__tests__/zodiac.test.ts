import { zodiacForMonthDay } from '../zodiac';

describe('zodiacForMonthDay', () => {
  describe('a representative day for each sign', () => {
    const cases: Array<[number, number, string]> = [
      [1, 5, 'Capricorn'],      // Jan 5 — Capricorn
      [2, 10, 'Aquarius'],      // Feb 10 — Aquarius
      [3, 10, 'Pisces'],        // Mar 10 — Pisces
      [4, 10, 'Aries'],         // Apr 10 — Aries
      [5, 10, 'Taurus'],        // May 10 — Taurus
      [6, 10, 'Gemini'],        // Jun 10 — Gemini
      [7, 10, 'Cancer'],        // Jul 10 — Cancer
      [8, 10, 'Leo'],           // Aug 10 — Leo
      [9, 10, 'Virgo'],         // Sep 10 — Virgo
      [10, 10, 'Libra'],        // Oct 10 — Libra
      [11, 10, 'Scorpio'],      // Nov 10 — Scorpio
      [12, 10, 'Sagittarius'],  // Dec 10 — Sagittarius
    ];

    it.each(cases)('%i/%i → %s', (month, day, expected) => {
      expect(zodiacForMonthDay(month, day)).toBe(expected);
    });
  });

  describe('cusp boundaries', () => {
    it('Capricorn ends Jan 19, Aquarius starts Jan 20', () => {
      expect(zodiacForMonthDay(1, 19)).toBe('Capricorn');
      expect(zodiacForMonthDay(1, 20)).toBe('Aquarius');
    });

    it('Aquarius ends Feb 18, Pisces starts Feb 19', () => {
      expect(zodiacForMonthDay(2, 18)).toBe('Aquarius');
      expect(zodiacForMonthDay(2, 19)).toBe('Pisces');
    });

    it('Pisces ends Mar 20, Aries starts Mar 21', () => {
      expect(zodiacForMonthDay(3, 20)).toBe('Pisces');
      expect(zodiacForMonthDay(3, 21)).toBe('Aries');
    });

    it('Aries ends Apr 19, Taurus starts Apr 20', () => {
      expect(zodiacForMonthDay(4, 19)).toBe('Aries');
      expect(zodiacForMonthDay(4, 20)).toBe('Taurus');
    });

    it('Taurus ends May 20, Gemini starts May 21', () => {
      expect(zodiacForMonthDay(5, 20)).toBe('Taurus');
      expect(zodiacForMonthDay(5, 21)).toBe('Gemini');
    });

    it('Gemini ends Jun 20, Cancer starts Jun 21', () => {
      expect(zodiacForMonthDay(6, 20)).toBe('Gemini');
      expect(zodiacForMonthDay(6, 21)).toBe('Cancer');
    });

    it('Cancer ends Jul 22, Leo starts Jul 23', () => {
      expect(zodiacForMonthDay(7, 22)).toBe('Cancer');
      expect(zodiacForMonthDay(7, 23)).toBe('Leo');
    });

    it('Leo ends Aug 22, Virgo starts Aug 23', () => {
      expect(zodiacForMonthDay(8, 22)).toBe('Leo');
      expect(zodiacForMonthDay(8, 23)).toBe('Virgo');
    });

    it('Virgo ends Sep 22, Libra starts Sep 23', () => {
      expect(zodiacForMonthDay(9, 22)).toBe('Virgo');
      expect(zodiacForMonthDay(9, 23)).toBe('Libra');
    });

    it('Libra ends Oct 22, Scorpio starts Oct 23', () => {
      expect(zodiacForMonthDay(10, 22)).toBe('Libra');
      expect(zodiacForMonthDay(10, 23)).toBe('Scorpio');
    });

    it('Scorpio ends Nov 21, Sagittarius starts Nov 22', () => {
      expect(zodiacForMonthDay(11, 21)).toBe('Scorpio');
      expect(zodiacForMonthDay(11, 22)).toBe('Sagittarius');
    });

    it('Sagittarius ends Dec 21, Capricorn starts Dec 22', () => {
      expect(zodiacForMonthDay(12, 21)).toBe('Sagittarius');
      expect(zodiacForMonthDay(12, 22)).toBe('Capricorn');
    });
  });

  describe('first and last day of every sign range', () => {
    it('Capricorn: Dec 22 → Jan 19', () => {
      expect(zodiacForMonthDay(12, 22)).toBe('Capricorn');
      expect(zodiacForMonthDay(1, 19)).toBe('Capricorn');
    });

    it('Sagittarius: Nov 22 → Dec 21', () => {
      expect(zodiacForMonthDay(11, 22)).toBe('Sagittarius');
      expect(zodiacForMonthDay(12, 21)).toBe('Sagittarius');
    });
  });

  describe('Feb 29 (leap day)', () => {
    it('Feb 29 falls in Pisces', () => {
      // Feb 29 sits between Feb 19 and Mar 20 → Pisces.
      expect(zodiacForMonthDay(2, 29)).toBe('Pisces');
    });
  });
});
