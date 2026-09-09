export type ZodiacSign =
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces'
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius';

interface Boundary {
  month: number;
  day: number;
  sign: ZodiacSign;
}

/**
 * Zodiac boundaries, ordered ascending by (month, day).
 * Each sign begins on the listed date and continues until the next entry.
 * Capricorn wraps around from Dec 22 to Jan 19.
 */
const BOUNDARIES: ReadonlyArray<Boundary> = [
  { month: 1, day: 1, sign: 'Capricorn' },
  { month: 1, day: 20, sign: 'Aquarius' },
  { month: 2, day: 19, sign: 'Pisces' },
  { month: 3, day: 21, sign: 'Aries' },
  { month: 4, day: 20, sign: 'Taurus' },
  { month: 5, day: 21, sign: 'Gemini' },
  { month: 6, day: 21, sign: 'Cancer' },
  { month: 7, day: 23, sign: 'Leo' },
  { month: 8, day: 23, sign: 'Virgo' },
  { month: 9, day: 23, sign: 'Libra' },
  { month: 10, day: 23, sign: 'Scorpio' },
  { month: 11, day: 22, sign: 'Sagittarius' },
  { month: 12, day: 22, sign: 'Capricorn' },
];

function compare(month: number, day: number, boundary: Boundary): number {
  if (month !== boundary.month) return month - boundary.month;
  return day - boundary.day;
}

/**
 * Returns the Western (tropical) zodiac sign for the given month and day.
 * The year is intentionally ignored — sign depends only on the date within
 * the year, so this works even when the birth year is unknown.
 */
export function zodiacForMonthDay(month: number, day: number): ZodiacSign {
  // Walk the list from the end so Dec → Capricorn (which appears at both
  // the start and end of the table) is handled correctly.
  let chosen: ZodiacSign = BOUNDARIES[0].sign;
  for (const boundary of BOUNDARIES) {
    if (compare(month, day, boundary) >= 0) {
      chosen = boundary.sign;
    }
  }
  return chosen;
}
