"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateDriverModal from "@/components/admin/CreateDriverModal";
import { ChevronRight, Eye, Phone, Plus, Edit2 } from "lucide-react";
import { driverService } from "@/services/driverService";
import { truckService } from "@/services/truckService";
import { fetchLiveVehicles, getDriverName, cleanDriverName } from "@/services/liveTrackingService";

export default function AdminDrivers() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setIsLoading(true);

    // Step 1: show DB drivers immediately
    let db: any[] = [];
    try {
      db = await driverService.getAll() || [];
      setDrivers(db);
    } catch {
      // DB unavailable — still proceed to GPS
    } finally {
      setIsLoading(false);
    }

    // Step 2: fetch GPS data, ensure trucks exist in DB, then save drivers with assignment
    try {
      const dbNames = new Set(db.map((d: any) => d.name?.toLowerCase()));
      const gpsData = await fetchLiveVehicles();

      // Ensure trucks are saved first so we can look up their _id
      let allTrucks = await truckService.getAll() || [];
      const truckDbIds = new Set(allTrucks.map((t: any) => t.truckId));
      const newTrucks = gpsData.filter((v) => {
        const id = v.Vehicle_No || v.Vehicle_Name;
        return id && !truckDbIds.has(id);
      });
      if (newTrucks.length > 0) {
        await Promise.allSettled(
          newTrucks.map((v) => {
            const truckId = v.Vehicle_No || v.Vehicle_Name;
            return truckService.create({
              truckId,
              vehicleModel: v.Vehicletype || v.DeviceModel || "--",
              truckType: v.Vehicletype || "--",
              status: v.Status === "RUNNING" ? "Active" : v.Status === "IDLE" ? "Idle" : "Maint.",
              odometer: v.Odometer || "0",
            });
          })
        );
        allTrucks = await truckService.getAll() || [];
      }

      // Build truckId → MongoDB _id map
      const truckMap = new Map<string, string>(
        allTrucks.map((t: any) => [t.truckId, t._id])
      );

      // Find new drivers
      const seen = new Set<string>();
      const newDrivers = gpsData
        .map((v) => ({
          name: getDriverName(v),
          imei: v.Imeino,
          vehicleNo: v.Vehicle_No || v.Vehicle_Name,
        }))
        .filter(({ name, imei }) => {
          if (name === "No Driver" || seen.has(imei)) return false;
          seen.add(imei);
          return !dbNames.has(name.toLowerCase());
        });

      if (newDrivers.length > 0) {
        await Promise.allSettled(
          newDrivers.map(({ name, imei, vehicleNo }) => {
            const assignedTruck = truckMap.get(vehicleNo);
            return driverService.create({
              name,
              phone: "--",
              licenseType: "NA",
              licenseNo: imei,
              experience: 0,
              status: "Active",
              ...(assignedTruck ? { assignedTruck } : {}),
            });
          })
        );
        const fresh = await driverService.getAll();
        setDrivers(fresh || []);
      }
    } catch {
      // GPS unavailable — DB drivers already shown, silently skip
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

  const q = searchQuery.trim().toLowerCase();
  const filteredDrivers = q
    ? drivers.filter(d => {
        const name    = cleanDriverName(d.name || "").toLowerCase();
        const license = (d.licenseNo || "").toLowerCase();
        const truck   = (d.assignedTruck?.truckId || "").toLowerCase();
        const contact = (d.phone || "").toLowerCase();
        return name.includes(q) || license.includes(q) || truck.includes(q) || contact.includes(q);
      })
    : drivers;

  const tableData = filteredDrivers.map(d => ({
    id: (d.licenseNo || "").substring(0, 7).toUpperCase(),
    name: cleanDriverName(d.name),
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
          {/* <button
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
          </button> */}
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
                  placeholder="Search name, license, truck, contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-neutral-100 rounded-xl px-4 py-2 text-[11px] font-medium outline-none focus:border-primary/20 transition-all w-56 shadow-sm"
                />
                
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
