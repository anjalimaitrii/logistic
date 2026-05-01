"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateDriverModal from "@/components/admin/CreateDriverModal";
import { ChevronRight, Eye, Phone, Plus, Edit2, Trash2 } from "lucide-react";
import { driverService } from "@/services/driverService";

export default function AdminDrivers() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setIsLoading(true);
      const data = await driverService.getAll();
      setDrivers(data || []);
    } catch (error) {
      console.error("Failed to load drivers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDriver = async (formData: any) => {
    try {
      if (selectedDriver) {
        // Update existing
        await driverService.update(selectedDriver._id, formData);
      } else {
        // Create new
        await driverService.create(formData);
      }
      setModalOpen(false);
      setSelectedDriver(null);
      loadDrivers();
    } catch (error) {
      console.error("Failed to save driver:", error);
      alert("Failed to save driver profile");
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;
    try {
      await driverService.delete(id);
      loadDrivers();
    } catch (error) {
      console.error("Failed to delete driver:", error);
      alert("Failed to delete driver");
    }
  };

    const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      await driverService.update(id, { status: newStatus });
      loadDrivers();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const kpis = [
    { label: "Total Drivers", value: drivers.length.toString(), icon: "👤", subText: "Active on roster", trend: "Live", variant: "primary" as const },
    { label: "Active", value: drivers.filter(d => d.status === "Active").length.toString(), icon: "🛣️", subText: "Ready for duty", trend: "Updated", variant: "success" as const },
    { label: "Assigned", value: drivers.filter(d => d.assignedTruck).length.toString(), icon: "🚛", subText: "With vehicles", trend: "Synced", variant: "primary" as const },
    { label: "Off Duty", value: drivers.filter(d => d.status !== "Active").length.toString(), icon: "🏠", subText: "Resting / Other", trend: "-", variant: "warning" as const },
  ];

  const tableData = drivers.map(d => ({
    id: d.licenseNo.substring(0, 7).toUpperCase(),
    name: d.name,
    status: d.status || "Active",
    truck: d.assignedTruck ? d.assignedTruck.truckId : "Not Assigned",
    contact: d.phone,
    type: d.status === "Active" ? "success" : "warning",
    raw: d
  }));

  const columns = [
    { label: "License ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
    {
      label: "Full Name", key: "name", render: (val: string) => (
        <div className="flex items-center gap-2.5 text-nowrap">
          <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center font-semibold text-[10px] text-neutral-400">
            {val.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="font-semibold text-neutral-900">{val}</span>
        </div>
      )
    },
    {
      label: "Status",
      key: "status",
      render: (val: string, row: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStatusToggle(row.raw._id, val);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest transition-all hover:brightness-95 ${
            val === "Active"
            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
            : "bg-rose-50 text-rose-500 border border-rose-100"
          }`}
        >
          <span
            className={`w-1 h-1 rounded-full ${val === "Active" ? "bg-emerald-500" : "bg-rose-500"}`}
          />
          {val}
        </button>
      ),
    },
    { label: "Assigned Truck", key: "truck", render: (val: string) => <span className="font-semibold text-slate-700">{val}</span> },
    { label: "Contact", key: "contact", render: (val: string) => <span className="text-neutral-500">{val}</span> },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (val: any, row: any) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/drivers/${row.raw._id}`);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-primary transition-all shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDriver(row.raw);
              setModalOpen(true);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-primary transition-all shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteDriver(row.raw._id);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-rose-500 transition-all shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
              <span className="text-primary/80">Drivers Directory</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Manage Personnel</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Oversee driver performance, assignments and compliance.</p>
          </div>
          <button
            onClick={() => {
              setSelectedDriver(null);
              setModalOpen(true);
            }}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:brightness-110 transition-all w-fit flex items-center gap-2"
          >
            <div className="p-0.5 rounded-md bg-white/20">
              <Plus className="w-3 h-3" />
            </div>
            Add New Driver
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))}
        </div>

        <CommonTable
          title="Staff Directory"
          icon="👥"
          columns={columns}
          data={tableData}
          onRowClick={(row) => router.push(`/admin/drivers/${row.raw._id}`)}
          action={
            <div className="flex gap-2">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search drivers..."
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

      <CreateDriverModal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedDriver(null);
        }}
        onSubmit={handleSubmitDriver}
        initialData={selectedDriver}
      />
    </AdminLayout>
  );
}
