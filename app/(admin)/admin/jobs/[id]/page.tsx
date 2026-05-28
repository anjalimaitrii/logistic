"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Fuel,
  Receipt,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Clock,
  Package,
  Activity,
  Play,
  Box,
  ArrowDownCircle,
  Coffee,
  Flag,
  RotateCcw
} from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { assignmentService } from "@/services/assignmentService";
import { settlementService } from "@/services/settlementService";
import { format } from "date-fns";


export default function JobDetailReport() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [settlement, setSettlement] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Trip Expense Tracker State
  const [tripExpenses, setTripExpenses] = useState<any[]>([]);
  const [newExpenseEntry, setNewExpenseEntry] = useState({
    category: "Fuel",
    description: "",
    amount: "",
    litres: "",
    rate: "",
    date: new Date().toISOString().split('T')[0]
  });

  // Address Change Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressChangeData, setAddressChangeData] = useState({
    pContactPerson: "",
    pContactNumber: "",
    pPlotNo: "",
    pStreet: "",
    pCity: "",
    pPincode: "",
    dContactPerson: "",
    dContactNumber: "",
    dPlotNo: "",
    dStreet: "",
    dCity: "",
    dPincode: "",
    reason: "",
    newPickupKm: "",
    newDropoffKm: "",
    newFinalAmount: ""
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Fetch booking first — if this fails, show "not found"
      const bookingData = await bookingService.getById(id);
      setBooking(bookingData);

      // Fetch assignment & settlement independently so their failures don't hide the booking
      const [assignmentData, settlementData] = await Promise.all([
        assignmentService.getByBookingId(id).catch(() => null),
        settlementService.getByBookingId(id).catch(() => null),
      ]);
      setAssignment(assignmentData);
      setSettlement(settlementData);

      if (settlementData?.expenses) {
        setTripExpenses(settlementData.expenses);
      }
    } catch (error) {
      console.error("Failed to fetch job details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const jobInfo = useMemo(() => {
    if (!booking) return null;
    return {
      id: booking.tripId || `#FL-${booking._id.substring(booking._id.length - 4).toUpperCase()}`,
      driver: assignment?.driverName || "Not Assigned",
      truckNumber: assignment?.truckNumber || "N/A",
      status: (booking.tripStatus || booking.status || "PENDING").toUpperCase(),
      truckHealth: assignment?.truckHealth || "N/A",
      pickupLocations: booking.pickupLocations?.length > 0 ? booking.pickupLocations : (booking.pickup ? [booking.pickup] : [{ address: {} }]),
      dropoffLocations: booking.dropoffLocations?.length > 0 ? booking.dropoffLocations : (booking.dropoff ? [booking.dropoff] : [{ address: {} }]),
      cargo: booking.cargoDetails?.goodsType || "N/A",
      weight: booking.cargoDetails?.weight ? `${booking.cargoDetails.weight} Tons` : "N/A",
      loadingDate: booking.cargoDetails?.loadingDate || "N/A",
      totalDistance: settlement?.totalDistance
        ? `${settlement.totalDistance} km`
        : settlement?.fuelDetails?.totalDistance
          ? `${settlement.fuelDetails.totalDistance} km`
          : "N/A"
    };
  }, [booking, assignment, settlement]);

  const financialSummary = useMemo(() => {
    if (!settlement) return { fuelTotal: 0, otherLogs: 0, totalCost: 0, allocationMoney: 0, remainingProfit: 0 };
    
    const fuelTotal = settlement.financials?.fuelTotal || 0;
    const otherLogs = (settlement.expenses || []).reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    const totalCost = fuelTotal + otherLogs;
    const allocationMoney = settlement.financials?.cashAllocation || 0;
    
    return {
      fuelTotal,
      otherLogs,
      totalCost,
      allocationMoney,
      remainingProfit: allocationMoney - totalCost
    };
  }, [settlement]);

  const handleAddExpense = async () => {
    if (!newExpenseEntry.description || (!newExpenseEntry.amount && !newExpenseEntry.litres)) {
      alert("Please fill all required details");
      return;
    }

    const calculatedAmount = newExpenseEntry.category === "Fuel" 
      ? (parseFloat(newExpenseEntry.litres) || 0) * (parseFloat(newExpenseEntry.rate) || 0)
      : parseFloat(newExpenseEntry.amount) || 0;

    const entry = {
      id: Math.random().toString(36).substr(2, 9),
      ...newExpenseEntry,
      amount: calculatedAmount
    };

    const updatedExpenses = [...tripExpenses, entry];
    setTripExpenses(updatedExpenses);

    // Sync with backend Settlement record
    try {
      await settlementService.process({
        bookingId: id,
        assignmentId: assignment?._id,
        expenses: updatedExpenses.map(({ id, ...rest }) => rest) // Remove local UI IDs
      });
    } catch (error) {
      console.error("Failed to sync expense with backend:", error);
    }

    setNewExpenseEntry({
      category: "Fuel",
      description: "",
      amount: "",
      litres: "",
      rate: "",
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleRemoveExpense = async (expenseId: string) => {
    const updatedExpenses = tripExpenses.filter(e => e.id !== expenseId && e._id !== expenseId);
    setTripExpenses(updatedExpenses);

    try {
      await settlementService.process({
        bookingId: id,
        assignmentId: assignment?._id,
        expenses: updatedExpenses.map(({ id, ...rest }) => rest)
      });
    } catch (error) {
      console.error("Failed to sync removal with backend:", error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await bookingService.updateTripStatus(id, newStatus.toLowerCase());
      await loadData();
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };


  const openAddressModal = () => {
    const firstPickup = booking.pickupLocations?.[0] || booking.pickup;
    const lastDropoff = booking.dropoffLocations?.[booking.dropoffLocations?.length - 1] || booking.dropoff;
    setAddressChangeData({
      pContactPerson: firstPickup?.contactPerson || "",
      pContactNumber: firstPickup?.contactNumber || "",
      pPlotNo: firstPickup?.address?.plotNo || "",
      pStreet: firstPickup?.address?.street || "",
      pCity: firstPickup?.address?.city || "",
      pPincode: firstPickup?.address?.pincode || "",
      dContactPerson: lastDropoff?.contactPerson || "",
      dContactNumber: lastDropoff?.contactNumber || "",
      dPlotNo: lastDropoff?.address?.plotNo || "",
      dStreet: lastDropoff?.address?.street || "",
      dCity: lastDropoff?.address?.city || "",
      dPincode: lastDropoff?.address?.pincode || "",
      reason: "",
      newPickupKm: settlement?.fuelDetails?.pickupKm || "",
      newDropoffKm: settlement?.fuelDetails?.dropoffKm || "",
      newFinalAmount: booking?.finalAmount || ""
    });
    setShowAddressModal(true);
  };

  const handleAddressChange = async () => {
    if (!addressChangeData.pCity || !addressChangeData.dCity) {
      alert("Please ensure at least City is provided for both Pickup and Drop-off");
      return;
    }
    try {
      await bookingService.changeAddress(id, 
        {
          contactPerson: addressChangeData.pContactPerson,
          contactNumber: addressChangeData.pContactNumber,
          address: {
            plotNo: addressChangeData.pPlotNo,
            street: addressChangeData.pStreet,
            city: addressChangeData.pCity,
            pincode: addressChangeData.pPincode
          }
        }, 
        {
          contactPerson: addressChangeData.dContactPerson,
          contactNumber: addressChangeData.dContactNumber,
          address: {
            plotNo: addressChangeData.dPlotNo,
            street: addressChangeData.dStreet,
            city: addressChangeData.dCity,
            pincode: addressChangeData.dPincode
          }
        },
        addressChangeData.reason, 
        {
          newPickupKm: Number(addressChangeData.newPickupKm) || 0,
          newDropoffKm: Number(addressChangeData.newDropoffKm) || 0,
          newFinalAmount: Number(addressChangeData.newFinalAmount) || 0
        }
      );

      setShowAddressModal(false);
      setAddressChangeData({ 
        pContactPerson: "", pContactNumber: "", pPlotNo: "", pStreet: "", pCity: "", pPincode: "",
        dContactPerson: "", dContactNumber: "", dPlotNo: "", dStreet: "", dCity: "", dPincode: "",
        reason: "", newPickupKm: "", newDropoffKm: "", newFinalAmount: "" 
      });
      await loadData();
    } catch (error) {
      console.error("Address change failed:", error);
      alert("Failed to change address");
    }
  };

  const timelineEvents = useMemo(() => {
    if (!booking) return [];

    // Use tripStatus if set; otherwise trip hasn't started yet
    const rawStatus = booking.tripStatus ? booking.tripStatus.toUpperCase() : "PENDING";
    const backendTimeline = booking.timeline || [];
    const pLocs = booking.pickupLocations?.length > 0 ? booking.pickupLocations : (booking.pickup ? [booking.pickup] : [{}]);
    const dLocs = booking.dropoffLocations?.length > 0 ? booking.dropoffLocations : (booking.dropoff ? [booking.dropoff] : [{}]);
    const pCount = pLocs.length;
    const dCount = dLocs.length;
    const multi = pCount > 1 || dCount > 1;
    const getLabel = (idx: number) => String.fromCharCode(65 + idx); // A, B, C, D…

    // STARTED → LOADING_1 → DEPARTED_1 → LOADING_2 → DEPARTED_2 → … → REACHED_1 → OFFLOADING_1 → … → RETURNING → COMPLETED
    const statusOrder = [
      "STARTED",
      ...pLocs.flatMap((_: any, i: number) => [
        multi ? `LOADING_${i + 1}` : "LOADING",
        multi ? `DEPARTED_${i + 1}` : "DEPARTED"
      ]),
      ...dLocs.flatMap((_: any, i: number) => [
        multi ? `REACHED_${i + 1}` : "REACHED",
        multi ? `OFFLOADING_${i + 1}` : "OFFLOADING"
      ]),
      "RETURNING", "COMPLETED"
    ];
    const currentIdx = statusOrder.indexOf(rawStatus);
    const isPast = (id: string) => { const i = statusOrder.indexOf(id); return i !== -1 && currentIdx > i; };

    // Convert raw status IDs like "Loading_1", "Reached_2" → human labels "Loading A", "Reached C"
    const fmtTitle = (raw: string) => {
      const m = raw.match(/^(.+?)_(\d+)$/i);
      if (!m) {
        if (raw.toLowerCase() === "started") return "Trip Started";
        return raw;
      }
      const [, action, numStr] = m;
      const n = parseInt(numStr) - 1;
      const a = action.toLowerCase();
      if (a === "loading")   return `Loading ${getLabel(n)}`;
      if (a === "departed")  return `Departed ${getLabel(n)}`;
      if (a === "reached")   return `Reached ${getLabel(pCount + n)}`;
      if (a === "offloading") return `Offloaded ${getLabel(pCount + n)}`;
      return raw;
    };
    const fmtDesc = (raw: string, fallback: string) => {
      const m = raw.match(/^(.+?)_(\d+)$/i);
      if (!m) return fallback;
      const [, action, numStr] = m;
      const n = parseInt(numStr) - 1;
      const a = action.toLowerCase();
      const isPick = a === "loading" || a === "departed";
      const loc = isPick ? pLocs[n] : dLocs[n];
      const label = isPick ? getLabel(n) : getLabel(pCount + n);
      const city = loc?.address?.city ? ` – ${loc.address.city}` : "";
      if (a === "loading")    return `Cargo loaded at ${label}${city}`;
      if (a === "departed")   return `Truck departed from ${label}${city}`;
      if (a === "reached")    return `Vehicle arrived at ${label}${city}`;
      if (a === "offloading") return `Unloading completed at ${label}${city}`;
      return fallback;
    };

    const historicalEvents = backendTimeline.map((item: any) => ({
      title: fmtTitle(item.title),
      description: fmtDesc(item.title, item.description),
      time: item.time ? format(new Date(item.time), "MMM d, h:mm a") : "---",
      status: "completed",
      icon: item.title === "Petrol Refilled" ? <Fuel className="w-3.5 h-3.5" /> :
            item.title?.toLowerCase().includes("reached") ? <Flag className="w-3.5 h-3.5" /> :
            item.title?.toLowerCase().includes("loading") ? <Box className="w-3.5 h-3.5" /> :
            item.title?.toLowerCase().includes("departed") ? <Truck className="w-3.5 h-3.5" /> :
            item.title?.toLowerCase().includes("offload") ? <ArrowDownCircle className="w-3.5 h-3.5" /> :
            item.title === "Driver Assigned" ? <Truck className="w-3.5 h-3.5" /> :
            item.title === "Booking Created" ? <Package className="w-3.5 h-3.5" /> :
            item.title === "Trip Approved" ? <CreditCard className="w-3.5 h-3.5" /> :
            <CheckCircle2 className="w-3.5 h-3.5" />
    }));

    // Single Trip Start
    const tripStartMilestone = {
      title: "Trip Started",
      description: "Driver has started the journey",
      time: status === "STARTED" ? "Just now" : "---",
      status: status === "STARTED" ? "active" : "pending",
      icon: <Play className="w-3.5 h-3.5" />,
      hide: isPast("STARTED") || backendTimeline.some((e: any) => e.title.toLowerCase().includes("started"))
    };

    // Per-pickup: Loaded at A, B… then Departed from A, B…
    const pickupMilestones = pLocs.flatMap((loc: any, i: number) => {
      const loadId = multi ? `LOADING_${i + 1}` : "LOADING";
      const departId = multi ? `DEPARTED_${i + 1}` : "DEPARTED";
      const label = getLabel(i);
      const city = loc?.address?.city || `Stop ${i + 1}`;
      return [
        {
          title: multi ? `Loading ${label}` : "Loaded",
          description: `Cargo loaded at ${multi ? `${label} – ${city}` : "origin"}`,
          time: status === loadId ? "Active" : "---",
          status: status === loadId ? "active" : "pending",
          icon: <Box className="w-3.5 h-3.5" />,
          hide: isPast(loadId) || backendTimeline.some((e: any) => e.title.toLowerCase().includes("loaded"))
        },
        {
          title: multi ? `Departed ${label}` : "Departed",
          description: `Truck departed from ${multi ? `${label} – ${city}` : "origin"}`,
          time: status === departId ? "Just now" : "---",
          status: status === departId ? "active" : "pending",
          icon: <Truck className="w-3.5 h-3.5" />,
          hide: isPast(departId) || backendTimeline.some((e: any) => e.title.toLowerCase().includes("departed"))
        }
      ];
    });

    // Per-dropoff: Reached + Offloaded at C, D…
    const dropoffMilestones = dLocs.flatMap((loc: any, i: number) => {
      const reachedId = multi ? `REACHED_${i + 1}` : "REACHED";
      const offloadId = multi ? `OFFLOADING_${i + 1}` : "OFFLOADING";
      const label = getLabel(pCount + i);
      const city = loc?.address?.city || `Stop ${i + 1}`;
      return [
        {
          title: multi ? `Reached ${label}` : "Reached",
          description: `Vehicle arrived at ${multi ? `${label} – ${city}` : "destination"}`,
          time: status === reachedId ? "Just now" : "---",
          status: status === reachedId ? "active" : "pending",
          icon: <Flag className="w-3.5 h-3.5" />,
          hide: isPast(reachedId) || status === offloadId ||
                backendTimeline.some((e: any) => e.title.toLowerCase().includes("reached"))
        },
        {
          title: multi ? `Offloaded ${label}` : "Offloaded",
          description: `Unloading completed at ${multi ? `${label} – ${city}` : "destination"}`,
          time: status === offloadId ? "Just now" : "---",
          status: status === offloadId ? "active" : "pending",
          icon: <ArrowDownCircle className="w-3.5 h-3.5" />,
          hide: isPast(offloadId) ||
                backendTimeline.some((e: any) => e.title.toLowerCase().includes("offload"))
        }
      ];
    });

    const futureMilestones = [
      tripStartMilestone,
      ...pickupMilestones,
      ...dropoffMilestones,
      {
        title: "Return Journey",
        description: "Vehicle is heading back or assigned to next task",
        time: status === "RETURNING" ? "Active" : "---",
        status: status === "RETURNING" ? "active" : "pending",
        icon: <RotateCcw className="w-3.5 h-3.5" />,
        hide: isPast("RETURNING") || backendTimeline.some((e: any) => e.title.toUpperCase() === "RETURNING")
      }
    ].filter(m => !m.hide);

    return [...historicalEvents, ...futureMilestones];
  }, [booking, assignment, settlement]);

  const statCards = [
    { label: "Fuel Total", value: `₦${financialSummary.fuelTotal.toLocaleString()}`, icon: <Fuel className="w-4 h-4 text-orange-500" />, color: "border-orange-500" },
    { label: "Other Logs", value: `₦${financialSummary.otherLogs.toLocaleString()}`, icon: <Receipt className="w-4 h-4 text-blue-500" />, color: "border-blue-500" },
    { label: "Total Cost", value: `₦${financialSummary.totalCost.toLocaleString()}`, icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, color: "border-emerald-500" },
    { label: "Trip Health", value: jobInfo?.truckHealth || "N/A", icon: <Truck className="w-4 h-4 text-slate-500" />, color: "border-slate-500" },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 bg-neutral-50 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!booking) {
    return (
      <AdminLayout>
        <div className="p-6 bg-neutral-50 min-h-screen flex flex-col items-center justify-center gap-4">
          <Package className="w-12 h-12 text-neutral-200" />
          <h2 className="text-xl font-bold text-slate-900">Job Not Found</h2>
          <button onClick={() => router.back()} className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest">Go Back</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-neutral-50 min-h-screen font-sans pb-10">
        {/* Header */}
        <div className="bg-white border-b border-neutral-100 px-4 md:px-8 py-5 sticky top-0 z-20">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 rounded-full border border-neutral-100 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition-all shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-0.5">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{jobInfo?.id}</h1>
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest">
                    {jobInfo?.driver}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-400 text-[9px] font-bold uppercase tracking-widest">
                    {jobInfo?.truckNumber}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5 uppercase tracking-widest">
                  General Jobs <ChevronRight className="w-2.5 h-2.5" /> Final Report
                </p>
              </div>
            </div>

            <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border ${
              jobInfo?.status?.startsWith("STARTED") || jobInfo?.status?.startsWith("REACHED") ? "bg-blue-50 text-blue-600 border-blue-100" :
              jobInfo?.status === "FINALIZED" || jobInfo?.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              jobInfo?.status?.startsWith("LOADING") || jobInfo?.status?.startsWith("OFFLOADING") ? "bg-orange-50 text-orange-600 border-orange-100" :
              "bg-neutral-50 text-neutral-400 border-neutral-100"
            }`}>
              {jobInfo?.status?.replace(/_(\d+)$/, ' (Stop $1)')}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <div key={i} className={`bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 border-t-4 ${card.color}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    {card.icon}
                  </div>
                </div>
                <div className="text-[20px] font-bold text-slate-900 mb-1 leading-tight">{card.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Trip Route History */}
              <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Trip Route History</h2>
                  <div className="px-3 py-1 rounded-full bg-slate-50 text-[9px] font-bold text-slate-300 uppercase tracking-widest border border-slate-100">Completed Route</div>
                </div>

                <div className="space-y-12">
                  {[
                    ...(jobInfo?.pickupLocations || []).map((loc: any, i: number) => ({ loc, type: 'pickup' as const, idx: i })),
                    ...(jobInfo?.dropoffLocations || []).map((loc: any, i: number) => ({ loc, type: 'dropoff' as const, idx: i }))
                  ].map(({ loc, type, idx }, totalIdx, arr) => {
                    const isLastTotal = totalIdx === arr.length - 1;
                    const isFirstPickup = type === 'pickup' && idx === 0;
                    const pickupCount = jobInfo?.pickupLocations?.length ?? 1;
                    const dropoffCount = jobInfo?.dropoffLocations?.length ?? 1;
                    const isLastDropoff = type === 'dropoff' && idx === dropoffCount - 1;
                    const label = type === 'pickup'
                      ? (pickupCount === 1 ? 'ORIGIN / PICKUP' : idx === 0 ? 'ORIGIN' : `PICKUP STOP ${idx + 1}`)
                      : (dropoffCount === 1 ? 'DESTINATION / DROP-OFF' : idx === dropoffCount - 1 ? 'FINAL DESTINATION' : `DROP-OFF ${idx + 1}`);
                    return (
                      <div key={`${type}-${idx}`} className={!isLastTotal ? "relative" : ""}>
                        {!isLastTotal && (
                          <div className="absolute left-[15px] top-10 bottom-[-48px] w-px bg-slate-100 border-l border-dashed border-slate-300" />
                        )}
                        <div className="flex gap-6 items-start relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                            type === 'pickup'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-emerald-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-100 shadow-rose-100'
                          }`}>
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</div>
                            <h3 className="text-base font-bold text-slate-900 mb-1">
                              {[loc?.address?.plotNo, loc?.address?.street, loc?.address?.city].filter(Boolean).join(', ') || 'N/A'}
                            </h3>
                            {loc?.contactPerson && (
                              <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                                {loc.contactPerson}{loc.contactNumber ? ` · ${loc.contactNumber}` : ''}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <div className="text-[11px] font-medium text-slate-400 italic">
                                {type === 'pickup' ? `Scheduled: ${jobInfo?.loadingDate}` : 'Expected Completion'}
                              </div>
                              {(isFirstPickup || isLastDropoff) && (
                                <button
                                  onClick={openAddressModal}
                                  className="px-3 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-bold uppercase tracking-widest hover:bg-amber-100 transition-all"
                                >
                                  Change Address
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Address History */}
                  {booking?.addressHistory && booking.addressHistory.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-dashed border-slate-100">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Previous Addresses</div>
                      <div className="space-y-3">
                        {booking.addressHistory.map((hist: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 text-[9px] font-bold">{idx + 1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                {hist.type?.toUpperCase() || "DROP-OFF"} ADDRESS
                              </div>
                              <div className="text-[11px] font-semibold text-slate-700">
                                {hist.oldAddress?.address?.plotNo} {hist.oldAddress?.address?.street}, {hist.oldAddress?.address?.city}
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5">
                                Changed: {hist.changedAt ? format(new Date(hist.changedAt), "MMM d, h:mm a") : "---"} • {hist.reason || "No reason"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cargo</div>
                    <div className="text-[12px] font-bold text-slate-800">{jobInfo?.cargo}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</div>
                    <div className="text-[12px] font-bold text-slate-800">{jobInfo?.weight}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vehicle</div>
                    <div className="text-[12px] font-bold text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> {jobInfo?.truckHealth}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Distance</div>
                    <div className="text-[12px] font-bold text-slate-800 tracking-tight">{jobInfo?.totalDistance}</div>
                  </div>
                </div>
              </div>

              {/* Trip Expense Tracker */}
              <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Trip Expenses</h2>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5 font-sans">Fuel, Tolls & Operational costs</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
                    {tripExpenses.length} Record{tripExpenses.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Add Expense Form */}
                <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Add Expense Entry</span>
                    </div>
                    <select 
                      value={newExpenseEntry.category} 
                      onChange={(e) => setNewExpenseEntry({...newExpenseEntry, category: e.target.value})}
                      className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-[10px] font-bold text-slate-600 outline-none uppercase"
                    >
                      <option value="Fuel">⛽ Fuel</option>
                      <option value="Food">🍲 Food</option>
                      <option value="Repair">🛠️ Repair</option>
                      <option value="Other">📝 Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        {newExpenseEntry.category === "Fuel" ? "Petrol Pump Name" : "Description / Remarks"}
                      </label>
                      <input 
                        type="text" 
                        value={newExpenseEntry.description} 
                        onChange={(e) => setNewExpenseEntry({...newExpenseEntry, description: e.target.value})} 
                        placeholder={newExpenseEntry.category === "Fuel" ? "e.g. NNPC Station" : "e.g. Bridge Toll / Dinner"} 
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[12px] font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all placeholder:text-slate-300" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
                      <input type="date" value={newExpenseEntry.date} onChange={(e) => setNewExpenseEntry({...newExpenseEntry, date: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[12px] font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all" />
                    </div>
                  </div>

                  {newExpenseEntry.category === "Fuel" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Litres</label>
                        <input type="number" value={newExpenseEntry.litres} onChange={(e) => setNewExpenseEntry({...newExpenseEntry, litres: e.target.value})} placeholder="0" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[12px] font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Rate (₦/L)</label>
                        <input type="number" value={newExpenseEntry.rate} onChange={(e) => setNewExpenseEntry({...newExpenseEntry, rate: e.target.value})} placeholder="0" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[12px] font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Total (₦)</label>
                        <div className="w-full bg-amber-50 border border-amber-200 rounded-xl py-2.5 px-4 text-[12px] font-bold text-amber-700">
                          ₦{((parseFloat(newExpenseEntry.litres) || 0) * (parseFloat(newExpenseEntry.rate) || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 mb-5">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount (₦)</label>
                        <input type="number" value={newExpenseEntry.amount} onChange={(e) => setNewExpenseEntry({...newExpenseEntry, amount: e.target.value})} placeholder="0" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[12px] font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all" />
                      </div>
                    </div>
                  )}
                  
                  <button onClick={handleAddExpense} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm">
                    <Receipt className="w-3.5 h-3.5" /> Log Trip Expense
                  </button>
                </div>

                {/* Expense List */}
                <div className="space-y-3">
                  {tripExpenses.length > 0 ? tripExpenses.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:border-transparent transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                          entry.category === "Fuel" ? "bg-amber-50 text-amber-500 border border-amber-100" :
                          entry.category === "Food" ? "bg-emerald-50 text-emerald-500 border border-emerald-100" :
                          "bg-slate-50 text-slate-500 border border-slate-100"
                        }`}>
                          {entry.category === "Fuel" ? <Fuel className="w-4 h-4" /> : 
                           entry.category === "Food" ? <Coffee className="w-4 h-4" /> :
                           <Receipt className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-slate-900">{entry.description}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${
                              entry.category === "Fuel" ? "bg-amber-50 text-amber-600" :
                              entry.category === "Food" ? "bg-emerald-50 text-emerald-600" :
                              "bg-slate-50 text-slate-400"
                            }`}>{entry.category}</span>
                            {entry.category === "Fuel" && (
                              <span className="text-[9px] font-bold text-slate-400">{entry.litres}L @ ₦{entry.rate}</span>
                            )}
                            <span className="text-[9px] font-medium text-slate-300">· {entry.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-[14px] font-bold text-slate-900 tracking-tight">₦{entry.amount.toLocaleString()}</div>
                        <button onClick={() => handleRemoveExpense(entry.id || entry._id)} className="p-1.5 text-slate-200 hover:text-rose-500 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <Receipt className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No expenses logged yet</p>
                    </div>
                  )}
                </div>

                {/* Total Summary */}
                {tripExpenses.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-xl p-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Trip Spend</span>
                    <span className="text-lg font-bold text-slate-900">₦{tripExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Journey Timeline */}
              <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Job Timeline</h2>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5 font-sans">System logs & operational milestones</p>
                  </div>
                </div>

                <div className="relative pl-8 space-y-10">
                  {/* Vertical Line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-100 border-l border-dashed border-slate-300" />
                  
                  {timelineEvents.map((event, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[25px] w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                        event.status === 'completed' ? 'bg-emerald-500' : 
                        event.status === 'active' ? 'bg-blue-500 animate-pulse' : 
                        event.status === 'warning' ? 'bg-amber-500' : 'bg-slate-200'
                      }`}>
                        {/* Status Icon/Indicator */}
                        {event.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                      </div>
                      
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[13px] font-bold ${event.status === 'pending' ? 'text-slate-400' : 'text-slate-900'}`}>
                              {event.title}
                            </span>
                            {event.status === 'active' && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[8px] font-bold uppercase tracking-wider animate-pulse">Live</span>
                            )}
                          </div>
                          <p className={`text-[11px] font-medium leading-relaxed ${event.status === 'pending' ? 'text-slate-300' : 'text-slate-500'}`}>
                            {event.description}
                          </p>
                        </div>
                        <div className="shrink-0 pt-0.5">
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            {event.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side Cards */}
            <div className="space-y-6">
              {/* Trip Status Management */}
              <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Update Status</h2>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5 font-sans">Active Controls</p>
                  </div>
                </div>

                {(() => {
                    const pLocs = booking.pickupLocations?.length > 0 ? booking.pickupLocations : (booking.pickup ? [booking.pickup] : [{}]);
                    const dLocs = booking.dropoffLocations?.length > 0 ? booking.dropoffLocations : (booking.dropoff ? [booking.dropoff] : [{}]);
                    const multi = pLocs.length > 1 || dLocs.length > 1;
                    const lbl = (idx: number) => String.fromCharCode(65 + idx);

                    const statusOrder = [
                      "STARTED",
                      ...pLocs.flatMap((_: any, i: number) => [
                        multi ? `LOADING_${i + 1}` : "LOADING",
                        multi ? `DEPARTED_${i + 1}` : "DEPARTED"
                      ]),
                      ...dLocs.flatMap((_: any, i: number) => [
                        multi ? `REACHED_${i + 1}` : "REACHED",
                        multi ? `OFFLOADING_${i + 1}` : "OFFLOADING"
                      ]),
                      "RETURNING", "COMPLETED"
                    ];

                    const rawStatus = booking.tripStatus ? booking.tripStatus.toUpperCase() : "PENDING";
                    const currentIdx = statusOrder.indexOf(rawStatus);

                    const btnCls = (id: string) => {
                      const idx = statusOrder.indexOf(id);
                      const isDone   = idx !== -1 && idx < currentIdx;
                      const isActive = idx === currentIdx;
                      const isNext   = idx === currentIdx + 1;
                      if (isDone)    return { cls: "bg-emerald-50 border-emerald-100 text-emerald-600 cursor-not-allowed opacity-80", isDone, isActive, isNext };
                      if (isActive)  return { cls: "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 cursor-not-allowed", isDone, isActive, isNext };
                      if (isNext)    return { cls: "bg-orange-500 border-orange-400 text-white shadow-md shadow-orange-100 hover:bg-orange-600 active:scale-[0.98] cursor-pointer", isDone, isActive, isNext };
                      return { cls: "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50", isDone, isActive, isNext };
                    };

                    const Btn = ({ id, label, icon, city, full }: { id: string; label: string; icon: React.ReactNode; city?: string; full?: boolean }) => {
                      const { cls, isDone, isActive, isNext } = btnCls(id);
                      return (
                        <button
                          disabled={!isNext}
                          onClick={() => isNext && handleStatusUpdate(id)}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-1 ${full ? "w-full" : "flex-1"} ${cls}`}
                        >
                          <div>{isDone ? <CheckCircle2 className="w-4 h-4" /> : icon}</div>
                          <span className="text-[9px] font-bold uppercase tracking-widest leading-tight text-center">{label}</span>
                          {city && (
                            <span className={`text-[7px] font-medium normal-case truncate max-w-full text-center ${isActive ? "text-white/70" : isDone ? "text-emerald-400" : isNext ? "text-white/80" : "text-slate-200"}`}>
                              {city}
                            </span>
                          )}
                          {isDone  && <span className="text-[7px] font-bold uppercase tracking-widest text-emerald-500">Done</span>}
                          {isNext  && <span className="text-[7px] font-bold uppercase tracking-widest text-white/80">Tap to Update</span>}
                          {isActive && <span className="text-[7px] font-bold uppercase tracking-widest text-white/70">Current</span>}
                        </button>
                      );
                    };

                    return (
                      <div className="space-y-3">
                        {/* Step 1: Trip Start — full width */}
                        <Btn id="STARTED" label="Trip Start" icon={<Play className="w-4 h-4" />} full />

                        {/* Pickup steps — Load + Depart per location in one row */}
                        {pLocs.map((loc: any, i: number) => {
                          const l = lbl(i);
                          const city = multi ? (loc?.address?.city || undefined) : undefined;
                          return (
                            <div key={`p-${i}`} className="space-y-1.5">
                              {multi && (
                                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 px-1">
                                  Pickup {l} {city ? `· ${city}` : ""}
                                </p>
                              )}
                              <div className="flex gap-3">
                                <Btn
                                  id={multi ? `LOADING_${i + 1}` : "LOADING"}
                                  label={multi ? `${l} · Load` : "Loading"}
                                  icon={<Box className="w-4 h-4" />}
                                />
                                <Btn
                                  id={multi ? `DEPARTED_${i + 1}` : "DEPARTED"}
                                  label={multi ? `${l} · Depart` : "Departed"}
                                  icon={<Truck className="w-4 h-4" />}
                                />
                              </div>
                            </div>
                          );
                        })}

                        {/* Dropoff steps — Reached + Offload per location in one row */}
                        {dLocs.map((loc: any, i: number) => {
                          const l = lbl(pLocs.length + i);
                          const city = multi ? (loc?.address?.city || undefined) : undefined;
                          return (
                            <div key={`d-${i}`} className="space-y-1.5">
                              {multi && (
                                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 px-1">
                                  Dropoff {l} {city ? `· ${city}` : ""}
                                </p>
                              )}
                              <div className="flex gap-3">
                                <Btn
                                  id={multi ? `REACHED_${i + 1}` : "REACHED"}
                                  label={multi ? `${l} · Reached` : "Reached"}
                                  icon={<Flag className="w-4 h-4" />}
                                />
                                <Btn
                                  id={multi ? `OFFLOADING_${i + 1}` : "OFFLOADING"}
                                  label={multi ? `${l} · Offload` : "Offloading"}
                                  icon={<ArrowDownCircle className="w-4 h-4" />}
                                />
                              </div>
                            </div>
                          );
                        })}

                        {/* Final steps — full width */}
                        <Btn id="RETURNING" label="Returning" icon={<RotateCcw className="w-4 h-4" />} full />
                        <Btn id="COMPLETED" label="Completed" icon={<CheckCircle2 className="w-4 h-4" />} full />
                      </div>
                    );
                  })()}
              </div>

              {/* Job Settlement Summary */}
              <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                   <CreditCard className="w-5 h-5 text-orange-400" />
                   <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-[0.1em]">Settlement Overview</h2>
                </div>

                <div className="space-y-6">
                  <div className="p-5 rounded-[20px] bg-slate-50/50 border border-slate-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allocation Money To Driver</span>
                      <span className="text-[24px] font-bold text-slate-900 tracking-tight">₦{financialSummary.allocationMoney.toLocaleString()}</span>
                    </div>
                    <p className="text-[9px] font-medium text-slate-300 mt-2 italic uppercase tracking-wider">Approved cash for driver support</p>
                  </div>

                  {/* Deal Amounts — read-only, set from Requests page */}
                  <div className="p-5 rounded-[20px] bg-emerald-50/60 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Deal Summary</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Final Amount</div>
                        <div className="text-[18px] font-bold text-slate-900">
                          {booking?.finalAmount ? `₦${Number(booking.finalAmount).toLocaleString()}` : <span className="text-slate-300 text-[13px]">Not set</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Advance Paid</div>
                        <div className="text-[18px] font-bold text-slate-900">
                          {booking?.advancePaid ? `₦${Number(booking.advancePaid).toLocaleString()}` : <span className="text-slate-300 text-[13px]">—</span>}
                        </div>
                      </div>
                    </div>
                    {booking?.finalAmount && booking?.advancePaid && (
                      <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Balance Due</span>
                        <span className="text-[14px] font-bold text-slate-900">
                          ₦{(Number(booking.finalAmount) - Number(booking.advancePaid)).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Route Map Preview */}
                  <div className="rounded-2xl border border-slate-100 shadow-sm relative group overflow-hidden bg-slate-50 p-1">
                    <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                      <div className="text-[9px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Route Map
                      </div>
                    </div>
                    <div className="h-[200px] rounded-xl overflow-hidden relative">
                      <img
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
                        alt="Trip Route"
                        className="w-full h-full object-cover opacity-80 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Address Change Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Update Job Locations</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Modify origin or destination. Changes are logged to history.</p>
                </div>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Pickup Section */}
                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Pickup Details (Origin)
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Contact Person</label>
                      <input
                        type="text"
                        value={addressChangeData.pContactPerson}
                        onChange={(e) => setAddressChangeData(p => ({...p, pContactPerson: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-emerald-300 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Contact Number</label>
                      <input
                        type="text"
                        value={addressChangeData.pContactNumber}
                        onChange={(e) => setAddressChangeData(p => ({...p, pContactNumber: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-emerald-300 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Plot No</label>
                      <input
                        type="text"
                        value={addressChangeData.pPlotNo}
                        onChange={(e) => setAddressChangeData(p => ({...p, pPlotNo: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-emerald-300 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Street</label>
                      <input
                        type="text"
                        value={addressChangeData.pStreet}
                        onChange={(e) => setAddressChangeData(p => ({...p, pStreet: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-emerald-300 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">City *</label>
                      <input
                        type="text"
                        value={addressChangeData.pCity}
                        onChange={(e) => setAddressChangeData(p => ({...p, pCity: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-emerald-300 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Pincode</label>
                      <input
                        type="text"
                        value={addressChangeData.pPincode}
                        onChange={(e) => setAddressChangeData(p => ({...p, pPincode: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-emerald-300 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Dropoff Section */}
                <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100/50">
                  <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Drop-off Details (Destination)
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Contact Person</label>
                      <input
                        type="text"
                        value={addressChangeData.dContactPerson}
                        onChange={(e) => setAddressChangeData(p => ({...p, dContactPerson: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-rose-300 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Contact Number</label>
                      <input
                        type="text"
                        value={addressChangeData.dContactNumber}
                        onChange={(e) => setAddressChangeData(p => ({...p, dContactNumber: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-rose-300 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Plot No</label>
                      <input
                        type="text"
                        value={addressChangeData.dPlotNo}
                        onChange={(e) => setAddressChangeData(p => ({...p, dPlotNo: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-rose-300 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Street</label>
                      <input
                        type="text"
                        value={addressChangeData.dStreet}
                        onChange={(e) => setAddressChangeData(p => ({...p, dStreet: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-rose-300 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">City *</label>
                      <input
                        type="text"
                        value={addressChangeData.dCity}
                        onChange={(e) => setAddressChangeData(p => ({...p, dCity: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-rose-300 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Pincode</label>
                      <input
                        type="text"
                        value={addressChangeData.dPincode}
                        onChange={(e) => setAddressChangeData(p => ({...p, dPincode: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-rose-300 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Reason for Change</label>
                  <input
                    type="text"
                    value={addressChangeData.reason}
                    onChange={(e) => setAddressChangeData(p => ({...p, reason: e.target.value}))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-amber-300 transition-colors"
                    placeholder="e.g. Client changed location"
                  />
                </div>

                {/* Financial Impact */}
                <div className="pt-4 mt-2 border-t border-dashed border-slate-200">
                  <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-3">📊 Financial Impact</div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">New Pickup Distance (KM)</label>
                      <input
                        type="number"
                        value={addressChangeData.newPickupKm}
                        onChange={(e) => setAddressChangeData(p => ({...p, newPickupKm: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-amber-300 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">New Dropoff Distance (KM)</label>
                      <input
                        type="number"
                        value={addressChangeData.newDropoffKm}
                        onChange={(e) => setAddressChangeData(p => ({...p, newDropoffKm: e.target.value}))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-amber-300 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">New Final Amount (₦)</label>
                    <input
                      type="number"
                      value={addressChangeData.newFinalAmount}
                      onChange={(e) => setAddressChangeData(p => ({...p, newFinalAmount: e.target.value}))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-amber-300 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddressModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddressChange}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
              >
                Update Job Details
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
