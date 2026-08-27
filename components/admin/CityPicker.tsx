"use client";

import { useState } from "react";
import { AFRICAN_COUNTRIES, AFRICAN_CITIES } from "@/lib/africaLocations";
import ComboBox from "@/components/admin/ComboBox";
import { useCustomLocations } from "@/hooks/use-custom-locations";

/**
 * Country → City picker for an empty-leg endpoint.
 *
 * The endpoint is stored as a bare city name, exactly like a cargo leg's
 * endpoint (which comes from `address.city` on the booking). Free text was
 * producing the same place under two spellings — "Lusaka" on one card and
 * "lusaka" on the next — which read inconsistently in every report.
 *
 * Plot and street are deliberately not collected: an empty leg's endpoint is
 * only ever a label, and nobody needs a plot number to know the truck ran
 * empty to Lusaka.
 */
export default function CityPicker({
  value,
  onChange,
  defaultCountry,
  label,
  tone = "neutral",
}: {
  value: string;
  onChange: (city: string) => void;
  defaultCountry?: string;
  label?: string;
  tone?: "neutral" | "amber";
}) {
  // Which country's city list to show. Seeded from the country the trip is in,
  // then owned by the user once they change it.
  // Case-insensitive throughout: stored values may predate the dropdowns and
  // carry whatever casing someone typed ("lusaka" vs "Lusaka"). Matching on
  // exact case would render those as unknown cities and quietly duplicate them.
  const eq = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

  const [country, setCountry] = useState<string>(() => {
    if (value) {
      const owner = AFRICAN_COUNTRIES.find((c) =>
        (AFRICAN_CITIES[c] || []).some((city) => eq(city, value))
      );
      if (owner) return owner;
    }
    const seeded = defaultCountry && AFRICAN_COUNTRIES.find((c) => eq(c, defaultCountry));
    return seeded || AFRICAN_COUNTRIES[0];
  });

  // Same options the booking forms offer, so an empty leg can end at a town that
  // was added there — otherwise a truck could be dispatched somewhere it could
  // never be recorded as returning from.
  const { countryOptions, cityOptionsFor, createLocation, deleteLocation } = useCustomLocations();

  const cityOptions = cityOptionsFor(country) || [];
  const cities = cityOptions.map(o => o.name);
  // Snap a differently-cased value onto the canonical spelling so the select
  // shows it as selected instead of falling through to "Select city…".
  const canonical = value ? cities.find((c) => eq(c, value)) : "";
  const selected = canonical || value;
  // A saved city from another country must still render as the current value
  // rather than silently snapping back to blank.
  // Keep the option objects rather than bare names: the id is what marks an entry
  // as operator-added, and without it the remove control cannot be offered.
  const options = selected && !cities.includes(selected)
    ? [{ name: selected }, ...cityOptions]
    : cityOptions;

  const selectCls =
    tone === "amber"
      ? "w-full bg-white border border-amber-200 rounded-lg py-1.5 px-2 text-[12px] font-semibold text-slate-900 outline-none cursor-pointer"
      : "w-full bg-white border border-neutral-200 rounded-lg py-1.5 px-2 text-[12px] font-semibold text-slate-900 outline-none cursor-pointer";

  return (
    <div className="mt-0.5 space-y-1">
      {label && (
        <div className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest">{label}</div>
      )}
      <ComboBox
        value={country}
        options={countryOptions}
        placeholder="Country"
        className={`${selectCls} text-[10px] text-neutral-500`}
        onChange={(name) => {
          setCountry(name);
          onChange(""); // the old city does not exist in the new country's list
        }}
        onCreate={(name) => createLocation("country", name, {})}
        onDelete={deleteLocation}
      />
      <ComboBox
        value={selected}
        options={options}
        placeholder="Select city…"
        className={selectCls}
        onChange={onChange}
        onCreate={(name) => createLocation("city", name, { country })}
        onDelete={deleteLocation}
      />
    </div>
  );
}
