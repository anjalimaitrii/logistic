"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateTruckModal from "@/components/admin/CreateTruckModal";
import TruckComplianceDrawer from "@/components/admin/TruckComplianceDrawer";
import { ChevronRight, Eye, Settings, Plus, Package } from "lucide-react";
import { truckService } from "@/services/truckService";
import { fetchLiveVehicles } from "@/services/liveTrackingService";

function gpsStatusToTruck(s: string) {
  if (s === "RUNNING") return "Active";
  if (s === "IDLE")    return "Idle";
  if (s === "STOP")    return "Stopped";
  return "Inactive";
}

export default function AdminTrucks() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [gpsStatusMap, setGpsStatusMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadTrucks();
  }, []);

  const loadTrucks = async () => {
    setIsLoading(true);

    // Step 1: show DB trucks immediately
    let db: any[] = [];
    try {
      db = await truckService.getAll() || [];
      setTrucks(db);
    } catch {
      // DB unavailable — still proceed to GPS
    } finally {
      setIsLoading(false);
    }

    // Step 2: fetch GPS vehicles, save new ones to DB
    try {
      const dbIds = new Set(db.map((t: any) => t.truckId));
      const gpsData = await fetchLiveVehicles();

      // Build live status map (truckId → Active/Idle)
      const statusMap: Record<string, string> = {};
      gpsData.forEach(v => {
        const id = v.Vehicle_No || v.Vehicle_Name;
        if (id) statusMap[id] = gpsStatusToTruck(v.Status);
      });
      setGpsStatusMap(statusMap);

      const newVehicles = gpsData.filter((v) => {
        const id = v.Vehicle_No || v.Vehicle_Name;
        return id && !dbIds.has(id);
      });

      // Fix any existing DB trucks still carrying the old "Maint." value
      const staleMaints = db.filter((t: any) => t.status === "Maint.");
      if (staleMaints.length > 0) {
        await Promise.allSettled(
          staleMaints.map((t: any) => {
            const gpsStatus = statusMap[t.truckId];
            const corrected = gpsStatus || "Stopped";
            return truckService.update(t._id, { status: corrected });
          })
        );
      }

      if (newVehicles.length > 0) {
        await Promise.allSettled(
          newVehicles.map((v) => {
            const truckId = v.Vehicle_No || v.Vehicle_Name;
            return truckService.create({
              truckId,
              vehicleModel: v.Vehicletype || v.DeviceModel || "--",
              truckType: v.Vehicletype || "--",
              status: gpsStatusToTruck(v.Status),
              odometer: v.Odometer || "0",
            });
          })
        );
      }

      if (staleMaints.length > 0 || newVehicles.length > 0) {
        const fresh = await truckService.getAll();
        setTrucks(fresh || []);
      }
    } catch {
      // GPS unavailable — DB trucks already shown, silently skip
    }
  };

  const handleCreateTruck = async (data: any) => {
    try {
      await truckService.create(data);
      loadTrucks();
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to create truck:", error);
      alert("Failed to add truck. Please try again.");
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await truckService.update(id, { status: newStatus });
      loadTrucks();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const getDisplayStatus = (t: any): string => {
    const gps = gpsStatusMap[t.truckId];
    if (gps) return gps;
    if (t.status === "Maint." || t.status === "Inactive") return "Stopped";
    return t.status || "Idle";
  };


  const kpis = [
    { label: "Total Fleet", value: trucks.length.toString(), icon: "🚛", subText: "Registered units", trend: "Live", variant: "primary" as const },
    { label: "Active", value: trucks.filter(t => getDisplayStatus(t) === "Active").length.toString(), icon: "🛣️", subText: "Currently on road", trend: "Sync", variant: "success" as const },
    { label: "Idle", value: trucks.filter(t => getDisplayStatus(t) === "Idle").length.toString(), icon: "🅿️", subText: "Engine on, stationary", trend: "Ready", variant: "warning" as const },
    { label: "Stopped", value: trucks.filter(t => getDisplayStatus(t) === "Stopped" || getDisplayStatus(t) === "Inactive").length.toString(), icon: "🔴", subText: "Stopped / Inactive", trend: "Review", variant: "danger" as const },
  ];

  const tableData = trucks.map(t => ({
    id: t.truckId,
    model: t.vehicleModel,
    status: getDisplayStatus(t),
    odo: t.odometer || "0 km",
    truckType: t.truckType,
    capacity: t.capacity,
    raw: t
  }));

  const columns = [
    { label: "Truck ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
    { label: "Model", key: "model", render: (val: string) => <span className="font-medium text-slate-700 text-nowrap">{val}</span> },
    { label: "Type", key: "truckType", render: (val: any) => <span className="font-medium text-slate-500">{val}</span> },
    { label: "Capacity", key: "capacity", render: (val: string) => <span className="font-medium text-slate-500">{val}</span> },
    {
      label: "Status",
      key: "status",
      render: (_val: string, row: any) => {
        const ds = getDisplayStatus(row.raw);
        const colorClass =
          ds === "Active"   ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
          ds === "Idle"     ? "bg-amber-50 text-amber-500 border-amber-100" :
          ds === "Stopped"  ? "bg-rose-50 text-rose-500 border-rose-100" :
                              "bg-slate-50 text-slate-400 border-slate-200";
        return (
          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
            {ds}
          </span>
        );
      }
    },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (val: any, row: any) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/trucks/${row.raw._id}`);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-primary transition-all shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTruck(row.raw._id);
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
          data={tableData}
          onRowClick={(row) => router.push(`/admin/trucks/${row.raw._id}`)}
          emptyState={
            isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Syncing fleet units...</p>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Package className="w-8 h-8 text-neutral-200" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">No trucks found in inventory</p>
              </div>
            )
          }
        />
      </div>

      <CreateTruckModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateTruck}
      />

      <TruckComplianceDrawer
        isOpen={isComplianceOpen}
        onClose={() => setIsComplianceOpen(false)}
        truckId={selectedTruck}
      />
    </AdminLayout>
  );
}
