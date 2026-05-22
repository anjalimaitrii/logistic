"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import CommonTable from "@/components/admin/CommonTable";
import {
  Package,
  AlertTriangle,
  CheckSquare,
  Key,
  ChevronRight,
  Eye,
  Edit2,
  Search
} from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { assignmentService } from "@/services/assignmentService";
import EditJobDrawer from "@/components/admin/EditJobDrawer";

export default function AdminJobsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const [bookingsData, assignmentsData] = await Promise.all([
        bookingService.getAll(),
        assignmentService.getAll()
      ]);

      // ONLY SHOW FINALIZED JOBS
      const finalizedOnly = (bookingsData || []).filter((b: any) =>
        b.status === 'finalized'
      );
      setBookings(finalizedOnly);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateJob = async (id: string, payload: any) => {
    try {
      await bookingService.update(id, payload);
      await loadBookings(); // Refresh list
    } catch (error) {
      console.error("Failed to update job:", error);
      throw error;
    }
  };

  const getStatusType = (status: string) => {
    if (!status) return 'Pending';
    const s = status.toLowerCase();
    if (s === 'finalized') return 'FINALIZED';
    if (s === 'transit') return 'IN TRANSIT';
    if (s === 'delivered') return 'DELIVERED';
    if (s === 'delayed') return 'DELAYED';
    return s.toUpperCase();
  };

  const getStatusStyles = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'FINALIZED' || s === 'DELIVERED') return 'bg-emerald-50 text-emerald-500 border-emerald-100';
    if (s === 'IN TRANSIT') return 'bg-orange-50 text-orange-500 border-orange-100';
    if (s === 'DELAYED') return 'bg-rose-50 text-rose-500 border-rose-100';
    return 'bg-blue-50 text-blue-500 border-blue-100';
  };

  // Derive unique companies and clients for filter dropdowns
  const uniqueCompanies = Array.from(new Set(
    bookings.map(b => (b.clientId as any)?.company?.companyName).filter(Boolean)
  )) as string[];

  const uniqueClients = Array.from(new Set(
    bookings.map(b => (b.clientId as any)?.name).filter(Boolean)
  )) as string[];

  const filteredBookings = bookings.filter(b => {
    const pickupCity = b.pickupLocations?.[0]?.address?.city || b.pickup?.address?.city || "";
    const dropoffCity = b.dropoffLocations?.[b.dropoffLocations?.length - 1]?.address?.city || b.dropoff?.address?.city || "";
    const matchesSearch =
      b._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tripId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.clientId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pickupCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dropoffCity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = companyFilter === "all" || (b.clientId as any)?.company?.companyName === companyFilter;
    const matchesClient = clientFilter === "all" || (b.clientId as any)?.name === clientFilter;
    return matchesSearch && matchesCompany && matchesClient;
  });

  const jobsData = filteredBookings.map(b => {
    const pickupLocs = b?.pickupLocations?.length > 0 ? b.pickupLocations : (b?.pickup ? [b.pickup] : []);
    const dropoffLocs = b?.dropoffLocations?.length > 0 ? b.dropoffLocations : (b?.dropoff ? [b.dropoff] : []);
    const allLocs = [...pickupLocs, ...dropoffLocs];
    const firstCity = allLocs[0]?.address?.city || "Origin";
    const lastCity = allLocs[allLocs.length - 1]?.address?.city || "Dest.";
    const route = allLocs.length > 2 ? `${firstCity} → ... → ${lastCity}` : `${firstCity} → ${lastCity}`;
    const assignment = assignments.find(a => (a.bookingId?._id || a.bookingId) === b._id);
    return {
      id: b?.tripId || `#FL-${b?._id?.substring(b._id.length - 4).toUpperCase()}`,
      client: (b?.clientId as any)?.name || "Direct Client",
      companyName: (b?.clientId as any)?.company?.companyName || "Direct Booking",
      status: getStatusType(b?.tripStatus || b?.status),
      driver: assignment?.driverName || "Assign Driver",
      route,
      raw: b
    };
  });

  const columns = [
    {
      label: "TRIP ID",
      key: "id",
      render: (val: string) => <span className="text-[12px] font-bold text-orange-500 tracking-tight">{val}</span>
    },
    {
      label: "CLIENT",
      key: "client",
      render: (val: string, row: any) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[7.5px] font-bold uppercase tracking-wider">{row.companyName}</span>
          </div>
          <span className="text-[12px] font-bold text-slate-700">{val}</span>
        </div>
      )
    },
    {
      label: "STATUS",
      key: "status",
      render: (val: string) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(val)}`}>
          <div className={`w-1 h-1 rounded-full mr-1.5 ${val === 'IN TRANSIT' ? 'bg-orange-500' :
            val === 'DELIVERED' ? 'bg-emerald-500' :
              val === 'DELAYED' ? 'bg-rose-500' : 'bg-indigo-500'
            }`} />
          {val}
        </span>
      )
    },
    {
      label: "DRIVER",
      key: "driver",
      render: (val: string) => <span className="text-[12px] font-medium text-slate-600">{val}</span>
    },
    {
      label: "ROUTE",
      key: "route",
      render: (val: string) => <span className="text-[12px] font-medium text-slate-500 italic">{val}</span>
    },
    {
      label: "ACTIONS",
      key: "actions",
      align: "center" as const,
      render: (_: any, row: any) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/jobs/${row.raw._id || row.raw.id}`);
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all border border-slate-100"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedJob(row.raw);
              setIsEditDrawerOpen(true);
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  const kpis = [
    {
      label: "ACTIVE JOBS",
      value: bookings.filter(b => b.status === 'transit' || b.status === 'accepted').length.toString(),
      icon: <Package className="w-5 h-5 text-orange-500" />,
      subText: "8 transit - 4 loading",
      trend: "+ 4 TODAY",
      variant: "primary" as const
    },
    {
      label: "DELAYED JOBS",
      value: "3",
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      subText: "2 mechanical - 1 traffic",
      trend: "↑ 1 NEW",
      variant: "warning" as const
    },
    {
      label: "COMPLETED",
      value: bookings.filter(b => b.status === 'finalized' || b.status === 'delivered').length.toString(),
      icon: <CheckSquare className="w-5 h-5 text-emerald-500" />,
      subText: "Last 30 days summary",
      trend: "↑ 12%",
      variant: "success" as const
    },
    {
      label: "PENDING OTP",
      value: "5",
      icon: <Key className="w-5 h-5 text-indigo-500" />,
      subText: "Awaiting driver verify",
      trend: "↑ 2 TODAY",
      variant: "indigo" as const
    },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mb-1 font-medium uppercase tracking-widest">
              <span>FleetTrack</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary">Jobs</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Job Management</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Manage and track your logistics operations in real-time.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[24px] font-bold text-slate-900">{kpi.value}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${kpi.variant === 'primary' ? 'bg-emerald-50 text-emerald-500' :
                      kpi.variant === 'warning' ? 'bg-amber-50 text-amber-500' :
                        kpi.variant === 'success' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'
                      }`}>
                      {kpi.trend}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                  <p className="text-[10px] font-medium text-slate-300 italic">● {kpi.subText}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                  {kpi.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <CommonTable
          title="Active Trips"
          icon={<Package className="w-4 h-4 text-orange-500" />}
          columns={columns}
          data={isLoading ? [] : jobsData}
          onRowClick={(row) => router.push(`/admin/jobs/${row.raw._id}`)}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search ID, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-100 rounded-lg pl-9 pr-3 py-2 text-[11px] font-medium outline-none focus:bg-white focus:border-primary/20 transition-all w-40"
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
          emptyState={
            isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Syncing Fleet Operations...</p>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Package className="w-10 h-10 text-slate-100" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">No Active Trips Found</p>
              </div>
            )
          }
        />

        <EditJobDrawer
          isOpen={isEditDrawerOpen}
          onClose={() => {
            setIsEditDrawerOpen(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
          onUpdate={handleUpdateJob}
        />
      </div>
    </AdminLayout>
  );
}
