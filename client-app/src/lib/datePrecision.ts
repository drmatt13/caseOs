import type { DatePrecision } from "#/types/caseRecords";

// ─────────────────────────────────────────────────────────────────────────────
// Date precision — single source of truth.
//
// Everything about a timeline date's granularity lives here: the ordered set,
// the human labels, the dropdown options, the Intl display options, and the
// input behavior (which HTML control to render and how to slice/coerce the
// stored ISO value). Both the case-creation intake form and the workspace record
// editor consume this module, and `formatEventDate` (case-workspace/helpers.ts)
// imports the display options from here — so the precisions never drift apart.
//
// Precisions split at the HOUR boundary: "year"/"month"/"day" are date-only
// (a plain <input type="date">), while "hour"/"minute"/"second" carry a
// time-of-day (an <input type="datetime-local">). Stored values are TZ-naive ISO
// strings ("1994-06-12T22:25"), parsed as local time — matching the demo data.
// ─────────────────────────────────────────────────────────────────────────────

// Ordered coarse → fine; also the order shown in every precision dropdown.
export const DATE_PRECISIONS: readonly DatePrecision[] = [
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second",
];

export const DATE_PRECISION_LABELS: Record<DatePrecision, string> = {
  year: "Year only",
  month: "Month only",
  day: "Exact day",
  hour: "Hour",
  minute: "Minute",
  second: "Second",
};

// Select options for the intake form and the record editor (structurally a
// SelectOption<DatePrecision>[]; typed inline to avoid a feature → lib import).
export const DATE_PRECISION_SELECT_OPTIONS: {
  value: DatePrecision;
  label: string;
}[] = DATE_PRECISIONS.map((value) => ({
  value,
  label: DATE_PRECISION_LABELS[value],
}));

// Intl options per precision. Coarse precisions read as approximate; the sub-day
// precisions surface the time-of-day stored in the ISO value ("hour" → "10 PM",
// "minute" → "10:25 PM", "second" → "10:25:30 PM").
export const EVENT_DATE_FORMAT_OPTIONS: Record<
  DatePrecision,
  Intl.DateTimeFormatOptions
> = {
  year: { year: "numeric" },
  month: { month: "short", year: "numeric" },
  day: { month: "short", day: "numeric", year: "numeric" },
  hour: { month: "short", day: "numeric", year: "numeric", hour: "numeric" },
  minute: {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
  second: {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Input behavior
// ─────────────────────────────────────────────────────────────────────────────

// True for the precisions that carry a time-of-day component.
export function precisionHasTime(precision: DatePrecision): boolean {
  return precision === "hour" || precision === "minute" || precision === "second";
}

// Which HTML input renders for a precision: a date picker for date-only
// precisions, a date-and-time picker once a time component is meaningful.
export function inputTypeForPrecision(
  precision: DatePrecision,
): "date" | "datetime-local" {
  return precisionHasTime(precision) ? "datetime-local" : "date";
}

// `step` for the datetime-local input so the picker exposes the right grain:
// seconds wheel for "second", whole hours for "hour", default minutes otherwise.
// Date inputs ignore step, so undefined is fine for the date-only precisions.
export function stepForPrecision(precision: DatePrecision): number | undefined {
  if (precision === "second") return 1; // seconds
  if (precision === "hour") return 3600; // whole hours
  return undefined; // minute (default 60) / date precisions
}

// Slice a stored ISO value into the exact string the precision's input expects:
//   date precisions       → "YYYY-MM-DD"
//   hour / minute          → "YYYY-MM-DDTHH:mm"
//   second                 → "YYYY-MM-DDTHH:mm:ss"
// A date-only value used at a time precision is padded with "T00:00" so the
// datetime-local control has something valid to show.
export function toDateInputValue(
  iso: string | undefined,
  precision: DatePrecision,
): string {
  if (!iso) return "";
  if (!precisionHasTime(precision)) return iso.slice(0, 10);

  let value = iso.includes("T") ? iso : `${iso.slice(0, 10)}T00:00`;
  if (precision === "second") {
    value = value.length >= 19 ? value.slice(0, 19) : `${value.slice(0, 16)}:00`;
  } else {
    value = value.slice(0, 16);
  }
  return value;
}

// Reconcile a stored value with a NEWLY chosen precision so display and input
// never disagree: coarsening past the hour boundary drops the time, refining to
// a time precision seeds a midnight time when none exists. Called from the
// precision <select> onChange on both surfaces.
export function coerceDateToPrecision(
  iso: string | undefined,
  precision: DatePrecision,
): string {
  if (!iso) return "";
  if (!precisionHasTime(precision)) return iso.slice(0, 10);
  return iso.includes("T") ? iso : `${iso.slice(0, 10)}T00:00`;
}
