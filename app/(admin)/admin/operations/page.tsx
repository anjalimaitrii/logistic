"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import OperationAssignmentDrawer from "@/components/admin/OperationAssignmentDrawer";
import { Truck, Users, Clock, AlertTriangle, Eye, Edit2, ChevronRight, Search, CheckCircle2, RotateCcw } from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { assignmentService } from "@/services/assignmentService";
import { settlementService } from "@/services/settlementService";
import { driverService } from "@/services/driverService";

export default function AdminOperations() {
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [returningDrivers, setReturningDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectionModal, setInspectionModal] = useState<{ open: boolean; driver: any | null }>({ open: false, driver: null });
  const [inspectionForm, setInspectionForm] = useState({ vehicleCondition: "Good", tyreCondition: "Good", notes: "", tollAmount: "" });
  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const [bookingsData, assignmentsData, settlementsData] = await Promise.all([
        bookingService.getAll(),
        assignmentService.getAll(),
        settlementService.getAll().catch(() => [])
      ]);

      const finalized = (bookingsData || []).filter((b: any) => b.status?.toLowerCase() === "finalized");
      setBookings(finalized);
      setAssignments(assignmentsData || []);
      setSettlements(settlementsData || []);

      const driversData = await driverService.getAll().catch(() => []);
      setReturningDrivers((driversData || []).filter((d: any) =>
        d.driverStatus === "returning" || d.driverStatus === "under_inspection"
      ));
    } catch (error) {
      console.error("Failed to load operations data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignJob = async (assignmentData: any) => {
    if (!selectedJob) return;
    try {
      const payload = {
        bookingId: selectedJob._id,
        truckId: assignmentData.truckId,
        driverId: assignmentData.driverId,
        driverName: assignmentData.driver,
        truckNumber: assignmentData.truckNumber,
        truckHealth: assignmentData.truckHealth,
        collectionArea: assignmentData.collection
      };

      if (selectedJob.assignment) {
        // Update existing assignment
        await assignmentService.update(selectedJob._id, payload);
      } else {
        // Create new assignment
        await assignmentService.create(payload);
      }

      setIsDrawerOpen(false);
      loadBookings();
    } catch (error) {
      console.error("Failed to assign job:", error);
      alert("Failed to assign fleet unit");
    }
  };

  const openInspectionModal = (driver: any) => {
    setInspectionForm({ vehicleCondition: "Good", tyreCondition: "Good", notes: "", tollAmount: "" });
    setInspectionModal({ open: true, driver });
  };

  const handleSubmitInspection = async () => {
    if (!inspectionModal.driver) return;
    try {
      setIsSubmittingInspection(true);
      const { tollAmount, ...inspectionData } = inspectionForm;
      await assignmentService.markTruckInspected(inspectionModal.driver._id, inspectionData);

      // Save toll amount to settlement if provided
      const tollAmt = parseFloat(tollAmount);
      if (tollAmt > 0) {
        const driverAssignment = assignments.find(
          a => (a.driverId?._id || a.driverId) === inspectionModal.driver._id
        );
        if (driverAssignment) {
          const bookingId = driverAssignment.bookingId?._id || driverAssignment.bookingId;
          await settlementService.process({ bookingId, tollAmount: tollAmt });
        }
      }

      setInspectionModal({ open: false, driver: null });
      loadBookings();
    } catch (error) {
      console.error("Failed to submit inspection:", error);
      alert("Failed to complete inspection");
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  const kpis = [
    { label: "Total Finalized", value: bookings.length.toString(), icon: <Truck className="w-5 h-5 text-primary" />, subText: "Ready for operations", trend: "Live", variant: "primary" as const },
    { label: "Unassigned", value: bookings.filter(b => !assignments.find(a => (a.bookingId?._id || a.bookingId) === b._id)).length.toString(), icon: <AlertTriangle className="w-5 h-5 text-rose-500" />, subText: "Needs driver/truck", trend: "Critical", variant: "danger" as const },
    { label: "Assigned", value: assignments.length.toString(), icon: <Users className="w-5 h-5 text-emerald-500" />, subText: "Fleet coordinated", trend: "Ready", variant: "success" as const },
    { label: "In Transit", value: "0", icon: <Clock className="w-5 h-5 text-amber-500" />, subText: "On the road", trend: "Tracking", variant: "warning" as const },
  ];

  // Derive unique companies and clients for filter dropdowns
  const uniqueCompanies = Array.from(new Set(
    bookings.map(b => (b.clientId as any)?.company?.companyName).filter(Boolean)
  )) as string[];

  const uniqueClients = Array.from(new Set(
    bookings.map(b => (b.clientId as any)?.name).filter(Boolean)
  )) as string[];

  const filteredBookings = bookings.filter(b => {
    const pickupCity = b.pickupLocations?.[0]?.address?.city || b.pickup?.address?.city || "";
    const dropoffCity = b.dropoffLocations?.[0]?.address?.city || b.dropoff?.address?.city || "";
    const matchesSearch =
      b._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tripId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.clientId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pickupCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dropoffCity.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    const matchesCompany = companyFilter === "all" || (b.clientId as any)?.company?.companyName === companyFilter;
    const matchesClient = clientFilter === "all" || (b.clientId as any)?.name === clientFilter;

    return matchesSearch && matchesStatus && matchesCompany && matchesClient;
  });

  const tableData = filteredBookings.map(b => {
    const assignment = assignments.find(a => (a.bookingId?._id || a.bookingId) === b._id);
    const settlement = settlements.find(s => (s.bookingId?._id || s.bookingId) === b._id);
    return {
      id: b.tripId || b._id.substring(b._id.length - 6).toUpperCase(),
      companyName: (b.clientId as any)?.company?.companyName || "Direct Booking",
      clientName: (b.clientId as any)?.name || "N/A",
      route: `${b.pickupLocations?.[0]?.address?.city || b.pickup?.address?.city || 'N/A'} → ${b.dropoffLocations?.[0]?.address?.city || b.dropoff?.address?.city || 'N/A'}`,
      status: assignment ? "Assigned" : "Unassigned",
      weight: b.cargoDetails?.weight,
      goodsType: b.cargoDetails?.goodsType,
      scheduleDate: b.cargoDetails?.loadingDate,
      type: assignment ? "success" : "unassigned",
      isApproved: !!settlement,
      raw: { ...b, assignment, isApproved: !!settlement }
    };
  });

  const columns = [
    { label: "Job ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">#{val}</span> },
    {
      label: "Company & Client",
      key: "companyName",
      render: (val: string, row: any) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[8px] font-bold uppercase tracking-wider">{val}</span>
          </div>
          <span className="text-[11px] font-bold text-slate-700 ml-0.5">{row.clientName}</span>
        </div>
      )
    },
    { label: "Route", key: "route", render: (val: string) => <span className="text-[11px] font-medium text-neutral-400 italic pr-2">{val}</span> },
    {
      label: "Status",
      key: "status",
      render: (val: string, row: any) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${row.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-neutral-50 text-neutral-400"
            }`}
        >
          <span className={`w-1 h-1 rounded-full ${row.type === "success" ? "bg-emerald-500" : "bg-neutral-400"}`} />
          {val}
        </span>
      ),
    },
    {
      label: "Payload", key: "weight", render: (val: string, row: any) => (
        <div className="flex flex-col">
          <span className="text-slate-900 font-bold">{val} kg</span>
          <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-tighter">{row.goodsType}</span>
        </div>
      )
    },
    { label: "Schedule", key: "scheduleDate", render: (val: string) => <span className="font-medium text-neutral-500">{val}</span> },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (val: any, row: any) => (
        <div className="flex gap-2 justify-center">
          {row.raw.assignment ? (
            <button
              onClick={() => {
                setSelectedJob(row.raw);
                setIsDrawerOpen(true);
              }}
              className="px-3 py-1.5 bg-white border border-neutral-100 text-neutral-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:text-primary hover:border-primary/20 transition-all flex items-center gap-2"
            >
              <Eye className="w-3 h-3" />
              View
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedJob(row.raw);
                setIsDrawerOpen(true);
              }}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/10 flex items-center gap-2"
            >
              <Edit2 className="w-3 h-3" />
              Assign
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-8 font-sans">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[9px] text-neutral-400 mb-1 font-medium uppercase tracking-widest">
              <span className="hover:text-primary cursor-pointer transition-colors">Admin</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary/80">Operations</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Logistics Operations</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Manage driver assignments and fleet coordination.</p>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))}
        </div>

        {/* Active Jobs Table */}
        <CommonTable
          title="Operation Ready Jobs"
          icon="📦"
          columns={columns}
          data={tableData}
          onRowClick={(row) => {
            setSelectedJob(row.raw);
            setIsDrawerOpen(true);
          }}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/20 w-40 transition-all"
                />
              </div>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-40"
              >
                <option value="all">All Companies</option>
                {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-40"
              >
                <option value="all">All Clients</option>
                {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {filteredBookings.length} Result{filteredBookings.length !== 1 ? 's' : ''}
              </div>
            </div>
          }
        />

        {/* Returning Drivers — Pending Truck Inspection */}
        {returningDrivers.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-slate-900">Returning Drivers</h2>
                  <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Truck inspection required before next assignment</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100 uppercase tracking-widest">
                {returningDrivers.length} Pending
              </span>
            </div>
            <div className="divide-y divide-neutral-50">
              {returningDrivers.map((driver: any) => (
                <div key={driver._id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-slate-900">{driver.name}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-2">
                        <span>{driver.assignedTruck?.truckId || "No Truck"}</span>
                        {driver.assignedTruck?.health && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-neutral-300" />
                            <span>{driver.assignedTruck.health}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-bold rounded-full border border-amber-100 uppercase tracking-widest flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                      {driver.driverStatus === "under_inspection" ? "Under Inspection" : "Returning"}
                    </span>
                    <button
                      onClick={() => openInspectionModal(driver)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Check & Release
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignment Drawer */}
        {isDrawerOpen && (
          <OperationAssignmentDrawer
            isOpen={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              loadBookings();
            }}
            job={selectedJob}
            onSubmit={handleAssignJob}
          />
        )}

        {/* Truck Inspection Modal */}
        {inspectionModal.open && inspectionModal.driver && (
          <div className="fixed inset-0 z-700 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setInspectionModal({ open: false, driver: null })} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 pt-6 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-slate-900">Truck Inspection</h2>
                    <p className="text-[11px] text-neutral-400 font-medium">{inspectionModal.driver.name} · {inspectionModal.driver.assignedTruck?.truckId || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-[11px] text-neutral-500 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  Complete the inspection before releasing driver for new assignments.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Vehicle Condition</label>
                    <select
                      value={inspectionForm.vehicleCondition}
                      onChange={e => setInspectionForm(f => ({ ...f, vehicleCondition: e.target.value }))}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-900 outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor — Needs Repair</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tyre Condition</label>
                    <select
                      value={inspectionForm.tyreCondition}
                      onChange={e => setInspectionForm(f => ({ ...f, tyreCondition: e.target.value }))}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-900 outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor — Replace</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={inspectionForm.notes}
                    onChange={e => setInspectionForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any observations or issues found..."
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-[12px] text-slate-700 outline-none focus:border-primary/30 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    Toll Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={inspectionForm.tollAmount}
                    onChange={e => setInspectionForm(f => ({ ...f, tollAmount: e.target.value }))}
                    placeholder="0 — leave blank if no toll"
                    className="w-full bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-900 outline-none focus:border-amber-300 transition-all"
                  />
                  <p className="text-[9px] text-neutral-400 italic">Amount will be deducted from toll wallet</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setInspectionModal({ open: false, driver: null })}
                  className="flex-1 py-3 border border-neutral-100 rounded-2xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitInspection}
                  disabled={isSubmittingInspection}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmittingInspection ? "Releasing..." : "Confirm & Release Driver"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
