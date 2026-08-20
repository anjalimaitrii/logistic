"use client";

import { SearchProvider } from "@/context/SearchContext";

/**
 * The search query has to live ABOVE the pages, not inside them.
 *
 * Each admin page renders <AdminLayout> itself, so a provider placed in
 * AdminLayout sits below the page component — and a page calling useSearch()
 * would read the default value forever while the topbar wrote to a context it
 * could never see. A route-group layout is the first common ancestor of the
 * topbar and every page, so it goes here.
 */
export default function AdminRouteGroupLayout({ children }: { children: React.ReactNode }) {
  return <SearchProvider>{children}</SearchProvider>;
}
