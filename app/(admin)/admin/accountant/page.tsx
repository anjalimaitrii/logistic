"use client";

import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import {
  Wallet,
  Users,
  Clock,
  CheckCircle2,
  Eye,
  Receipt,
  Truck,
  DollarSign,
  MapPin,
  ChevronRight
} from "lucide-react";

export default function AdminAccountant() {
  const router = useRouter();

  const kpis = [
    { label: "Total Revenue", value: "₦1.2M", icon: <Wallet className="w-5 h-5 text-emerald-600" />, subText: "Last 30 days", trend: "↑ 12%", variant: "success" as const },
    { label: "Pending Allos", value: "5", icon: <Clock className="w-5 h-5 text-amber-500" />, subText: "Awaiting approval", trend: "Critical", variant: "warning" as const },
    { label: "Active Trips", value: "12", icon: <Truck className="w-5 h-5 text-primary" />, subText: "On the road", trend: "↑ 4 today", variant: "primary" as const },
    { label: "Settled Jobs", value: "148", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, subText: "Fully processed", trend: "98% accuracy", variant: "success" as const },
  ];

  const accountantData = [
    {
      id: "#JOB-4005",
      route: "Kano (North) → Port Harcourt",
      status: "Assigned",
      driver: "Adaeze O.",
      truckNumber: "TRK-2201",
      collection: "Collection 2",
      type: "success"
    },
    {
      id: "#JOB-3992",
      route: "Kaduna (NW) → Lagos (SW)",
      status: "In Transit",
      driver: "Kwame M.",
      truckNumber: "TRK-9005",
      collection: "Collection 1",
      allocationMoney: "45,000",
      petrolFilled: true,
      type: "transit"
    },
    {
      id: "#JOB-4012",
      route: "Lagos (West) → Ibadan (SW)",
      status: "Assigned",
      driver: "Oluwaseun P.",
      truckNumber: "TRK-1102",
      collection: "Collection 1",
      type: "success"
    },
  ];

  const columns = [
    { label: "Job ID", key: "id", render: (val: string) => <span className="font-semibold text-emerald-600">{val}</span> },
    {
      label: "Driver", key: "driver", render: (val: string) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-medium text-slate-500">
            {val?.split(' ')[0][0]}{val?.split(' ')[1]?.[0] || ""}
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
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${row.allocationMoney
            ? "bg-emerald-50 text-emerald-600"
            : "bg-amber-50 text-amber-600"
            }`}
        >
          {row.allocationMoney ? "Settled" : "Pending"}
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
              router.push(`/admin/accountant/${row.id.replace('#', '')}`);
            }}
            className="px-4 py-1.5 flex items-center gap-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-[9px] font-semibold uppercase tracking-widest shadow-sm shadow-emerald-700/10"
          >
            {row.allocationMoney ? <Eye className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
            {row.allocationMoney ? "Details" : "Process"}
          </button>
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
              <span className="hover:text-emerald-600 cursor-pointer transition-colors">Admin</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-emerald-600/80">Accountant</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Accounts Management</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Manage driver allocations, fuel, and trip expenses.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-3">
              <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest">Financial Summary</span>
              <span className="text-[10px] font-semibold text-emerald-600 tracking-tight">System Live</span>
            </div>
            <div className="h-10 w-px bg-neutral-100" />
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-neutral-100 text-neutral-400 hover:text-emerald-600 hover:border-emerald-600/20 transition-all shadow-sm active:scale-95">
              <Receipt className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-md transition-all group active:scale-[0.98]">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-neutral-50 group-hover:bg-emerald-50 transition-colors">
                  {kpi.icon}
                </div>
                <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${
                  kpi.variant === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {kpi.trend}
                </span>
              </div>
              <div className="text-lg font-semibold text-slate-900 mb-0.1">{kpi.value}</div>
              <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">{kpi.label}</div>
              <div className="text-[9px] text-neutral-400 mt-2 flex items-center gap-1.5 font-normal">
                <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
                {kpi.subText}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <CommonTable
            title="Assigned Trip Ledger"
            icon="💳"
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
            data={accountantData}
            onRowClick={(row) => {
              router.push(`/admin/accountant/${row.id.replace('#', '')}`);
            }}
          />
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Assigned Trips</h3>
            <span className="text-[10px] font-bold text-neutral-400">{accountantData.length} Jobs</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {accountantData.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden active:scale-[0.98] transition-all"
                onClick={() => {
                  router.push(`/admin/accountant/${job.id.replace('#', '')}`);
                }}
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-950">{job.id}</div>
                        <div className="text-[10px] font-medium text-neutral-400">Driver: {job.driver}</div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${job.allocationMoney ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                      {job.allocationMoney ? "Settled" : "Pending"}
                    </span>
                  </div>

                  <div className="bg-slate-50/50 rounded-2xl p-3 border border-neutral-100/50">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-emerald-600" /> Planned Route
                    </div>
                    <div className="text-[12px] font-medium text-slate-600 leading-relaxed italic pr-2">
                      {job.route}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-4">
                      <div className={`p-1.5 rounded-lg ${job.petrolFilled ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 grayscale'}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                        Fuel: {job.petrolFilled ? "Filled" : "Pending"}
                      </div>
                    </div>
                    <div className="text-[13px] font-bold text-emerald-600">
                      {job.allocationMoney ? `₦${job.allocationMoney}` : "₦---"}
                    </div>
                  </div>

                  <button
                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all ${job.allocationMoney
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/20'
                      }`}
                  >
                    {job.allocationMoney ? <Eye className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                    {job.allocationMoney ? "View Ledger" : "Process Allocation"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
