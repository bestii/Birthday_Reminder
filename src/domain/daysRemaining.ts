export const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Resolve the observed calendar date for an annual event in `year`.
 * Feb 29 events are observed on Feb 28 in non-leap years.
 */
export function observedDateForYear(eventMonth: number, eventDay: number, year: number): Date {
  const day = eventMonth === 2 && eventDay === 29 && !isLeapYear(year) ? 28 : eventDay;
  return new Date(year, eventMonth - 1, day);
}

/**
 * Returns the number of days from `reference` (local-time) until the
 * next occurrence of the annual event identified by `eventDateISO`
 * (YYYY-MM-DD, month+day treated as the annual recurrence).
 *
 * - Same day → 0.
 * - Otherwise the count is always forward; if the date has already
 *   passed this year, it wraps to the next year.
 * - Feb 29 events are observed on Feb 28 in non-leap years.
 */
export function daysRemaining(eventDateISO: string, reference: Date): number {
  const ref = startOfDay(reference);
  const [, monthStr, dayStr] = eventDateISO.split('-');
  const eventMonth = Number(monthStr);
  const eventDay = Number(dayStr);

  const thisYearOccurrence = observedDateForYear(eventMonth, eventDay, ref.getFullYear());
  const thisYearStart = startOfDay(thisYearOccurrence);

  const diffMs = thisYearStart.getTime() - ref.getTime();
  const diffDays = Math.round(diffMs / MS_PER_DAY);

  if (diffDays > 0) return diffDays;

  if (diffDays === 0) return 0;

  // Already passed (or event is in the past for this year) → wrap forward.
  const nextYear = ref.getFullYear() + 1;
  const nextYearOccurrence = observedDateForYear(eventMonth, eventDay, nextYear);
  const nextYearStart = startOfDay(nextYearOccurrence);
  return Math.round((nextYearStart.getTime() - ref.getTime()) / MS_PER_DAY);
}

/** Convenience wrapper using the system clock at call time. */
export function daysRemainingFromToday(eventDateISO: string): number {
  return daysRemaining(eventDateISO, new Date());
}
