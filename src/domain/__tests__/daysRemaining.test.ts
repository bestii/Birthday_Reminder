import { daysRemaining, daysRemainingFromToday } from '../daysRemaining';

describe('daysRemaining', () => {
  describe('same-day', () => {
    it('returns 0 when the date is today', () => {
      expect(daysRemaining('2024-06-15', new Date(2024, 5, 15))).toBe(0);
    });
  });

  describe('counting forward', () => {
    it('returns 1 for tomorrow', () => {
      expect(daysRemaining('2024-06-16', new Date(2024, 5, 15))).toBe(1);
    });

    it('returns positive days for a date later in the same year', () => {
      expect(daysRemaining('2024-12-25', new Date(2024, 0, 1))).toBe(359);
    });
  });

  describe('wrapping to next year', () => {
    it('wraps to next year once the date has passed', () => {
      // Jan 1, 2024 reference. Target annual event is Dec 31.
      // The next occurrence is Dec 31, 2024 — 365 days later (2024 is leap).
      expect(daysRemaining('2023-12-31', new Date(2024, 0, 1))).toBe(365);
    });

    it('wraps a date passed by a single day', () => {
      // Yesterday
      expect(daysRemaining('2024-06-14', new Date(2024, 5, 15))).toBe(364);
    });
  });

  describe('Feb 29 leap-day handling', () => {
    it('observes Feb 28 in non-leap years', () => {
      // 2023 is not a leap year. Reference is Feb 27, 2023.
      // The Feb 29 event is observed on Feb 28, 2023 → 1 day.
      expect(daysRemaining('2024-02-29', new Date(2023, 1, 27))).toBe(1);
    });

    it('observes Feb 29 in leap years', () => {
      // 2024 is a leap year.
      expect(daysRemaining('2024-02-29', new Date(2024, 1, 28))).toBe(1);
    });

    it('does not regress: Feb 29 in a non-leap year that already passed wraps forward', () => {
      // Reference Mar 1, 2023 (non-leap). Next Feb 29 is 2024.
      expect(daysRemaining('2024-02-29', new Date(2023, 2, 1))).toBe(365);
    });

    it('treats Feb 29 annual event identical to a Feb 28 event in non-leap years', () => {
      // Both Feb 28 and Feb 29 birthdays should hit "today" on Feb 28 in a non-leap year.
      const ref = new Date(2023, 1, 28);
      expect(daysRemaining('2024-02-28', ref)).toBe(daysRemaining('2024-02-29', ref));
    });
  });

  describe('MMM D format input is not supported — ISO YYYY-MM-DD is the contract', () => {
    it('parses the YYYY-MM-DD source date', () => {
      expect(daysRemaining('2024-07-04', new Date(2024, 5, 15))).toBe(19);
    });
  });
});

describe('daysRemainingFromToday', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2024, 5, 15));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('uses the current date as the reference', () => {
    expect(daysRemainingFromToday('2024-06-15')).toBe(0);
    expect(daysRemainingFromToday('2024-06-16')).toBe(1);
    // From Jun 15, 2024 to Jun 14, 2025 = 364 days (2024 leap day already passed in Feb).
    expect(daysRemainingFromToday('2024-06-14')).toBe(364);
  });
});
