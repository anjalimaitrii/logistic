"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateTruckModal from "@/components/admin/CreateTruckModal";
import TruckComplianceDrawer from "@/components/admin/TruckComplianceDrawer";
import { ChevronRight, Eye, Settings, Plus } from "lucide-react";

export default function AdminTrucks() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const router = useRouter();

  const kpis = [
    { label: "Total Fleet", value: "40", icon: "🚛", subText: "Active registered units", trend: "↑ 2 new", variant: "primary" as const },
    { label: "On Road", value: "32", icon: "🛣️", subText: "Currently in transit", trend: "↑ 80%", variant: "success" as const },
    { label: "Maintenance", value: "2", icon: "🔧", subText: "In workshop for repairs", trend: "↓ 1 cleared", variant: "danger" as const },
    { label: "Idle", value: "6", icon: "🅿️", subText: "Available for dispatch", trend: "↑ 1 today", variant: "warning" as const },
  ];

  const trucksData = [
    { id: "TRK-014", model: "Volvo FH16", status: "Active", odo: "12,400 km", type: "success" },
    { id: "TRK-022", model: "Mercedes Actros", status: "Active", odo: "45,210 km", type: "success" },
    { id: "TRK-018", model: "Scania R500", status: "Inactive", odo: "89,100 km", type: "danger" },
    { id: "TRK-007", model: "MAN TGX", status: "Idle", odo: "5,300 km", type: "warning" },
    { id: "TRK-025", model: "Daf XF", status: "Maint.", odo: "156,000 km", type: "danger" },
  ];

  const columns = [
    { label: "Truck ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
    { label: "Model", key: "model", render: (val: string) => <span className="font-medium text-slate-700 text-nowrap">{val}</span> },
    {
      label: "Status",
      key: "status",
      render: (val: string, row: any) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${row.type === "success"
            ? "bg-emerald-50 text-emerald-600"
            : row.type === "warning"
              ? "bg-amber-50 text-amber-500"
              : "bg-rose-50 text-rose-500"
            }`}
        >
          <span
            className={`w-1 h-1 rounded-full ${row.type === "success" ? "bg-emerald-500" : row.type === "warning" ? "bg-amber-500" : "bg-rose-500"
              }`}
          />
          {val}
        </span>
      ),
    },

    { label: "Odometer", key: "odo", render: (val: string) => <span className="font-medium text-slate-500">{val}</span> },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (val: any, row: any) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/trucks/${row.id}`);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-primary transition-all shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTruck(row.id);
              setIsComplianceOpen(true);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-primary transition-all shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 pb-20 space-y-8 bg-neutral-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1.5">
              <span className="hover:text-primary cursor-pointer transition-colors">Operations</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary/80">Fleet Management</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Manage Trucks</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Inventory and health monitoring of all fleet units.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:brightness-110 transition-all w-fit flex items-center gap-2"
          >
            <div className="p-0.5 rounded-md bg-white/20">
              <Plus className="w-3 h-3" />
            </div>
            Add New Truck
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))}
        </div>

        <CommonTable
          title="Fleet Inventory"
          icon="🚛"
          columns={columns}
          data={trucksData}
          onRowClick={(row) => router.push(`/admin/trucks/${row.id}`)}
          action={
            <div className="flex gap-2">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search trucks..."
                  className="bg-white border border-neutral-100 rounded-xl px-4 py-2 text-[11px] font-medium outline-none focus:border-primary/20 transition-all w-56 shadow-sm"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-primary transition-colors">
                  🔍
                </div>
              </div>
            </div>
          }
        />
      </div>

      <CreateTruckModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          console.log("Truck Added:", data);
          setModalOpen(false);
        }}
      />

      <TruckComplianceDrawer
        isOpen={isComplianceOpen}
        onClose={() => setIsComplianceOpen(false)}
        truckId={selectedTruck}
      />
    </AdminLayout>
  );
}
