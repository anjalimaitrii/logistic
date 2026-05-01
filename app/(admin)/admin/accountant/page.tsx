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
  AlertTriangle
} from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { assignmentService } from "@/services/assignmentService";

export default function AdminAccountant() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      // Only show finalized bookings
      const finalized = (bookingsData || []).filter((b: any) => b.status === "finalized");
      setBookings(finalized);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error("Failed to load accountant data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [assignments, setAssignments] = useState<any[]>([]);

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
      value: bookings.filter(b => !b.advancePaid).length.toString(),
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
      value: bookings.filter(b => b.advancePaid > 0).length.toString(),
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      subText: "Verified Ledger",
      trend: "Live",
      variant: "success" as const
    },
  ];

  const tableData = bookings.map(b => {
    const assignment = assignments.find(a => (a.bookingId?._id || a.bookingId) === b._id);
    return {
      id: `#JOB-${b._id.substring(b._id.length - 4).toUpperCase()}`,
      route: `${b.pickup?.address?.city || 'N/A'} → ${b.dropoff?.address?.city || 'N/A'}`,
      status: b.advancePaid ? "Approved" : "Pending",
      driver: assignment?.driverName || "Unassigned",
      truckNumber: assignment?.truckNumber || "N/A",
      collection: assignment?.collectionArea || "N/A",
      raw: b
    };
  });

  const columns = [
    { label: "Job ID", key: "id", render: (val: string) => <span className="font-semibold text-emerald-600">{val}</span> },
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
    { label: "Route", key: "route", render: (val: string) => <span className="text-[11px] font-normal text-neutral-400">{val}</span> },
    {
      label: "Process Status",
      key: "status",
      render: (val: string, row: any) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${val === "Settled"
            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
            : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}
        >
          {val}
        </span>
      ),
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
            className="px-4 py-1.5 flex items-center gap-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-[9px] font-semibold uppercase tracking-widest shadow-sm shadow-emerald-700/10"
          >
            <Eye className="w-3.5 h-3.5" />
            Process
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

          <div className="flex items-center gap-3">
            <div className="bg-white border border-neutral-200 rounded-2xl p-1.5 flex items-center gap-1 shadow-sm">
              <button className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 transition-all">Daily</button>
              <button className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-all">Monthly</button>
            </div>
            <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all">
              Export Report
            </button>
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
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Search Job/Driver..."
                    className="bg-white border border-neutral-200 rounded-lg px-4 py-1.5 text-[10px] font-medium outline-none focus:border-emerald-500/40 transition-all w-48 shadow-inner placeholder:text-neutral-300"
                  />
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
