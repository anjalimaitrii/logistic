"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import {
  Wallet,
  Clock,
  CheckCircle2,
  Eye,
  Truck,
  ChevronRight,
  AlertTriangle,
  Search
} from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { assignmentService } from "@/services/assignmentService";
import { settlementService } from "@/services/settlementService";

export default function AdminAccountant() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");

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

      const assignments = assignmentsData || [];
      const settlements = settlementsData || [];

      const assignedBookingIds = new Set(assignments.map((a: any) =>
        (a.bookingId?._id || a.bookingId)?.toString()
      ));

      // Only show finalized bookings that have been assigned to a driver
      const finalizedAndAssigned = (bookingsData || []).filter((b: any) =>
        b.status?.toLowerCase() === "finalized" && assignedBookingIds.has(b._id.toString())
      );

      setBookings(finalizedAndAssigned);
      setAssignments(assignments);
      setSettlements(settlements);
    } catch (error) {
      console.error("Failed to load accountant data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [assignments, setAssignments] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);

  const kpis = [
    {
      label: "Total Ledger",
      value: bookings.length.toString(),
      icon: <Wallet className="w-5 h-5 text-emerald-600" />,
      subText: "Finalized bookings",
      trend: "Live",
      variant: "success" as const
    },
    {
      label: "Pending Settlement",
      value: (bookings.length - settlements.length).toString(),
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      subText: "Awaiting payments",
      trend: "Action Required",
      variant: "warning" as const
    },
    {
      label: "Assigned Trips",
      value: assignments.length.toString(),
      icon: <Truck className="w-5 h-5 text-primary" />,
      subText: "Units allocated",
      trend: "Active",
      variant: "primary" as const
    },
    {
      label: "Approved Trips",
      value: settlements.length.toString(),
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      subText: "Verified Ledger",
      trend: "Live",
      variant: "success" as const
    },
  ];

  // Derive unique companies and clients for filter dropdowns
  const uniqueCompanies = Array.from(new Set(
    bookings.map(b => (b.clientId as any)?.company?.companyName).filter(Boolean)
  )) as string[];

  const uniqueClients = Array.from(new Set(
    bookings.map(b => (b.clientId as any)?.name).filter(Boolean)
  )) as string[];

  const filteredBookings = bookings.filter(b => {
    const matchesSearch =
      b._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tripId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.clientId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pickup?.address?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.dropoff?.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = companyFilter === "all" || (b.clientId as any)?.company?.companyName === companyFilter;
    const matchesClient = clientFilter === "all" || (b.clientId as any)?.name === clientFilter;
    return matchesSearch && matchesCompany && matchesClient;
  });

  const settledBookingIds = new Set(
    settlements.map((s: any) => (s.bookingId?._id || s.bookingId)?.toString())
  );

  const tableData = filteredBookings.map(b => {
    const assignment = assignments.find(a => (a.bookingId?._id || a.bookingId) === b._id);
    const isApproved = settledBookingIds.has(b._id.toString());
    const routeStops = [
      ...(b.pickupLocations?.length ? b.pickupLocations : b.pickup ? [b.pickup] : []).map((l: any) => l.address?.city).filter(Boolean),
      ...(b.dropoffLocations?.length ? b.dropoffLocations : b.dropoff ? [b.dropoff] : []).map((l: any) => l.address?.city).filter(Boolean),
    ] as string[];
    return {
      id: b.tripId || `#TRIP-${b._id.substring(b._id.length - 4).toUpperCase()}`,
      companyName: (b.clientId as any)?.company?.companyName || "Direct Booking",
      clientName: (b.clientId as any)?.name || "N/A",
      route: routeStops.length ? routeStops : ["N/A"],
      status: isApproved ? "Approved" : "Assigned",
      driver: assignment?.driverName || "Unassigned",
      truckNumber: assignment?.truckNumber || "N/A",
      collection: assignment?.collectionArea || "N/A",
      raw: b
    };
  });

  const columns = [
    { label: "Job ID", key: "id", render: (val: string) => <span className="font-semibold text-emerald-600">{val}</span> },
    {
      label: "Company & Client",
      key: "companyName",
      render: (val: string, row: any) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[7.5px] font-bold uppercase tracking-wider">{val}</span>
          </div>
          <span className="text-[11px] font-bold text-slate-700 ml-0.5">{row.clientName}</span>
        </div>
      )
    },
    {
      label: "Driver", key: "driver", render: (val: string) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-medium text-slate-500 uppercase">
            {val !== "Unassigned" ? val.split(' ').map((n: string) => n[0]).join('') : "❓"}
          </div>
          <span className="font-medium text-slate-700">{val}</span>
        </div>
      )
    },
    {
      label: "Route", key: "route",
      render: (val: string[]) => {
        const cities = Array.isArray(val) ? val : [val];
        return (
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-slate-600 italic">{cities[0]}</span>
            {cities.length > 1 && <span className="text-slate-300 text-[10px] font-bold">→</span>}
            {cities.length > 2 && <span className="text-[11px] text-slate-400 italic">...</span>}
            {cities.length > 2 && <span className="text-slate-300 text-[10px] font-bold">→</span>}
            {cities.length > 1 && <span className="text-[11px] font-medium text-slate-600 italic">{cities[cities.length - 1]}</span>}
          </div>
        );
      }
    },
    {
      label: "Action",
      key: "actions",
      align: "center" as const,
      render: (val: any, row: any) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/accountant/${row.raw._id}`);
            }}
            className={`px-4 py-1.5 flex items-center gap-2 rounded-lg transition-all text-[9px] font-semibold uppercase tracking-widest shadow-sm ${row.status === "Approved"
              ? "bg-slate-100 text-slate-500 cursor-default"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-700/10"
              }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {row.status === "Approved" ? "Approved" : "Review & Approve"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 pb-20 space-y-8 bg-neutral-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.15em]">
              <span className="hover:text-emerald-600 cursor-pointer transition-colors">Financials</span>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <span className="text-emerald-600/80">Accountant Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trip Ledger & Settlements</h1>
            <p className="text-[12px] text-neutral-400 font-medium">Verify cargo delivery and process driver allocations.</p>
          </div>


        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white rounded-[24px] p-5 border border-neutral-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-2xl bg-slate-50 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-neutral-100">
                  {kpi.icon}
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${kpi.variant === 'success' ? 'bg-emerald-50 text-emerald-600' :
                  kpi.variant === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                  {kpi.trend}
                </span>
              </div>
              <div className="text-lg font-semibold text-slate-900 mb-0.1">{isLoading ? "..." : kpi.value}</div>
              <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">{kpi.label}</div>
              <div className="text-[9px] text-neutral-400 mt-2 flex items-center gap-1.5 font-normal">
                <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
                {kpi.subText}
              </div>
            </div>
          ))}
        </div>

        {/* Table View */}
        <div className="block">
          <CommonTable
            title="Assigned Trip Ledger"
            icon="💳"
            isLoading={isLoading}
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
                  className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-[160px]"
                >
                  <option value="all">All Companies</option>
                  {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-[160px]"
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
            columns={columns}
            data={tableData}
            onRowClick={(row) => router.push(`/admin/accountant/${row.raw._id}`)}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
