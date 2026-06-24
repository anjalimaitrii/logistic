// Zambia / Africa timezone — Central Africa Time (CAT, UTC+2).
// All user-facing dates & times across the app are rendered in this zone
// regardless of the viewer's local browser timezone.
export const APP_TIME_ZONE = "Africa/Lusaka";

type DateInput = string | number | Date | null | undefined;

const toDate = (input: DateInput): Date | null => {
  if (input === null || input === undefined || input === "") return null;
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : d;
};

/** Time only — e.g. "02:45 PM" (CAT) */
export const formatTime = (input: DateInput, opts: Intl.DateTimeFormatOptions = {}): string => {
  const d = toDate(input);
  if (!d) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIME_ZONE, ...opts });
};

/** Date only — e.g. "18 Jun 2026" (CAT) */
export const formatDate = (input: DateInput, opts: Intl.DateTimeFormatOptions = {}): string => {
  const d = toDate(input);
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: APP_TIME_ZONE, ...opts });
};

/** A date as YYYY-MM-DD in app timezone (CAT) — for <input type="date"> and day comparisons. */
export const toAppDateKey = (input: DateInput): string => {
  const d = toDate(input);
  if (!d) return "";
  // en-CA renders as YYYY-MM-DD
  return d.toLocaleDateString("en-CA", { timeZone: APP_TIME_ZONE });
};

/** Today's date as YYYY-MM-DD in app timezone (CAT). */
export const todayAppDateKey = (): string =>
  new Date().toLocaleDateString("en-CA", { timeZone: APP_TIME_ZONE });

/** Date + time — e.g. "18 Jun 2026, 02:45 PM" (CAT) */
export const formatDateTime = (input: DateInput, opts: Intl.DateTimeFormatOptions = {}): string => {
  const d = toDate(input);
  if (!d) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: APP_TIME_ZONE, ...opts,
  });
};
