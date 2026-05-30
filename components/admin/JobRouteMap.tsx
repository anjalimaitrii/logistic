"use client";

import { useEffect, useRef, useState } from "react";
import { fetchLiveVehicles, getVehicleStatus, hasValidCoords, getDriverName } from "@/services/liveTrackingService";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const TILE_URL    = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

declare global { var L: any; }

let leafletPromise: Promise<void> | null = null;
function loadLeaflet(): Promise<void> {
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise<void>((resolve, reject) => {
    if (typeof window !== "undefined" && window.L) { resolve(); return; }
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet"; link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    if (document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const wait = () => (window.L ? resolve() : setTimeout(wait, 50));
      wait(); return;
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve();
    script.onerror = () => { leafletPromise = null; reject(); };
    document.head.appendChild(script);
  });
  return leafletPromise;
}

const STATUS_COLORS: Record<string, string> = {
  moving: "#10b981", stopped: "#f59e0b", parked: "#6b7280", inactive: "#ef4444",
};
const STATUS_LABELS: Record<string, string> = {
  moving: "Running", stopped: "Idle", parked: "Stopped", inactive: "No Signal",
};

function makeTruckIcon(L: any, status: string, angle: number) {
  const color = STATUS_COLORS[status] || "#6b7280";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
    <circle cx="21" cy="21" r="18" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="2"/>
    <circle cx="21" cy="21" r="18" fill="none" stroke="${color}" stroke-width="1" stroke-opacity="0.4"/>
    <g transform="rotate(${status === "moving" ? angle : 0}, 21, 21)">
      <polygon points="21,8 30,32 21,26 12,32" fill="${color}" stroke="white" stroke-width="1.5"/>
    </g>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [42, 42], iconAnchor: [21, 21], popupAnchor: [0, -26] });
}

interface Props {
  truckNumber: string;
}

export default function JobRouteMap({ truckNumber }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const [state, setState] = useState<"loading" | "no-gps" | "ready">("loading");
  const [vehicleInfo, setVehicleInfo] = useState<{
    status: string;
    rawStatus: string;
    speed: string;
    location: string;
    driver: string;
    ign: string;
    datetime: string;
  } | null>(null);

  useEffect(() => {
    if (!truckNumber) return;
    let destroyed = false;

    async function init() {
      try {
        await loadLeaflet();
        if (destroyed || !containerRef.current) return;

        const L = window.L;
        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

        const map = L.map(containerRef.current, {
          center: [-13, 28],
          zoom: 6,
          zoomControl: true,
          attributionControl: false,
        });
        L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);
        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 200);

        // Fetch all live vehicles, filter to this truck only
        const vehicles = await fetchLiveVehicles();
        if (destroyed) return;

        const vehicle = vehicles.find(v =>
          v.Vehicle_No === truckNumber || v.Vehicle_Name === truckNumber
        );

        if (!vehicle || !hasValidCoords(vehicle)) {
          setState("no-gps");
          return;
        }

        const lat    = parseFloat(vehicle.Latitude);
        const lng    = parseFloat(vehicle.Longitude);
        const vstatus = getVehicleStatus(vehicle);
        const angle  = parseFloat(vehicle.Angle) || 0;
        const speed  = vehicle.Speed || "0";
        const driver = getDriverName(vehicle);
        const color  = STATUS_COLORS[vstatus] || "#6b7280";
        const label  = STATUS_LABELS[vstatus] || vstatus;

        const icon = makeTruckIcon(L, vstatus, angle);

        L.marker([lat, lng], { icon })
          .bindPopup(`
            <div style="font-family:system-ui,sans-serif;min-width:190px">
              <div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f1f5f9">
                🚛 ${vehicle.Vehicle_No || vehicle.Vehicle_Name}
              </div>
              <div style="font-size:11px;margin-bottom:4px">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:5px"></span>
                <b style="color:${color}">${label}</b>
                ${parseFloat(speed) > 0 ? `<span style="color:#94a3b8;margin-left:6px">${speed} km/h</span>` : ""}
              </div>
              <div style="font-size:11px;color:#64748b;line-height:1.8">
                <div>👤 ${driver}</div>
                <div>🔑 IGN: <b>${vehicle.IGN}</b> &nbsp;|&nbsp; 🛰 GPS: <b>${vehicle.GPS}</b></div>
                ${vehicle.Odometer && vehicle.Odometer !== "--" ? `<div>📍 ODO: ${parseInt(vehicle.Odometer).toLocaleString()} m</div>` : ""}
                ${vehicle.Datetime && vehicle.Datetime !== "--" ? `<div style="font-size:10px;color:#94a3b8;margin-top:4px">🕐 ${vehicle.Datetime}</div>` : ""}
                ${vehicle.Location && vehicle.Location !== "--" ? `<div style="font-size:10px;color:#94a3b8">📌 ${vehicle.Location}</div>` : ""}
              </div>
            </div>
          `, { maxWidth: 240 })
          .addTo(map)
          .openPopup();

        map.setView([lat, lng], 14, { animate: false });

        setVehicleInfo({
          status: label,
          rawStatus: vstatus,
          speed: parseFloat(speed) > 0 ? `${speed} km/h` : "Stationary",
          location: vehicle.Location && vehicle.Location !== "--" ? vehicle.Location : "",
          driver: driver,
          ign: vehicle.IGN || "--",
          datetime: vehicle.Datetime && vehicle.Datetime !== "--" ? vehicle.Datetime : "",
        });
        setState("ready");

      } catch {
        if (!destroyed) setState("no-gps");
      }
    }

    init();

    return () => {
      destroyed = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      leafletPromise = null;
    };
  }, [truckNumber]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 rounded-xl z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fetching live data...</span>
          </div>
        </div>
      )}

      {/* No GPS banner */}
      {state === "no-gps" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 rounded-xl z-10">
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">📡</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No GPS signal for {truckNumber}</span>
          </div>
        </div>
      )}

      {/* Live badge — top left */}
      {state === "ready" && vehicleInfo && (
        <>
          <div className="absolute top-3 left-3 z-500 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              vehicleInfo.rawStatus === "moving"   ? "bg-emerald-500" :
              vehicleInfo.rawStatus === "stopped"  ? "bg-amber-500" :
              vehicleInfo.rawStatus === "parked"   ? "bg-slate-400" :
                                                     "bg-red-500"
            }`} />
            <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">Live · {truckNumber}</span>
          </div>

          {/* Status bar — bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-500 bg-white/95 backdrop-blur-md border-t border-slate-100 px-3 py-2 flex items-center gap-3 flex-wrap">
            {/* Status chip */}
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border flex items-center gap-1 ${
              vehicleInfo.rawStatus === "moving"   ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              vehicleInfo.rawStatus === "stopped"  ? "bg-amber-50 text-amber-600 border-amber-100" :
              vehicleInfo.rawStatus === "parked"   ? "bg-slate-50 text-slate-500 border-slate-200" :
                                                     "bg-red-50 text-red-500 border-red-100"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                vehicleInfo.rawStatus === "moving"  ? "bg-emerald-500" :
                vehicleInfo.rawStatus === "stopped" ? "bg-amber-500" :
                vehicleInfo.rawStatus === "parked"  ? "bg-slate-400" : "bg-red-500"
              }`} />
              {vehicleInfo.status}
            </span>

            <span className="text-[9px] font-semibold text-slate-500">🚀 {vehicleInfo.speed}</span>
            <span className="text-[9px] font-semibold text-slate-500">🔑 IGN: {vehicleInfo.ign}</span>
            {vehicleInfo.driver && vehicleInfo.driver !== "No Driver" && (
              <span className="text-[9px] font-semibold text-slate-500">👤 {vehicleInfo.driver}</span>
            )}
            {vehicleInfo.location && (
              <span className="text-[9px] text-slate-400 truncate max-w-45">📌 {vehicleInfo.location}</span>
            )}
            {vehicleInfo.datetime && (
              <span className="text-[9px] text-slate-300 ml-auto shrink-0">🕐 {vehicleInfo.datetime}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
