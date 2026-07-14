"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Fuel,
  Paperclip,
  X as XIcon,
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
  RotateCcw,
  Navigation,
  Timer,
  Gauge,
  Route,
  DollarSign
} from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { todayAppDateKey } from "@/lib/datetime";
import { assignmentService } from "@/services/assignmentService";
import { cleanDriverName } from "@/services/liveTrackingService";
import { settlementService } from "@/services/settlementService";
import { completionService } from "@/services/completionService";
import JobRouteMap from "@/components/admin/JobRouteMap";
import { uploadService } from "@/services/uploadService";
import React from "react";

function formatCAT(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      timeZone: "Africa/Lusaka",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateStr));
  } catch {
    return "---";
  }
}


export default function JobDetailReport() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const id = params.id as string;
  const isSecretContext = pathname.startsWith("/admin/secret");
  const wrap = (content: React.ReactNode) =>
    isSecretContext ? <>{content}</> : <AdminLayout>{content}</AdminLayout>;

  const [booking, setBooking] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [settlement, setSettlement] = useState<any>(null);
  // New completion id (INV-xxx / CASH-xxx) — replaces the trip id once completed
  const [newId, setNewId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [gpsStats, setGpsStats] = useState<any>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Trip Expense Tracker State
  const [tripExpenses, setTripExpenses] = useState<any[]>([]);
  const [newExpenseEntry, setNewExpenseEntry] = useState({
    category: "Fuel",
    description: "",
    amount: "",
    litres: "",
    rate: "",
    date: todayAppDateKey()
  });

  // Completion Inspection Modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    vehicleCondition: "Good",
    tyreCondition: "Good",
    tyreNumber: "",
    challans: "",
    notes: "",
  });
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Offloading Modal State
  const [showOffloadingModal, setShowOffloadingModal] = useState(false);
  const [offloadingTargetStatus, setOffloadingTargetStatus] = useState("");
  const [offloadingForm, setOffloadingForm] = useState({
    deliveryOrders: [""],
    damages: [{ quantity: "", amount: "" }],
  });
  const [isSubmittingOffloading, setIsSubmittingOffloading] = useState(false);
  const [offloadingFiles, setOffloadingFiles] = useState<File[]>([]);
  const offloadingFileInputRef = React.useRef<HTMLInputElement>(null);

  // Earlier trips auto-completed while this driver was returning (truck never came
  // back for inspection) — their damages/DO are collected in this completion modal.
  const [pendingTrips, setPendingTrips] = useState<any[]>([]);
  const [pastTripForms, setPastTripForms] = useState<
    Record<string, { deliveryOrders: string[]; damages: { quantity: string; amount: string }[] }>
  >({});

  // Address Change Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressChangeData, setAddressChangeData] = useState({
    pContactPerson: "",
    pContactNumber: "",
    pPlotNo: "",
    pStreet: "",
    pCity: "",
    dContactPerson: "",
    dContactNumber: "",
    dPlotNo: "",
    dStreet: "",
    dCity: "",
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

  const handleCancelTrip = async () => {
    if (!confirm("Are you sure you want to cancel this trip? This permanently deletes it and cannot be undone.")) return;
    setIsCancelling(true);
    try {
      await bookingService.cancel(id);
      router.back();
    } catch {
      alert("Failed to cancel trip. Please try again.");
      setIsCancelling(false);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Fetch booking first — if this fails, show "not found"
      const bookingData = await bookingService.getById(id);
      setBooking(bookingData);

      // Show last-cached GPS stats instantly (Trakzee fetch below refreshes them)
      if (bookingData?.tripStats) setGpsStats(bookingData.tripStats);

      // Fetch assignment & settlement independently so their failures don't hide the booking
      const [assignmentData, settlementData] = await Promise.all([
        assignmentService.getByBookingId(id).catch(() => null),
        settlementService.getByBookingId(id).catch(() => null),
      ]);
      setAssignment(assignmentData);
      setSettlement(settlementData);

      // Once the trip is filed at completion, show its new id (INV-xxx / CASH-xxx)
      try {
        const [inv, cash] = await Promise.all([
          completionService.getInvoices().catch(() => []),
          completionService.getCash().catch(() => []),
        ]);
        const rec = [...(inv || []), ...(cash || [])].find(
          (r: any) => String(r.bookingId?._id || r.bookingId) === String(id)
        );
        if (rec) setNewId(String(rec.invoiceId || rec.cashId || "").toUpperCase());
      } catch { /* non-critical */ }

      if (settlementData?.expenses) {
        setTripExpenses(settlementData.expenses);
      }

      // Fetch GPS stats if trip has started
      if (bookingData?.tripStatus && assignmentData?.truckNumber) {
        fetchGpsStats(bookingData, assignmentData.truckNumber);
      }

    } catch (error) {
      console.error("Failed to fetch job details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGpsStats = async (bookingData: any, truckNumber: string) => {
    const from = bookingData?.tripStartedAt || bookingData?.cargoDetails?.loadingDate;
    if (!from || !truckNumber || truckNumber === "N/A") {
      console.warn("[GPS] skipped — from:", from, "truck:", truckNumber);
      return;
    }
    setGpsLoading(true);
    try {
      const tripStatus = (bookingData?.tripStatus || "").toLowerCase();
      const isDone = tripStatus === "completed" || tripStatus === "delivered";
      const toDate = isDone && bookingData?.tripEndedAt
        ? bookingData.tripEndedAt
        : new Date().toISOString();

      const params = new URLSearchParams({
        truck: truckNumber,
        from: String(from),
        to: toDate,
      });
      console.log("[GPS] fetching trip-stats:", { truck: truckNumber, from: String(from), to: toDate });
      const res = await fetch(`/api/trip-stats?${params}`);
      const json = await res.json();
      console.log("[GPS] trip-stats response:", json);
      if (json.success && json.data) {
        setGpsStats(json.data);
        // Persist the fresh stats so a reload shows them immediately next time
        try {
          const saved = await bookingService.saveTripStats(id, json.data);
          console.log("[GPS] saved to DB:", saved);
        } catch (saveErr) {
          console.error("[GPS] saveTripStats FAILED — is backend redeployed?", saveErr);
        }
      } else {
        console.warn("[GPS] no data to save. success:", json.success, "error:", json.error);
      }
    } catch (err) {
      console.error("[GPS] trip-stats fetch failed:", err);
    } finally {
      setGpsLoading(false);
    }
  };

  const jobInfo = useMemo(() => {
    if (!booking) return null;
    return {
      id: newId || booking.tripId || `#FL-${booking._id.substring(booking._id.length - 4).toUpperCase()}`,
      driver: assignment?.driverName ? cleanDriverName(assignment.driverName) : "Not Assigned",
      truckNumber: assignment?.truckNumber || "N/A",
      status: (() => {
        const raw = (booking.tripStatus || booking.status || "PENDING").toUpperCase();
        // Returning trip with a new job assigned → the return leg is concluded
        const hasNewJob = (booking.timeline || []).some((e: any) => e.title === "New Job Assigned");
        return (raw === "RETURNING" && hasNewJob) ? "COMPLETED" : raw;
      })(),
      truckHealth: assignment?.truckHealth || "N/A",
      pickupLocations: booking.pickupLocations?.length > 0 ? booking.pickupLocations : (booking.pickup ? [booking.pickup] : [{ address: {} }]),
      dropoffLocations: booking.dropoffLocations?.length > 0 ? booking.dropoffLocations : (booking.dropoff ? [booking.dropoff] : [{ address: {} }]),
      cargo: Array.isArray(booking.cargoDetails?.goodsType) ? booking.cargoDetails.goodsType.join(", ") : (booking.cargoDetails?.goodsType || "N/A"),
      weight: booking.cargoDetails?.weight ? `${booking.cargoDetails.weight} Tons` : "N/A",
      loadingDate: booking.cargoDetails?.loadingDate || "N/A",
      totalDistance: settlement?.totalDistance
        ? `${settlement.totalDistance} km`
        : settlement?.fuelDetails?.totalDistance
          ? `${settlement.fuelDetails.totalDistance} km`
          : "N/A"
    };
  }, [booking, assignment, settlement, newId]);

  const financialSummary = useMemo(() => {
    const tollAmount = booking?.tollAmount || 0;
    if (!settlement) return { fuelTotal: 0, otherLogs: 0, totalCost: 0, allocationMoney: 0, councilLevy: 0, tollAmount, remainingProfit: 0 };

    const fuelTotal = settlement.financials?.fuelTotal || 0;
    const otherLogs = (settlement.expenses || []).reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    const allocationMoney = settlement.financials?.cashAllocation || 0;
    const councilLevy = settlement.financials?.councilLevy || 0;
    const totalCost = fuelTotal + otherLogs + allocationMoney + councilLevy;

    return {
      fuelTotal,
      otherLogs,
      totalCost,
      allocationMoney,
      councilLevy,
      tollAmount,
      remainingProfit: allocationMoney - totalCost
    };
  }, [settlement, booking]);

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
      date: todayAppDateKey()
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

  // Capture the truck's live GPS position at this exact moment (for trip start/end points)
  const captureTruckCoords = async (truckNumber?: string): Promise<{ lat: number; lng: number; location?: string } | undefined> => {
    if (!truckNumber) return undefined;
    try {
      const liveRes = await fetch("/api/livetrack");
      const liveData = await liveRes.json();
      const normalized = String(truckNumber).trim().toUpperCase();
      const vehicle = (liveData.vehicles || []).find(
        (v: any) =>
          String(v.Vehicle_No || "").trim().toUpperCase() === normalized ||
          String(v.Vehicle_Name || "").trim().toUpperCase() === normalized
      );
      const lat = parseFloat(vehicle?.Latitude);
      const lng = parseFloat(vehicle?.Longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return { lat, lng, location: vehicle.Location || undefined };
      }
    } catch (err) {
      console.warn("[TripCoords] capture failed:", err);
    }
    return undefined;
  };

  const handleStatusUpdate = async (newStatus: string) => {
    const upperStatus = newStatus.toUpperCase();
    if (upperStatus.startsWith("OFFLOADING")) {
      const dLocs = booking?.dropoffLocations?.length > 0 ? booking.dropoffLocations : (booking?.dropoff ? [booking.dropoff] : [{}]);
      const m = upperStatus.match(/^OFFLOADING_(\d+)$/);
      const isLastDropoff = !m || parseInt(m[1], 10) === dLocs.length;

      if (isLastDropoff) {
        setOffloadingTargetStatus(newStatus);
        setOffloadingForm({
          deliveryOrders: [""],
          damages: [{ quantity: "", amount: "" }],
        });
        setOffloadingFiles([]);
        setShowOffloadingModal(true);
        return;
      }

      // Intermediate dropoff on a multi-route trip — advance status directly, no receipt form.
      try {
        await bookingService.updateTripStatus(id, newStatus.toLowerCase());
        await loadData();
      } catch (error) {
        console.error("Status update failed:", error);
      }
      return;
    }
    if (newStatus === "COMPLETED") {
      setShowCompletionModal(true);
      return;
    }
    try {
      if (newStatus === "STARTED" && assignment?.truckNumber) {
        // Freeze the truck's position at the moment "Trip Start" is clicked
        const tripStartCoords = await captureTruckCoords(assignment.truckNumber);
        await bookingService.updateTripStatus(id, newStatus.toLowerCase(), { tripStartCoords });
      } else {
        await bookingService.updateTripStatus(id, newStatus.toLowerCase());
      }
      await loadData();
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const handleSubmitCompletion = async () => {
    setIsSubmittingCompletion(true);
    try {
      const inspectionData = completionForm;

      if (assignment?.driverId) {
        await assignmentService.markTruckInspected(assignment.driverId, {
          ...inspectionData,
          bookingId: id,
        });
      }
      // Freeze the truck's position at the moment the trip is completed (end point)
      const tripEndCoords = await captureTruckCoords(assignment?.truckNumber);
      await bookingService.updateTripStatus(id, "completed", { tripEndCoords });
      setShowCompletionModal(false);
      await loadData();
    } catch (error) {
      console.error("Completion failed:", error);
      alert("Failed to complete job");
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  const handleSubmitOffloading = async () => {
    setIsSubmittingOffloading(true);
    try {
      // Upload files to S3
      const attachments = offloadingFiles.length > 0
        ? await uploadService.uploadToS3(offloadingFiles, "job-attachments")
        : [];

      const payload = {
        tripStatus: offloadingTargetStatus.toLowerCase(),
        deliveryOrders: offloadingForm.deliveryOrders.filter(d => d.trim()),
        damages: offloadingForm.damages.filter(d => d.quantity.trim()),
        attachments,
      };

      await bookingService.updateTripStatus(id, payload.tripStatus, {
        deliveryOrders: payload.deliveryOrders,
        damages: payload.damages,
        attachments: payload.attachments,
      });

      setShowOffloadingModal(false);
      setOffloadingFiles([]);
      await loadData();
    } catch (error) {
      console.error("Offloading submission failed:", error);
      alert("Failed to submit offloading data");
    } finally {
      setIsSubmittingOffloading(false);
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
      dContactPerson: lastDropoff?.contactPerson || "",
      dContactNumber: lastDropoff?.contactNumber || "",
      dPlotNo: lastDropoff?.address?.plotNo || "",
      dStreet: lastDropoff?.address?.street || "",
      dCity: lastDropoff?.address?.city || "",
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
          }
        },
        {
          contactPerson: addressChangeData.dContactPerson,
          contactNumber: addressChangeData.dContactNumber,
          address: {
            plotNo: addressChangeData.dPlotNo,
            street: addressChangeData.dStreet,
            city: addressChangeData.dCity,
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
        pContactPerson: "", pContactNumber: "", pPlotNo: "", pStreet: "", pCity: "",
        dContactPerson: "", dContactNumber: "", dPlotNo: "", dStreet: "", dCity: "",
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
      if (a === "loading") return `Loading ${getLabel(n)}`;
      if (a === "departed") return `Departed ${getLabel(n)}`;
      if (a === "reached") return `Reached ${getLabel(pCount + n)}`;
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
      if (a === "loading") return `Cargo loaded at ${label}${city}`;
      if (a === "departed") return `Truck departed from ${label}${city}`;
      if (a === "reached") return `Vehicle arrived at ${label}${city}`;
      if (a === "offloading") return `Unloading completed at ${label}${city}`;
      return fallback;
    };

    const historicalEvents = backendTimeline.map((item: any) => ({
      title: fmtTitle(item.title),
      description: fmtDesc(item.title, item.description),
      time: item.time ? formatCAT(item.time) : "---",
      status: "completed",
      icon: item.title === "Petrol Refilled" ? <Fuel className="w-3.5 h-3.5" /> :
        item.title?.toLowerCase().includes("reached") ? <Flag className="w-3.5 h-3.5" /> :
          item.title?.toLowerCase().includes("loading") ? <Box className="w-3.5 h-3.5" /> :
            item.title?.toLowerCase().includes("departed") ? <Truck className="w-3.5 h-3.5" /> :
              item.title?.toLowerCase().includes("offload") ? <ArrowDownCircle className="w-3.5 h-3.5" /> :
                item.title === "Driver Assigned" ? <Truck className="w-3.5 h-3.5" /> :
                  item.title === "New Job Assigned" ? <RotateCcw className="w-3.5 h-3.5" /> :
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
    { label: "Total Cost", value: `K ${financialSummary.totalCost.toLocaleString()}`, icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, color: "border-emerald-500" },
    { label: "Fuel Total", value: `K ${financialSummary.fuelTotal.toLocaleString()}`, icon: <Fuel className="w-4 h-4 text-orange-500" />, color: "border-orange-500" },
    { label: "Other Logs", value: `K ${financialSummary.otherLogs.toLocaleString()}`, icon: <Receipt className="w-4 h-4 text-blue-500" />, color: "border-blue-500" },
    { label: "Allocation", value: `K ${financialSummary.allocationMoney.toLocaleString()}`, icon: <DollarSign className="w-4 h-4 text-violet-500" />, color: "border-violet-500" },
    { label: "Council Levy", value: `K ${financialSummary.councilLevy.toLocaleString()}`, icon: <DollarSign className="w-4 h-4 text-slate-500" />, color: "border-slate-400" },
    { label: "Toll", value: `K ${financialSummary.tollAmount.toLocaleString()}`, icon: <Route className="w-4 h-4 text-teal-500" />, color: "border-teal-500" },
  ];

  if (isLoading) {
    return wrap(
      <div className="p-6 bg-neutral-50 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return wrap(
      <div className="p-6 bg-neutral-50 min-h-screen flex flex-col items-center justify-center gap-4">
        <Package className="w-12 h-12 text-neutral-200" />
        <h2 className="text-xl font-bold text-slate-900">Job Not Found</h2>
        <button onClick={() => router.back()} className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest">Go Back</button>
      </div>
    );
  }

  return wrap(
    <>
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

            <div className="flex items-center gap-2">
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border ${jobInfo?.status?.startsWith("STARTED") || jobInfo?.status?.startsWith("REACHED") ? "bg-blue-50 text-blue-600 border-blue-100" :
                jobInfo?.status === "FINALIZED" || jobInfo?.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                  jobInfo?.status?.startsWith("LOADING") || jobInfo?.status?.startsWith("OFFLOADING") ? "bg-orange-50 text-orange-600 border-orange-100" :
                    jobInfo?.status === "CANCELLED" ? "bg-rose-50 text-rose-500 border-rose-100" :
                      "bg-neutral-50 text-neutral-400 border-neutral-100"
                }`}>
                {jobInfo?.status?.replace(/_(\d+)$/, ' (Stop $1)')}
              </div>
              {!booking?.tripStatus && booking?.status !== "cancelled" && (
                <button
                  onClick={handleCancelTrip}
                  disabled={isCancelling}
                  className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                >
                  {isCancelling ? "Cancelling…" : "Cancel Trip"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {statCards.map((card, i) => (
              <div key={i} className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 border-t-4 ${card.color}`}>
                <div className="p-1.5 rounded-lg bg-slate-50 w-fit mb-2">
                  {card.icon}
                </div>
                <div className="text-[15px] font-bold text-slate-900 leading-tight">{card.value}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{card.label}</div>
              </div>
            ))}
          </div>


          {/* GPS Trip Stats Card */}
          {(gpsLoading || gpsStats) && (
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">GPS Trip Stats</h2>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">
                      {gpsStats ? `${gpsStats.dateRange?.from?.slice(0, 10)} → ${gpsStats.dateRange?.to?.slice(0, 10)}` : "Loading from Trakzee…"}
                    </p>
                  </div>
                </div>
                {gpsLoading && (
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {gpsStats && (
                <>
                  {/* Main stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Timer className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Running</span>
                      </div>
                      <span className="text-[18px] font-bold text-slate-900 leading-tight">{gpsStats.runningDuration}</span>
                      <span className="text-[9px] font-medium text-slate-400">hrs</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Coffee className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Idle</span>
                      </div>
                      <span className="text-[18px] font-bold text-slate-900 leading-tight">{gpsStats.idleDuration}</span>
                      <span className="text-[9px] font-medium text-slate-400">hrs</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Stopped</span>
                      </div>
                      <span className="text-[18px] font-bold text-slate-900 leading-tight">{gpsStats.stopDuration}</span>
                      <span className="text-[9px] font-medium text-slate-400">hrs</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Route className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Distance</span>
                      </div>
                      <span className="text-[18px] font-bold text-slate-900 leading-tight">{gpsStats.runningKm}</span>
                      <span className="text-[9px] font-medium text-slate-400">km</span>
                    </div>
                  </div>

                  {/* Speed + days row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-slate-100/70 border border-slate-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Inactive / Off</span>
                      </div>
                      <span className="text-[15px] font-bold text-slate-800">{gpsStats.inactiveDuration || "--"} <span className="text-[9px] font-medium text-slate-400">hrs</span></span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Gauge className="w-3 h-3 text-slate-400" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Max Speed</span>
                      </div>
                      <span className="text-[15px] font-bold text-slate-800">{gpsStats.maxSpeed} <span className="text-[9px] font-medium text-slate-400">km/h</span></span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Activity className="w-3 h-3 text-slate-400" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Avg Speed</span>
                      </div>
                      <span className="text-[15px] font-bold text-slate-800">{gpsStats.avgSpeed} <span className="text-[9px] font-medium text-slate-400">km/h</span></span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Work Days</span>
                      </div>
                      <span className="text-[15px] font-bold text-slate-800">{gpsStats.workingDays} <span className="text-[9px] font-medium text-slate-400">days</span></span>
                    </div>
                  </div>

                  {/* Start → End location */}
                  {(() => {
                    const ts = (booking?.tripStatus || "").toLowerCase();
                    const isDone = ts === "completed" || ts === "delivered";
                    // Start location = exact spot the truck was at the moment "Trip Start"
                    // was clicked (captured into tripStartCoords). NOT from the travel API.
                    const sc = booking?.tripStartCoords;
                    const hasCoords = sc?.lat != null && sc?.lng != null;
                    const startText =
                      sc?.location
                      || (hasCoords ? `${Number(sc.lat).toFixed(5)}, ${Number(sc.lng).toFixed(5)}` : null)
                      || (booking?.tripStartedAt ? "GPS unavailable at start" : "Not started yet");
                    // End location = exact spot captured when the trip was completed
                    const ec = booking?.tripEndCoords;
                    const hasEnd = ec?.lat != null && ec?.lng != null;
                    const endText =
                      ec?.location
                      || (hasEnd ? `${Number(ec.lat).toFixed(5)}, ${Number(ec.lng).toFixed(5)}` : null)
                      || "GPS unavailable at end";
                    return (
                      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Start Location</div>
                          <div className="text-[11px] font-semibold text-slate-700">{startText}</div>
                          {sc?.lat != null && sc?.lng != null && (
                            <a
                              href={`https://www.google.com/maps?q=${sc.lat},${sc.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[8px] font-bold text-primary uppercase tracking-widest hover:underline"
                            >
                              View on map ↗
                            </a>
                          )}
                        </div>
                        <div className="text-slate-200 font-bold text-lg self-center">→</div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">End Location</div>
                          {isDone ? (
                            <>
                              <div className="text-[11px] font-semibold text-slate-700">{endText}</div>
                              {hasEnd && (
                                <a
                                  href={`https://www.google.com/maps?q=${ec.lat},${ec.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[8px] font-bold text-primary uppercase tracking-widest hover:underline"
                                >
                                  View on map ↗
                                </a>
                              )}
                            </>
                          ) : (
                            <div className="text-[10px] font-bold text-amber-500 italic">Trip in progress…</div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

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
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${type === 'pickup'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-emerald-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100 shadow-rose-100'
                            }`}>
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</div>
                            <h3 className="text-base font-bold text-slate-900 mb-1">
                              {[loc?.address?.plotNo, loc?.address?.street, loc?.address?.city, loc?.address?.state, loc?.address?.country].filter(Boolean).join(', ') || 'N/A'}
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
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

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
                      onChange={(e) => setNewExpenseEntry({ ...newExpenseEntry, category: e.target.value })}
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
                        onChange={(e) => setNewExpenseEntry({ ...newExpenseEntry, description: e.target.value })}
                        placeholder={newExpenseEntry.category === "Fuel" ? "e.g. NNPC Station" : "e.g. Bridge Toll / Dinner"}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[12px] font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
                      <input type="date" value={newExpenseEntry.date} onChange={(e) => setNewExpenseEntry({ ...newExpenseEntry, date: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[12px] font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all" />
                    </div>
                  </div>

                  {newExpenseEntry.category === "Fuel" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Litres</label>
                        <input type="number" value={newExpenseEntry.litres} onChange={(e) => setNewExpenseEntry({ ...newExpenseEntry, litres: e.target.value })} placeholder="0" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[12px] font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Rate (K/L)</label>
                        <input type="number" value={newExpenseEntry.rate} onChange={(e) => setNewExpenseEntry({ ...newExpenseEntry, rate: e.target.value })} placeholder="0" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[12px] font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Total (K)</label>
                        <div className="w-full bg-amber-50 border border-amber-200 rounded-xl py-2.5 px-4 text-[12px] font-bold text-amber-700">
                          K{((parseFloat(newExpenseEntry.litres) || 0) * (parseFloat(newExpenseEntry.rate) || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 mb-5">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount (K)</label>
                        <input type="number" value={newExpenseEntry.amount} onChange={(e) => setNewExpenseEntry({ ...newExpenseEntry, amount: e.target.value })} placeholder="0" className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-[12px] font-bold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all" />
                      </div>
                    </div>
                  )}

                  <button onClick={handleAddExpense} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm">
                    <Receipt className="w-3.5 h-3.5" /> Log Trip Expense
                  </button>
                </div>

                {/* Expense List */}
                <div className="space-y-3">
                  {tripExpenses.length > 0 ? tripExpenses.map((entry, idx) => (
                    <div key={entry.id ?? idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:border-transparent transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${entry.category === "Fuel" ? "bg-amber-50 text-amber-500 border border-amber-100" :
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
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${entry.category === "Fuel" ? "bg-amber-50 text-amber-600" :
                              entry.category === "Food" ? "bg-emerald-50 text-emerald-600" :
                                "bg-slate-50 text-slate-400"
                              }`}>{entry.category}</span>
                            {entry.category === "Fuel" && (
                              <span className="text-[9px] font-bold text-slate-400">{entry.litres}L @ K{entry.rate}</span>
                            )}
                            <span className="text-[9px] font-medium text-slate-300">· {entry.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-[14px] font-bold text-slate-900 tracking-tight">K{entry.amount.toLocaleString()}</div>
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
                    <span className="text-lg font-bold text-slate-900">K{tripExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
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
                      <div className={`absolute -left-[25px] w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${event.status === 'completed' ? 'bg-emerald-500' :
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

                  // A "New Job Assigned" entry means this trip was auto-completed because
                  // the driver/truck picked up a new trip while returning. The trip is already
                  // "completed" in the DB (with its end point); show the Completed button locked
                  // with that as the reason, instead of a tappable / generic "current" state.
                  const newJobEntry = (booking.timeline || []).find((e: any) => e.title === "New Job Assigned");
                  const newJobBlocked = !!newJobEntry;

                  const btnCls = (id: string) => {
                    const idx = statusOrder.indexOf(id);
                    const isDone = idx !== -1 && idx < currentIdx;
                    const isActive = idx === currentIdx;
                    const isNext = idx === currentIdx + 1;
                    if (isDone) return { cls: "bg-emerald-50 border-emerald-100 text-emerald-600 cursor-not-allowed opacity-80", isDone, isActive, isNext };
                    if (isActive) return { cls: "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 cursor-not-allowed", isDone, isActive, isNext };
                    if (isNext) return { cls: "bg-orange-500 border-orange-400 text-white shadow-md shadow-orange-100 hover:bg-orange-600 active:scale-[0.98] cursor-pointer", isDone, isActive, isNext };
                    return { cls: "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50", isDone, isActive, isNext };
                  };

                  const Btn = ({ id, label, icon, city, full }: { id: string; label: string; icon: React.ReactNode; city?: string; full?: boolean }) => {
                    const { cls, isDone, isActive, isNext } = btnCls(id);
                    const isLockedByNewJob = id === "COMPLETED" && newJobBlocked;
                    const effectiveCls = isLockedByNewJob
                      ? "bg-amber-50 border-amber-200 text-amber-600 cursor-not-allowed"
                      : cls;
                    return (
                      <button
                        disabled={(!isNext) || isLockedByNewJob}
                        onClick={() => isNext && !isLockedByNewJob && handleStatusUpdate(id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-1 ${full ? "w-full" : "flex-1"} ${effectiveCls}`}
                      >
                        <div>{isDone ? <CheckCircle2 className="w-4 h-4" /> : icon}</div>
                        <span className="text-[9px] font-bold uppercase tracking-widest leading-tight text-center">{label}</span>
                        {city && (
                          <span className={`text-[7px] font-medium normal-case truncate max-w-full text-center ${isActive ? "text-white/70" : isDone ? "text-emerald-400" : isNext ? "text-white/80" : "text-slate-200"}`}>
                            {city}
                          </span>
                        )}
                        {isDone && <span className="text-[7px] font-bold uppercase tracking-widest text-emerald-500">Done</span>}
                        {isLockedByNewJob && <span className="text-[7px] font-bold uppercase tracking-widest text-amber-500">New Job Assigned</span>}
                        {isNext && !isLockedByNewJob && <span className="text-[7px] font-bold uppercase tracking-widest text-white/80">Tap to Update</span>}
                        {isActive && !isLockedByNewJob && <span className="text-[7px] font-bold uppercase tracking-widest text-white/70">Current</span>}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Allocation To Driver</span>
                      <div className="text-[15px] font-bold text-slate-900 mt-0.5">K{financialSummary.allocationMoney.toLocaleString()}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Council Levy</span>
                      <div className="text-[15px] font-bold text-slate-900 mt-0.5">K{financialSummary.councilLevy.toLocaleString()}</div>
                    </div>
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
                          {booking?.finalAmount ? `K${Number(booking.finalAmount).toLocaleString()}` : <span className="text-slate-300 text-[13px]">Not set</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Advance Paid</div>
                        <div className="text-[18px] font-bold text-slate-900">
                          {booking?.advancePaid ? `K${Number(booking.advancePaid).toLocaleString()}` : <span className="text-slate-300 text-[13px]">—</span>}
                        </div>
                      </div>
                    </div>
                    {booking?.finalAmount && booking?.advancePaid && (
                      <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Balance Due</span>
                        <span className="text-[14px] font-bold text-slate-900">
                          K{(Number(booking.finalAmount) - Number(booking.advancePaid)).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Live Route Map */}
                  <div className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-slate-50" style={{ height: 260 }}>
                    {assignment?.truckNumber && assignment.truckNumber !== "N/A" ? (
                      <JobRouteMap
                        truckNumber={assignment.truckNumber}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <MapPin className="w-7 h-7 text-slate-200" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No truck assigned yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Offloading Modal */}
      {showOffloadingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowOffloadingModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="px-6 pt-6 pb-4 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <ArrowDownCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Cargo Offloading Receipt</h2>
                  <p className="text-[11px] text-neutral-400 font-medium">
                    {assignment?.driverName ? cleanDriverName(assignment.driverName) : "Driver"} · {assignment?.truckNumber || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Delivery Orders</label>
                  <button type="button" onClick={() => setOffloadingForm(f => ({ ...f, deliveryOrders: [...f.deliveryOrders, ""] }))} className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline">+ Add</button>
                </div>
                {offloadingForm.deliveryOrders.map((do_, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={do_} onChange={e => { const arr = [...offloadingForm.deliveryOrders]; arr[i] = e.target.value; setOffloadingForm(f => ({ ...f, deliveryOrders: arr })); }} placeholder={`DO #${i + 1}`} className="flex-1 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2 text-[12px] text-slate-900 outline-none focus:border-primary/30 transition-all" />
                    {offloadingForm.deliveryOrders.length > 1 && <button type="button" onClick={() => setOffloadingForm(f => ({ ...f, deliveryOrders: f.deliveryOrders.filter((_, idx) => idx !== i) }))} className="px-2 text-rose-400 hover:text-rose-600 text-[11px] font-bold">✕</button>}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Damages</label>
                  <button type="button" onClick={() => setOffloadingForm(f => ({ ...f, damages: [...f.damages, { quantity: "", amount: "" }] }))} className="text-[9px] font-bold text-rose-500 uppercase tracking-widest hover:underline">+ Add</button>
                </div>
                {offloadingForm.damages.map((dmg, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input type="text" value={dmg.quantity} onChange={e => { const arr = offloadingForm.damages.map((d, idx) => idx === i ? { ...d, quantity: e.target.value } : d); setOffloadingForm(f => ({ ...f, damages: arr })); }} placeholder="Qty with units (e.g. 2 bags)" className="flex-1 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-[12px] text-slate-900 outline-none focus:border-rose-300 transition-all" />
                    <input type="number" value={dmg.amount} onChange={e => { const arr = offloadingForm.damages.map((d, idx) => idx === i ? { ...d, amount: e.target.value } : d); setOffloadingForm(f => ({ ...f, damages: arr })); }} placeholder="Amount" className="w-24 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-[12px] text-slate-900 outline-none focus:border-rose-300 transition-all" />
                    {offloadingForm.damages.length > 1 && <button type="button" onClick={() => setOffloadingForm(f => ({ ...f, damages: f.damages.filter((_, idx) => idx !== i) }))} className="px-2 pt-2 text-rose-400 hover:text-rose-600 text-[11px] font-bold">✕</button>}
                  </div>
                ))}
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Offloading Attachments</label>
                <div
                  onClick={() => offloadingFileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <Paperclip className="w-5 h-5 text-neutral-300" />
                  <p className="text-[11px] font-semibold text-neutral-400">Click to attach files</p>
                  <p className="text-[9px] text-neutral-300">PDF, Images, Docs — any format</p>
                </div>
                <input
                  ref={offloadingFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={e => {
                    const selected = Array.from(e.target.files || []);
                    setOffloadingFiles(prev => {
                      const existing = new Set(prev.map(f => f.name));
                      return [...prev, ...selected.filter(f => !existing.has(f.name))];
                    });
                    e.target.value = "";
                  }}
                />
                {offloadingFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {offloadingFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-100 rounded-xl">
                        <Paperclip className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="text-[11px] font-medium text-slate-700 truncate flex-1">{file.name}</span>
                        <span className="text-[9px] text-neutral-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                        <button
                          type="button"
                          onClick={() => setOffloadingFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-neutral-300 hover:text-rose-500 transition-colors shrink-0"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                disabled={isSubmittingOffloading}
                onClick={() => setShowOffloadingModal(false)}
                className="px-5 py-2.5 rounded-xl border border-neutral-100 text-[12px] font-bold text-slate-500 hover:bg-neutral-50 transition-colors uppercase tracking-widest disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingOffloading}
                onClick={handleSubmitOffloading}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingOffloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Offloading"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Completion Inspection Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowCompletionModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="px-6 pt-6 pb-4 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Complete Job — Final Inspection</h2>
                  <p className="text-[11px] text-neutral-400 font-medium">
                    {assignment?.driverName ? cleanDriverName(assignment.driverName) : "Driver"} · {assignment?.truckNumber || "N/A"}
                    {(newId || booking?.tripId) && <span className="text-primary ml-1">· {newId || booking.tripId}</span>}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Vehicle Condition</label>
                  <select value={completionForm.vehicleCondition} onChange={e => setCompletionForm(f => ({ ...f, vehicleCondition: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-900 outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer">
                    <option>Excellent</option><option>Good</option><option>Fair</option><option>Poor — Needs Repair</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tyre Condition</label>
                  <select value={completionForm.tyreCondition} onChange={e => setCompletionForm(f => ({ ...f, tyreCondition: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-900 outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer">
                    <option>Excellent</option><option>Good</option><option>Fair</option><option>Poor — Replace</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tyre Number</label>
                  <input type="text" value={completionForm.tyreNumber} onChange={e => setCompletionForm(f => ({ ...f, tyreNumber: e.target.value }))} placeholder="e.g. TY-2024-001" className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-[13px] text-slate-900 outline-none focus:border-primary/30 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Challans</label>
                  <input type="text" value={completionForm.challans} onChange={e => setCompletionForm(f => ({ ...f, challans: e.target.value }))} placeholder="Challan no. or ref." className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-[13px] text-slate-900 outline-none focus:border-primary/30 transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Notes</label>
                <textarea rows={2} value={completionForm.notes} onChange={e => setCompletionForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any observations or issues..." className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-[12px] text-slate-700 outline-none focus:border-primary/30 transition-all resize-none" />
              </div>
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-neutral-100 flex gap-3 shrink-0">
              <button onClick={() => setShowCompletionModal(false)} className="flex-1 py-3 border border-neutral-100 rounded-2xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all">
                Cancel
              </button>
              <button onClick={handleSubmitCompletion} disabled={isSubmittingCompletion} className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                {isSubmittingCompletion ? "Completing..." : "Confirm & Complete Job"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                        onChange={(e) => setAddressChangeData(p => ({ ...p, pContactPerson: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-emerald-300 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Contact Number</label>
                      <input
                        type="text"
                        value={addressChangeData.pContactNumber}
                        onChange={(e) => setAddressChangeData(p => ({ ...p, pContactNumber: e.target.value }))}
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
                        onChange={(e) => setAddressChangeData(p => ({ ...p, pPlotNo: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-emerald-300 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Street</label>
                      <input
                        type="text"
                        value={addressChangeData.pStreet}
                        onChange={(e) => setAddressChangeData(p => ({ ...p, pStreet: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-emerald-300 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">City *</label>
                    <input
                      type="text"
                      value={addressChangeData.pCity}
                      onChange={(e) => setAddressChangeData(p => ({ ...p, pCity: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-emerald-300 transition-colors"
                    />
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
                        onChange={(e) => setAddressChangeData(p => ({ ...p, dContactPerson: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-rose-300 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Contact Number</label>
                      <input
                        type="text"
                        value={addressChangeData.dContactNumber}
                        onChange={(e) => setAddressChangeData(p => ({ ...p, dContactNumber: e.target.value }))}
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
                        onChange={(e) => setAddressChangeData(p => ({ ...p, dPlotNo: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-rose-300 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Street</label>
                      <input
                        type="text"
                        value={addressChangeData.dStreet}
                        onChange={(e) => setAddressChangeData(p => ({ ...p, dStreet: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-rose-300 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">City *</label>
                    <input
                      type="text"
                      value={addressChangeData.dCity}
                      onChange={(e) => setAddressChangeData(p => ({ ...p, dCity: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-rose-300 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Reason for Change</label>
                  <input
                    type="text"
                    value={addressChangeData.reason}
                    onChange={(e) => setAddressChangeData(p => ({ ...p, reason: e.target.value }))}
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
                        onChange={(e) => setAddressChangeData(p => ({ ...p, newPickupKm: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-amber-300 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">New Dropoff Distance (KM)</label>
                      <input
                        type="number"
                        value={addressChangeData.newDropoffKm}
                        onChange={(e) => setAddressChangeData(p => ({ ...p, newDropoffKm: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 outline-none focus:border-amber-300 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">New Final Amount (K)</label>
                    <input
                      type="number"
                      value={addressChangeData.newFinalAmount}
                      onChange={(e) => setAddressChangeData(p => ({ ...p, newFinalAmount: e.target.value }))}
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
    </>
  );
}
