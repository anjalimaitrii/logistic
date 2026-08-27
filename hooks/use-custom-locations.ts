"use client";

import { useCallback, useEffect, useState } from "react";
import { AFRICAN_COUNTRIES, AFRICAN_STATES, AFRICAN_CITIES } from "@/lib/africaLocations";
import { locationService, type CustomLocation, type LocationKind } from "@/services/locationService";
import type { ComboOption } from "@/components/admin/ComboBox";

const fold = (v: string) => v.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Merge the shipped list with what operators have added, shipped first and
 * without duplicates. The shipped entry wins on a clash, which is also what
 * keeps it undeletable — only operator-added options carry an id, and only
 * those get a remove control.
 */
function merge(shipped: string[], custom: CustomLocation[]): ComboOption[] {
  const seen = new Set(shipped.map(fold));
  return [
    ...shipped.map(name => ({ name })),
    ...custom.filter(l => !seen.has(fold(l.name))).map(l => ({ name: l.name, id: l._id })),
  ];
}

/**
 * The country/province/city options every booking-shaped form offers, and the
 * two writes that keep them growing.
 *
 * Every form that collects an address needs the same three lists and the same
 * add-if-missing behaviour. Holding it here means a town added on one screen
 * shows up on all of them, and there is one place where the merge rule lives.
 */
export function useCustomLocations(enabled = true) {
  const [custom, setCustom] = useState<CustomLocation[]>([]);

  const reload = useCallback(async () => {
    // A failure here is not fatal — the shipped lists still render, and the
    // server rejects a duplicate anyway.
    try { setCustom((await locationService.getAll()) || []); } catch { /* shipped list still works */ }
  }, []);

  useEffect(() => { if (enabled) reload(); }, [enabled, reload]);

  const countryOptions = merge(AFRICAN_COUNTRIES, custom.filter(l => l.kind === "country"));

  const stateOptionsFor = (country: string) =>
    merge(AFRICAN_STATES[country] || [], custom.filter(l => l.kind === "state" && l.country === country));

  const cityOptionsFor = (country: string) =>
    merge(AFRICAN_CITIES[country] || [], custom.filter(l => l.kind === "city" && l.country === country));

  /**
   * File a new place. A province or town is stored under the country already
   * selected on that form, and a town also keeps the province — without that
   * path it would be saved and never offered again.
   */
  const createLocation = async (
    kind: LocationKind,
    name: string,
    ctx: { country?: string; state?: string } = {}
  ) => {
    try {
      await locationService.create({
        kind,
        name,
        ...(kind === "country" ? {} : { country: ctx.country || "" }),
        ...(kind === "city" ? { state: ctx.state || "" } : {}),
      });
      await reload();
    } catch {
      alert(`Could not add "${name}". Please try again.`);
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      await locationService.remove(id);
      await reload();
    } catch {
      alert("Could not remove that entry. Please try again.");
    }
  };

  return { custom, reload, countryOptions, stateOptionsFor, cityOptionsFor, createLocation, deleteLocation };
}
