import { site } from "./config";

/**
 * Dates are handled as London calendar days ("YYYY-MM-DD"). Fixtures are
 * stored at midday UTC on their match day, which is the same calendar day in
 * London all year round, so a fixture never slips a day across a clock change.
 */

const DAY_MS = 86_400_000;

const isoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: site.timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The London calendar date of an instant. */
export function londonIso(date: Date | string): string {
  return isoFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function todayIso(): string {
  return londonIso(new Date());
}

/** A calendar date as the instant fixtures are stored at (12:00 UTC). */
export function isoToStored(iso: string): Date {
  return new Date(`${iso}T12:00:00.000Z`);
}

export function addDaysIso(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetweenIso(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(iso: string): number {
  return (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export function mondayOf(iso: string): string {
  return addDaysIso(iso, -weekdayIndex(iso));
}

export function isValidIso(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === value;
}

/* --------------------------------------------------------------------------
   League weeks. Weeks 1–10 run from the Monday of Michaelmas week 1; weeks
   11 onwards from the Monday of Lent week 11, as in the university calendar.
   ----------------------------------------------------------------------- */

type SeasonDates = { michaelmasStart: Date | string; lentStart: Date | string };

export function weekStartIso(season: SeasonDates, week: number): string {
  if (week <= 10) return addDaysIso(londonIso(season.michaelmasStart), (week - 1) * 7);
  return addDaysIso(londonIso(season.lentStart), (week - 11) * 7);
}

/**
 * The league week a calendar date falls in, or null over the Christmas break
 * and before the season. Dates after Lent are counted on from week 20.
 */
export function weekForIso(season: SeasonDates, iso: string): number | null {
  const mich = londonIso(season.michaelmasStart);
  const lent = londonIso(season.lentStart);
  if (iso < mich) return null;
  if (iso < lent) {
    const week = 1 + Math.floor(daysBetweenIso(mich, iso) / 7);
    return week <= 10 ? week : null;
  }
  return 11 + Math.floor(daysBetweenIso(lent, iso) / 7);
}

/* --------------------------------------------------------------------------
   Formatting
   ----------------------------------------------------------------------- */

function fmt(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: site.timeZone, ...options });
}

const shortDay = fmt({ weekday: "short", day: "numeric", month: "short" });
const longDay = fmt({ weekday: "long", day: "numeric", month: "long" });
const dayMonthYear = fmt({ day: "numeric", month: "short", year: "numeric" });
const dayMonth = fmt({ day: "numeric", month: "short" });
const dateTime = fmt({ day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const asDate = (d: Date | string) => (typeof d === "string" ? (d.length === 10 ? isoToStored(d) : new Date(d)) : d);

/** "Mon 12 Oct" */
export const formatShortDay = (d: Date | string) => shortDay.format(asDate(d));
/** "Monday 12 October" */
export const formatLongDay = (d: Date | string) => longDay.format(asDate(d));
/** "12 Oct 2026" */
export const formatDate = (d: Date | string) => dayMonthYear.format(asDate(d));
/** "12 Oct" */
export const formatDayMonth = (d: Date | string) => dayMonth.format(asDate(d));
/** "12 Oct 2026, 19:30" */
export const formatDateTime = (d: Date | string) => dateTime.format(typeof d === "string" ? new Date(d) : d);

/** "12–18 Oct" or "28 Sept – 4 Oct" */
export function formatWeekRange(mondayIso: string): string {
  const sunday = addDaysIso(mondayIso, 6);
  if (mondayIso.slice(0, 7) === sunday.slice(0, 7)) {
    return `${Number(mondayIso.slice(8))}–${formatDayMonth(sunday)}`;
  }
  return `${formatDayMonth(mondayIso)} – ${formatDayMonth(sunday)}`;
}

export function relativeDays(iso: string, today = todayIso()): string {
  const n = daysBetweenIso(today, iso);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1 && n < 7) return `In ${n} days`;
  if (n < -1 && n > -7) return `${-n} days ago`;
  return formatShortDay(iso);
}
