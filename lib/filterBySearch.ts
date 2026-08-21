/**
 * Narrow a table by a search box.
 *
 * Every term must appear somewhere in the record, in any order, so "cam active"
 * finds active CAM trucks rather than matching either word on its own. An empty
 * query returns the list untouched — the box is a filter, not a gate.
 */
export function filterBySearch<T>(rows: T[], query: string, fields: (row: T) => unknown[]): T[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return rows;

  return rows.filter((row) => {
    const haystack = fields(row)
      .map((v) => String(v ?? "").toLowerCase())
      .join(" ");
    return terms.every((t) => haystack.includes(t));
  });
}
