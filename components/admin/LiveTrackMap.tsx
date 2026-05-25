"use client";

import { useEffect, useRef, useState } from "react";
import {
  LiveVehicle,
  VehicleStatusType,
  getVehicleStatus,
  getDriverName,
  hasValidCoords,
} from "@/services/liveTrackingService";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// CartoDB Voyager — English labels everywhere in the world
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

declare global {
  // eslint-disable-next-line no-var
  var L: any;
}

let loadPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<void>((resolve, reject) => {
    if (typeof window !== "undefined" && window.L) { resolve(); return; }

    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    if (document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const wait = () => (window.L ? resolve() : setTimeout(wait, 50));
      wait();
      return;
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve();
    script.onerror = () => { loadPromise = null; reject(new Error("Failed to load Leaflet")); };
    document.head.appendChild(script);
  });
  return loadPromise;
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="15" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="1.5"/>
    <g transform="rotate(${isMoving ? angle : 0}, 18, 18)">
      <polygon points="18,7 26,27 18,23 10,27" fill="${color}" stroke="white" stroke-width="1.2"/>
    </g>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22] });
}

function buildPopup(v: LiveVehicle): string {
  const speed  = parseFloat(v.Speed) || 0;
  const driver = getDriverName(v);
  const status = getVehicleStatus(v);
  const label: Record<VehicleStatusType, string> = {
    moving: "Running", stopped: "Idle", parked: "Stopped", inactive: "No Signal",
  };
  const c = STATUS_COLORS[status];
  return `
    <div style="font-family:system-ui,sans-serif;min-width:200px;max-width:240px">
      <div style="font-weight:700;font-size:14px;color:#0f172a;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f1f5f9">
        ${v.Vehicle_Name || v.Vehicle_No || "Unknown"}
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};flex-shrink:0"></span>
        <span style="font-size:11px;font-weight:600;color:${c}">${label[status]}</span>
        ${speed > 0 ? `<span style="font-size:11px;color:#94a3b8;margin-left:auto">${speed} km/h</span>` : ""}
      </div>
      <div style="font-size:11px;color:#64748b;line-height:1.9">
        <div>🏢 ${v.Company || "--"}</div>
        <div>👤 ${driver}</div>
        <div>🔑 IGN: <b>${v.IGN}</b> &nbsp;|&nbsp; 🛰 GPS: <b>${v.GPS}</b></div>
        ${v.Odometer && v.Odometer !== "--" ? `<div>📍 ODO: ${parseInt(v.Odometer).toLocaleString()} m</div>` : ""}
        ${v.ExternalVolt && v.ExternalVolt !== "--" ? `<div>🔋 ${v.ExternalVolt}V</div>` : ""}
        ${v.Datetime && v.Datetime !== "--" ? `<div style="margin-top:4px;font-size:10px;color:#94a3b8">🕐 ${v.Datetime}</div>` : ""}
        ${v.Location && v.Location !== "--" ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px">📌 ${v.Location}</div>` : ""}
      </div>
    </div>`;
}

interface LiveTrackMapProps {
  vehicles: LiveVehicle[];
  selectedVehicle: string | null;
  onSelectVehicle: (name: string) => void;
}

export default function LiveTrackMap({ vehicles, selectedVehicle, onSelectVehicle }: LiveTrackMapProps) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<any>(null);
  const markersRef      = useRef<Record<string, any>>({});
  const fittedRef       = useRef(false);
  // Stable callback ref — so changing onSelectVehicle never re-runs marker effect
  const onSelectRef     = useRef(onSelectVehicle);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => { onSelectRef.current = onSelectVehicle; }, [onSelectVehicle]);

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    let destroyed = false;

    loadLeaflet().then(() => {
      if (destroyed || !containerRef.current || mapRef.current) return;

      const L   = window.L;
      const map = L.map(containerRef.current, {
        center: [-13, 28],
        zoom: 6,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer(TILE_URL, { maxZoom: 19 }).addTo(map);

      mapRef.current = map;

      // Force Leaflet to recalculate container size (fixes sidebar-animation glitch)
      setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 300);

      // Also recalculate on every window resize (sidebar expand/collapse)
      const onResize = () => { if (mapRef.current) mapRef.current.invalidateSize(); };
      window.addEventListener("resize", onResize);
      (map as any)._resizeCleanup = () => window.removeEventListener("resize", onResize);

      setMapReady(true);
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        if ((mapRef.current as any)._resizeCleanup) (mapRef.current as any)._resizeCleanup();
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = {};
      fittedRef.current  = false;
      loadPromise = null; // allow re-init on remount
      setMapReady(false);
    };
  }, []);

  // ── Place / update markers when map ready OR vehicles change ───────────────
  // NOTE: selectedVehicle intentionally NOT in deps — selection is handled separately
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const L   = window.L;
    const map = mapRef.current;

    const validVehicles = vehicles.filter(hasValidCoords);
    const currentNames  = new Set(validVehicles.map((v) => v.Vehicle_Name));

    // Remove markers whose vehicle is no longer in the list
    Object.keys(markersRef.current).forEach((name) => {
      if (!currentNames.has(name)) {
        markersRef.current[name].remove();
        delete markersRef.current[name];
      }
    });

    // Add new markers or update existing ones in place
    validVehicles.forEach((v) => {
      const lat    = parseFloat(v.Latitude);
      const lng    = parseFloat(v.Longitude);
      const angle  = parseFloat(v.Angle) || 0;
      const status = getVehicleStatus(v);
      const icon   = makeTruckIcon(L, status, angle);
      const popup  = buildPopup(v);

      if (markersRef.current[v.Vehicle_Name]) {
        // Update position + icon + popup without removing/re-adding the marker
        markersRef.current[v.Vehicle_Name].setLatLng([lat, lng]);
        markersRef.current[v.Vehicle_Name].setIcon(icon);
        markersRef.current[v.Vehicle_Name].setPopupContent(popup);
      } else {
        const marker = L.marker([lat, lng], { icon })
          .bindPopup(popup, { maxWidth: 260 })
          .addTo(map);
        marker.on("click", () => onSelectRef.current(v.Vehicle_Name));
        markersRef.current[v.Vehicle_Name] = marker;
      }
    });

    // Auto-fit to all vehicles only on the very first load
    if (validVehicles.length > 0 && !fittedRef.current) {
      const bounds = L.latLngBounds(
        validVehicles.map((v) => [parseFloat(v.Latitude), parseFloat(v.Longitude)])
      );
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
      fittedRef.current = true;
    }
  }, [mapReady, vehicles]); // ← selectedVehicle removed — no more unnecessary re-runs

  // ── Pan + open popup when user selects a vehicle from the list ────────────
  useEffect(() => {
    if (!mapRef.current || !selectedVehicle) return;
    const marker = markersRef.current[selectedVehicle];
    if (marker) {
      mapRef.current.setView(marker.getLatLng(), 15, { animate: true });
      marker.openPopup();
    }
  }, [selectedVehicle]);

  return (
    // position:absolute fills the parent's relative container perfectly
    // regardless of flex or percentage-height quirks
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
