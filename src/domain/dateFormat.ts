export type DateFormatPreset = 'MMM D, YYYY' | 'D MMM YYYY' | 'DD/MM/YYYY';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function parseISO(s: string): { year: number; month: number; day: number } {
  const [y, m, d] = s.split('-').map(Number);
  return { year: y, month: m, day: d };
}

/**
 * Render an ISO date string (YYYY-MM-DD) using one of the three
 * supported presets.
 *
 *  - `MMM D, YYYY`  → "Jan 5, 2024"
 *  - `D MMM YYYY`   → "5 Jan 2024"
 *  - `DD/MM/YYYY`   → "05/01/2024"
 */
export function formatDate(isoDate: string, preset: DateFormatPreset): string {
  const { year, month, day } = parseISO(isoDate);
  const monthName = MONTH_NAMES[month - 1];

  switch (preset) {
    case 'MMM D, YYYY':
      return `${monthName} ${day}, ${year}`;
    case 'D MMM YYYY':
      return `${day} ${monthName} ${year}`;
    case 'DD/MM/YYYY':
      return `${pad2(day)}/${pad2(month)}/${year}`;
  }
}
