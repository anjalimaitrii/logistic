/**
 * The countries this fleet runs in, and how long a local number is in each.
 *
 * The length matters: a phone box with no cap accepts "89898908098098098888888888",
 * which is not a number anyone can call and is not caught anywhere downstream.
 * Every phone field in the app therefore takes its limit from here.
 *
 * One list, because it used to be pasted into three files and had already begun
 * to drift.
 */
export const DIAL_CODES = [
  { code: "+260", label: "ZM +260", maxLen: 9 },
  { code: "+263", label: "ZW +263", maxLen: 9 },
  { code: "+243", label: "CD +243", maxLen: 9 },
  { code: "+265", label: "MW +265", maxLen: 9 },
  { code: "+255", label: "TZ +255", maxLen: 9 },
  { code: "+258", label: "MZ +258", maxLen: 9 },
  { code: "+267", label: "BW +267", maxLen: 8 },
  { code: "+264", label: "NA +264", maxLen: 9 },
  { code: "+27",  label: "ZA +27",  maxLen: 9 },
  { code: "+244", label: "AO +244", maxLen: 9 },
] as const;

export const DEFAULT_DIAL_CODE = "+260";

/** How many digits the local part may have. Unknown code → the longest we allow. */
export function maxLenFor(code?: string): number {
  return DIAL_CODES.find((d) => d.code === code)?.maxLen ?? 10;
}

/**
 * What the <input maxLength> may be, which is NOT the length of the number.
 *
 * The browser truncates the value at maxLength BEFORE any handler runs, so a
 * tight cap destroys a paste before it can be normalised: +260975035330 arrived
 * as +260975035 and was saved as a different number entirely. The box is
 * therefore allowed to hold a full international number; cleanLocalNumber is
 * what enforces the real length once it has stripped the prefixes.
 */
export function inputMaxLenFor(code?: string): number {
  // Deliberately loose. It is not the rule — cleanLocalNumber is, and it runs on
  // every keystroke — so this only has to be wide enough that nothing legitimate
  // is cut off before it gets there. A pasted "+260 97 503 5330" carries a code,
  // spaces and the number, and gets nowhere near a tight cap.
  return maxLenFor(code) + 12;
}

/**
 * Whatever was pasted, reduced to the local number this country actually uses.
 *
 * People paste a number in every shape they have it in — 0975035330 off a
 * business card, +260975035330 out of WhatsApp, 00260975035330 from a contact
 * export. All three are the same phone. Keeping the prefixes as digits saved
 * three different wrong numbers, each one a digit or four short of callable.
 *
 * Order matters: the country code comes off first, then the trunk 0 that only
 * exists when dialling inside the country, and only then is the length capped.
 */
export function cleanLocalNumber(raw: string, code?: string): string {
  const max = maxLenFor(code);
  const cc = (code || "").replace(/\D/g, "");
  let digits = (raw || "").replace(/\D/g, "");

  if (cc) {
    if (digits.startsWith("00" + cc)) {
      digits = digits.slice(2 + cc.length);
    } else if (digits.startsWith(cc) && digits.length > max) {
      // Only when something is left over. A local number may legitimately begin
      // with the same digits as the country code, and eating them would quietly
      // corrupt it — the surplus length is what proves this is a prefix.
      digits = digits.slice(cc.length);
    }
  }

  return digits.replace(/^0+/, "").slice(0, max);
}

/**
 * Stored numbers carry their dial code ("+260771370090"); every form keeps the
 * code in its own select. Longest prefix first, so "+260" is never read as the
 * shorter "+27".
 */
export function splitDialCode(stored?: string): { code: string; rest: string } {
  const raw = (stored || "").trim();
  if (!raw) return { code: DEFAULT_DIAL_CODE, rest: "" };
  const match = [...DIAL_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((d) => raw.startsWith(d.code));
  if (match) return { code: match.code, rest: match.code ? raw.slice(match.code.length).replace(/^0+/, "") : raw };
  // No country code on it — an older record saved as a plain local number.
  // Drop the trunk prefix so it lines up with what the field now holds.
  return { code: DEFAULT_DIAL_CODE, rest: raw.replace(/^\+/, "").replace(/\D/g, "").replace(/^0+/, "") };
}

/** Back into the single string that gets stored. */
export function joinDialCode(code: string, local: string): string {
  const digits = (local || "").replace(/\D/g, "");
  if (!digits) return "";
  return code ? `${code}${digits}` : digits;
}
