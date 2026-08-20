"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  ArrowLeft,
  Fuel,
  MapPin,
  CheckCircle2,
  ChevronRight,
  DollarSign
} from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { assignmentService } from "@/services/assignmentService";
import { settlementService } from "@/services/settlementService";
import { cleanDriverName } from "@/services/liveTrackingService";
import { routeService } from "@/services/routeService";
import { mileageService } from "@/services/mileageService";
import { warehouseService, type WarehouseConfig } from "@/services/warehouseService";
import { tripGapService } from "@/services/tripGapService";
import {
  buildLegRows,
  mergeReturnGap,
  toSavePayload,
  billableRows,
  newEmptyLeg,
  newDispatchLeg,
  type LegRow,
} from "@/lib/legModel";
import CityPicker from "@/components/admin/CityPicker";
import { useNotifications } from "@/context/NotificationContext";

export default function AccountantJobDetail() {
  const router = useRouter();
  const { id } = useParams();
  const { addNotification } = useNotifications();
  const notifiedRef = useRef<Set<string>>(new Set());
  const [jobData, setJobData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [jobSettlement, setJobSettlement] = useState<any>(null);

  // Explicit leg rows: dispatch → cargo legs → empty transit → return. Identity
  // is carried per row, never derived from array position (CR-VL-001 §8.1).
  const [legRows, setLegRows] = useState<LegRow[]>([]);
  const [warehouse, setWarehouse] = useState<WarehouseConfig>({ street: "", city: "", province: "", country: "" });
  // Struck-off return leg. A returning trip offers one ready-made, but not every
  // returning truck drives a leg worth billing — and the dismissal has to be
  // saved, or the row reappears on the next load.
  const [returnDismissed, setReturnDismissed] = useState(false);
  // Arriving from the jobs list after marking a truck as returning: the one row
  // that brought us here gets scrolled to and ringed, so the operator is not left
  // scanning a long settlement for which leg is missing its distance.
  const focusKind = useSearchParams().get("focus");
  const focusRef = useRef<HTMLDivElement | null>(null);
  const [focusFaded, setFocusFaded] = useState(false);
  const [gaps, setGaps] = useState<any[]>([]);
  // What was last persisted, so an already-approved trip can still show a Save
  // button when the accountant adds an empty leg after the fact.
  const [savedFingerprint, setSavedFingerprint] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // Warehouse-bound legs removed on load because the trip was diverted.
  // Saved return legs whose warehouse destination was cleared by a diversion.
  const [droppedYardLegs, setDroppedYardLegs] = useState(0);
  // Did this truck actually come from the yard? Null while unknown.
  const [yardStart, setYardStart] = useState<{ ok: boolean; reason: string } | null>(null);
  const [mileageRates, setMileageRates] = useState<{ loaded: string; unloaded: string }>({ loaded: "0", unloaded: "0" });
  const [fuelRate, setFuelRate] = useState("0");
  const [allocationMoney, setAllocationMoney] = useState("0");
  const [councilLevy, setCouncilLevy] = useState("0");
  const [tollAmount, setTollAmount] = useState("0");

  // Route Master original values — to detect manual overrides
  const [routeDefaults, setRouteDefaults] = useState<{ km: number; allocationMoney: number; councilLevy: number; tollAmount: number } | null>(null);

  useEffect(() => {
    if (id) loadJobDetails();
  }, [id]);

  const bookingIdStr = (Array.isArray(id) ? id[0] : id) as string;

  const updateRow = (rowId: string, patch: Partial<LegRow>) =>
    setLegRows((rows) => rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));

  // A stable projection of everything the accountant can change. Deliberately
  // not toSavePayload() — that stamps addedAt on every call, so it never
  // compares equal to itself.
  const fingerprintOf = (
    rows: LegRow[],
    rate: string,
    alloc: string,
    levy: string,
    toll: string
  ) =>
    JSON.stringify({
      legs: billableRows(rows).map((r) => [r.kind, r.fromLabel, r.toLabel, r.km, r.loadType]),
      rate, alloc, levy, toll,
    });

  const removeRow = (rowId: string) =>
    setLegRows((rows) => {
      // Striking off a return leg is a decision, not just a row deletion: the
      // trip is still "returning", so it would be offered again on reload.
      if (rows.find((r) => r.id === rowId)?.kind === "return") setReturnDismissed(true);
      return rows.filter((r) => r.id !== rowId);
    });

  const removeDispatchLeg = () =>
    setLegRows((rows) => rows.filter((r) => r.kind !== "dispatch"));

  // Insert a pre-pickup leg at the very top. The warehouse is only a suggested
  // origin — the accountant can type wherever the truck actually started.
  //
  // At most one: a trip has a single run into its first pickup. (Empty legs
  // AFTER the drop are unbounded — a truck can make several unladen moves.)
  const addDispatchLeg = () =>
    setLegRows((rows) => {
      if (rows.some((r) => r.kind === "dispatch")) return rows;
      const firstPickup = jobData?.pickupLocations?.[0]?.address?.city || "";
      // Bare city, not "Lusaka (Warehouse)" — the endpoint is now chosen from
      // the city list, and a decorated label would not match any option.
      const row = newDispatchLeg(warehouse.city || "", firstPickup, mileageRates.unloaded);
      const firstCargoIdx = rows.findIndex((r) => r.kind === "stop");
      if (firstCargoIdx === -1) return [row, ...rows];
      return [...rows.slice(0, firstCargoIdx), row, ...rows.slice(firstCargoIdx)];
    });

  // Route Master comparison applies to CARGO legs only. Dispatch, empty transit
  // and return legs have no Route Master counterpart, so comparing them would
  // fire a "distance changed" warning on literally every trip.
  const handleKmBlur = (row: LegRow, value: string) => {
    if (row.kind !== "stop") return;
    if (!routeDefaults || !jobData) return;
    const newKm = parseFloat(value) || 0;
    if (newKm <= 0) return;
    if (newKm !== routeDefaults.km && !notifiedRef.current.has(`km-${row.id}`)) {
      notifiedRef.current.add(`km-${row.id}`);
      const tripId = jobData.tripId || `#${jobData._id?.slice(-4).toUpperCase()}`;
      addNotification(
        "⚠️",
        `Distance Changed — ${tripId}`,
        `Route Master: ${routeDefaults.km} km → ${row.fromLabel} → ${row.toLabel}: ${newKm} km`
      );
    }
    if (newKm === routeDefaults.km) notifiedRef.current.delete(`km-${row.id}`);
  };

  const gapContextFor = (row: LegRow) => {
    const gap = gaps.find((g: any) => String(g._id) === row.gapId);
    if (!gap) return null;
    const prevId = String(gap.prevBookingId?._id || gap.prevBookingId);
    const nextId = String(gap.nextBookingId?._id || gap.nextBookingId);
    const isPrevTrip = prevId === bookingIdStr;
    return {
      gap,
      isPrevTrip,
      side: (isPrevTrip ? "append" : "prepend") as "append" | "prepend",
      otherTripBookingId: isPrevTrip ? nextId : prevId,
      otherTripLabel:
        (isPrevTrip ? gap.nextBookingId?.tripId : gap.prevBookingId?.tripId) || "the other trip",
      currentOwnerId: gap.claimedByBookingId?._id || gap.claimedByBookingId,
    };
  };

  /**
   * Claiming used to write only the gap, leaving the distance to a separate Save.
   * Press the trip button before typing the km and you got a claimed leg worth
   * 0 km — attributed but uncosted. One action now does both, and it refuses to
   * run until there is something worth saving.
   */
  const handleClaimGap = async (row: LegRow) => {
    const ctx = gapContextFor(row);
    if (!row.gapId || !ctx) return;

    const km = Number(row.km) || 0;
    if (!row.fromLabel.trim() || !row.toLabel.trim()) {
      alert("Name both ends of this empty leg first.");
      return;
    }
    if (km <= 0) {
      alert("Enter the distance for this empty leg first — claiming it at 0 km would cost nothing.");
      return;
    }

    try {
      setIsSaving(true);
      // Endpoints travel with the claim so the gap carries the whole fact, not
      // just the distance — the adjacent trip then renders it without re-asking.
      await tripGapService.claim(row.gapId, {
        bookingId: bookingIdStr,
        side: ctx.side,
        km,
        fromLabel: row.fromLabel,
        toLabel: row.toLabel,
      });
      // Same action, same click: put the leg on the settlement too, so nothing
      // is left half-written for someone to notice later.
      await settlementService.process(buildSettlementPayload());
      await loadJobDetails();
    } catch (err: any) {
      if (err?.status === 409) {
        alert(err.message || "This empty leg was just claimed by the other trip.");
        await loadJobDetails();
      } else {
        alert(err?.message || "Failed to claim the empty leg.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAllocationChange = (value: string) => {
    setAllocationMoney(value);
  };

  const handleAllocationBlur = (value: string) => {
    if (!routeDefaults || !jobData) return;
    const newVal = parseFloat(value) || 0;
    if (newVal <= 0) return;
    if (newVal !== routeDefaults.allocationMoney && !notifiedRef.current.has("alloc")) {
      notifiedRef.current.add("alloc");
      const tripId = jobData.tripId || `#${jobData._id?.slice(-4).toUpperCase()}`;
      addNotification(
        "💰",
        `Allocation Changed — ${tripId}`,
        `Route Master: K${routeDefaults.allocationMoney.toLocaleString()} → Trip: K${newVal.toLocaleString()}`
      );
    }
    if (newVal === routeDefaults.allocationMoney) notifiedRef.current.delete("alloc");
  };

  // One movement, one row. The return leg and the gap collapse into a single card
  // whenever they end at the same city — and everything downstream (totals, the
  // rendered list, the saved payload) reads THIS, so a merged leg cannot be
  // costed once on screen and twice in the settlement.
  const visibleRows = useMemo(() => mergeReturnGap(legRows), [legRows]);

  const calculations = useMemo(() => {
    const rate = parseFloat(fuelRate) || 0;
    const cash = parseFloat(allocationMoney) || 0;

    // Locked rows are excluded: that empty leg is billed to the OTHER trip.
    // Counting it here would double-bill exactly what this feature prevents.
    const rows = billableRows(visibleRows);

    const perRow = new Map<string, { liters: number; amount: number }>();
    let totalLiters = 0;
    let fuelTotal = 0;
    let emptyTotal = 0;

    for (const r of rows) {
      const km = parseFloat(r.km) || 0;
      const mileage = parseFloat(r.mileage) || 1;
      const liters = km / mileage;
      const amount = Math.round(liters * rate);
      perRow.set(r.id, { liters, amount });
      totalLiters += liters;
      fuelTotal += amount;
      if (r.kind !== "stop") emptyTotal += amount;
    }

    return {
      perRow,
      totalLiters: totalLiters.toFixed(1),
      fuelTotal,
      emptyTotal,
      legCount: rows.length,
      grandTotal: fuelTotal + Math.round(cash),
    };
  }, [visibleRows, fuelRate, allocationMoney]);

  /**
   * A truck only leaves the yard when its previous job is genuinely finished and
   * it has gone back. If the same truck is still offloading or returning on an
   * earlier trip, this one starts wherever that truck currently is — so offering
   * a warehouse dispatch leg here would invite a distance nobody drove.
   *
   * Keyed on the TRUCK, not the driver: the leg is about where the vehicle was.
   */
  const resolveYardStart = async (bookingId: string, assignment: any, gapList: any[]) => {
    // Inherited an empty run from a predecessor → the truck came from there.
    const inherited = (gapList || []).find(
      (g: any) => String(g.nextBookingId?._id || g.nextBookingId) === String(bookingId)
    );
    if (inherited) {
      setYardStart({ ok: false, reason: `Truck came from ${inherited.fromLabel || "the previous trip"}` });
      return;
    }

    const truckId = assignment?.truckId?._id || assignment?.truckId;
    if (!truckId) {
      setYardStart({ ok: true, reason: "" });
      return;
    }

    try {
      const truckAssignments = await assignmentService.getByTruckId(String(truckId));
      const others = (truckAssignments || [])
        .filter((a: any) => String(a.bookingId?._id || a.bookingId) !== String(bookingId))
        .filter((a: any) => a.bookingId && typeof a.bookingId === "object")
        .sort(
          (a: any, b: any) =>
            new Date(b.assignedAt || 0).getTime() - new Date(a.assignedAt || 0).getTime()
        );

      const previous = others[0];
      if (!previous) {
        setYardStart({ ok: true, reason: "" }); // truck's first job
        return;
      }

      const prevBooking = previous.bookingId;
      const prevStatus = (prevBooking.tripStatus || "").trim().toLowerCase();
      const prevDone = prevStatus === "completed" || prevStatus === "delivered";
      const prevDiverted = prevBooking.lastPoint?.source === "reassignment";
      const prevLabel = prevBooking.tripId || "the previous trip";

      if (!prevDone) {
        setYardStart({
          ok: false,
          reason: `${prevLabel} is still ${prevStatus || "running"} on this truck`,
        });
      } else if (prevDiverted) {
        setYardStart({
          ok: false,
          reason: `${prevLabel} ended at ${prevBooking.lastPoint?.label || "another pickup"}, not the yard`,
        });
      } else {
        setYardStart({ ok: true, reason: "" });
      }
    } catch {
      // Cannot tell — leave the choice with the accountant rather than hiding it.
      setYardStart({ ok: true, reason: "" });
    }
  };

  const loadJobDetails = async () => {
    try {
      setIsLoading(true);
      const bookingId = (Array.isArray(id) ? id[0] : id) as string;
      if (!bookingId) return;

      const [data, assignment, settlement, wh, gapList] = await Promise.all([
        bookingService.getById(bookingId),
        assignmentService.getByBookingId(bookingId),
        settlementService.getByBookingId(bookingId).catch(() => null),
        warehouseService.get().catch(() => ({ street: "", city: "", province: "", country: "" })),
        tripGapService.forBooking(bookingId).catch(() => []),
      ]);

      setJobData({ ...data, assignment });
      setJobSettlement(settlement);
      setWarehouse(wh);
      setGaps(gapList || []);
      await resolveYardStart(bookingId, assignment, gapList || []);

      // Always fetch route master match — used for pre-fill AND override detection
      const pCity = data.pickupLocations?.[0]?.address?.city || data.pickup?.address?.city;
      const dCity = (data.dropoffLocations?.[data.dropoffLocations.length - 1] || data.dropoffLocations?.[0])?.address?.city || data.dropoff?.address?.city;
      const routeMatch = (pCity && dCity)
        ? await routeService.findMatch(pCity, dCity).catch(() => null)
        : null;

      // Held as locals as well as state: setState is async, so reading these back
      // from state later in this same function would give the PREVIOUS render's
      // values and make the dirty check fire on a freshly loaded, untouched trip.
      let effectiveLevy = "0";
      let effectiveToll = "0";

      if (routeMatch) {
        setRouteDefaults({
          km: routeMatch.distance,
          allocationMoney: routeMatch.allocationMoney,
          councilLevy: routeMatch.councilLevy || 0,
          tollAmount: routeMatch.tollAmount || 0,
        });
        effectiveLevy = routeMatch.councilLevy?.toString() || "0";
        effectiveToll = routeMatch.tollAmount?.toString() || "0";
        setCouncilLevy(effectiveLevy);
        setTollAmount(effectiveToll);
      }

      // Always fetch global mileage config
      const mileageConfig = await mileageService.get().catch(() => ({ loadedMileage: 0, unloadedMileage: 0 }));
      const loadedMil = mileageConfig.loadedMileage?.toString() ?? "0";
      const unloadedMil = mileageConfig.unloadedMileage?.toString() ?? "0";
      setMileageRates({ loaded: loadedMil, unloaded: unloadedMil });

      // The truck was driving Kafue → the yard when a new job diverted it, so it
      // stopped somewhere short — Chongwe, say. The leg is real; only its end
      // point and distance are now wrong.
      //
      // So the destination is CLEARED, not the leg deleted, and the row is
      // reopened for editing with its old km still in the box as a starting
      // figure. Deleting it threw away a run the truck genuinely made and left
      // the accountant retyping it from nothing.
      const retargeted = data.lastPoint?.source === "reassignment";
      const whCity = (wh.city || "").trim().toLowerCase();
      let effectiveSettlement = settlement;
      let needsEndPoint = 0;
      if (retargeted && whCity && settlement?.extraLegs?.length) {
        const rewritten = settlement.extraLegs.map((e: any) => {
          const goesToYard =
            e.kind !== "dispatch" && String(e.to || "").trim().toLowerCase() === whCity;
          if (!goesToYard) return e;
          needsEndPoint++;
          // Blank `to` also clears the row's `saved` flag in buildLegRows, which
          // is what unlocks the distance for re-entry.
          return { ...e, to: "" };
        });
        if (needsEndPoint > 0) effectiveSettlement = { ...settlement, extraLegs: rewritten };
      }
      setDroppedYardLegs(needsEndPoint);

      // One builder for both the fresh and the saved case. It reads saved legs
      // and extraLegs when present and leaves everything else blank — including
      // the dispatch leg, which must never be pre-seeded with a Route Master
      // distance that describes a completely different journey.
      setReturnDismissed(!!effectiveSettlement?.returnLegDismissed);

      const rows = buildLegRows({
        pickups: data.pickupLocations || [],
        dropoffs: data.dropoffLocations || [],
        settlement: effectiveSettlement,
        gaps: gapList || [],
        bookingId,
        loadedMileage: loadedMil,
        unloadedMileage: unloadedMil,
        warehouseCity: wh.city,
        // Only a genuine yard return. A diverted trip is "repositioning" and is
        // not going there, so it must not be handed a warehouse leg.
        returningToYard: String(data.tripStatus || "").trim().toLowerCase() === "returning",
        returnLegDismissed: !!effectiveSettlement?.returnLegDismissed,
      });

      if (settlement) {
        // A settlement can now exist without being approved — an accountant may
        // have saved a draft, or approval may be blocked by an unattributed
        // empty leg. Existence is not approval.
        setIsApproved(settlement.status === "Approved");

        setLegRows(rows);
        const savedRate = settlement.fuelDetails?.fuelRate?.toString() || "0";
        setFuelRate(savedRate);
        const savedAllocation = settlement.financials?.cashAllocation?.toString() || "";
        setAllocationMoney(savedAllocation);
        const savedLevy = settlement.financials?.councilLevy
          ? settlement.financials.councilLevy.toString()
          : effectiveLevy;
        if (settlement.financials?.councilLevy) setCouncilLevy(savedLevy);
        const savedTollVal = settlement.financials?.tollAmount ?? settlement.financials?.assumeTollAmount;
        const savedTollStr = savedTollVal ? savedTollVal.toString() : effectiveToll;
        if (savedTollVal) setTollAmount(savedTollStr);

        // Baseline for the dirty check, so an approved trip only offers "Save
        // Changes" once something has actually changed.
        setSavedFingerprint(fingerprintOf(rows, savedRate, savedAllocation, savedLevy, savedTollStr));

        // Notify if saved values differ from Route Master. Compare against the
        // first CARGO leg — legs[0] is the dispatch leg now, which has no Route
        // Master counterpart and would produce a meaningless warning.
        if (routeMatch) {
          const tripId = data.tripId || `#${data._id?.slice(-4).toUpperCase()}`;
          const firstCargo = rows.find((r) => r.kind === "stop");
          const savedKm = parseFloat(firstCargo?.km || "0");
          const savedAlloc = parseFloat(savedAllocation) || 0;
          if (savedKm > 0 && savedKm !== routeMatch.distance) {
            addNotification("⚠️", `Distance Changed — ${tripId}`,
              `Route Master: ${routeMatch.distance} km → Trip: ${savedKm} km`);
          }
          if (savedAlloc > 0 && savedAlloc !== routeMatch.allocationMoney) {
            addNotification("💰", `Allocation Changed — ${tripId}`,
              `Route Master: K${routeMatch.allocationMoney.toLocaleString()} → Trip: K${savedAlloc.toLocaleString()}`);
          }
        }
      } else {
        const routeKm = routeMatch?.distance?.toString() ?? "";
        const routeAllocation = routeMatch?.allocationMoney?.toString() ?? (data.advancePaid?.toString() || "0");

        // Route Master describes the cargo run only. Seed the cargo legs with it
        // and leave the empty legs blank for the accountant.
        setLegRows(rows.map((r) => (r.kind === "stop" ? { ...r, km: routeKm } : r)));
        setAllocationMoney(routeAllocation);
        setSavedFingerprint(""); // nothing persisted yet
      }
    } catch (error) {
      console.error("Failed to load job details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessSettlement = async (silent = false) => {
    // Fuel rate is a hard stop. Without it every leg costs nothing, so the trip
    // would be approved at a fuel total of zero — the one figure this screen
    // exists to produce.
    if (!(parseFloat(fuelRate) > 0)) {
      alert("Enter the Fuel Rate (K/L) before approving — without it the fuel cost is zero.");
      return;
    }

    // Every rendered leg must be filled. A single total-above-zero check passed
    // on the cargo leg alone and let a blank dispatch or return leg through.
    const rowsToSave = billableRows(visibleRows);

    // A hand-added leg with no place names would persist as "→" and be
    // unreadable in every report that renders it.
    const unnamed = rowsToSave.filter(
      (r) => (r.editableFrom && !r.fromLabel.trim()) || (r.editableTo && !r.toLabel.trim())
    );
    if (unnamed.length > 0) {
      alert(`Name both ends of every empty leg you added (${unnamed.length} incomplete).`);
      return;
    }

    const unfilled = rowsToSave.filter((r) => !(Number(r.km) > 0));
    if (unfilled.length > 0) {
      alert(
        "Enter a distance for every leg. Missing:\n" +
          unfilled.map((r) => `· ${r.fromLabel || "?"} → ${r.toLabel || "?"}`).join("\n")
      );
      return;
    }
    // These two default to "0", so a plain truthiness check never fired and a trip
    // could be approved having been costed at nothing. Not blocked — a route
    // really can have no toll — but worth one look before the figures commit.
    const unpriced = [
      parseFloat(allocationMoney) > 0 ? null : "Driver's Allowance",
      parseFloat(tollAmount) > 0 ? null : "Toll Amount",
    ].filter(Boolean);

    if (unpriced.length > 0 && !silent) {
      const ok = confirm(
        `${unpriced.join(" and ")} ${unpriced.length > 1 ? "are" : "is"} still zero.

Continue anyway?`
      );
      if (!ok) return;
    }

    if (blockingGap) {
      const prevLabel = (blockingGap.prevBookingId as any)?.tripId || "the previous trip";
      alert(
        `Empty leg ${blockingGap.fromLabel} → ${blockingGap.toLabel} is unattributed. ` +
          `Assign it to ${jobData?.tripId || "this trip"} or to ${prevLabel} before approving.`
      );
      return;
    }
    try {
      setIsSaving(true);
      if (!jobData?.assignment || (!jobData.assignment._id && !jobData.assignment.driverName)) {
        alert("Assignment details not found. Please assign a fleet unit first.");
        return;
      }

      await settlementService.process(buildSettlementPayload());

      // New baseline — the Save button hides again until something else changes.
      setSavedFingerprint(fingerprintOf(legRows, fuelRate, allocationMoney, councilLevy, tollAmount));

      if (!silent) {
        setIsApproved(true);
        const tripId = jobData?.tripId || `#${jobData?._id?.slice(-4).toUpperCase()}`;
        const driver = cleanDriverName(jobData?.assignment?.driverName) || "Driver";
        const pickup = allStops[0]?.address?.city || "—";
        const dropoff = allStops[allStops.length - 1]?.address?.city || "—";
        const totalKm = billableRows(visibleRows).reduce((s, r) => s + (Number(r.km) || 0), 0);
        const wasAlreadyApproved = isApproved;
        addNotification(
          wasAlreadyApproved ? "📝" : "✅",
          `${wasAlreadyApproved ? "Settlement Updated" : "Trip Approved"} — ${tripId}`,
          `${driver} · ${pickup} → ${dropoff} · Distance: ${totalKm} km (incl. empty legs) · Allocation: K${parseFloat(allocationMoney).toLocaleString()}`
        );
        alert(wasAlreadyApproved ? "Changes saved." : "Trip approved successfully!");
      }
    } catch (error: any) {
      console.error("Failed to approve trip:", error);
      // The server is the real gate. The disabled button only spares a round trip.
      if (error?.status === 409) {
        alert(error.message || "An empty leg must be attributed before this trip can be approved.");
        await loadJobDetails();
        return;
      }
      if (!silent) alert("Error approving trip");
    } finally {
      setIsSaving(false);
    }
  };

  const jobIdStr = Array.isArray(id) ? id[0] : id;
  const job = jobData
    ? {
        id: jobData.tripId || `#TRIP-${jobData._id.substring(jobData._id.length - 6).toUpperCase()}`,
        status: jobData.status,
        client: jobData.clientId?.name || "N/A",
        company: jobData.clientId?.company?.companyName || "Direct Booking",
        driver: jobData.assignment?.driverName ? cleanDriverName(jobData.assignment.driverName) : "Unassigned",
        truckNumber: jobData.assignment?.truckNumber || "N/A",
        truckHealth: jobData.assignment?.truckHealth || "Good",
        pickupLocations: jobData.pickupLocations || [],
        dropoffLocations: jobData.dropoffLocations || [],
        cargo: jobData.cargoDetails?.goodsType || "N/A",
        weight: jobData.cargoDetails?.weight ? `${jobData.cargoDetails.weight} kg` : "—",
        schedule: jobData.cargoDetails?.loadingDate || "N/A",
      }
    : {
        id: `#${jobIdStr?.toUpperCase() || "TRIP-4005"}`,
        status: "Loading...",
        client: "Loading...",
        driver: "Loading...",
        truckNumber: "Loading...",
        truckHealth: "---",
        pickupLocations: [],
        dropoffLocations: [],
        cargo: "---",
        weight: "---",
        schedule: "---",
      };

  // All stops in journey order: pickups first, then dropoffs
  const allStops = [...job.pickupLocations, ...job.dropoffLocations];

  useEffect(() => {
    if (!focusKind || !focusRef.current) return;
    focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    // The ring is a pointer, not a permanent state — drop it once it has done
    // its job so the row looks like every other row again.
    const t = setTimeout(() => setFocusFaded(true), 2600);
    return () => clearTimeout(t);
  }, [focusKind, legRows.length]);

  const hasDispatchLeg = legRows.some((r) => r.kind === "dispatch");

  // One shape, two callers: the Approve/Save button and the gap-claim action.
  // Built from current state so a claim carries whatever the accountant has typed.
  const buildSettlementPayload = () => {
    const rate = Number(fuelRate) || 0;
    const { legs, extraLegs } = toSavePayload(legRows, rate);
    return {
      bookingId: bookingIdStr,
      fuelDetails: { fuelRate: rate, legs },
      extraLegs,
      returnLegDismissed: returnDismissed,
      expenses: jobSettlement?.expenses || [],
      financials: {
        cashAllocation: Number(allocationMoney) || 0,
        fuelTotal: calculations.fuelTotal,
        councilLevy: Number(councilLevy) || 0,
        tollAmount: Number(tollAmount) || 0,
        // Route Master values — kept alongside for actual-vs-assumed comparison
        assumeCashAllocation: routeDefaults?.allocationMoney ?? 0,
        assumeCouncilLevy: routeDefaults?.councilLevy ?? 0,
        assumeTollAmount: routeDefaults?.tollAmount ?? 0,
      },
    };
  };

  // This trip was diverted to another job's pickup, so the truck never went back
  // to the yard. Offering "returned to warehouse" here would let the accountant
  // record something that did not happen.
  const wasRetargeted = jobData?.lastPoint?.source === "reassignment";

  // Where this trip's journey is supposed to end: the next job's pickup if it was
  // diverted there, otherwise the yard.
  const journeyEndCity = wasRetargeted
    ? (legRows.find((r) => r.gapId)?.toLabel || "")
    : (warehouse.city || "");

  // Once the last leg lands on that point, the chain is continuous — trip 1 ends
  // exactly where trip 2 begins — and there is nothing left to attribute.
  const lastRow = legRows[legRows.length - 1];
  const journeyClosed =
    !!journeyEndCity &&
    !!lastRow?.toLabel &&
    lastRow.toLabel.trim().toLowerCase() === journeyEndCity.trim().toLowerCase();

  const isDirty =
    fingerprintOf(legRows, fuelRate, allocationMoney, councilLevy, tollAmount) !== savedFingerprint;

  // Once the truck is on the road the planned route is history — it is no longer
  // something to edit. Empty legs stay open, because gaps only become known
  // during and after the trip (a reassignment mid-return is the whole point).
  const tripStarted =
    !!jobData?.tripStartedAt ||
    !!(jobData?.tripStatus && jobData.tripStatus.toLowerCase() !== "pending");

  // Seeds the city pickers' country select: whatever country this trip is
  // already operating in, falling back to the warehouse's.
  const tripCountry =
    jobData?.pickupLocations?.[0]?.address?.country ||
    jobData?.dropoffLocations?.[0]?.address?.country ||
    warehouse.country ||
    undefined;

  // A gap leading INTO this trip blocks its approval. A gap leading out of it
  // belongs to the trip that follows, which is not this one's problem.
  const blockingGap = gaps.find(
    (g: any) =>
      String(g.nextBookingId?._id || g.nextBookingId) === bookingIdStr &&
      g.status === "unattributed"
  );

  // Colour by leg kind, not by array position. Index arithmetic broke the moment
  // a dispatch leg was prepended.
  const legColorOf = (kind: LegRow["kind"]) =>
    kind === "dispatch" ? "slate" : kind === "return" ? "violet" : kind === "extra" ? "amber" : "emerald";

  const statCards = [
    {
      label: "Est. Fuel Cost",
      value: `K${calculations.fuelTotal.toLocaleString()}`,
      sub: calculations.emptyTotal > 0
        ? `incl. K${calculations.emptyTotal.toLocaleString()} empty`
        : undefined,
      icon: <Fuel className="w-4 h-4 text-amber-500" />,
      color: "border-amber-500",
    },
    {
      label: "Cash Allocation",
      value: allocationMoney ? `K${parseFloat(allocationMoney).toLocaleString()}` : "---",
      icon: <DollarSign className="w-4 h-4 text-blue-500" />,
      color: "border-blue-500",
    },
    {
      label: "Council Levy",
      value: councilLevy && parseFloat(councilLevy) > 0 ? `K${parseFloat(councilLevy).toLocaleString()}` : "---",
      icon: <DollarSign className="w-4 h-4 text-emerald-500" />,
      color: "border-emerald-500",
    },
    {
      label: "Toll Amount",
      value: tollAmount && parseFloat(tollAmount) > 0 ? `K${parseFloat(tollAmount).toLocaleString()}` : "---",
      icon: <DollarSign className="w-4 h-4 text-violet-500" />,
      color: "border-violet-500",
    },
  ];

  return (
    <AdminLayout>
      <div className="bg-neutral-50 min-h-screen font-sans">
        {/* Header */}
        <div className="bg-white border-b border-neutral-100 px-4 md:px-8 py-3 md:py-5 sticky top-0 z-20">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-5">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-neutral-100 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:text-primary transition-all shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 md:gap-3 mb-0.5">
                  <h1 className="text-md md:text-xl font-semibold text-slate-900 tracking-tight">{job.id}</h1>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[8px] md:text-[9px] font-bold uppercase tracking-widest">{job.company}</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[8px] md:text-[9px] font-medium uppercase tracking-widest">{job.driver}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-400 text-[8px] md:text-[9px] font-medium uppercase tracking-widest">{job.truckNumber}</span>
                </div>
                <p className="text-[9px] md:text-[11px] font-normal text-neutral-400 flex items-center gap-1.5">
                  Accountant <ChevronRight className="w-2.5 h-2.5" /> Settlement Ledger
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isApproved ? (
                // Approval is not the end of the story: empty legs are added
                // after the trip runs, so an approved settlement still has to be
                // saveable. Without this the accountant could add a return leg,
                // watch the fuel total change, and have nothing persist.
                <div className="flex items-center gap-2">
                  <div className="px-5 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                  </div>
                  {isDirty && (
                    <button
                      onClick={() => handleProcessSettlement(false)}
                      disabled={isSaving}
                      className="px-4 md:px-5 py-1.5 md:py-2 rounded-lg bg-primary text-white text-[10px] font-semibold uppercase tracking-widest hover:brightness-110 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isSaving ? "Saving…" : "Save Changes"}
                    </button>
                  )}
                </div>
              ) : (
                // The banner explaining a blocked approval lives in the scrolling
                // body, so the reason has to repeat here or the button reads as
                // simply broken.
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => handleProcessSettlement(false)}
                    disabled={!!blockingGap}
                    className={`flex-1 md:flex-none px-4 md:px-5 py-1.5 md:py-2 rounded-lg text-[10px] font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                      blockingGap
                        ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                        : "bg-slate-900 text-white hover:brightness-110"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Trip
                  </button>
                  {blockingGap && (
                    <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wide">
                      Empty leg unattributed
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-[1280px] mx-auto space-y-4 md:space-y-6">

          {/* Amendment banner — outside the routeDefaults guard on purpose: a trip
              whose city pair has no Route Master entry still needs to see this. */}
          {jobData?.lastPoint?.source === "reassignment" && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-amber-500 text-base shrink-0">⚠️</span>
              <div>
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">Last Point Changed</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  This trip now ends at <strong>{jobData.lastPoint.label}</strong> instead of the warehouse
                  {jobData.lastPoint.setAt ? ` · ${new Date(jobData.lastPoint.setAt).toLocaleString()}` : ""}.
                  Fill the empty legs below before approving.
                </p>
              </div>
            </div>
          )}

          {/* Orphan gap blocker */}
          {blockingGap && (
            <div className="flex items-start gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-rose-500 text-base shrink-0">🔴</span>
              <div>
                <p className="text-[11px] font-bold text-rose-700 uppercase tracking-widest">Unattributed Empty Leg</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  {blockingGap.fromLabel} → {blockingGap.toLabel} has not been billed to any trip.
                  This trip cannot be approved until it is — use the empty-leg card below.
                </p>
              </div>
            </div>
          )}

          {/* Route Master override notification */}
          {routeDefaults && (() => {
            const kmChanged = legRows.some(l => l.kind === "stop" && parseFloat(l.km) > 0 && parseFloat(l.km) !== routeDefaults.km);
            const allocChanged = parseFloat(allocationMoney) > 0 && parseFloat(allocationMoney) !== routeDefaults.allocationMoney;
            if (!kmChanged && !allocChanged) return null;
            const changes: string[] = [];
            if (kmChanged) changes.push(`distance changed from ${routeDefaults.km} km (Route Master)`);
            if (allocChanged) changes.push(`allocation changed from K${routeDefaults.allocationMoney.toLocaleString()} (Route Master)`);
            return (
              <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-amber-500 text-base shrink-0">⚠️</span>
                <div>
                  <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">Route Data Modified</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    For this trip: {changes.join(" · ")}
                  </p>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {statCards.map((card, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl md:rounded-2xl p-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border-t-2 ${card.color} transition-transform hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1 px-1.5 rounded-lg bg-neutral-50 shrink-0">{card.icon}</div>
                </div>
                <div className="text-sm md:text-lg font-semibold text-slate-900 mb-0.5">{card.value}</div>
                <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest">{card.label}</div>
                {card.sub && (
                  <div className="text-[8px] font-bold text-amber-600 uppercase tracking-wide mt-0.5">{card.sub}</div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Route Flow */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs md:text-sm font-semibold text-slate-950">Trip Route Flow</h2>
                  <div className="px-2 md:px-3 py-1 rounded-full bg-emerald-50 text-[8px] md:text-[9px] font-medium text-emerald-600 uppercase tracking-wider">Live Route</div>
                </div>

                <div className="relative">
                  <div className="absolute left-3.75 top-4 bottom-4 w-px bg-neutral-100" />
                  <div className="space-y-0">
                    {/* Origin node — only when the accountant has actually added a
                        leg before the first pickup. A trip does not always start
                        at the warehouse, so this must not be assumed. */}
                    {legRows.filter((r) => r.kind === "dispatch").map((r) => (
                      <div key={r.id} className="relative flex gap-4 pb-6">
                        <div className="relative z-10 w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 text-[10px] font-bold shadow-md shadow-slate-200">
                          X
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Origin · Empty Run</div>
                          <div className="text-sm font-semibold text-slate-900 leading-tight">
                            {r.fromLabel || "Not named yet"}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            Truck runs empty to {r.toLabel || "the first pickup"}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pickup stops */}
                    {job.pickupLocations.map((loc: any, idx: number) => (
                      <div key={`p-${idx}`} className="relative flex gap-4 pb-6">
                        <div className="relative z-10 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-[10px] font-bold shadow-md shadow-emerald-200">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Pickup Stop</div>
                          <div className="text-sm font-semibold text-slate-900 leading-tight">{[loc.address?.city, loc.address?.state, loc.address?.country].filter(Boolean).join(", ") || "—"}</div>
                          {(loc.address?.plotNo || loc.address?.street) && (
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              {[loc.address?.plotNo, loc.address?.street].filter(Boolean).join(", ")}
                            </div>
                          )}
                          {loc.contactPerson && (
                            <div className="text-[10px] text-emerald-600 mt-1 font-medium">
                              {loc.contactPerson}{loc.contactNumber ? ` · ${loc.contactNumber}` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Truck transition */}
                    <div className="relative flex gap-4 pb-6">
                      <div className="relative z-10 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-md shadow-slate-200 text-base">
                        🚛
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">In Transit</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">Cargo loaded · Heading to destination</div>
                      </div>
                    </div>

                    {/* Dropoff stops */}
                    {job.dropoffLocations.map((loc: any, idx: number) => {
                      const isLast = idx === job.dropoffLocations.length - 1;
                      return (
                        <div key={`d-${idx}`} className={`relative flex gap-4 ${isLast ? "pb-6" : "pb-6"}`}>
                          <div className="relative z-10 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-[10px] font-bold shadow-md shadow-rose-200">
                            {String.fromCharCode(65 + job.pickupLocations.length + idx)}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-0.5">
                              {isLast ? "Final Destination" : "Drop-off Stop"}
                            </div>
                            <div className="text-sm font-semibold text-slate-900 leading-tight">{[loc.address?.city, loc.address?.state, loc.address?.country].filter(Boolean).join(", ") || "—"}</div>
                            {(loc.address?.plotNo || loc.address?.street) && (
                              <div className="text-[11px] text-neutral-500 mt-0.5">
                                {[loc.address?.plotNo, loc.address?.street].filter(Boolean).join(", ")}
                              </div>
                            )}
                            {loc.contactPerson && (
                              <div className="text-[10px] text-rose-500 mt-1 font-medium">
                                {loc.contactPerson}{loc.contactNumber ? ` · ${loc.contactNumber}` : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {/* Empty movements after the last drop — the claimed gap and any
                        legs the accountant added. Rendered from the actual rows, so
                        the same movement can never appear twice (it used to: a gap
                        row and an auto return row both described drop → next pickup). */}
                    {legRows
                      .filter((r) => r.kind === "extra" || r.kind === "return")
                      .map((r) => (
                        <div key={r.id} className="relative flex gap-4 pb-6 last:pb-0">
                          <div className="relative z-10 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-200 text-sm">
                            ↩
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5">
                            <div className="text-[9px] font-bold text-violet-600 uppercase tracking-widest">
                              {r.kind === "extra" ? "Empty Transit" : "Return Journey"}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              {r.fromLabel || "—"} → {r.toLabel || "—"}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Cash Allocation — flex-1 so the left column's bottom lines up with the right column */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 px-1.5 rounded-lg bg-blue-50 text-blue-600"><DollarSign className="w-3.5 h-3.5" /></div>
                  <div>
                    <h2 className="text-xs md:text-sm font-semibold text-slate-950">Driver's Allowance</h2>
                    <p className="text-[8px] md:text-[9px] font-normal text-neutral-400 uppercase tracking-widest">Food & Other Expenses</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-blue-50/30 border border-blue-100/50 mb-4">
                  <p className="text-[10px] font-medium text-blue-700 leading-relaxed">
                    This amount is given to the driver for food, lodging, tolls and other miscellaneous expenses during the trip. This is <strong>not</strong> for fuel/petrol.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-sans">Allocation Amount (K)</label>
                    {routeDefaults && parseFloat(allocationMoney) !== routeDefaults.allocationMoney && parseFloat(allocationMoney) > 0 && (
                      <span className="text-[7px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Route: K{routeDefaults.allocationMoney.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={allocationMoney}
                    onChange={(e) => handleAllocationChange(e.target.value)}
                    onBlur={(e) => handleAllocationBlur(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-neutral-300"
                  />
                </div>

                {/* Council Levy */}
                <div className="space-y-2 mt-4 pt-4 border-t border-neutral-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 px-1.5 rounded-lg bg-emerald-50 text-emerald-600"><DollarSign className="w-3.5 h-3.5" /></div>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-950">Council Levy</h3>
                      <p className="text-[8px] font-normal text-neutral-400 uppercase tracking-widest">Route Master value</p>
                    </div>
                  </div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-sans ml-1">Council Levy Amount (K)</label>
                  <input
                    type="number"
                    value={councilLevy}
                    onChange={(e) => setCouncilLevy(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-emerald-50/40 border border-emerald-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400 focus:bg-white transition-all placeholder:text-neutral-300"
                  />
                </div>

              </div>
            </div>

            {/* Fuel Estimate — per leg */}
            <div className="space-y-4 md:space-y-6">
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-1.5 rounded-lg bg-orange-50 text-orange-600"><Fuel className="w-3.5 h-3.5" /></div>
                    <h2 className="text-xs md:text-sm font-semibold text-slate-950">Fuel Estimate</h2>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-amber-50 text-[8px] md:text-[9px] font-medium text-amber-600 uppercase tracking-widest">Auto Calc</div>
                </div>

                <div className="space-y-3">
                  {droppedYardLegs > 0 && (
                    <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">
                        {droppedYardLegs} return leg{droppedYardLegs > 1 ? "s" : ""} reopened
                      </p>
                      <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                        This trip was diverted to {jobData?.lastPoint?.label || "another job's pickup"},
                        so the truck stopped short of the yard. The leg is kept — set the destination to
                        where it actually turned and correct the distance, then press Save.
                      </p>
                    </div>
                  )}

                  {tripStarted && (
                    <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Route locked</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        The trip has started, so the cargo route and its distances can no longer
                        be changed. Empty legs stay open — dispatch, transit and the return are
                        only known once the truck is on the road.
                      </p>
                    </div>
                  )}

                  {/* Add a leg BEFORE the first pickup. Optional and hand-added,
                      because a trip does not always start at the warehouse.
                      Hidden once one exists — there is only ever one run into
                      the first pickup. Remove it with × to add a different one.
                      Also hidden once the truck has left: the route is settled. */}
                  {/* A yes/no question, not an action: did the truck start from the
                      yard? Both endpoints are already known, so ticking this is the
                      whole decision — the card below then only asks for the km. */}
                  {/* Only offered when the truck could actually have come from the
                      yard — i.e. its previous job is finished and ended there.
                      Otherwise the vehicle is mid-journey somewhere else, and a
                      warehouse leg would be a distance nobody drove. */}
                  {!tripStarted && yardStart?.ok === false && !hasDispatchLeg && (
                    <div className="px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                      <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                        Not a warehouse start
                      </p>
                      <p className="text-[9px] text-neutral-400 mt-0.5">{yardStart.reason}</p>
                    </div>
                  )}
                  {!tripStarted && (yardStart?.ok !== false || hasDispatchLeg) && (
                    <label
                      className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border ${
                        warehouse.city
                          ? "border-neutral-200 cursor-pointer hover:bg-neutral-50"
                          : "border-neutral-200 opacity-60 cursor-not-allowed"
                      }`}
                      title={warehouse.city ? "" : "Set the warehouse on Route Master first"}
                    >
                      <input
                        type="checkbox"
                        disabled={!warehouse.city}
                        checked={hasDispatchLeg}
                        onChange={(e) => (e.target.checked ? addDispatchLeg() : removeDispatchLeg())}
                        className="w-3.5 h-3.5 mt-0.5 accent-primary shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                          Trip started from the warehouse
                        </span>
                        <span className="block text-[9px] text-neutral-400 mt-0.5">
                          {warehouse.city
                            ? `Adds ${warehouse.city} → ${jobData?.pickupLocations?.[0]?.address?.city || "first pickup"} — you enter the km`
                            : "Warehouse not set on Route Master"}
                        </span>
                      </span>
                    </label>
                  )}

                  {/* Per-leg cards. Keyed by row.id, never by index — [+] and
                      claim/unclaim mutate the middle of this list, and index keys
                      would re-map inputs onto the wrong rows at runtime. */}
                  {visibleRows.map((row) => {
                    const color = legColorOf(row.kind);
                    const calc = calculations.perRow.get(row.id);
                    const ctx = row.gapId ? gapContextFor(row) : null;
                    // The claim strip sits on whichever card carries the gap, and a
                    // gap absorbed by the return leg lands on a violet one — an amber
                    // rule across it reads as a stray fragment of another card.
                    const claimRule = color === "violet" ? "border-violet-200/60" : "border-amber-200/60";
                    const claimText = color === "violet" ? "text-violet-700" : "text-amber-700";
                    const isCargo = row.kind === "stop";
                    // Two things freeze once the truck is out: the cargo route,
                    // and any empty leg already committed to the settlement. An
                    // empty leg stays open only until it is saved — after that it
                    // has been costed, and a figure that keeps moving under the
                    // accountant is worse than one they have to remove on purpose.
                    const locked = tripStarted && (row.kind === "stop" || !!row.saved);

                    const colorMap: Record<string, string> = {
                      emerald: "bg-emerald-50 border-emerald-100",
                      slate:   "bg-slate-50 border-slate-100",
                      amber:   "bg-amber-50 border-amber-200",
                      violet:  "bg-violet-50 border-violet-100",
                    };
                    const textColor: Record<string, string> = {
                      emerald: "text-emerald-700",
                      slate:   "text-slate-700",
                      amber:   "text-amber-700",
                      violet:  "text-violet-700",
                    };
                    const labelBg: Record<string, string> = {
                      emerald: "bg-emerald-500",
                      slate:   "bg-slate-600",
                      amber:   "bg-amber-500",
                      violet:  "bg-violet-500",
                    };

                    const kindLabel: Record<LegRow["kind"], string> = {
                      dispatch: "Dispatch · From Warehouse",
                      stop:     "Cargo Leg",
                      extra:    "Empty Transit",
                      return:   jobData?.lastPoint?.source === "reassignment" ? "Repositioning · Empty" : "Return · Empty",
                    };

                    const isFocused = focusKind === row.kind && !focusFaded;

                    return (
                      <div
                        key={row.id}
                        ref={focusKind === row.kind ? focusRef : undefined}
                        className={`p-4 rounded-xl border space-y-3 transition-shadow duration-500 ${colorMap[color]} ${
                          isFocused ? "ring-4 ring-violet-300 ring-offset-2" : ""
                        }`}
                      >
                        {/* From */}
                        <div className="flex items-start gap-2">
                          <div className={`w-7 h-7 rounded-full ${labelBg[color]} text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5`}>
                            {row.kind === "dispatch" ? "X" : row.kind === "extra" ? "•" : "→"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[8px] font-bold uppercase tracking-widest ${textColor[color]}`}>{kindLabel[row.kind]}</div>
                            {row.editableFrom && !locked ? (
                              // The mid-return point has no record anywhere — the
                              // accountant picks it, from the same city list the
                              // booking form uses so the names cannot drift.
                              <CityPicker
                                value={row.fromLabel}
                                onChange={(city) => updateRow(row.id, { fromLabel: city })}
                                defaultCountry={tripCountry}
                                tone={row.kind === "extra" ? "amber" : "neutral"}
                              />
                            ) : (
                              <div className="text-[12px] font-semibold text-slate-900">
                                {row.fromLabel}
                                {/* Say so plainly — on its own, a city name gives no
                                    clue that this is the yard rather than a stop. */}
                                {row.kind === "dispatch" && (
                                  <span className="ml-1.5 text-[8px] font-bold uppercase tracking-widest text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                                    Warehouse
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Hand-added and return legs get a ×; the dismissal of a
                              return leg is saved, so it stays gone. Dispatch is owned
                              by the checkbox above, and a gap row is claimed rather
                              than deleted.

                              A diverted trip is the exception: the truck really did
                              drive from the drop to wherever the new job caught it,
                              and that leg is what this settlement exists to cost.
                              Striking it off would not undo the drive, only hide it. */}
                          {row.manual &&
                            (row.kind === "extra" || (row.kind === "return" && !wasRetargeted)) &&
                            !row.gapId && (
                            <button
                              onClick={() => removeRow(row.id)}
                              title="Remove this leg"
                              className="shrink-0 w-6 h-6 rounded-lg border border-neutral-200 bg-white text-neutral-400 hover:text-rose-600 hover:border-rose-200 text-[13px] leading-none flex items-center justify-center transition-all"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        {/* Arrow */}
                        <div className="flex items-center gap-2 pl-3">
                          <div className="w-px h-4 bg-neutral-200" />
                          <span className="text-[9px] text-neutral-400 font-medium">
                            {row.kind === "return" ? "↩" : row.kind === "stop" ? "↓" : "⇢ empty"}
                          </span>
                        </div>
                        {/* To */}
                        <div className="flex items-start gap-2">
                          <div className={`w-7 h-7 rounded-full ${labelBg[color]} text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5`}>
                            {row.kind === "return" ? "X" : "→"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[8px] font-bold uppercase tracking-widest ${textColor[color]}`}>Destination</div>
                            {row.editableTo && !locked ? (
                              /* The yard is picked from the same city list as anywhere
                                 else. It used to have its own tick-box, which made the
                                 one destination field behave two different ways
                                 depending on where the truck went. */
                              <CityPicker
                                value={row.toLabel}
                                onChange={(city) => updateRow(row.id, { toLabel: city })}
                                defaultCountry={tripCountry}
                                tone={row.kind === "extra" ? "amber" : "neutral"}
                              />
                            ) : (
                              <div className="text-[12px] font-semibold text-slate-900">{row.toLabel}</div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-[11px] font-bold ${textColor[color]}`}>K{(calc?.amount || 0).toLocaleString()}</div>
                            <div className="text-[8px] font-semibold text-neutral-400 uppercase">{(calc?.liters || 0).toFixed(1)}L</div>
                          </div>
                        </div>
                        {/* Inputs */}
                        <div className="grid grid-cols-2 gap-2 pt-1 items-start">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between ml-1">
                              <label className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest">Distance (KM)</label>
                              {isCargo && routeDefaults && parseFloat(row.km) !== routeDefaults.km && parseFloat(row.km) > 0 && (
                                <span className="text-[7px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                  Route: {routeDefaults.km} km
                                </span>
                              )}
                            </div>
                            <input
                              type="number"
                              value={row.km}
                              placeholder="0"
                              disabled={locked}
                              onChange={(e) => updateRow(row.id, { km: e.target.value })}
                              onBlur={(e) => handleKmBlur(row, e.target.value)}
                              className={`w-full border rounded-lg py-1.5 px-3 text-[11px] font-semibold outline-none transition-colors ${
                                locked
                                  ? "bg-neutral-100 border-neutral-200 text-neutral-500 cursor-not-allowed"
                                  : isCargo && routeDefaults && parseFloat(row.km) !== routeDefaults.km && parseFloat(row.km) > 0
                                    ? "bg-amber-50 border-amber-300 text-slate-900"
                                    : "bg-white border-neutral-200 text-slate-900"
                              }`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] flex font-medium text-neutral-400 uppercase tracking-widest ml-1">Load Type</label>
                            <select
                              value={row.loadType}
                              // Empty legs are unloaded by definition. Billing one at
                              // the loaded rate is always wrong, so it is not offered.
                              disabled={!isCargo || locked}
                              onChange={(e) => {
                                const type = e.target.value as "loaded" | "unloaded";
                                updateRow(row.id, {
                                  loadType: type,
                                  mileage: type === "loaded" ? mileageRates.loaded : mileageRates.unloaded,
                                });
                              }}
                              className={`w-full border border-neutral-200 rounded-lg py-1.5 px-3 text-[11px] font-semibold outline-none appearance-none ${
                                isCargo && !locked
                                  ? "bg-white cursor-pointer text-slate-900"
                                  : "bg-neutral-100 cursor-not-allowed text-neutral-500"
                              }`}
                            >
                              <option value="loaded">Loaded ({mileageRates.loaded} km/L)</option>
                              <option value="unloaded">Unloaded ({mileageRates.unloaded} km/L)</option>
                            </select>
                          </div>
                        </div>
                        {/* Unclaimed gap → bill it to one trip or the other */}
                        {ctx && ctx.gap.status === "unattributed" && (
                          <div className={`flex items-center justify-between gap-2 pt-2 border-t ${claimRule}`}>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${claimText}`}>Bill this empty leg to</span>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleClaimGap(row)}
                                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:brightness-110"
                              >
                                {/* Named, not "this trip" — the other option is a
                                    trip id, so a relative label next to it makes the
                                    accountant work out which is which. */}
                                {job.id}
                              </button>
                              <button
                                onClick={() => router.push(`/admin/accountant/${ctx.otherTripBookingId}`)}
                                className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:border-primary/30 hover:text-primary"
                              >
                                {ctx.otherTripLabel}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Settled. Attribution is deliberately one-way: the leg is
                            now costed on this trip, and offering to pull it back out
                            turns a decision into something that drifts. Billing it to
                            the other trip is done from that trip's own screen. */}
                        {ctx && ctx.gap.status === "claimed" && (
                          <div className={`flex items-center gap-2 pt-2 border-t ${claimRule}`}>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${claimText}`}>
                              Billed to {ctx.currentOwnerId && String(ctx.currentOwnerId) !== bookingIdStr
                                ? ctx.otherTripLabel
                                : job.id}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {journeyClosed && (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                        Route complete · ends at {journeyEndCity}
                      </span>
                    </div>
                  )}

                  {/* Fuel Rate */}
                  <div className="flex items-center justify-between px-1 py-2 border-b border-neutral-100">
                    <label className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Fuel className="w-3 h-3" /> Fuel Rate (K/L)
                    </label>
                    <input
                      type="number"
                      value={fuelRate}
                      onChange={(e) => setFuelRate(e.target.value)}
                      className="w-16 bg-neutral-50 border-b-2 border-emerald-500/30 text-[11px] font-bold text-emerald-700 text-right outline-none pr-1 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  {/* Total */}
                  <div className="py-4 bg-amber-50/30 rounded-xl px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Est. Fuel Cost</div>
                        <div className="text-[8px] font-bold text-amber-600 uppercase">
                          {calculations.totalLiters}L total · {calculations.legCount} leg{calculations.legCount === 1 ? "" : "s"}
                          {calculations.emptyTotal > 0 ? ` · K${calculations.emptyTotal.toLocaleString()} empty` : ""}
                        </div>
                      </div>
                      <span className="text-base md:text-xl font-bold text-amber-600">K{calculations.fuelTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toll Amount — Route Master estimate, NOT part of driver's allowance */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 px-1.5 rounded-lg bg-violet-50 text-violet-600"><DollarSign className="w-3.5 h-3.5" /></div>
                  <div>
                    <h2 className="text-xs md:text-sm font-semibold text-slate-950">Toll Amount</h2>
                    <p className="text-[8px] md:text-[9px] font-normal text-neutral-400 uppercase tracking-widest">Route Master value</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-violet-50/30 border border-violet-100/50 mb-4">
                  <p className="text-[10px] font-medium text-violet-700 leading-relaxed">
                    Estimated toll cost for this route. This is <strong>not</strong> part of the driver&apos;s allowance — it is tracked separately.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-sans">Toll Amount (K)</label>
                    {routeDefaults && parseFloat(tollAmount) !== routeDefaults.tollAmount && parseFloat(tollAmount) > 0 && (
                      <span className="text-[7px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Route: K{routeDefaults.tollAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={tollAmount}
                    onChange={(e) => setTollAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-violet-50/40 border border-violet-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:bg-white transition-all placeholder:text-neutral-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
