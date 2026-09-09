import { formatDate, type DateFormatPreset } from '../dateFormat';

describe('formatDate', () => {
  describe("'MMM D, YYYY' (default)", () => {
    const preset: DateFormatPreset = 'MMM D, YYYY';

    it('renders a single-digit day without zero-padding', () => {
      expect(formatDate('2024-01-05', preset)).toBe('Jan 5, 2024');
    });

    it('renders a double-digit day without zero-padding', () => {
      expect(formatDate('2024-12-25', preset)).toBe('Dec 25, 2024');
    });

    it('renders February correctly', () => {
      expect(formatDate('2024-02-14', preset)).toBe('Feb 14, 2024');
    });

    it('renders a leap-day date', () => {
      expect(formatDate('2024-02-29', preset)).toBe('Feb 29, 2024');
    });
  });

  describe("'D MMM YYYY'", () => {
    const preset: DateFormatPreset = 'D MMM YYYY';

    it('renders a single-digit day without zero-padding', () => {
      expect(formatDate('2024-01-05', preset)).toBe('5 Jan 2024');
    });

    it('renders a double-digit day without zero-padding', () => {
      expect(formatDate('2024-12-25', preset)).toBe('25 Dec 2024');
    });
  });

  describe("'DD/MM/YYYY'", () => {
    const preset: DateFormatPreset = 'DD/MM/YYYY';

    it('zero-pads both day and month', () => {
      expect(formatDate('2024-01-05', preset)).toBe('05/01/2024');
    });

    it('renders end-of-year date', () => {
      expect(formatDate('2024-12-31', preset)).toBe('31/12/2024');
    });

    it('renders Feb 29 in a leap year unambiguously', () => {
      expect(formatDate('2024-02-29', preset)).toBe('29/02/2024');
    });
  });

  describe('all three presets on the same date', () => {
    it('renders July 4, 2024 in each preset', () => {
      const date = '2024-07-04';
      expect(formatDate(date, 'MMM D, YYYY')).toBe('Jul 4, 2024');
      expect(formatDate(date, 'D MMM YYYY')).toBe('4 Jul 2024');
      expect(formatDate(date, 'DD/MM/YYYY')).toBe('04/07/2024');
    });
  });
});
