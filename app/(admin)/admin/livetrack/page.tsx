"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import AdminLayout from "@/components/admin/AdminLayout";
import { ChevronRight, RefreshCw, MapPin, Wifi, WifiOff } from "lucide-react";
import {
  fetchLiveVehicles,
  LiveVehicle,
  getVehicleStatus,
  getDriverName,
  VehicleStatusType,
} from "@/services/liveTrackingService";
import { formatTime } from "@/lib/datetime";

// Leaflet must be loaded client-side only
const LiveTrackMap = dynamic(() => import("@/components/admin/LiveTrackMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-neutral-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Loading map...
        </p>
      </div>
    </div>
  ),
});

const STATUS_CONFIG: Record<
  VehicleStatusType,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  moving:   { label: "Running",   dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-100" },
  stopped:  { label: "Idle",      dot: "bg-amber-500",   text: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-100"   },
  parked:   { label: "Stopped",   dot: "bg-gray-400",    text: "text-gray-500",    bg: "bg-gray-50",     border: "border-gray-100"    },
  inactive: { label: "No Signal", dot: "bg-red-400",     text: "text-red-500",     bg: "bg-red-50",      border: "border-red-100"     },
};

const REFRESH_INTERVAL = 30_000; // 30 seconds

export default function LiveTrackPage() {
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<VehicleStatusType | "all">("all");

  const loadVehicles = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setError(null);
      const data = await fetchLiveVehicles();
      // Only update if we got actual data — never wipe existing vehicles with an empty response
      if (data.length > 0) setVehicles(data);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + auto-refresh
  useEffect(() => {
    loadVehicles();
    const timer = setInterval(() => loadVehicles(), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [loadVehicles]);

  const statusCounts = {
    all:      vehicles.length,
    moving:   vehicles.filter((v) => getVehicleStatus(v) === "moving").length,
    stopped:  vehicles.filter((v) => getVehicleStatus(v) === "stopped").length,
    parked:   vehicles.filter((v) => getVehicleStatus(v) === "parked").length,
    inactive: vehicles.filter((v) => getVehicleStatus(v) === "inactive").length,
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchSearch =
      !search ||
      v.Vehicle_Name?.toLowerCase().includes(search.toLowerCase()) ||
      v.Vehicle_No?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" || getVehicleStatus(v) === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col bg-neutral-50" style={{ height: "calc(100vh - 64px)" }}>

        {/* ── HEADER ── */}
        <div className="px-6 py-4 bg-white border-b border-neutral-100 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1">
                <span>Operations</span>
                <ChevronRight className="w-2.5 h-2.5" />
                <span className="text-primary/80">Live Tracking</span>
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                Fleet Live Track
              </h1>
              {lastUpdated && (
                <p className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  Updated {formatTime(lastUpdated, { second: "2-digit" })} · Auto-refresh every 30s
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status pills */}
              {(["moving", "stopped", "parked", "inactive"] as VehicleStatusType[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                    filterStatus === s
                      ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].border} border`
                      : "bg-white border-neutral-100 hover:border-neutral-200"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                  <span className={`text-[10px] font-bold ${STATUS_CONFIG[s].text}`}>
                    {statusCounts[s]} {STATUS_CONFIG[s].label}
                  </span>
                </button>
              ))}

              <button
                onClick={() => loadVehicles(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex flex-1 min-h-0">

          {/* Vehicle list panel */}
          <div className="w-72 shrink-0 bg-white border-r border-neutral-100 flex flex-col overflow-hidden">
            {/* Panel header + search */}
            <div className="px-3 py-3 border-b border-neutral-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  Vehicles
                </span>
                <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full">
                  {filteredVehicles.length} / {vehicles.length}
                </span>
              </div>
              <input
                type="text"
                placeholder="Search vehicle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-[11px] bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-1.5 outline-none focus:border-primary/30 transition-all"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] text-neutral-400 font-medium">
                    Loading vehicles...
                  </p>
                </div>
              ) : error ? (
                <div className="p-4 text-center space-y-2">
                  <WifiOff className="w-8 h-8 text-red-300 mx-auto" />
                  <p className="text-[11px] text-red-500 font-medium">{error}</p>
                  <button
                    onClick={() => loadVehicles(true)}
                    className="text-[10px] text-primary font-bold underline"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="p-6 text-center">
                  <MapPin className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                  <p className="text-[11px] text-neutral-400">No vehicles found</p>
                </div>
              ) : (
                filteredVehicles.map((v) => {
                  const status = getVehicleStatus(v);
                  const cfg = STATUS_CONFIG[status];
                  const isSelected = selectedVehicle === v.Vehicle_Name;
                  const speed = parseFloat(v.Speed) || 0;
                  const driver = getDriverName(v);

                  return (
                    <button
                      key={v.Vehicle_Name}
                      onClick={() =>
                        setSelectedVehicle(
                          isSelected ? null : v.Vehicle_Name
                        )
                      }
                      className={`w-full text-left px-4 py-3 border-b border-neutral-50 transition-all hover:bg-neutral-50 ${
                        isSelected
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : "border-l-2 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot} ${
                            status === "moving" ? "animate-pulse" : ""
                          }`}
                        />
                        <span className="text-[12px] font-semibold text-slate-800 truncate flex-1">
                          {v.Vehicle_Name || v.Vehicle_No}
                        </span>
                      </div>

                      <div className="ml-4 flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        {status === "moving" && (
                          <span className="text-[9px] text-slate-400">
                            {speed} km/h
                          </span>
                        )}
                      </div>

                      {driver !== "No Driver" && (
                        <p className="text-[9px] text-neutral-400 ml-4 mt-0.5 truncate">
                          👤 {driver}
                        </p>
                      )}

                      {v.Datetime && v.Datetime !== "--" && (
                        <p className="text-[9px] text-neutral-300 ml-4 mt-0.5 truncate">
                          {v.Datetime}
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Map area */}
          <div className="flex-1 relative min-w-0">
            <LiveTrackMap
              vehicles={vehicles}
              selectedVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
            />

            {/* Vehicle count overlay */}
            {!loading && !error && vehicles.length > 0 && (
              <div className="absolute top-3 right-3 z-400 bg-white rounded-xl shadow-lg border border-neutral-100 px-3 py-2 flex items-center gap-3">
                {(["moving", "stopped", "parked", "inactive"] as VehicleStatusType[]).map((s) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                    <span className="text-[10px] font-bold text-slate-600">
                      {statusCounts[s]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
