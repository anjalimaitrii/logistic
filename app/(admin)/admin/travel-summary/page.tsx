"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { ChevronRight, Search, Play, Loader2, MapPin, Clock, Gauge, Route } from "lucide-react";
import { fetchLiveVehicles, LiveVehicle } from "@/services/liveTrackingService";
import { fetchTravelSummary, TravelSummaryRecord } from "@/services/travelSummaryService";

function formatDuration(val: string | number | undefined): string {
  if (!val || val === "--") return "--";
  return String(val);
}

function formatKm(val: string | number | undefined): string {
  if (!val && val !== 0) return "--";
  const n = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(n)) return String(val);
  return `${n.toFixed(1)} km`;
}

function formatSpeed(val: string | number | undefined): string {
  if (!val && val !== 0) return "--";
  const n = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(n)) return String(val);
  return `${n} km/h`;
}

// Default: yesterday 00:00 → today 00:00
function defaultRange() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T00:00`;
  return { start: fmt(yesterday), end: fmt(today) };
}

// Convert datetime-local value to API format: "DD-MM-YYYY HH:MM:SS"
function toApiDateTime(val: string): string {
  const d = new Date(val);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

export default function TravelSummaryPage() {
  const range = defaultRange();
  const [startDT, setStartDT] = useState(range.start);
  const [endDT, setEndDT] = useState(range.end);

  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [selectedImeis, setSelectedImeis] = useState<Set<string>>(new Set());
  const [vehicleSearch, setVehicleSearch] = useState("");

  const [results, setResults] = useState<TravelSummaryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  // Load live vehicles to get IMEI list
  useEffect(() => {
    fetchLiveVehicles()
      .then((data) => {
        // Only vehicles that have an IMEI
        setVehicles(data.filter((v) => v.Imeino && v.Imeino !== "--"));
      })
      .catch(() => setVehicles([]))
      .finally(() => setVehiclesLoading(false));
  }, []);

  const toggleVehicle = useCallback((imei: string) => {
    setSelectedImeis((prev) => {
      const next = new Set(prev);
      next.has(imei) ? next.delete(imei) : next.add(imei);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const filtered = vehicles.filter(
      (v) =>
        !vehicleSearch ||
        v.Vehicle_Name?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.Vehicle_No?.toLowerCase().includes(vehicleSearch.toLowerCase())
    );
    const allSelected = filtered.every((v) => selectedImeis.has(v.Imeino));
    setSelectedImeis((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filtered.forEach((v) => next.delete(v.Imeino));
      } else {
        filtered.forEach((v) => next.add(v.Imeino));
      }
      return next;
    });
  }, [vehicles, vehicleSearch, selectedImeis]);

  const handleGenerate = async () => {
    if (selectedImeis.size === 0) {
      setError("Select at least one vehicle.");
      return;
    }
    setLoading(true);
    setError(null);
    setFetched(false);
    try {
      const imei_nos = Array.from(selectedImeis).join(",");
      const data = await fetchTravelSummary(
        toApiDateTime(startDT),
        toApiDateTime(endDT),
        imei_nos
      );
      setResults(data);
      setFetched(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      !vehicleSearch ||
      v.Vehicle_Name?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.Vehicle_No?.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const allFilteredSelected =
    filteredVehicles.length > 0 &&
    filteredVehicles.every((v) => selectedImeis.has(v.Imeino));

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 pb-20 space-y-6 max-w-[1400px] mx-auto">

        {/* Header */}
        <div>
          <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mb-1 font-medium uppercase tracking-widest">
            <span>Operations</span>
            <ChevronRight className="w-2.5 h-2.5" />
            <span className="text-primary">Travel Summary</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Travel Summary Report</h1>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Distance, duration, speed, and route data for each vehicle over a selected period.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Report Parameters
          </h2>

          {/* Date range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Start Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={startDT}
                onChange={(e) => setStartDT(e.target.value)}
                className="w-full text-[12px] bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary/40 transition-all text-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                End Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={endDT}
                onChange={(e) => setEndDT(e.target.value)}
                className="w-full text-[12px] bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary/40 transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Vehicle selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Select Vehicles
              </label>
              <span className="text-[10px] text-neutral-400">
                {selectedImeis.size} / {vehicles.length} selected
              </span>
            </div>

            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              {/* Search + select all */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100 bg-neutral-50">
                <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search vehicle..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="flex-1 text-[11px] bg-transparent outline-none text-slate-700 placeholder:text-neutral-400"
                />
                <button
                  onClick={toggleAll}
                  className="text-[9px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors shrink-0"
                >
                  {allFilteredSelected ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Vehicle list */}
              <div className="max-h-52 overflow-y-auto divide-y divide-neutral-50">
                {vehiclesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-neutral-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[11px]">Loading vehicles...</span>
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  <p className="text-center py-6 text-[11px] text-neutral-400">No vehicles found</p>
                ) : (
                  filteredVehicles.map((v) => {
                    const checked = selectedImeis.has(v.Imeino);
                    return (
                      <label
                        key={v.Imeino}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                          checked ? "bg-primary/5" : "hover:bg-neutral-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleVehicle(v.Imeino)}
                          className="accent-primary w-3.5 h-3.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-slate-800 truncate">
                            {v.Vehicle_Name || v.Vehicle_No}
                          </div>
                          <div className="text-[9px] text-neutral-400 font-mono truncate">
                            IMEI: {v.Imeino}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-[11px] text-red-500 font-medium">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Generate Report
          </button>
        </div>

        {/* Results */}
        {fetched && (
          <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-bold text-slate-900">Results</h2>
                <p className="text-[10px] text-neutral-400 mt-0.5">{results.length} vehicle{results.length !== 1 ? "s" : ""} found</p>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Route className="w-10 h-10 text-neutral-200" />
                <p className="text-[12px] text-neutral-400 font-medium">No travel data found for the selected period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-100">
                      {[
                        "Vehicle",
                        "Driver",
                        "Distance",
                        "Running Time",
                        "Stop Time",
                        "Max Speed",
                        "Start Location",
                        "End Location",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-neutral-400 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {results.map((row, i) => (
                      <tr key={i} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-[12px] font-semibold text-slate-900">
                            {row.vehicle_name || row.vehicle_no || "--"}
                          </div>
                          {row.imei_no && (
                            <div className="text-[9px] text-neutral-400 font-mono">{row.imei_no}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-700">
                          {row.driver_name || "--"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Route className="w-3 h-3 text-primary shrink-0" />
                            <span className="text-[12px] font-semibold text-slate-900">
                              {formatKm(row.running_km)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="text-[11px] text-slate-700">
                              {formatDuration(row.running_duration)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="text-[11px] text-slate-700">
                              {formatDuration(row.stop_duration)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Gauge className="w-3 h-3 text-red-400 shrink-0" />
                            <span className="text-[11px] text-slate-700">
                              {formatSpeed(row.max_speed)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-[10px] text-slate-600 leading-relaxed line-clamp-2">
                              {row.start_location || "--"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                            <span className="text-[10px] text-slate-600 leading-relaxed line-clamp-2">
                              {row.end_location || "--"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
