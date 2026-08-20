"use client";

import { createContext, useContext, useState } from "react";

/**
 * The topbar search box lives above every admin page, but what it should filter
 * is whatever list that page is showing. Rather than the box knowing about every
 * screen, it publishes the query here and each screen decides what to do with it.
 *
 * A page with no list simply never reads it.
 */
type SearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
};

const SearchContext = createContext<SearchContextValue>({ query: "", setQuery: () => {} });

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  return <SearchContext.Provider value={{ query, setQuery }}>{children}</SearchContext.Provider>;
}

export const useSearch = () => useContext(SearchContext);

/**
 * Filter a list by the search box. Every term must appear somewhere in the
 * record, in any order, so "cam active" narrows to active CAM trucks rather than
 * matching either word alone.
 *
 * An empty query returns the list untouched — the box is a filter, not a gate.
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
