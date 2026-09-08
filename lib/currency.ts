/**
 * What symbol to put in front of a booking's money.
 *
 * The fleet runs in Zambia, so a deal is in Kwacha unless the trip crosses a
 * border — those are agreed in dollars. The currency is stored on the booking,
 * so every screen asks this rather than hardcoding a symbol; the Finalize drawer
 * used to render a dollar sign on what was always a Kwacha amount.
 *
 * A booking saved before the field existed has no value and reads as Kwacha,
 * which is what those deals were.
 */
export type CurrencyCode = "ZMW" | "USD";

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: "ZMW", symbol: "K", label: "Kwacha" },
  { code: "USD", symbol: "$", label: "US Dollar" },
];

export function currencySymbol(code?: string | null): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? "K";
}

/**
 * Money as it should read on screen: symbol, then the number grouped in
 * thousands. Blank and unparseable values render as a zero rather than "NaN",
 * because a missing amount is shown in the same column as a real one.
 */
export function formatMoney(amount: unknown, code?: string | null): string {
  const n = Number(amount);
  return `${currencySymbol(code)}${(isFinite(n) ? n : 0).toLocaleString()}`;
}

/**
 * Totals for a set of bookings, kept apart by currency.
 *
 * A client may run Kwacha jobs and cross-border dollar jobs in the same period,
 * and those cannot be added: there is no rate stored anywhere, and a rate that
 * moved would silently rewrite last month's figures. So each currency is totalled
 * on its own and the caller renders one line per currency.
 *
 * Currencies present but summing to zero are kept, because "K0" against a real
 * dollar figure is information — dropping the line would read as no Kwacha work.
 * Order follows CURRENCIES so the lines do not jump around between renders.
 */
export function totalsByCurrency<T>(
  items: T[],
  amountOf: (item: T) => number,
  currencyOf: (item: T) => string | null | undefined
): { code: CurrencyCode; symbol: string; total: number }[] {
  const sums = new Map<CurrencyCode, number>();
  for (const item of items) {
    const code: CurrencyCode = currencyOf(item) === "USD" ? "USD" : "ZMW";
    const n = Number(amountOf(item));
    sums.set(code, (sums.get(code) ?? 0) + (isFinite(n) ? n : 0));
  }
  return CURRENCIES
    .filter((c) => sums.has(c.code))
    .map((c) => ({ code: c.code, symbol: c.symbol, total: sums.get(c.code)! }));
}

/**
 * Those totals as display strings. One entry for a single-currency client, which
 * is the common case and reads exactly as it did before this existed.
 */
export function formatTotals(
  totals: { code: CurrencyCode; total: number }[]
): string[] {
  if (totals.length === 0) return [formatMoney(0, "ZMW")];
  return totals.map((t) => formatMoney(t.total, t.code));
}
