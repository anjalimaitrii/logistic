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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRouter } from "next/navigation";
import { bookingService } from "@/services/bookingService";

const TRUCK_TYPES = [
   { name: "Flat Bed", icon: "🚜", desc: "Open Platform", cap: "Required" },
   { name: "Walled", icon: "🚛", desc: "Enclosed Sides", cap: "Required" },
];

type LocationEntry = {
   contactPerson: string;
   contact: string;
   plotNo: string;
   street: string;
   city: string;
   pincode: string;
   gps: boolean;
};

const emptyLocation = (): LocationEntry => ({
   contactPerson: "", contact: "", plotNo: "", street: "", city: "", pincode: "", gps: false
});

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
               contact: stop.contactNumber || "",
               plotNo: stop.address?.plotNo || "",
               street: stop.address?.street || "",
               city: stop.address?.city || "",
               pincode: stop.address?.pincode || "",
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

function LocationSection({ type, label, color, locations, offset, isPickup, previousAddresses, onUpdate, onAdd, onRemove, onFill }: LocationSectionProps) {
   const a = ACCENT[color];
   const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
   const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                           onClick={() => onUpdate(type, idx, "gps", !loc.gps)}
                           className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-semibold uppercase tracking-tighter shadow-sm
                              ${loc.gps ? a.gpsOn : `bg-slate-50 border-slate-100 text-slate-400 ${a.gpsOff}`}`}
                        >
                           <Navigation className={`w-3 h-3 ${loc.gps ? "" : "opacity-40"}`} />
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

                  {/* Contact fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                        <input
                           type="text"
                           placeholder="Contact Person"
                           value={loc.contactPerson}
                           onChange={(e) => onUpdate(type, idx, "contactPerson", e.target.value)}
                           className={`w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white outline-none transition-all ${a.focus}`}
                        />
                     </div>
                     <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                        <input
                           type="tel"
                           placeholder="Contact Number *"
                           value={loc.contact}
                           onChange={(e) => onUpdate(type, idx, "contact", e.target.value)}
                           className={`w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white outline-none transition-all ${a.focus}`}
                        />
                     </div>
                  </div>

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
                        <div className="relative">
                           <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                           <input
                              type="text"
                              placeholder="City *"
                              value={loc.city}
                              onChange={(e) => onUpdate(type, idx, "city", e.target.value)}
                              onFocus={() => handleAddressFieldFocus(idx)}
                              onBlur={handleAddressFieldBlur}
                              className={`w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white outline-none transition-all ${a.focus}`}
                           />
                        </div>
                        <div className="relative">
                           <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 scale-x-[-1] rotate-180" />
                           <input
                              type="text"
                              placeholder="Pincode"
                              value={loc.pincode}
                              onChange={(e) => onUpdate(type, idx, "pincode", e.target.value)}
                              onFocus={() => handleAddressFieldFocus(idx)}
                              onBlur={handleAddressFieldBlur}
                              className={`w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white outline-none transition-all ${a.focus}`}
                           />
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
                                          {[prev.plotNo, prev.street, prev.city, prev.pincode].filter(Boolean).join(", ")}
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
   const [previousLocations, setPreviousLocations] = useState<LocationEntry[]>([]);

   useEffect(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
   }, []);

   useEffect(() => {
      const clientId = user?._id || user?.id;
      if (!clientId) return;
      bookingService.getAll(clientId).then((data: any) => {
         const bookings = Array.isArray(data) ? data : (data?.bookings || []);
         setPreviousLocations(extractPreviousLocations(bookings));
      }).catch(() => {});
   }, [user]);

   const [formData, setFormData] = useState({
      goodsType: "",
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
      setFormData(prev => ({
         ...prev,
         [type]: prev[type].map((loc, i) => i === idx ? { ...address } : loc),
      }));
   };

   const handleSubmit = async () => {
      const hasValidPickup = formData.pickupLocations.some(l => l.city && l.contact);
      const hasValidDropoff = formData.dropoffLocations.some(l => l.city && l.contact);

      if (!formData.goodsType || !hasValidPickup || !hasValidDropoff) {
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
            contactNumber: loc.contact,
            address: { plotNo: loc.plotNo, street: loc.street, city: loc.city, pincode: loc.pincode },
            gpsEnabled: loc.gps,
         })),
         dropoffLocations: formData.dropoffLocations.map((loc, idx) => ({
            sequence: idx + 1,
            contactPerson: loc.contactPerson,
            contactNumber: loc.contact,
            address: { plotNo: loc.plotNo, street: loc.street, city: loc.city, pincode: loc.pincode },
            gpsEnabled: loc.gps,
         })),
         requirement: { bodyType: formData.truckType },
         status: "pending",
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
                  <div className="relative group">
                     <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                     <input
                        type="text"
                        placeholder="e.g. Electronics"
                        value={formData.goodsType}
                        onChange={(e) => setFormData(prev => ({ ...prev, goodsType: e.target.value }))}
                        className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-primary/20 outline-none transition-all"
                     />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest ml-1">Approx Weight (kg) <span className="text-red-500">*</span></label>
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
            previousAddresses={previousLocations}
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
            previousAddresses={previousLocations}
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
