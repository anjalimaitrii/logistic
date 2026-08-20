// The accountant's leg view model.
//
// Leg identity used to be derived from array position against the stop list, in
// five separate places. Prepending a single dispatch leg broke all five at once,
// so identity is now explicit: each row carries its own kind and endpoints, and
// nothing is recomputed from an index.

export type LegKind = "dispatch" | "stop" | "extra" | "return";

export interface LegRow {
  id: string;
  kind: LegKind;
  fromLabel: string;
  toLabel: string;
  km: string;
  mileage: string;
  loadType: "loaded" | "unloaded";
  /** Present on empty-transit rows: the TripGap this row bills. */
  gapId?: string;
  /** True on empty rows: the accountant names the mid-return point themselves. */
  editableFrom?: boolean;
  /** True on hand-added rows: the accountant names the destination too. */
  editableTo?: boolean;
  /** Added by hand via [+], not derived from a detected gap. Removable. */
  manual?: boolean;
  /** Which side of the cargo this empty leg belongs on, and how it is stored. */
  position?: "prepend" | "append";
  /**
   * This row came back from the settlement — it is already committed. Editing
   * stops there: a costed leg should not drift under the accountant's cursor.
   * Remove it and add it again if it was wrong.
   */
  saved?: boolean;
}

let manualSeq = 0;

/**
 * A hand-added empty leg. Covers every empty movement the accountant knows about
 * and the system does not: the return to the yard, a partial return that ended
 * where the driver was diverted, or any other unladen run.
 *
 * There used to be two constructors for this — one blank, one prefilled with the
 * warehouse — but they produced the same thing. The stored `kind` differed
 * ("transit" vs "return") and nothing anywhere read it, so the split bought a
 * second button and no behaviour.
 *
 * `from` is prefilled with the last drop because that is where an empty run
 * almost always begins; `to` is left blank because the destination is exactly
 * what the system cannot guess.
 */
export function newEmptyLeg(lastDrop: string, unloadedMileage: string): LegRow {
  return {
    id: `empty-${++manualSeq}-${Date.now()}`,
    kind: "extra",
    fromLabel: lastDrop,
    toLabel: "",
    km: "",
    mileage: unloadedMileage,
    loadType: "unloaded",
    editableFrom: true,
    editableTo: true,
    manual: true,
  };
}

/**
 * A leg running INTO the first pickup. The warehouse is offered as the default
 * origin because it is the common case, not because it is the only one — the
 * truck may have started from wherever its last job left it.
 */
export function newDispatchLeg(
  warehouseCity: string,
  firstPickup: string,
  unloadedMileage: string
): LegRow {
  return {
    id: `dispatch-${++manualSeq}-${Date.now()}`,
    kind: "dispatch",
    // Both ends are known: the yard on one side, the booking's first pickup on
    // the other. Nothing to choose, so nothing is offered — the accountant only
    // supplies the distance. If the truck did NOT start at the yard, this leg is
    // simply not added; "+ Add Empty Leg" covers that case with free endpoints.
    fromLabel: warehouseCity,
    toLabel: firstPickup,
    km: "",
    mileage: unloadedMileage,
    loadType: "unloaded",
    manual: true, // removable, but not editable
  };
}

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

const cityOf = (stop: any, fallback: string): string => stop?.address?.city || fallback;

/**
 * One journey: dispatch → cargo legs → claimed empty legs → return.
 *
 * The dispatch and return rows always render, blank, because every trip has
 * them. Empty-transit rows appear only when a TripGap exists.
 */
export function buildLegRows(args: {
  pickups: any[];
  dropoffs: any[];
  settlement?: any;
  gaps?: any[];
  bookingId: string;
  loadedMileage: string;
  unloadedMileage: string;
  /** Fallback origin for a saved dispatch leg written before the yard was set. */
  warehouseCity?: string;
  /** Ops has marked this trip as heading back to the yard. */
  returningToYard?: boolean;
  /** The accountant struck the offered return leg off — do not offer it again. */
  returnLegDismissed?: boolean;
}): LegRow[] {
  const {
    pickups, dropoffs, settlement, gaps = [],
    bookingId, loadedMileage, unloadedMileage, warehouseCity, returningToYard,
    returnLegDismissed = false,
  } = args;

  const stops = [...(pickups || []), ...(dropoffs || [])];
  const savedExtras: any[] = settlement?.extraLegs || [];
  const savedLegs: any[] = settlement?.fuelDetails?.legs || [];

  const rows: LegRow[] = [];

  // Gap rows, built up front so they can be placed on the correct SIDE of the
  // cargo. Which side depends on where this trip sits in the pair:
  //
  //   predecessor  → cargo, then the empty run out    → append
  //   successor    → the empty run in, then cargo     → prepend
  //
  // Listing them all after the cargo read as though the truck drove its load
  // first and only then made the empty approach, which is backwards for the
  // successor.
  const gapRows: LegRow[] = [];
  for (const g of gaps) {
    const claimant = g.claimedByBookingId;
    const claimantId = claimant?._id || claimant;
    const claimedByThisTrip = claimantId && String(claimantId) === String(bookingId);

    // Claimed by the OTHER trip → not this trip's leg at all, so it is not shown
    // here. It used to render as a locked card, which only invited the question
    // "why am I looking at something I cannot touch". The single-attribution lock
    // still holds — it lives on the TripGap row, not on this screen.
    if (g.status === "claimed" && !claimedByThisTrip) continue;

    const isSuccessor = String(g.nextBookingId?._id || g.nextBookingId) === String(bookingId);
    const saved = savedExtras.find(
      (e) => e.kind === "transit" && String(e.gapId) === String(g._id)
    );
    // Origin is prefilled only when the truck had not moved yet. If it was
    // already returning, the drop point is behind it — prefilling that would put
    // a wrong place in front of the accountant and invite them to accept it.
    const originPrefill = g.detectedDuring === "returning" ? "" : (g.fromLabel || "");
    gapRows.push({
      id: nextId("extra"),
      kind: "extra",
      fromLabel: saved?.from || originPrefill,
      toLabel: saved?.to || g.toLabel || "",
      km: saved ? String(saved.km) : g.claimedKm ? String(g.claimedKm) : "",
      mileage: unloadedMileage,
      loadType: "unloaded",
      gapId: String(g._id),
      editableFrom: true,
      position: isSuccessor ? "prepend" : "append",
      saved: !!saved,
    });
  }

  // 1. Legs running INTO the first pickup. NOT auto-created: a trip does not
  //    always start at the warehouse — the truck may already be out on the road
  //    from wherever its last job left it. The accountant adds these with [+]
  //    and names the origin themselves.
  for (const e of savedExtras) {
    if (e.kind !== "dispatch") continue;
    rows.push({
      id: nextId("dispatch"),
      kind: "dispatch",
      // Endpoints are derived, not chosen — see newDispatchLeg. The saved values
      // win so an older leg keeps whatever it was stored with.
      fromLabel: e.from || warehouseCity || "",
      toLabel: e.to || cityOf(stops[0], "Pickup"),
      km: String(e.km ?? ""),
      mileage: unloadedMileage,
      loadType: "unloaded",
      manual: true,
      saved: true,
    });
  }

  // 1b. Gaps this trip INHERITS — it is the successor, so the empty run happened
  //     BEFORE its cargo. Rendered above the cargo legs, matching the order the
  //     truck actually drove them.
  rows.push(...gapRows.filter((r) => r.position === "prepend"));

  // 2. Cargo legs — stop to stop.
  for (let i = 0; i < stops.length - 1; i++) {
    const saved = savedLegs[i];
    const loadType: "loaded" | "unloaded" = saved?.loadType || "loaded";
    rows.push({
      id: nextId("stop"),
      kind: "stop",
      fromLabel: cityOf(stops[i], `Stop ${i + 1}`),
      toLabel: cityOf(stops[i + 1], `Stop ${i + 2}`),
      km: saved ? String(saved.km) : "",
      mileage: loadType === "unloaded" ? unloadedMileage : loadedMileage,
      loadType,
    });
  }

  // 3. Hand-added empty legs from a previous save — transit rows carrying no
  //     gapId. Without this they would silently vanish on reload.
  for (const e of savedExtras) {
    if (e.kind !== "transit" || e.gapId) continue;
    rows.push({
      id: nextId("manual"),
      kind: "extra",
      fromLabel: e.from || "",
      toLabel: e.to || "",
      km: String(e.km ?? ""),
      mileage: unloadedMileage,
      loadType: "unloaded",
      editableFrom: true,
      editableTo: true,
      manual: true,
      saved: true,
    });
  }

  // 4. Legs after the last drop. Also NOT auto-created.
  //
  //    A retargeted trip already has a gap row covering drop → next pickup; auto-
  //    adding a return row pointing at the same next pickup rendered the identical
  //    movement twice. And a truck does not always go back to the warehouse
  //    anyway. So the accountant adds these too, and splits them if the truck
  //    actually part-returned before being diverted (drop → R, then R → pickup).
  for (const e of savedExtras) {
    if (e.kind !== "return" && e.kind !== "trimmedReturn") continue;
    rows.push({
      id: nextId("return"),
      kind: "return",
      fromLabel: e.from || cityOf(stops[stops.length - 1], "Drop"),
      toLabel: e.to || "",
      km: String(e.km ?? ""),
      mileage: unloadedMileage,
      loadType: "unloaded",
      editableFrom: true,
      editableTo: true,
      manual: true,
      // A destination cleared by the diversion rewrite is NOT settled — that is
      // the one field the accountant still has to answer.
      saved: !!e.to,
    });
  }

  // 4b. Ops has marked the truck as returning to the yard, so this leg is no
  //     longer a guess: both ends are known and only the distance is missing.
  //     Offered ready-made, exactly like the dispatch leg. A trip diverted to
  //     another job's pickup never qualifies — it is not going to the yard.
  const hasSavedReturn = savedExtras.some(
    (e) => e.kind === "return" || e.kind === "trimmedReturn"
  );
  if (returningToYard && warehouseCity && !hasSavedReturn && !returnLegDismissed) {
    rows.push({
      id: nextId("return"),
      kind: "return",
      fromLabel: cityOf(stops[stops.length - 1], "Drop"),
      toLabel: warehouseCity,
      km: "",
      mileage: unloadedMileage,
      loadType: "unloaded",
      manual: true, // removable, but the endpoints are not guesswork
    });
  }

  // 5. Gaps this trip LEADS INTO go LAST — the empty run onto the next job's
  //    pickup is the final thing the truck does, after any return leg it drove
  //    first. Listing it before the return read as though the truck reached the
  //    next pickup and only then set off homeward.
  rows.push(...gapRows.filter((r) => r.position === "append"));

  return rows;
}

/**
 * Every row on this screen is billed to this trip — legs claimed by the other
 * trip are omitted by buildLegRows rather than shown greyed out. Kept as a named
 * function so the callers still read as "the rows this settlement pays for".
 */
export function billableRows(rows: LegRow[]): LegRow[] {
  return rows;
}

export function toSavePayload(rows: LegRow[], fuelRate: number, addedBy = "") {
  const calc = (r: LegRow) => {
    const km = Number(r.km) || 0;
    const mileage = Number(r.mileage) || 1;
    const liters = Math.round((km / mileage) * 10) / 10;
    return { km, mileage, liters, amount: Math.round(liters * fuelRate) };
  };

  const billable = billableRows(rows);

  const legs = billable
    .filter((r) => r.kind === "stop")
    .map((r) => ({ from: r.fromLabel, to: r.toLabel, loadType: r.loadType, ...calc(r) }));

  const extraLegs = billable
    .filter((r) => r.kind !== "stop")
    .map((r) => ({
      kind: r.kind === "dispatch" ? "dispatch" : r.kind === "return" ? "return" : "transit",
      // A gap row already knows its side; everything else follows its kind.
      position: r.position ?? (r.kind === "dispatch" ? "prepend" : "append"),
      from: r.fromLabel,
      to: r.toLabel,
      ...(r.gapId ? { gapId: r.gapId } : {}),
      addedBy,
      addedAt: new Date().toISOString(),
      ...calc(r),
    }));

  return { legs, extraLegs };
}
