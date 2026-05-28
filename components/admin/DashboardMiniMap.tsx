"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchLiveVehicles,
  LiveVehicle,
  VehicleStatusType,
  getVehicleStatus,
  hasValidCoords,
} from "@/services/liveTrackingService";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const TILE_URL    = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

declare global { var L: any; }

let miniLoadPromise: Promise<void> | null = null;
function loadLeaflet(): Promise<void> {
  if (miniLoadPromise) return miniLoadPromise;
  miniLoadPromise = new Promise<void>((resolve, reject) => {
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
    script.onerror = () => { miniLoadPromise = null; reject(new Error("Leaflet load failed")); };
    document.head.appendChild(script);
  });
  return miniLoadPromise;
}

const STATUS_COLORS: Record<VehicleStatusType, string> = {
  moving:   "#10b981",
  stopped:  "#f59e0b",
  parked:   "#6b7280",
  inactive: "#ef4444",
};

function makeTruckIcon(L: any, status: VehicleStatusType, angle: number) {
  const color    = STATUS_COLORS[status];
  const isMoving = status === "moving";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
    <circle cx="15" cy="15" r="12" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="1.5"/>
    <g transform="rotate(${isMoving ? angle : 0}, 15, 15)">
      <polygon points="15,5 22,23 15,19 8,23" fill="${color}" stroke="white" stroke-width="1.2"/>
    </g>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [30, 30], iconAnchor: [15, 15] });
}

export default function DashboardMiniMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const [vehicles, setVehicles]   = useState<LiveVehicle[]>([]);
  const [loading, setLoading]     = useState(true);
  const [mapReady, setMapReady]   = useState(false);

  // Fetch vehicles once
  useEffect(() => {
    fetchLiveVehicles()
      .then((data) => { if (data.length > 0) setVehicles(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Init Leaflet map (non-interactive widget)
  useEffect(() => {
    let destroyed = false;
    loadLeaflet().then(() => {
      if (destroyed || !containerRef.current || mapRef.current) return;
      const L   = window.L;
      const map = L.map(containerRef.current, {
        center: [-13, 28],
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
      });
      L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 300);
      setMapReady(true);
    });
    return () => {
      destroyed = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      miniLoadPromise = null;
      setMapReady(false);
    };
  }, []);

  // Place markers; clicking any marker goes to live track page
  useEffect(() => {
    if (!mapReady || !mapRef.current || vehicles.length === 0) return;
    const L     = window.L;
    const map   = mapRef.current;
    const valid = vehicles.filter(hasValidCoords);

    valid.forEach((v) => {
      const lat    = parseFloat(v.Latitude);
      const lng    = parseFloat(v.Longitude);
      const status = getVehicleStatus(v);
      const icon   = makeTruckIcon(L, status, parseFloat(v.Angle) || 0);
      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.on("click", () => { window.location.href = "/admin/livetrack"; });
    });

    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map((v) => [parseFloat(v.Latitude), parseFloat(v.Longitude)]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 });
    }
  }, [mapReady, vehicles]);

  const counts = {
    moving:   vehicles.filter((v) => getVehicleStatus(v) === "moving").length,
    stopped:  vehicles.filter((v) => getVehicleStatus(v) === "stopped").length,
    parked:   vehicles.filter((v) => getVehicleStatus(v) === "parked").length,
    inactive: vehicles.filter((v) => getVehicleStatus(v) === "inactive").length,
  };

  return (
    <div className="h-70 relative overflow-hidden bg-neutral-50">
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-500 bg-neutral-50">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">
              Loading map...
            </p>
          </div>
        </div>
      )}

      {/* Leaflet container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Status legend */}
      {!loading && vehicles.length > 0 && (
        <div className="absolute top-3 left-3 bg-white/90 border border-neutral-100 rounded-xl p-3 backdrop-blur-md shadow-lg space-y-1.5 z-400">
          <div className="text-[9px] text-emerald-600 font-medium uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {counts.moving} Running
          </div>
          <div className="text-[9px] text-amber-500 font-medium uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {counts.stopped} Idle
          </div>
          <div className="text-[9px] text-gray-500 font-medium uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {counts.parked} Stopped
          </div>
          <div className="text-[9px] text-red-500 font-medium uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            {counts.inactive} No Signal
          </div>
        </div>
      )}

      {/* "View Full Map" button */}
      <a
        href="/admin/livetrack"
        className="absolute bottom-3 right-3 z-400 bg-white/90 border border-neutral-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:bg-white transition-all shadow-sm flex items-center gap-1.5 backdrop-blur-md"
      >
        View Full Map →
      </a>
    </div>
  );
}
