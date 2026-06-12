"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateTruckModal from "@/components/admin/CreateTruckModal";
import TruckComplianceDrawer from "@/components/admin/TruckComplianceDrawer";
import { ChevronRight, Eye, Settings, Plus, Package, X, Trash2, RefreshCw } from "lucide-react";
import { truckService } from "@/services/truckService";
import { fetchLiveVehicles } from "@/services/liveTrackingService";
import { driverService } from "@/services/driverService";

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
  const [driverMap, setDriverMap] = useState<Record<string, string>>({}); // truckNumber → driverName
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Collection modal state
  const [collectionTruck, setCollectionTruck] = useState<any | null>(null);
  const [colForm, setColForm] = useState({ name: "", description: "", quantity: "1" });
  const [colSaving, setColSaving] = useState(false);

  useEffect(() => {
    loadTrucks();
    loadDriverMap();
  }, []);

  const loadDriverMap = async () => {
    try {
      const drivers = await driverService.getAll();
      const map: Record<string, string> = {};
      (drivers || []).forEach((d: any) => {
        const truckId = d.assignedTruck?.truckId;
        if (truckId && d.name) {
          map[truckId] = d.name;
        }
      });
      setDriverMap(map);
    } catch { }
  };

  const handleAddCollection = async () => {
    if (!collectionTruck || !colForm.name.trim()) return;
    setColSaving(true);
    try {
      const updated = await truckService.addCollection(collectionTruck._id, {
        name: colForm.name.trim(),
        description: colForm.description.trim(),
        quantity: Number(colForm.quantity) || 1,
      });
      setTrucks(prev => prev.map(t => t._id === updated._id ? updated : t));
      setCollectionTruck(updated);
      setColForm({ name: "", description: "", quantity: "1" });
    } catch { alert("Failed to add collection item."); }
    finally { setColSaving(false); }
  };

  const handleRenewCollection = async (colId: string) => {
    if (!collectionTruck) return;
    try {
      const updated = await truckService.renewCollection(collectionTruck._id, colId);
      setCollectionTruck(updated);
      setTrucks(prev => prev.map(t => t._id === updated._id ? updated : t));
    } catch { alert("Failed to renew item."); }
  };

  const handleRemoveCollection = async (colId: string) => {
    if (!collectionTruck) return;
    try {
      const updated = await truckService.removeCollection(collectionTruck._id, colId);
      setTrucks(prev => prev.map(t => t._id === updated._id ? updated : t));
      setCollectionTruck(updated);
    } catch { alert("Failed to remove item."); }
  };

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
    driver: driverMap[t.truckId] || null,
    raw: t
  }));

  const columns = [
    { label: "Truck ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
    { label: "Type", key: "truckType", render: (val: any) => <span className="font-medium text-slate-500">{val}</span> },
    {
      label: "Driver",
      key: "driver",
      render: (val: string | null) => val
        ? <span className="text-[11px] font-semibold text-slate-700">{val}</span>
        : <span className="text-[10px] text-slate-300 italic">Unassigned</span>
    },
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
      label: "Collection",
      key: "collection",
      align: "center" as const,
      render: (_: any, row: any) => {
        const count = row.raw.collections?.length || 0;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setCollectionTruck(row.raw); setColForm({ name: "", description: "", quantity: "1" }); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 hover:bg-orange-100 transition-all text-[10px] font-bold uppercase tracking-widest"
          >
            <Package className="w-3 h-3" />
            {count > 0 ? count : "+"}
          </button>
        );
      },
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
          {/* <button
            onClick={() => setModalOpen(true)}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:brightness-110 transition-all w-fit flex items-center gap-2"
          >
            <div className="p-0.5 rounded-md bg-white/20">
              <Plus className="w-3 h-3" />
            </div>
            Add New Truck
          </button> */}
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

      {/* Collection Modal */}
      {collectionTruck && (
        <div className="fixed inset-0 z-600 pointer-events-none">
          <div
            className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm pointer-events-auto"
            onClick={() => setCollectionTruck(null)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-110 bg-white shadow-2xl pointer-events-auto flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-neutral-900">Collections</h2>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{collectionTruck.truckId} · {collectionTruck.vehicleModel}</p>
              </div>
              <button onClick={() => setCollectionTruck(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Add form */}
              <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 space-y-3">
                <h3 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Add Item</h3>
                <input
                  type="text"
                  placeholder="Name *"
                  value={colForm.name}
                  onChange={e => setColForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white border border-neutral-100 rounded-xl px-3 py-2.5 text-[12px] font-medium text-slate-900 outline-none focus:border-orange-200 transition-all"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={colForm.description}
                  onChange={e => setColForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-white border border-neutral-100 rounded-xl px-3 py-2.5 text-[12px] font-medium text-slate-900 outline-none focus:border-orange-200 transition-all"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  min={1}
                  value={colForm.quantity}
                  onChange={e => setColForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full bg-white border border-neutral-100 rounded-xl px-3 py-2.5 text-[12px] font-medium text-slate-900 outline-none focus:border-orange-200 transition-all"
                />
                <button
                  onClick={handleAddCollection}
                  disabled={colSaving || !colForm.name.trim()}
                  className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
                >
                  {colSaving ? "Saving…" : "+ Add to Collection"}
                </button>
              </div>

              {/* Existing items */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Items ({collectionTruck.collections?.length || 0})
                </h3>
                {(!collectionTruck.collections || collectionTruck.collections.length === 0) && (
                  <p className="text-[11px] text-neutral-300 font-medium text-center py-6">No items yet</p>
                )}
                {collectionTruck.collections?.map((col: any) => (
                  <div key={col._id} className="flex items-start justify-between gap-3 p-3 bg-white border border-neutral-100 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-slate-900">{col.name}</div>
                      {col.description && <div className="text-[11px] text-neutral-400 mt-0.5">{col.description}</div>}
                      <div className="text-[10px] font-bold text-orange-500 mt-1 uppercase tracking-widest">Qty: {col.quantity}</div>
                      {col.renewedAt && (
                        <div className="text-[10px] text-emerald-500 font-medium mt-0.5">
                          Renewed: {new Date(col.renewedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleRenewCollection(col._id)}
                        title="Renew"
                        className="p-1.5 text-neutral-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveCollection(col._id)}
                        title="Remove"
                        className="p-1.5 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
