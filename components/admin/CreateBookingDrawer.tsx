"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, MapPin, Package, Calendar, CheckCircle2,
  ArrowLeft, Users, Navigation, Loader2, Trash2, Plus, UserPlus, Phone, Clock,
} from "lucide-react";
import { clientService } from "@/services/clientService";
import { bookingService } from "@/services/bookingService";
import { goodsTypeService } from "@/services/goodsTypeService";
import { AFRICAN_COUNTRIES, AFRICAN_STATES, AFRICAN_CITIES, CITY_TO_STATE } from "@/lib/africaLocations";
import { todayAppDateKey } from "@/lib/datetime";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CreateBookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface LocationEntry {
  contactPerson: string;
  contactCode: string;
  contact: string;
  contactPerson2: string;
  contact2Code: string;
  contact2: string;
  plotNo: string;
  street: string;
  country: string;
  state: string;
  city: string;
}

const DIAL_CODES = [
  { code: "+260", label: "ZM +260", maxLen: 9 },
  { code: "+263", label: "ZW +263", maxLen: 9 },
  { code: "+243", label: "CD +243", maxLen: 9 },
  { code: "+265", label: "MW +265", maxLen: 9 },
  { code: "+255", label: "TZ +255", maxLen: 9 },
  { code: "+258", label: "MZ +258", maxLen: 9 },
  { code: "+267", label: "BW +267", maxLen: 8 },
  { code: "+264", label: "NA +264", maxLen: 9 },
  { code: "+27",  label: "ZA +27",  maxLen: 9 },
  { code: "+244", label: "AO +244", maxLen: 9 },
];

function matchList(raw: string, list: string[]): string {
  if (!raw) return "";
  const q = raw.toLowerCase();
  return list.find(l => l.toLowerCase() === q)
    || list.find(l => q.includes(l.toLowerCase()) || l.toLowerCase().includes(q))
    || "";
}
function matchCountry(raw: string): string {
  if (!raw) return "";
  const q = raw.toLowerCase();
  if (q.includes("congo") || q.includes("drc")) return "DRC (Congo)";
  return matchList(raw, AFRICAN_COUNTRIES);
}

const emptyLocation = (): LocationEntry => ({
  contactPerson: "", contactCode: "+260", contact: "",
  contactPerson2: "", contact2Code: "+260", contact2: "",
  plotNo: "", street: "", country: "", state: "", city: "",
});

// ─── LocationCard — defined OUTSIDE parent so React never remounts it ─────────
interface LocationCardProps {
  type: "pickup" | "dropoff";
  location: LocationEntry;
  idx: number;
  color: "emerald" | "rose";
  label: string;
  show2: boolean;
  canRemove: boolean;
  gpsLoading: { type: "pickup" | "dropoff"; idx: number } | null;
  suggestions: LocationEntry[];
  onUpdate: (field: keyof LocationEntry, value: string) => void;
  onToggle2: () => void;
  onRemove: () => void;
  onGps: () => void;
  onFill: (addr: LocationEntry) => void;
}

function LocationCard({
  type, location, idx, color, label, show2, canRemove,
  gpsLoading, suggestions, onUpdate, onToggle2, onRemove, onGps, onFill,
}: LocationCardProps) {
  const isPickup = type === "pickup";
  const inputCls = `w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none focus:border-${color}-200 transition-colors`;

  // Show previous-address suggestions only while an address field is focused (floating overlay)
  const [showSuggest, setShowSuggest] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAddrFocus = () => { if (hideTimer.current) clearTimeout(hideTimer.current); if (suggestions.length > 0) setShowSuggest(true); };
  const onAddrBlur = () => { hideTimer.current = setTimeout(() => setShowSuggest(false), 150); };

  return (
    <div className={`space-y-3 p-4 rounded-2xl bg-${color}-50/10 border border-${color}-100/30`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-full bg-${color}-500 text-white flex items-center justify-center text-[11px] font-bold`}>
            {label}
          </div>
          <span className={`text-[10px] font-semibold text-${color}-700`}>
            {isPickup ? "Pickup" : "Dropoff"} Stop
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGps}
            disabled={!!gpsLoading}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border border-${color}-200 bg-${color}-50 text-${color}-600 text-[9px] font-bold uppercase tracking-wider hover:bg-${color}-100 transition-colors disabled:opacity-50`}
          >
            {gpsLoading?.type === type && gpsLoading.idx === idx
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Navigation className="w-3 h-3" />}
            GPS
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-[10px] font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Primary contact */}
      <div className="grid grid-cols-1 gap-3">
        <input
          placeholder="Contact Person *"
          value={location.contactPerson}
          onChange={e => onUpdate("contactPerson", e.target.value.replace(/[0-9]/g, ""))}
          className={inputCls}
        />
        <div className="flex items-center bg-white border border-neutral-100 rounded-lg focus-within:border-neutral-300 transition-colors">
          <Phone className="ml-3 w-3.5 h-3.5 text-neutral-300 shrink-0" />
          <select
            value={location.contactCode}
            onChange={e => onUpdate("contactCode", e.target.value)}
            className="bg-transparent py-2 pl-2 pr-1 text-[11px] font-semibold text-neutral-500 outline-none appearance-none cursor-pointer border-r border-neutral-100 shrink-0"
          >
            <option value="">+</option>
            {DIAL_CODES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
          </select>
          <input
            type="tel"
            placeholder="Contact Number *"
            value={location.contact}
            maxLength={DIAL_CODES.find(d => d.code === location.contactCode)?.maxLen ?? 10}
            onChange={e => { const max = DIAL_CODES.find(d => d.code === location.contactCode)?.maxLen ?? 10; onUpdate("contact", e.target.value.replace(/\D/g, "").slice(0, max)); }}
            className="flex-1 bg-transparent py-2 pl-3 pr-3 text-[12px] outline-none min-w-0"
          />
        </div>
      </div>

      {/* 2nd contact toggle */}
      <button
        type="button"
        onClick={onToggle2}
        className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${show2 ? `text-${color}-600` : "text-neutral-400 hover:text-neutral-600"}`}
      >
        <UserPlus className="w-3 h-3" />
        {show2 ? "Remove 2nd Contact" : "+ Add 2nd Contact (Optional)"}
      </button>

      {show2 && (
        <div className="grid grid-cols-1 gap-3 pt-1 border-t border-dashed border-neutral-100">
          <input
            placeholder="2nd Contact Person"
            value={location.contactPerson2}
            onChange={e => onUpdate("contactPerson2", e.target.value.replace(/[0-9]/g, ""))}
            className={inputCls}
          />
          <div className="flex items-center bg-white border border-neutral-100 rounded-lg focus-within:border-neutral-300 transition-colors">
            <Phone className="ml-3 w-3.5 h-3.5 text-neutral-300 shrink-0" />
            <select
              value={location.contact2Code}
              onChange={e => onUpdate("contact2Code", e.target.value)}
              className="bg-transparent py-2 pl-2 pr-1 text-[11px] font-semibold text-neutral-500 outline-none appearance-none cursor-pointer border-r border-neutral-100 shrink-0"
            >
              <option value="">+</option>
              {DIAL_CODES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
            </select>
            <input
              type="tel"
              placeholder="2nd Contact Number"
              value={location.contact2}
              maxLength={DIAL_CODES.find(d => d.code === location.contact2Code)?.maxLen ?? 10}
              onChange={e => { const max = DIAL_CODES.find(d => d.code === location.contact2Code)?.maxLen ?? 10; onUpdate("contact2", e.target.value.replace(/\D/g, "").slice(0, max)); }}
              className="flex-1 bg-transparent py-2 pl-3 pr-3 text-[12px] outline-none min-w-0"
            />
          </div>
        </div>
      )}

      {/* Address — suggestions float over this block on focus */}
      <div className="relative">
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Plot/Shop No"
          value={location.plotNo}
          onChange={e => onUpdate("plotNo", e.target.value)}
          onFocus={onAddrFocus}
          onBlur={onAddrBlur}
          className={inputCls}
        />
        <input
          placeholder="Street/Area"
          value={location.street}
          onChange={e => onUpdate("street", e.target.value)}
          onFocus={onAddrFocus}
          onBlur={onAddrBlur}
          className={inputCls}
        />
      </div>

      {/* Country → State → City */}
      <div className="grid grid-cols-1 gap-2 mt-3">
        <select
          value={location.country}
          onChange={e => { onUpdate("country", e.target.value); onUpdate("state", ""); onUpdate("city", ""); }}
          className={`${inputCls} appearance-none cursor-pointer`}
        >
          <option value="">Country *</option>
          {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={location.state}
            onChange={e => { onUpdate("state", e.target.value); onUpdate("city", ""); }}
            className={`${inputCls} appearance-none cursor-pointer`}
            disabled={!location.country}
          >
            <option value="">State / Province</option>
            {(AFRICAN_STATES[location.country] || []).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={location.city}
            onChange={e => {
              const selectedCity = e.target.value;
              onUpdate("city", selectedCity);
              const autoState = location.country ? (CITY_TO_STATE[location.country]?.[selectedCity] || "") : "";
              if (autoState) onUpdate("state", autoState);
            }}
            className={`${inputCls} appearance-none cursor-pointer`}
            disabled={!location.country}
          >
            <option value="">City *</option>
            {(AFRICAN_CITIES[location.country] || []).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Previous address suggestions — floating overlay, shows on focus, does not push UI */}
      {showSuggest && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border border-neutral-200 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-neutral-50">
            <Clock className="w-3 h-3 text-neutral-300" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Previous Addresses</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onFill(s); setShowSuggest(false); }}
                className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0 flex items-center gap-2.5"
              >
                <MapPin className="w-3 h-3 text-neutral-300 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-700 truncate">
                    {[s.plotNo, s.street, s.city, s.state, s.country].filter(Boolean).join(", ")}
                  </p>
                  {s.contactPerson && (
                    <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{s.contactPerson} · {s.contact}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export default function CreateBookingDrawer({ isOpen, onClose, onSubmit }: CreateBookingDrawerProps) {
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [gpsLoading, setGpsLoading] = useState<{ type: "pickup" | "dropoff"; idx: number } | null>(null);
  const [clientSuggestions, setClientSuggestions] = useState<LocationEntry[]>([]);
  const [goodsTypes, setGoodsTypes] = useState<{ _id: string; name: string }[]>([]);
  const [showGoodsManager, setShowGoodsManager] = useState(false);
  const [newGoodsInput, setNewGoodsInput] = useState("");
  const [showContact2, setShowContact2] = useState<{ pickup: boolean[]; dropoff: boolean[] }>({
    pickup: [false], dropoff: [false],
  });
  const [formData, setFormData] = useState({
    clientId: "",
    goodsType: [] as string[],
    weight: "",
    scheduleDate: todayAppDateKey(),
    pickupLocations: [emptyLocation()],
    dropoffLocations: [emptyLocation()],
    truckType: "Flat Bed",
  });

  useEffect(() => {
    if (isOpen) { loadClients(); loadGoodsTypes(); }
  }, [isOpen]);

  useEffect(() => {
    if (!formData.clientId) { setClientSuggestions([]); return; }
    (async () => {
      try {
        const bookings = await bookingService.getAll(formData.clientId);
        const seen = new Set<string>();
        const locs: LocationEntry[] = [];
        for (const booking of bookings || []) {
          const stops = [...(booking.pickupLocations || []), ...(booking.dropoffLocations || [])];
          for (const stop of stops) {
            const key = `${stop.address?.city}|${stop.address?.street}|${stop.address?.plotNo}`;
            if (!seen.has(key) && stop.address?.city) {
              seen.add(key);
              locs.push({
                // Don't carry the contact from a past booking — the stored number
                // already includes "+260", which would double up with the "+260"
                // dial-code prefix. Admin enters a fresh local number per booking.
                contactPerson: "",
                contactCode: "+260",
                contact: "",
                contactPerson2: "",
                contact2Code: "+260",
                contact2: "",
                plotNo: stop.address?.plotNo || "",
                street: stop.address?.street || "",
                country: stop.address?.country || "",
                state: stop.address?.state || "",
                city: stop.address?.city || "",
              });
            }
          }
        }
        setClientSuggestions(locs);
      } catch { setClientSuggestions([]); }
    })();
  }, [formData.clientId]);

  const loadGoodsTypes = async () => {
    try { setGoodsTypes((await goodsTypeService.getAll()) || []); } catch { /* silent */ }
  };

  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      setClients((await clientService.getAll()) || []);
    } catch { /* silent */ } finally { setIsLoadingClients(false); }
  };

  const addGoodsType = async () => {
    const val = newGoodsInput.trim();
    if (!val) return;
    try {
      const created = await goodsTypeService.create(val);
      setGoodsTypes(prev => [...prev, created]);
      setNewGoodsInput("");
    } catch { /* silent */ }
  };

  const deleteGoodsType = async (id: string, name: string) => {
    try {
      await goodsTypeService.remove(id);
      setGoodsTypes(prev => prev.filter(g => g._id !== id));
      setFormData(f => ({ ...f, goodsType: f.goodsType.filter(g => g !== name) }));
    } catch { /* silent */ }
  };

  const fetchGpsAddress = (type: "pickup" | "dropoff", idx: number) => {
    if (!navigator.geolocation) { alert("Geolocation not supported."); return; }
    setGpsLoading({ type, idx });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const rawCountry = addr.country || "";
          const rawState = addr.state || addr.state_district || addr.county || "";
          const rawCity = addr.city || addr.town || addr.village || "";
          const country = matchCountry(rawCountry);
          const state = country ? matchList(rawState, AFRICAN_STATES[country] || []) : "";
          const city = country ? matchList(rawCity, AFRICAN_CITIES[country] || []) : "";
          if (!country && rawCountry) alert(`GPS detected "${rawCountry}" which is outside the supported region. Please select Country, State & City manually.`);
          updateLoc(type, idx, "country", country);
          updateLoc(type, idx, "state", state);
          updateLoc(type, idx, "city", city);
          updateLoc(type, idx, "street", addr.road || addr.suburb || "");
        } catch { alert("Failed to fetch address."); }
        finally { setGpsLoading(null); }
      },
      () => { alert("Location access denied."); setGpsLoading(null); },
      { timeout: 10000 }
    );
  };

  const getLabel = (pCount: number, dCount: number, isPick: boolean, idx: number) =>
    String.fromCharCode(65 + (isPick ? idx : pCount + idx));

  const updateLoc = (type: "pickup" | "dropoff", idx: number, field: keyof LocationEntry, value: string) => {
    const key = type === "pickup" ? "pickupLocations" : "dropoffLocations";
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].map((loc, i) => i === idx ? { ...loc, [field]: value } : loc),
    }));
  };

  const fillLocation = (type: "pickup" | "dropoff", idx: number, addr: LocationEntry) => {
    const key = type === "pickup" ? "pickupLocations" : "dropoffLocations";
    // Fill ONLY the address fields from the suggestion — keep whatever contact
    // person/number the user already typed (don't overwrite it).
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].map((loc, i) => i === idx ? {
        ...loc,
        plotNo: addr.plotNo,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        country: addr.country,
      } : loc),
    }));
  };

  const addLocation = (type: "pickup" | "dropoff") => {
    const key = type === "pickup" ? "pickupLocations" : "dropoffLocations";
    setFormData(prev => ({ ...prev, [key]: [...prev[key], emptyLocation()] }));
    setShowContact2(prev => ({ ...prev, [type]: [...prev[type], false] }));
  };

  const removeLocation = (type: "pickup" | "dropoff", idx: number) => {
    const key = type === "pickup" ? "pickupLocations" : "dropoffLocations";
    setFormData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
    setShowContact2(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== idx) }));
  };

  const toggleContact2 = (type: "pickup" | "dropoff", idx: number) => {
    setShowContact2(prev => {
      const arr = [...prev[type]];
      arr[idx] = !arr[idx];
      return { ...prev, [type]: arr };
    });
  };

  const isStep1Valid = !!formData.clientId && formData.goodsType.length > 0 && !!formData.scheduleDate;
  const isStep2Valid =
    formData.pickupLocations.some(l => l.contactPerson.trim() && l.contact.trim() && l.city.trim()) &&
    formData.dropoffLocations.some(l => l.contactPerson.trim() && l.contact.trim() && l.city.trim());
  const isNextDisabled = step === 1 ? !isStep1Valid : step === 2 ? !isStep2Valid : false;

  const handleFormSubmit = async () => {
    try {
      const selectedClient = clients.find(c => c._id === formData.clientId);
      const mapLoc = (loc: LocationEntry, i: number) => ({
        sequence: i + 1,
        contactPerson: loc.contactPerson,
        contactNumber: loc.contactCode ? `${loc.contactCode}${loc.contact}` : loc.contact,
        ...(loc.contactPerson2.trim() && { contactPerson2: loc.contactPerson2, contactNumber2: loc.contact2Code ? `${loc.contact2Code}${loc.contact2}` : loc.contact2 }),
        address: { plotNo: loc.plotNo, street: loc.street, country: loc.country, state: loc.state, city: loc.city },
        gpsEnabled: false,
      });
      const payload = {
        clientId: formData.clientId,
        cargoDetails: { goodsType: formData.goodsType, ...(formData.weight ? { weight: parseFloat(formData.weight) } : {}), loadingDate: formData.scheduleDate },
        pickupLocations: formData.pickupLocations.map(mapLoc),
        dropoffLocations: formData.dropoffLocations.map(mapLoc),
        requirement: { bodyType: formData.truckType },
        status: "active",
        metadata: { source: "admin_manual_entry", createdAt: new Date().toISOString(), client: selectedClient?.name || "" },
      };
      const response = await bookingService.create(payload);
      if (response) {
        alert("Booking created successfully!");
        onSubmit(formData);
        onClose();
        setStep(1);
      }
    } catch { alert("Failed to create booking. Please try again."); }
  };

  if (!isOpen) return null;

  const pCount = formData.pickupLocations.length;
  const dCount = formData.dropoffLocations.length;

  // An address picked on one side must not appear as a suggestion on the other:
  // a pickup can't also be offered as a dropoff, and vice versa.
  const locKey = (l: any) =>
    `${(l?.city || "").trim().toLowerCase()}|${(l?.street || "").trim().toLowerCase()}|${(l?.plotNo || "").trim().toLowerCase()}`;
  const pickedPickupKeys = new Set(formData.pickupLocations.map(locKey));
  const pickedDropoffKeys = new Set(formData.dropoffLocations.map(locKey));
  const pickupSuggestions = clientSuggestions.filter((s) => !pickedDropoffKeys.has(locKey(s)));
  const dropoffSuggestions = clientSuggestions.filter((s) => !pickedPickupKeys.has(locKey(s)));

  return (
    <div className="fixed inset-0 z-[600] pointer-events-none">
      <div
        className={`absolute inset-0 bg-neutral-900/30 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl transition-transform duration-300 pointer-events-auto flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">Create New Booking</h2>
            <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-widest">Manual entry from admin panel</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-xl text-neutral-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 bg-neutral-50/50 border-b border-neutral-100 flex items-center gap-4 shrink-0">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step >= s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white border border-neutral-200 text-neutral-400"}`}>
                {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 rounded-full ${step > s ? "bg-primary" : "bg-neutral-200"}`} />}
            </div>
          ))}
          <span className="ml-auto text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Step {step} of 3</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">

            {/* Step 1 — Client & Cargo */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2">Client & Cargo</h3>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Select Client <span className="text-red-500">*</span></label>
                  <div className="relative group">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                    <select
                      value={formData.clientId}
                      onChange={e => setFormData(f => ({ ...f, clientId: e.target.value }))}
                      className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-semibold text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm cursor-pointer appearance-none"
                    >
                      <option value="">Choose Client...</option>
                      {clients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}
                    </select>
                  </div>
                  {isLoadingClients && <p className="text-[9px] text-primary animate-pulse ml-1">Fetching clients...</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest">Type of Goods <span className="text-red-500">*</span></label>
                    <button type="button" onClick={() => setShowGoodsManager(v => !v)} className="flex items-center gap-1 text-[9px] font-bold text-primary uppercase tracking-widest hover:underline">
                      <Plus className="w-3 h-3" /> Manage
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {goodsTypes.map(g => {
                      const selected = formData.goodsType.includes(g.name);
                      return (
                        <button
                          key={g._id}
                          type="button"
                          onClick={() => setFormData(f => ({
                            ...f,
                            goodsType: selected
                              ? f.goodsType.filter(t => t !== g.name)
                              : [...f.goodsType, g.name],
                          }))}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            selected
                              ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                              : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:border-primary/40"
                          }`}
                        >
                          {selected && <span className="mr-1">✓</span>}{g.name}
                        </button>
                      );
                    })}
                    {goodsTypes.length === 0 && <p className="text-[11px] text-neutral-400 italic">No goods types yet — use Manage to add</p>}
                  </div>
                  {formData.goodsType.length > 0 && (
                    <p className="text-[10px] text-primary font-bold ml-1">{formData.goodsType.length} selected</p>
                  )}
                  {showGoodsManager && (
                    <div className="bg-white border border-neutral-100 rounded-xl p-3 shadow-sm space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text" value={newGoodsInput}
                          onChange={e => setNewGoodsInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addGoodsType()}
                          placeholder="New goods type..."
                          className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg py-1.5 px-3 text-[12px] outline-none focus:border-primary/30"
                        />
                        <button type="button" onClick={addGoodsType} className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:brightness-110">Add</button>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {goodsTypes.map(g => (
                          <div key={g._id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-neutral-50">
                            <span className="text-[12px] font-medium text-neutral-700">{g.name}</span>
                            <button type="button" onClick={() => deleteGoodsType(g._id, g.name)} className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Weight (kg)</label>
                  <input
                    type="number" value={formData.weight}
                    onChange={e => setFormData(f => ({ ...f, weight: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Schedule Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                    <input
                      type="date" value={formData.scheduleDate}
                      min={todayAppDateKey()}
                      onChange={e => setFormData(f => ({ ...f, scheduleDate: e.target.value }))}
                      className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Truck Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ name: "Flat Bed", icon: "🚛" }, { name: "Side Drop", icon: "🚚" }].map(truck => (
                      <button
                        key={truck.name}
                        onClick={() => setFormData(f => ({ ...f, truckType: truck.name }))}
                        className={`p-3 rounded-xl border flex flex-col items-center transition-all group ${formData.truckType === truck.name ? "bg-primary border-primary shadow-lg shadow-primary/20 text-white" : "bg-white border-neutral-100 hover:border-primary/20 text-neutral-900"}`}
                      >
                        <span className={`text-xl mb-1 transition-transform group-hover:scale-110 ${formData.truckType === truck.name ? "" : "filter grayscale opacity-50"}`}>{truck.icon}</span>
                        <span className="text-[11px] font-semibold">{truck.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Locations */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2">Location Logistics</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pickup Locations</span>
                    <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">{pCount}</span>
                  </div>
                  {formData.pickupLocations.map((loc, idx) => (
                    <LocationCard
                      key={`pickup-${idx}`}
                      type="pickup" location={loc} idx={idx} color="emerald"
                      label={getLabel(pCount, dCount, true, idx)}
                      show2={showContact2.pickup[idx]}
                      canRemove={pCount > 1}
                      gpsLoading={gpsLoading}
                      onUpdate={(field, val) => updateLoc("pickup", idx, field, val)}
                      onToggle2={() => toggleContact2("pickup", idx)}
                      onRemove={() => removeLocation("pickup", idx)}
                      onGps={() => fetchGpsAddress("pickup", idx)}
                      suggestions={pickupSuggestions}
                      onFill={(addr) => fillLocation("pickup", idx, addr)}
                    />
                  ))}
                  <button onClick={() => addLocation("pickup")} className="w-full py-2.5 border border-dashed border-emerald-300 rounded-lg text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors">
                    + Add Pickup Location
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Dropoff Locations</span>
                    <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-2 py-1 rounded">{dCount}</span>
                  </div>
                  {formData.dropoffLocations.map((loc, idx) => (
                    <LocationCard
                      key={`dropoff-${idx}`}
                      type="dropoff" location={loc} idx={idx} color="rose"
                      label={getLabel(pCount, dCount, false, idx)}
                      show2={showContact2.dropoff[idx]}
                      canRemove={dCount > 1}
                      gpsLoading={gpsLoading}
                      onUpdate={(field, val) => updateLoc("dropoff", idx, field, val)}
                      onToggle2={() => toggleContact2("dropoff", idx)}
                      onRemove={() => removeLocation("dropoff", idx)}
                      onGps={() => fetchGpsAddress("dropoff", idx)}
                      suggestions={dropoffSuggestions}
                      onFill={(addr) => fillLocation("dropoff", idx, addr)}
                    />
                  ))}
                  <button onClick={() => addLocation("dropoff")} className="w-full py-2.5 border border-dashed border-rose-300 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
                    + Add Dropoff Location
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Review */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-emerald-900">Review & Confirm</h4>
                    <p className="text-[10px] font-medium text-emerald-600/80">Manual booking will be created in active state.</p>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3">
                  <div>
                    <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Client</div>
                    <div className="text-[12px] font-semibold text-slate-900">{clients.find(c => c._id === formData.clientId)?.name || "N/A"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Cargo</div>
                      <div className="text-[11px] font-medium text-slate-700">{formData.goodsType.join(", ")} · {formData.weight} Tons</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Vehicle</div>
                      <div className="text-[11px] font-medium text-slate-700">{formData.truckType}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Pickup</div>
                  {formData.pickupLocations.map((loc, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{getLabel(pCount, dCount, true, idx)}</div>
                      <div>
                        <div className="font-bold text-emerald-900 text-[11px]">{loc.city}{loc.state ? `, ${loc.state}` : ""}</div>
                        <div className="text-emerald-600 text-[9px]">{loc.contactPerson} · {loc.contact}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center"><span className="text-2xl text-neutral-300">↓</span></div>

                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Dropoff</div>
                  {formData.dropoffLocations.map((loc, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">{getLabel(pCount, dCount, false, idx)}</div>
                      <div>
                        <div className="font-bold text-rose-900 text-[11px]">{loc.city}{loc.state ? `, ${loc.state}` : ""}</div>
                        <div className="text-rose-600 text-[9px]">{loc.contactPerson} · {loc.contact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 bg-white flex items-center gap-3 shrink-0">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 border border-neutral-100 rounded-xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          <button
            onClick={step === 3 ? handleFormSubmit : () => setStep(s => s + 1)}
            disabled={isNextDisabled}
            className={`flex-1 px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isNextDisabled ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" : "bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"}`}
          >
            {step === 3 ? "Create Booking" : "Next Details"}
            {step < 3 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
