"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { routeService } from "@/services/routeService";
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

  // One entry per leg (stop-to-stop)
  const [legData, setLegData] = useState<{ km: string; mileage: string }[]>([
    { km: "0", mileage: "0" },
  ]);
  const [fuelRate, setFuelRate] = useState("0");
  const [allocationMoney, setAllocationMoney] = useState("0");

  // Route Master original values — to detect manual overrides
  const [routeDefaults, setRouteDefaults] = useState<{ km: number; allocationMoney: number } | null>(null);

  useEffect(() => {
    if (id) loadJobDetails();
  }, [id]);

  const handleKmChange = (i: number, value: string) => {
    const updated = [...legData];
    updated[i] = { ...updated[i], km: value };
    setLegData(updated);
  };

  // Fires only when user leaves the km field (final value)
  const handleKmBlur = (i: number, value: string) => {
    if (!routeDefaults || !jobData) return;
    const newKm = parseFloat(value) || 0;
    if (newKm <= 0) return;
    if (newKm !== routeDefaults.km && !notifiedRef.current.has(`km-${i}`)) {
      notifiedRef.current.add(`km-${i}`);
      const tripId = jobData.tripId || `#${jobData._id?.slice(-4).toUpperCase()}`;
      addNotification(
        "⚠️",
        `Distance Changed — ${tripId}`,
        `Route Master: ${routeDefaults.km} km → Leg ${i + 1}: ${newKm} km`
      );
    }
    if (newKm === routeDefaults.km) notifiedRef.current.delete(`km-${i}`);
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

  const calculations = useMemo(() => {
    const rate = parseFloat(fuelRate) || 0;
    const cash = parseFloat(allocationMoney) || 0;

    const legCalcs = legData.map((leg) => {
      const km = parseFloat(leg.km) || 0;
      const mileage = parseFloat(leg.mileage) || 1;
      const liters = km / mileage;
      return { liters, amount: Math.round(liters * rate) };
    });

    const totalLiters = legCalcs.reduce((s, l) => s + l.liters, 0);
    const fuelTotal = legCalcs.reduce((s, l) => s + l.amount, 0);

    return {
      legCalcs,
      totalLiters: totalLiters.toFixed(1),
      fuelTotal,
      grandTotal: fuelTotal + Math.round(cash),
    };
  }, [legData, fuelRate, allocationMoney]);

  const loadJobDetails = async () => {
    try {
      setIsLoading(true);
      const bookingId = (Array.isArray(id) ? id[0] : id) as string;
      if (!bookingId) return;

      const [data, assignment, settlement] = await Promise.all([
        bookingService.getById(bookingId),
        assignmentService.getByBookingId(bookingId),
        settlementService.getByBookingId(bookingId).catch(() => null),
      ]);

      setJobData({ ...data, assignment });
      setJobSettlement(settlement);

      const totalStops =
        (data.pickupLocations?.length || 0) + (data.dropoffLocations?.length || 0);
      const totalLegs = Math.max(totalStops, 1);

      // Always fetch route master match — used for pre-fill AND override detection
      const pCity = data.pickupLocations?.[0]?.address?.city || data.pickup?.address?.city;
      const dCity = (data.dropoffLocations?.[data.dropoffLocations.length - 1] || data.dropoffLocations?.[0])?.address?.city || data.dropoff?.address?.city;
      const routeMatch = (pCity && dCity)
        ? await routeService.findMatch(pCity, dCity).catch(() => null)
        : null;

      if (routeMatch) {
        setRouteDefaults({ km: routeMatch.distance, allocationMoney: routeMatch.allocationMoney });
      }

      if (settlement) {
        setIsApproved(true);

        const legs = settlement.fuelDetails?.legs
          ? settlement.fuelDetails.legs.map((l: any) => ({ km: l.km.toString(), mileage: l.mileage.toString() }))
          : Array.from({ length: totalLegs }, (_, i) => ({
              km: i === 0 ? settlement.fuelDetails.pickupKm?.toString() || "0" : settlement.fuelDetails.dropoffKm?.toString() || "0",
              mileage: i === 0 ? settlement.fuelDetails.pickupMileage?.toString() || "0" : settlement.fuelDetails.dropoffMileage?.toString() || "0",
            }));

        setLegData(legs);
        setFuelRate(settlement.fuelDetails.fuelRate?.toString() || "0");
        const savedAllocation = settlement.financials.cashAllocation?.toString() || "";
        setAllocationMoney(savedAllocation);

        // Notify if saved values differ from Route Master
        if (routeMatch) {
          const tripId = data.tripId || `#${data._id?.slice(-4).toUpperCase()}`;
          const savedKm = parseFloat(legs[0]?.km || "0");
          const savedAlloc = parseFloat(savedAllocation) || 0;

          if (savedKm > 0 && savedKm !== routeMatch.distance) {
            addNotification(
              "⚠️",
              `Distance Changed — ${tripId}`,
              `Route Master: ${routeMatch.distance} km → Trip: ${savedKm} km`
            );
          }
          if (savedAlloc > 0 && savedAlloc !== routeMatch.allocationMoney) {
            addNotification(
              "💰",
              `Allocation Changed — ${tripId}`,
              `Route Master: K${routeMatch.allocationMoney.toLocaleString()} → Trip: K${savedAlloc.toLocaleString()}`
            );
          }
        }
      } else {
        const routeKm = routeMatch?.distance.toString() ?? "0";
        const routeAllocation = routeMatch?.allocationMoney.toString() ?? (data.advancePaid?.toString() || "0");

        setLegData(Array.from({ length: totalLegs }, () => ({
          km: routeKm,
          mileage: "0",
        })));
        setAllocationMoney(routeAllocation);
      }
    } catch (error) {
      console.error("Failed to load job details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessSettlement = async (silent = false) => {
    if (!allocationMoney) {
      alert("Please enter the Cash Allocation amount");
      return;
    }
    try {
      const bookingId = (Array.isArray(id) ? id[0] : id) as string;
      if (!jobData?.assignment || (!jobData.assignment._id && !jobData.assignment.driverName)) {
        alert("Assignment details not found. Please assign a fleet unit first.");
        return;
      }

      const rate = Number(fuelRate) || 0;
      const settlementPayload = {
        bookingId,
        fuelDetails: {
          fuelRate: rate,
          legs: legData.map((l, i) => {
            const isReturn = i === allStops.length - 1;
            const fromStop = isReturn ? allStops[allStops.length - 1] : allStops[i];
            const toStop   = isReturn ? allStops[0] : allStops[i + 1];
            const km       = Number(l.km) || 0;
            const mileage  = Number(l.mileage) || 1;
            const liters   = Math.round((km / mileage) * 10) / 10;
            return {
              from:   fromStop?.address?.city || `Stop ${i + 1}`,
              to:     isReturn
                        ? `${toStop?.address?.city || "Origin"} (Return)`
                        : (toStop?.address?.city || `Stop ${i + 2}`),
              km,
              mileage,
              liters,
              amount: Math.round(liters * rate),
            };
          }),
        },
        expenses: jobSettlement?.expenses || [],
        financials: {
          cashAllocation: Number(allocationMoney),
          fuelTotal: calculations.fuelTotal,
        },
      };

      await settlementService.process(settlementPayload);

      if (!silent) {
        setIsApproved(true);
        const tripId = jobData?.tripId || `#${jobData?._id?.slice(-4).toUpperCase()}`;
        const driver = jobData?.assignment?.driverName || "Driver";
        const pickup = allStops[0]?.address?.city || "—";
        const dropoff = allStops[allStops.length - 1]?.address?.city || "—";
        addNotification(
          "✅",
          `Trip Approved — ${tripId}`,
          `${driver} · ${pickup} → ${dropoff} · Distance: ${routeDefaults ? `${routeDefaults.km} km → ` : ""}${legData[0]?.km || "0"} km · Allocation: K${parseFloat(allocationMoney).toLocaleString()}`
        );
        alert("Trip approved successfully!");
      }
    } catch (error) {
      console.error("Failed to approve trip:", error);
      if (!silent) alert("Error approving trip");
    }
  };

  const jobIdStr = Array.isArray(id) ? id[0] : id;
  const job = jobData
    ? {
        id: jobData.tripId || `#TRIP-${jobData._id.substring(jobData._id.length - 6).toUpperCase()}`,
        status: jobData.status,
        client: jobData.clientId?.name || "N/A",
        company: jobData.clientId?.company?.companyName || "Direct Booking",
        driver: jobData.assignment?.driverName || "Unassigned",
        truckNumber: jobData.assignment?.truckNumber || "N/A",
        truckHealth: jobData.assignment?.truckHealth || "Good",
        pickupLocations: jobData.pickupLocations || [],
        dropoffLocations: jobData.dropoffLocations || [],
        cargo: jobData.cargoDetails?.goodsType || "N/A",
        weight: `${jobData.cargoDetails?.weight || 0} kg`,
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

  const getLegColor = (legIdx: number) => {
    const pickupCount = job.pickupLocations.length;
    if (legIdx === allStops.length - 1) return "violet"; // return journey (last leg)
    if (legIdx < pickupCount - 1) return "emerald";      // pickup → pickup
    if (legIdx === pickupCount - 1) return "slate";      // last pickup → first dropoff
    return "rose";                                        // dropoff → dropoff
  };

  const statCards = [
    {
      label: "Est. Fuel Cost",
      value: `₦${calculations.fuelTotal.toLocaleString()}`,
      icon: <Fuel className="w-4 h-4 text-amber-500" />,
      color: "border-amber-500",
    },
    {
      label: "Cash Allocation",
      value: allocationMoney ? `₦${parseFloat(allocationMoney).toLocaleString()}` : "---",
      icon: <DollarSign className="w-4 h-4 text-blue-500" />,
      color: "border-blue-500",
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
                <div className="px-5 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                </div>
              ) : (
                <button
                  onClick={() => handleProcessSettlement(false)}
                  className="flex-1 md:flex-none px-4 md:px-5 py-1.5 md:py-2 rounded-lg bg-slate-900 text-white text-[10px] font-semibold uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve Trip
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-[1280px] mx-auto space-y-4 md:space-y-6">

          {/* Route Master override notification */}
          {routeDefaults && (() => {
            const kmChanged = legData.some(l => parseFloat(l.km) > 0 && parseFloat(l.km) !== routeDefaults.km);
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
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
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* Route Flow */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs md:text-sm font-semibold text-slate-950">Trip Route Flow</h2>
                  <div className="px-2 md:px-3 py-1 rounded-full bg-emerald-50 text-[8px] md:text-[9px] font-medium text-emerald-600 uppercase tracking-wider">Live Route</div>
                </div>

                <div className="relative">
                  <div className="absolute left-3.75 top-4 bottom-4 w-px bg-neutral-100" />
                  <div className="space-y-0">
                    {/* Pickup stops */}
                    {job.pickupLocations.map((loc: any, idx: number) => (
                      <div key={`p-${idx}`} className="relative flex gap-4 pb-6">
                        <div className="relative z-10 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-[10px] font-bold shadow-md shadow-emerald-200">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Pickup Stop</div>
                          <div className="text-sm font-semibold text-slate-900 leading-tight">{loc.address?.city || "—"}</div>
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
                            <div className="text-sm font-semibold text-slate-900 leading-tight">{loc.address?.city || "—"}</div>
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
                    {/* Return journey indicator */}
                    {allStops.length > 0 && (
                      <div className="relative flex gap-4">
                        <div className="relative z-10 w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-200 text-sm">
                          ↩
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5">
                          <div className="text-[9px] font-bold text-violet-600 uppercase tracking-widest">Return Journey</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            {allStops[allStops.length - 1]?.address?.city || "Last Stop"} → {allStops[0]?.address?.city || "Origin"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cash Allocation */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
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
                  {/* Per-leg cards */}
                  {legData.map((leg, i) => {
                    const isReturn = i === allStops.length - 1;
                    const fromStop = isReturn ? allStops[allStops.length - 1] : allStops[i];
                    const toStop = isReturn ? allStops[0] : allStops[i + 1];
                    const fromCity = fromStop?.address?.city || String.fromCharCode(65 + i);
                    const toCity = isReturn
                      ? (toStop?.address?.city || "Origin")
                      : (toStop?.address?.city || String.fromCharCode(65 + i + 1));

                    const pickupCount = job.pickupLocations.length;
                    const getStopType = (stopIdx: number) =>
                      stopIdx < pickupCount ? "Pickup Stop" : "Dropoff Stop";
                    const fromType = isReturn ? "Dropoff Stop" : getStopType(i);
                    const toType = isReturn ? "Return to Warehouse" : getStopType(i + 1);

                    const fromLabel = isReturn
                      ? String.fromCharCode(65 + allStops.length - 1)
                      : String.fromCharCode(65 + i);
                    const toLabel = isReturn ? "A" : String.fromCharCode(65 + i + 1);

                    const color = getLegColor(i);
                    const calc = calculations.legCalcs[i];

                    const colorMap: Record<string, string> = {
                      emerald: "bg-emerald-50 border-emerald-100",
                      slate:   "bg-slate-50 border-slate-100",
                      rose:    "bg-rose-50 border-rose-100",
                      violet:  "bg-violet-50 border-violet-100",
                    };
                    const dotMap: Record<string, string> = {
                      emerald: "bg-emerald-500",
                      slate:   "bg-slate-600",
                      rose:    "bg-rose-500",
                      violet:  "bg-violet-500",
                    };
                    const textColor: Record<string, string> = {
                      emerald: "text-emerald-700",
                      slate:   "text-slate-700",
                      rose:    "text-rose-700",
                      violet:  "text-violet-700",
                    };
                    const labelBg: Record<string, string> = {
                      emerald: "bg-emerald-500",
                      slate:   "bg-slate-600",
                      rose:    "bg-rose-500",
                      violet:  "bg-violet-500",
                    };

                    return (
                      <div key={i} className={`p-4 rounded-xl border space-y-3 ${colorMap[color]}`}>
                        {/* From stop */}
                        <div className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full ${labelBg[color]} text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5`}>
                            {fromLabel}
                          </div>
                          <div>
                            <div className={`text-[8px] font-bold uppercase tracking-widest ${textColor[color]}`}>{fromType}</div>
                            <div className="text-[12px] font-semibold text-slate-900">{fromCity}</div>
                          </div>
                        </div>
                        {/* Arrow */}
                        <div className="flex items-center gap-2 pl-3">
                          <div className="w-px h-4 bg-neutral-200" />
                          <span className="text-[9px] text-neutral-400 font-medium">{isReturn ? "↩ Return Journey" : "↓"}</span>
                        </div>
                        {/* To stop */}
                        <div className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full ${labelBg[color]} text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5`}>
                            {toLabel}
                          </div>
                          <div className="flex-1">
                            <div className={`text-[8px] font-bold uppercase tracking-widest ${textColor[color]}`}>{toType}</div>
                            <div className="text-[12px] font-semibold text-slate-900">{toCity}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-[11px] font-bold ${textColor[color]}`}>₦{(calc?.amount || 0).toLocaleString()}</div>
                            <div className="text-[8px] font-semibold text-neutral-400 uppercase">{(calc?.liters || 0).toFixed(1)}L</div>
                          </div>
                        </div>
                        {/* Inputs */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between ml-1">
                              <label className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest">Distance (KM)</label>
                              {routeDefaults && parseFloat(leg.km) !== routeDefaults.km && parseFloat(leg.km) > 0 && (
                                <span className="text-[7px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                  Route: {routeDefaults.km} km
                                </span>
                              )}
                            </div>
                            <input
                              type="number"
                              value={leg.km}
                              onChange={(e) => handleKmChange(i, e.target.value)}
                              onBlur={(e) => handleKmBlur(i, e.target.value)}
                              className={`w-full border rounded-lg py-1.5 px-3 text-[11px] font-semibold text-slate-900 outline-none transition-colors ${
                                routeDefaults && parseFloat(leg.km) !== routeDefaults.km && parseFloat(leg.km) > 0
                                  ? "bg-amber-50 border-amber-300"
                                  : "bg-white border-neutral-200"
                              }`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest ml-1">Mileage (KM/L)</label>
                            <input
                              type="number"
                              value={leg.mileage}
                              onChange={(e) => {
                                const updated = [...legData];
                                updated[i] = { ...updated[i], mileage: e.target.value };
                                setLegData(updated);
                              }}
                              className="w-full bg-white border border-neutral-200 rounded-lg py-1.5 px-3 text-[11px] font-semibold text-slate-900 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Fuel Rate */}
                  <div className="flex items-center justify-between px-1 py-2 border-b border-neutral-100">
                    <label className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Fuel className="w-3 h-3" /> Fuel Rate (₦/L)
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
                        <div className="text-[8px] font-bold text-amber-600 uppercase">{calculations.totalLiters}L total · {legData.length} leg{legData.length > 1 ? "s" : ""}</div>
                      </div>
                      <span className="text-base md:text-xl font-bold text-amber-600">₦{calculations.fuelTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
