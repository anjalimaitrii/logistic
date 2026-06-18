"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ClientSidebarNavigation } from "@/components/client/ClientSidebarNavigation";
import {
   ArrowLeft,
   Phone,
   Package,
   Calendar,
   ChevronRight,
   TrendingUp,
   DollarSign,
   Plus,
   Navigation,
   User,
   Hash,
   MapPin,
   Building,
   X,
   Clock,
   Loader2,
   UserPlus,
   Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRouter } from "next/navigation";
import { bookingService } from "@/services/bookingService";
import { goodsTypeService } from "@/services/goodsTypeService";
import { AFRICAN_COUNTRIES, AFRICAN_STATES, AFRICAN_CITIES, CITY_TO_STATE } from "@/lib/africaLocations";

const TRUCK_TYPES = [
   { name: "Flat Bed", icon: "🚛", desc: "Open Platform", cap: "Required" },
   { name: "Side Drop", icon: "🚚", desc: "Drop Side Body", cap: "Required" },
];

type LocationEntry = {
   contactPerson: string;
   contactCode: string;
   contact: string;
   contactPerson2: string;
   contact2Code: string;
   contact2: string;
   clientName: string;
   plotNo: string;
   street: string;
   country: string;
   state: string;
   city: string;
   gps: boolean;
};

const emptyLocation = (): LocationEntry => ({
   contactPerson: "", contactCode: "+260", contact: "",
   contactPerson2: "", contact2Code: "+260", contact2: "",
   clientName: "", plotNo: "", street: "", country: "", state: "", city: "", gps: false,
});

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

const getLabel = (idx: number, offset = 0) => String.fromCharCode(65 + offset + idx);

const ACCENT = {
   emerald: {
      bar: "bg-emerald-500",
      title: "text-emerald-700",
      badge: "bg-emerald-50 text-emerald-600",
      circle: "bg-emerald-500",
      card: "bg-emerald-50/10 border-emerald-100/30",
      gpsOn: "bg-emerald-50 border-emerald-100 text-emerald-600",
      gpsOff: "hover:text-emerald-500 hover:border-emerald-100",
      focus: "focus:border-emerald-100",
      add: "border-emerald-300 text-emerald-600 hover:bg-emerald-50",
      suggestion: "border-emerald-100",
   },
   rose: {
      bar: "bg-rose-500",
      title: "text-rose-700",
      badge: "bg-rose-50 text-rose-600",
      circle: "bg-rose-500",
      card: "bg-rose-50/10 border-rose-100/30",
      gpsOn: "bg-rose-50 border-rose-100 text-rose-600",
      gpsOff: "hover:text-rose-500 hover:border-rose-100",
      focus: "focus:border-rose-100",
      add: "border-rose-300 text-rose-600 hover:bg-rose-50",
      suggestion: "border-rose-100",
   },
};

function extractPreviousLocations(bookings: any[]): LocationEntry[] {
   const seen = new Set<string>();
   const locs: LocationEntry[] = [];
   for (const booking of bookings) {
      const stops = [...(booking.pickupLocations || []), ...(booking.dropoffLocations || [])];
      for (const stop of stops) {
         const key = `${stop.address?.city}|${stop.address?.street}|${stop.address?.plotNo}|${stop.contactNumber}`;
         if (!seen.has(key) && stop.address?.city) {
            seen.add(key);
            locs.push({
               contactPerson: stop.contactPerson || "",
               contactCode: "", contact: stop.contactNumber || "",
               contactPerson2: "", contact2Code: "", contact2: "", clientName: "",
               plotNo: stop.address?.plotNo || "",
               street: stop.address?.street || "",
               country: stop.address?.country || "",
               state: stop.address?.state || "",
               city: stop.address?.city || "",
               gps: stop.gpsEnabled || false,
            });
         }
      }
   }
   return locs.slice(0, 10);
}

interface LocationSectionProps {
   type: "pickupLocations" | "dropoffLocations";
   label: string;
   color: "emerald" | "rose";
   locations: LocationEntry[];
   offset: number;
   isPickup: boolean;
   previousAddresses: LocationEntry[];
   onUpdate: (type: "pickupLocations" | "dropoffLocations", idx: number, field: keyof LocationEntry, value: string | boolean) => void;
   onAdd: (type: "pickupLocations" | "dropoffLocations") => void;
   onRemove: (type: "pickupLocations" | "dropoffLocations", idx: number) => void;
   onFill: (type: "pickupLocations" | "dropoffLocations", idx: number, address: LocationEntry) => void;
}

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

function LocationSection({ type, label, color, locations, offset, isPickup, previousAddresses, onUpdate, onAdd, onRemove, onFill }: LocationSectionProps) {
   const a = ACCENT[color];
   const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
   const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const [gpsLoadingIdx, setGpsLoadingIdx] = useState<number | null>(null);
   const [showContact2, setShowContact2] = useState<boolean[]>(() => locations.map(() => false));
   const [showClientName, setShowClientName] = useState<boolean[]>(() => locations.map(() => false));

   useEffect(() => {
      setShowContact2(prev => locations.map((_, i) => prev[i] ?? false));
      setShowClientName(prev => locations.map((_, i) => prev[i] ?? false));
   }, [locations.length]);

   const fetchGps = (idx: number) => {
      if (!navigator.geolocation) { alert("Geolocation not supported."); return; }
      setGpsLoadingIdx(idx);
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
               if (!country && rawCountry) {
                  alert(`GPS detected "${rawCountry}" which is outside the supported region. Please select Country, State & City manually.`);
               }
               onFill(type, idx, {
                  ...locations[idx],
                  country,
                  state,
                  city,
                  street: addr.road || addr.suburb || addr.neighbourhood || "",
               });
            } catch {
               alert("Failed to fetch address.");
            } finally {
               setGpsLoadingIdx(null);
            }
         },
         () => { alert("Location access denied."); setGpsLoadingIdx(null); },
         { timeout: 10000 }
      );
   };

   const handleAddressFieldFocus = (idx: number) => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (previousAddresses.length > 0) setFocusedIdx(idx);
   };

   const handleAddressFieldBlur = () => {
      hideTimerRef.current = setTimeout(() => setFocusedIdx(null), 150);
   };

   const handleSuggestionClick = (idx: number, addr: LocationEntry) => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      onFill(type, idx, addr);
      setFocusedIdx(null);
   };

   return (
      <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
         <div className="flex items-center gap-2">
            <div className={`w-1.5 h-4 ${a.bar} rounded-full`} />
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-900">{label}</h2>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${a.badge}`}>{locations.length}</span>
         </div>

         <div className="space-y-4">
            {locations.map((loc, idx) => (
               <div key={idx} className={`space-y-3 p-4 rounded-2xl border ${a.card}`}>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full ${a.circle} text-white flex items-center justify-center text-[11px] font-bold`}>
                           {getLabel(idx, offset)}
                        </div>
                        <span className={`text-[10px] font-semibold ${a.title}`}>
                           {isPickup ? "Pickup" : "Dropoff"} Stop {getLabel(idx, offset)}
                        </span>
                     </div>
                     <div className="flex items-center gap-2">
                        <button
                           type="button"
                           onClick={() => fetchGps(idx)}
                           disabled={gpsLoadingIdx !== null}
                           className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-semibold uppercase tracking-tighter shadow-sm bg-slate-50 border-slate-100 text-slate-400 hover:text-blue-500 hover:border-blue-100 disabled:opacity-50"
                        >
                           {gpsLoadingIdx === idx
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Navigation className="w-3 h-3" />}
                           GPS
                        </button>
                        {locations.length > 1 && (
                           <button
                              type="button"
                              onClick={() => onRemove(type, idx)}
                              className="text-[10px] font-semibold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                           >
                              Remove
                           </button>
                        )}
                     </div>
                  </div>

                  {/* Dropoff only — client/business name (above contact) */}
                  {!isPickup && (
                     <>
                        <button
                           type="button"
                           onClick={() => setShowClientName(prev => { const a = [...prev]; a[idx] = !a[idx]; return a; })}
                           className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${showClientName[idx] ? `${a.title}` : "text-slate-400 hover:text-slate-600"}`}
                        >
                           <Briefcase className="w-3 h-3" />
                           {showClientName[idx] ? "Remove Client Name" : "+ Add Client (Optional)"}
                        </button>
                        {showClientName[idx] && (
                           <div className="relative">
                              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                              <input
                                 type="text"
                                 placeholder="Client / Business Name"
                                 value={loc.clientName}
                                 onChange={(e) => onUpdate(type, idx, "clientName", e.target.value)}
                                 className={`w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white outline-none transition-all ${a.focus}`}
                              />
                           </div>
                        )}
                     </>
                  )}

                  {/* Primary contact */}
                  <div className="grid grid-cols-1 gap-3">
                     <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                        <input
                           type="text"
                           placeholder="Contact Person"
                           value={loc.contactPerson}
                           onChange={(e) => onUpdate(type, idx, "contactPerson", e.target.value.replace(/[0-9]/g, ""))}
                           className={`w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white outline-none transition-all ${a.focus}`}
                        />
                     </div>
                     <div className={`flex items-center bg-slate-50 rounded-lg border border-transparent focus-within:bg-white focus-within:border-slate-200 transition-all`}>
                        <Phone className="ml-3 w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <select
                           value={loc.contactCode}
                           onChange={(e) => onUpdate(type, idx, "contactCode", e.target.value)}
                           className="bg-transparent py-2.5 pl-2 pr-1 text-[11px] font-semibold text-slate-500 outline-none appearance-none cursor-pointer border-r border-slate-200 shrink-0"
                        >
                           <option value="">+</option>
                           {DIAL_CODES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                        </select>
                        <input
                           type="tel"
                           placeholder="Contact Number *"
                           value={loc.contact}
                           maxLength={DIAL_CODES.find(d => d.code === loc.contactCode)?.maxLen ?? 10}
                           onChange={(e) => { const max = DIAL_CODES.find(d => d.code === loc.contactCode)?.maxLen ?? 10; onUpdate(type, idx, "contact", e.target.value.replace(/\D/g, "").slice(0, max)); }}
                           className="flex-1 bg-transparent py-2.5 pl-3 pr-4 text-[12px] font-medium text-slate-900 outline-none min-w-0"
                        />
                     </div>
                  </div>

                  {/* Optional 2nd contact toggle */}
                  <button
                     type="button"
                     onClick={() => setShowContact2(prev => { const a = [...prev]; a[idx] = !a[idx]; return a; })}
                     className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${showContact2[idx] ? `${a.title}` : "text-slate-400 hover:text-slate-600"}`}
                  >
                     <UserPlus className="w-3 h-3" />
                     {showContact2[idx] ? "Remove 2nd Contact" : "+ Add 2nd Contact (Optional)"}
                  </button>

                  {showContact2[idx] && (
                     <div className="grid grid-cols-1 gap-3 pt-1 border-t border-dashed border-slate-100">
                        <div className="relative">
                           <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                           <input
                              type="text"
                              placeholder="2nd Contact Person"
                              value={loc.contactPerson2}
                              onChange={(e) => onUpdate(type, idx, "contactPerson2", e.target.value.replace(/[0-9]/g, ""))}
                              className={`w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white outline-none transition-all ${a.focus}`}
                           />
                        </div>
                        <div className="flex items-center bg-slate-50 rounded-lg border border-transparent focus-within:bg-white focus-within:border-slate-200 transition-all">
                           <Phone className="ml-3 w-3.5 h-3.5 text-slate-300 shrink-0" />
                           <select
                              value={loc.contact2Code}
                              onChange={(e) => onUpdate(type, idx, "contact2Code", e.target.value)}
                              className="bg-transparent py-2.5 pl-2 pr-1 text-[11px] font-semibold text-slate-500 outline-none appearance-none cursor-pointer border-r border-slate-200 shrink-0"
                           >
                              <option value="">+</option>
                              {DIAL_CODES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                           </select>
                           <input
                              type="tel"
                              placeholder="2nd Contact Number"
                              value={loc.contact2}
                              maxLength={DIAL_CODES.find(d => d.code === loc.contact2Code)?.maxLen ?? 10}
                              onChange={(e) => { const max = DIAL_CODES.find(d => d.code === loc.contact2Code)?.maxLen ?? 10; onUpdate(type, idx, "contact2", e.target.value.replace(/\D/g, "").slice(0, max)); }}
                              className="flex-1 bg-transparent py-2.5 pl-3 pr-4 text-[12px] font-medium text-slate-900 outline-none min-w-0"
                           />
                        </div>
                     </div>
                  )}

                  {/* Address fields — suggestions appear below these */}
                  <div className="relative">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="relative">
                           <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                           <input
                              type="text"
                              placeholder="Plot / Office No"
                              value={loc.plotNo}
                              onChange={(e) => onUpdate(type, idx, "plotNo", e.target.value)}
                              onFocus={() => handleAddressFieldFocus(idx)}
                              onBlur={handleAddressFieldBlur}
                              className={`w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white outline-none transition-all ${a.focus}`}
                           />
                        </div>
                        <div className="relative">
                           <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                           <input
                              type="text"
                              placeholder="Street / Building"
                              value={loc.street}
                              onChange={(e) => onUpdate(type, idx, "street", e.target.value)}
                              onFocus={() => handleAddressFieldFocus(idx)}
                              onBlur={handleAddressFieldBlur}
                              className={`w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white outline-none transition-all ${a.focus}`}
                           />
                        </div>
                        <div className="relative col-span-full">
                           <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                           <select
                              value={loc.country}
                              onChange={(e) => { onUpdate(type, idx, "country", e.target.value); onUpdate(type, idx, "state", ""); onUpdate(type, idx, "city", ""); }}
                              className={`w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white outline-none transition-all appearance-none cursor-pointer ${a.focus}`}
                           >
                              <option value="">Country *</option>
                              {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                        <div className="relative">
                           <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                           <select
                              value={loc.state}
                              onChange={(e) => { onUpdate(type, idx, "state", e.target.value); onUpdate(type, idx, "city", ""); }}
                              disabled={!loc.country}
                              className={`w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 ${a.focus}`}
                           >
                              <option value="">State / Province</option>
                              {(AFRICAN_STATES[loc.country] || []).map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                        <div className="relative">
                           <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                           <select
                              value={loc.city}
                              onChange={(e) => {
                                 const selectedCity = e.target.value;
                                 onUpdate(type, idx, "city", selectedCity);
                                 const autoState = loc.country ? (CITY_TO_STATE[loc.country]?.[selectedCity] || "") : "";
                                 if (autoState) onUpdate(type, idx, "state", autoState);
                              }}
                              disabled={!loc.country}
                              className={`w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 ${a.focus}`}
                           >
                              <option value="">City *</option>
                              {(AFRICAN_CITIES[loc.country] || []).map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                     </div>

                     {/* Previous address suggestions */}
                     {focusedIdx === idx && (
                        <div className={`mt-2 rounded-xl border ${a.suggestion} bg-white shadow-lg overflow-hidden`}>
                           <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-50">
                              <Clock className="w-3 h-3 text-slate-300" />
                              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Previous Addresses</span>
                           </div>
                           <div className="max-h-48 overflow-y-auto">
                              {previousAddresses.map((prev, pIdx) => (
                                 <button
                                    key={pIdx}
                                    type="button"
                                    onMouseDown={(e) => {
                                       e.preventDefault();
                                       handleSuggestionClick(idx, prev);
                                    }}
                                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 flex items-center gap-2.5"
                                 >
                                    <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                       <p className="text-[11px] font-medium text-slate-700 truncate">
                                          {[prev.plotNo, prev.street, prev.city, prev.state, prev.country].filter(Boolean).join(", ")}
                                       </p>
                                       {(prev.contactPerson || prev.contact) && (
                                          <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                                             {[prev.contactPerson, prev.contact].filter(Boolean).join(" · ")}
                                          </p>
                                       )}
                                    </div>
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            ))}

            <button
               type="button"
               onClick={() => onAdd(type)}
               className={`w-full py-2.5 border border-dashed rounded-lg text-[11px] font-semibold transition-colors ${a.add}`}
            >
               + Add {isPickup ? "Pickup" : "Dropoff"} Location
            </button>
         </div>
      </section>
   );
}

export default function NewBookingPage() {
   const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const isDesktop = useMediaQuery("(min-width: 768px)");
   const router = useRouter();
   const [user, setUser] = useState<any>(null);
   const [localPrevious, setLocalPrevious] = useState<LocationEntry[]>([]);
   const [goodsTypes, setGoodsTypes] = useState<{ _id: string; name: string }[]>([]);

   useEffect(() => {
      goodsTypeService.getAll().then(data => setGoodsTypes(data || [])).catch(() => {});
   }, []);
   // Maps "pickupLocations-0" → index in localPrevious (to update on edit)
   const [suggestionSource, setSuggestionSource] = useState<Record<string, number>>({});

   useEffect(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
   }, []);

   useEffect(() => {
      const clientId = user?._id || user?.id;
      if (!clientId) return;
      bookingService.getAll(clientId).then((data: any) => {
         const bookings = Array.isArray(data) ? data : (data?.bookings || []);
         setLocalPrevious(extractPreviousLocations(bookings));
      }).catch(() => {});
   }, [user]);

   const [formData, setFormData] = useState({
      goodsType: [] as string[],
      weight: "",
      scheduleDate: new Date().toISOString().split('T')[0],
      pickupLocations: [emptyLocation()],
      dropoffLocations: [emptyLocation()],
      truckType: "Flat Bed"
   });

   const updateLocation = (
      type: "pickupLocations" | "dropoffLocations",
      idx: number,
      field: keyof LocationEntry,
      value: string | boolean
   ) => {
      // If this stop was filled from a suggestion, update that suggestion in-place
      const sourceIdx = suggestionSource[`${type}-${idx}`];
      if (sourceIdx !== undefined && sourceIdx >= 0) {
         setLocalPrevious(prev => prev.map((loc, i) =>
            i === sourceIdx ? { ...loc, [field]: value } : loc
         ));
      }
      setFormData(prev => {
         const updated = prev[type].map((loc, i) =>
            i === idx ? { ...loc, [field]: value } : loc
         );
         return { ...prev, [type]: updated };
      });
   };

   const addLocation = (type: "pickupLocations" | "dropoffLocations") => {
      setFormData(prev => ({ ...prev, [type]: [...prev[type], emptyLocation()] }));
   };

   const removeLocation = (type: "pickupLocations" | "dropoffLocations", idx: number) => {
      setFormData(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== idx) }));
   };

   const fillLocation = (type: "pickupLocations" | "dropoffLocations", idx: number, address: LocationEntry) => {
      // Track which localPrevious entry this came from
      const sourceIdx = localPrevious.findIndex(a => addrKey(a) === addrKey(address));
      setSuggestionSource(prev => ({ ...prev, [`${type}-${idx}`]: sourceIdx }));
      setFormData(prev => ({
         ...prev,
         [type]: prev[type].map((loc, i) => i === idx ? { ...address } : loc),
      }));
   };

   const addrKey = (a: LocationEntry) => `${a.city}|${a.street}|${a.plotNo}|${a.contact}`;

   // Current form entries with a city (new addresses typed fresh this session)
   const activePickup  = formData.pickupLocations.filter(l => l.city);
   const activeDropoff = formData.dropoffLocations.filter(l => l.city);

   // Merge: localPrevious + new form entries not already in localPrevious
   const allAddresses: LocationEntry[] = [
      ...localPrevious,
      ...activePickup.filter(a => !localPrevious.some(p => addrKey(p) === addrKey(a))),
      ...activeDropoff.filter(a => !localPrevious.some(p => addrKey(p) === addrKey(a))),
   ];

   const usedInPickup  = new Set(activePickup.map(addrKey));
   const usedInDropoff = new Set(activeDropoff.map(addrKey));

   const pickupSuggestions  = allAddresses.filter(a => !usedInDropoff.has(addrKey(a)));
   const dropoffSuggestions = allAddresses.filter(a => !usedInPickup.has(addrKey(a)));

   const handleSubmit = async () => {
      const hasValidPickup = formData.pickupLocations.some(l => l.city && l.contact);
      const hasValidDropoff = formData.dropoffLocations.some(l => l.city && l.contact);

      if (formData.goodsType.length === 0 || !hasValidPickup || !hasValidDropoff) {
         alert("Please fill in Goods Type and at least one complete pickup & dropoff location (City + Contact Number).");
         return;
      }

      setIsSubmitting(true);

      const payload = {
         clientId: user?._id || user?.id,
         cargoDetails: {
            goodsType: formData.goodsType,
            weight: formData.weight ? Number(formData.weight) : 0,
            loadingDate: formData.scheduleDate,
         },
         pickupLocations: formData.pickupLocations.map((loc, idx) => ({
            sequence: idx + 1,
            contactPerson: loc.contactPerson,
            contactNumber: loc.contactCode ? `${loc.contactCode}${loc.contact}` : loc.contact,
            ...(loc.contactPerson2.trim() && { contactPerson2: loc.contactPerson2, contactNumber2: loc.contact2Code ? `${loc.contact2Code}${loc.contact2}` : loc.contact2 }),
            address: { plotNo: loc.plotNo, street: loc.street, country: loc.country, state: loc.state, city: loc.city },
            gpsEnabled: loc.gps,
         })),
         dropoffLocations: formData.dropoffLocations.map((loc, idx) => ({
            sequence: idx + 1,
            contactPerson: loc.contactPerson,
            contactNumber: loc.contactCode ? `${loc.contactCode}${loc.contact}` : loc.contact,
            ...(loc.contactPerson2.trim() && { contactPerson2: loc.contactPerson2, contactNumber2: loc.contact2Code ? `${loc.contact2Code}${loc.contact2}` : loc.contact2 }),
            ...(loc.clientName.trim() && { clientName: loc.clientName }),
            address: { plotNo: loc.plotNo, street: loc.street, country: loc.country, state: loc.state, city: loc.city },
            gpsEnabled: loc.gps,
         })),
         requirement: { bodyType: formData.truckType },
         status: "active",
         metadata: { source: "webapp_client", createdAt: new Date().toISOString() }
      };

      try {
         await bookingService.create(payload);
         setIsSubmitting(false);
         alert("Booking Request Posted Successfully!");
         router.push("/dashboard");
      } catch (error) {
         console.error("Submission failed:", error);
         setIsSubmitting(false);
         alert("Failed to post booking. Please try again.");
      }
   };

   const FormContent = (
      <div className="max-w-3xl mx-auto space-y-6">
         {/* ── 1. CARGO DETAILS ── */}
         <section className="bg-white space-y-5 p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
               <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Cargo & Schedule</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 px-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Type of Goods <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2 mt-1">
                     {goodsTypes.map(g => {
                        const selected = formData.goodsType.includes(g.name);
                        return (
                           <button
                              key={g._id}
                              type="button"
                              onClick={() => setFormData(prev => ({
                                 ...prev,
                                 goodsType: selected
                                    ? prev.goodsType.filter(t => t !== g.name)
                                    : [...prev.goodsType, g.name],
                              }))}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                                 selected
                                    ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-primary/40"
                              }`}
                           >
                              {selected && <span className="mr-1">✓</span>}{g.name}
                           </button>
                        );
                     })}
                     {goodsTypes.length === 0 && <p className="text-[11px] text-slate-400 italic">No goods types available</p>}
                  </div>
                  {formData.goodsType.length > 0 && (
                     <p className="text-[10px] text-primary font-bold ml-1 mt-1">{formData.goodsType.length} selected</p>
                  )}
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest ml-1">Approx Weight (kg)</label>
                  <input
                     type="number"
                     placeholder="0"
                     value={formData.weight}
                     onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                     className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 px-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-primary/20 outline-none transition-all"
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 px-2 gap-4 pb-2 border-t border-slate-50 pt-4">
               <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Loading Date</label>
                  <div className="relative">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                     <input
                        type="date"
                        value={formData.scheduleDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduleDate: e.target.value }))}
                        className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-primary/20 outline-none transition-all"
                     />
                  </div>
               </div>
            </div>
         </section>

         {/* ── 2. PICKUP LOCATIONS ── */}
         <LocationSection
            type="pickupLocations"
            label="Pickup Locations"
            color="emerald"
            locations={formData.pickupLocations}
            offset={0}
            isPickup={true}
            previousAddresses={pickupSuggestions}
            onUpdate={updateLocation}
            onAdd={addLocation}
            onRemove={removeLocation}
            onFill={fillLocation}
         />

         {/* ── 3. DROPOFF LOCATIONS ── */}
         <LocationSection
            type="dropoffLocations"
            label="Dropoff Locations"
            color="rose"
            locations={formData.dropoffLocations}
            offset={formData.pickupLocations.length}
            isPickup={false}
            previousAddresses={dropoffSuggestions}
            onUpdate={updateLocation}
            onAdd={addLocation}
            onRemove={removeLocation}
            onFill={fillLocation}
         />

         {/* ── 4. VEHICLE CATEGORY ── */}
         <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
               <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Select Body Type (Required)</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
               {TRUCK_TYPES.map((truck) => (
                  <button
                     key={truck.name}
                     type="button"
                     onClick={() => setFormData(prev => ({ ...prev, truckType: truck.name }))}
                     className={`p-3 rounded-xl border flex flex-col items-center transition-all group ${formData.truckType === truck.name ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white' : 'bg-white border-slate-100 hover:border-primary/20 text-slate-900'}`}
                  >
                     <span className={`text-xl mb-2 transition-transform group-hover:scale-110 ${formData.truckType === truck.name ? '' : 'filter grayscale opacity-50'}`}>{truck.icon}</span>
                     <span className="text-[11px] font-semibold truncate overflow-hidden w-full text-center">{truck.name}</span>
                     <span className={`text-[8px] font-medium uppercase tracking-widest ${formData.truckType === truck.name ? 'text-white/60' : 'text-slate-300'}`}>{truck.cap}</span>
                  </button>
               ))}
            </div>
         </section>

         <div className="pt-4 pb-8 md:pb-0">
            <button
               type="button"
               onClick={handleSubmit}
               disabled={isSubmitting}
               className={`w-full bg-primary py-4 rounded-2xl text-white text-[12px] font-semibold uppercase tracking-[0.2em] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:brightness-110
                  ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
               {isSubmitting ? (
                  <>
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     Posting...
                  </>
               ) : (
                  <>
                     Post Booking Request
                     <ChevronRight className="w-4 h-4" strokeWidth={2} />
                  </>
               )}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 font-medium tracking-tight">By posting, you agree to our Fleet Link Terms & Conditions</p>
         </div>
      </div>
   );

   return (
      <div className="flex bg-neutral-50 min-h-screen relative overflow-x-hidden">
         <div className="hidden md:block fixed top-0 left-0 h-screen z-50">
            <ClientSidebarNavigation
               isExpanded={isSidebarExpanded}
               onHover={setIsSidebarExpanded}
            />
         </div>

         <motion.main
            initial={false}
            animate={{
               paddingLeft: isDesktop ? (isSidebarExpanded ? 240 + 24 : 68 + 24) : 16,
               paddingRight: isDesktop ? 24 : 16
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-1 min-w-0 pb-24 md:pb-12"
         >
            <AnimatePresence>
               {!isDesktop && (
                  <header className="h-14 flex items-center justify-between px-4 bg-white border-b border-neutral-100 -mx-4 mb-6 sticky top-0 z-40">
                     <Link href="/dashboard" className="p-2 border border-neutral-100 rounded-lg">
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                     </Link>
                     <h1 className="text-[12px] font-semibold uppercase tracking-widest text-slate-950">New Booking</h1>
                     <div className="w-8" />
                  </header>
               )}
            </AnimatePresence>

            {isDesktop ? (
               <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[2px]">
                  <div className="absolute inset-0" onClick={() => router.push('/dashboard')} />
                  <motion.div
                     initial={{ x: "100%" }}
                     animate={{ x: 0 }}
                     exit={{ x: "100%" }}
                     transition={{ type: "spring", damping: 30, stiffness: 300 }}
                     className="bg-white w-full max-w-130 h-screen shadow-2xl relative flex flex-col"
                  >
                     <button
                        type="button"
                        onClick={() => router.push('/dashboard')}
                        className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all z-10"
                     >
                        <X className="w-5 h-5" />
                     </button>

                     <div className="p-10 pb-6 border-b border-slate-50">
                        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">New Booking Request</h2>
                        <p className="text-[12px] font-normal text-slate-400 mt-1.5">Add pickup & dropoff stops for your shipment.</p>
                     </div>

                     <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        {FormContent}
                     </div>
                  </motion.div>
               </div>
            ) : (
               <div className="px-1">
                  {FormContent}
               </div>
            )}
         </motion.main>

         <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-neutral-100 flex justify-around py-3 rounded-2xl shadow-xl z-50">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 text-slate-300">
               <TrendingUp className="w-5 h-5" />
               <span className="text-[8px] font-semibold uppercase tracking-tighter">Dash</span>
            </Link>
            <div className="flex flex-col items-center gap-1 text-primary">
               <div className="relative">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white -mt-6">
                     <Plus className="w-6 h-6" />
                  </div>
               </div>
               <span className="text-[8px] font-semibold uppercase tracking-tighter">New</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-slate-300">
               <DollarSign className="w-5 h-5" />
               <span className="text-[8px] font-semibold uppercase tracking-tighter">Ledger</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-slate-300">
               <div className="w-5 h-5 rounded-md bg-slate-100" />
               <span className="text-[8px] font-semibold uppercase tracking-tighter">Acc</span>
            </div>
         </nav>
      </div>
   );
}
