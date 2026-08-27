"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, MapPin, Package, Calendar,
  CheckCircle2, ArrowLeft, Users, Plus, Trash2, UserPlus, Phone, Navigation, Loader2, Clock
} from "lucide-react";
import { clientService } from "@/services/clientService";
import { bookingService } from "@/services/bookingService";
import { goodsTypeService } from "@/services/goodsTypeService";
import { AFRICAN_COUNTRIES, AFRICAN_STATES, AFRICAN_CITIES, CITY_TO_STATE } from "@/lib/africaLocations";
import ComboBox from "@/components/admin/ComboBox";
import { useCustomLocations } from "@/hooks/use-custom-locations";
import { todayAppDateKey } from "@/lib/datetime";
import { DIAL_CODES, cleanLocalNumber, inputMaxLenFor } from "@/lib/dialCodes";


interface CreateSecretJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const emptyLocation = () => ({ contactPerson: "", contactCode: "+260", contact: "", contactPerson2: "", contact2Code: "+260", contact2: "", plotNo: "", street: "", country: "", state: "", city: "" });

export default function CreateSecretJobModal({ isOpen, onClose, onSubmit }: CreateSecretJobModalProps) {
  // Shared with every other booking form, so a town added anywhere shows up here.
  const {
    countryOptions, stateOptionsFor, cityOptionsFor, createLocation, deleteLocation,
  } = useCustomLocations(isOpen);
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [withTax, setWithTax] = useState(true);
  const [goodsTypes, setGoodsTypes] = useState<{ _id: string; name: string }[]>([]);
  const [showGoodsManager, setShowGoodsManager] = useState(false);
  const [newGoodsInput, setNewGoodsInput] = useState("");
  const [showContact2, setShowContact2] = useState<{ pickup: boolean[]; dropoff: boolean[] }>({ pickup: [false], dropoff: [false] });
  const [gpsLoading, setGpsLoading] = useState<{ type: "pickup" | "dropoff"; idx: number } | null>(null);
  const [clientSuggestions, setClientSuggestions] = useState<ReturnType<typeof emptyLocation>[]>([]);
  // Floating previous-address dropdown — tracks which location card's address field is focused
  const [focusedAddr, setFocusedAddr] = useState<string | null>(null);
  const addrHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAddrFocus = (key: string) => { if (addrHideTimer.current) clearTimeout(addrHideTimer.current); if (clientSuggestions.length > 0) setFocusedAddr(key); };
  const onAddrBlur = () => { addrHideTimer.current = setTimeout(() => setFocusedAddr(null), 150); };

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
        const locs: ReturnType<typeof emptyLocation>[] = [];
        for (const booking of bookings || []) {
          const stops = [...(booking.pickupLocations || []), ...(booking.dropoffLocations || [])];
          for (const stop of stops) {
            const key = `${stop.address?.city}|${stop.address?.street}|${stop.address?.plotNo}`;
            if (!seen.has(key) && stop.address?.city) {
              seen.add(key);
              // Don't carry the contact from a past booking — only the address is reused.
              locs.push({ contactPerson: "", contactCode: "+260", contact: "", contactPerson2: "", contact2Code: "+260", contact2: "", plotNo: stop.address?.plotNo || "", street: stop.address?.street || "", country: stop.address?.country || "", state: stop.address?.state || "", city: stop.address?.city || "" });
            }
          }
        }
        setClientSuggestions(locs);
      } catch { setClientSuggestions([]); }
    })();
  }, [formData.clientId]);

  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      const data = await clientService.getAll();
      setClients(data || []);
    } catch { } finally {
      setIsLoadingClients(false);
    }
  };

  const loadGoodsTypes = async () => {
    try {
      const data = await goodsTypeService.getAll();
      setGoodsTypes(data || []);
    } catch { }
  };

  const addGoodsType = async () => {
    const val = newGoodsInput.trim();
    if (!val) return;
    try {
      const created = await goodsTypeService.create(val);
      setGoodsTypes(prev => [...prev, created]);
      setNewGoodsInput("");
    } catch { }
  };

  const deleteGoodsType = async (id: string, name: string) => {
    try {
      await goodsTypeService.remove(id);
      setGoodsTypes(prev => prev.filter(g => g._id !== id));
      setFormData(f => ({ ...f, goodsType: f.goodsType.filter(g => g !== name) }));
    } catch { }
  };

  const matchList = (raw: string, list: string[]) => {
    if (!raw) return "";
    const q = raw.toLowerCase();
    return list.find(l => l.toLowerCase() === q) || list.find(l => q.includes(l.toLowerCase()) || l.toLowerCase().includes(q)) || "";
  };
  const matchCountry = (raw: string) => {
    if (!raw) return "";
    const q = raw.toLowerCase();
    if (q.includes("congo") || q.includes("drc")) return "DRC (Congo)";
    return matchList(raw, AFRICAN_COUNTRIES);
  };

  const fetchGpsAddress = (type: "pickup" | "dropoff", idx: number) => {
    if (!navigator.geolocation) { alert("Geolocation not supported."); return; }
    setGpsLoading({ type, idx });
    const update = type === "pickup" ? updatePickup : updateDropoff;
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
          update(idx, "country", country);
          update(idx, "state", state);
          update(idx, "city", city);
          update(idx, "street", addr.road || addr.suburb || "");
        } catch { alert("Failed to fetch address."); }
        finally { setGpsLoading(null); }
      },
      () => { alert("Location access denied."); setGpsLoading(null); },
      { timeout: 10000 }
    );
  };

  const lbl = (pCount: number, dCount: number, isPick: boolean, idx: number) =>
    String.fromCharCode(65 + (isPick ? idx : pCount + idx));

  const isStep1Valid =
    !!formData.clientId &&
    formData.goodsType.length > 0 &&
    !!formData.scheduleDate;

  const isStep2Valid =
    formData.pickupLocations.some(l => l.contactPerson.trim() && l.contact.trim() && l.city.trim()) &&
    formData.dropoffLocations.some(l => l.contactPerson.trim() && l.contact.trim() && l.city.trim());

  const isNextDisabled = step === 1 ? !isStep1Valid : step === 2 ? !isStep2Valid : false;

  const sanitize = (key: string, val: string, loc?: any) => {
    if (key === "contactPerson" || key === "contactPerson2") return val.replace(/[0-9]/g, "");
    if (key === "contact") { const max = DIAL_CODES.find(d => d.code === loc?.contactCode)?.maxLen ?? 10; return val.replace(/\D/g, "").slice(0, max); }
    if (key === "contact2") { const max = DIAL_CODES.find(d => d.code === loc?.contact2Code)?.maxLen ?? 10; return val.replace(/\D/g, "").slice(0, max); }
    return val;
  };

  const toggleContact2 = (type: "pickup" | "dropoff", idx: number) => {
    setShowContact2(prev => {
      const arr = [...prev[type]];
      arr[idx] = !arr[idx];
      return { ...prev, [type]: arr };
    });
  };

  const updatePickup = (idx: number, key: string, val: string) => {
    const locs = [...formData.pickupLocations];
    (locs[idx] as any)[key] = sanitize(key, val, locs[idx]);
    setFormData({ ...formData, pickupLocations: locs });
  };

  const updateDropoff = (idx: number, key: string, val: string) => {
    const locs = [...formData.dropoffLocations];
    (locs[idx] as any)[key] = sanitize(key, val, locs[idx]);
    setFormData({ ...formData, dropoffLocations: locs });
  };

  // Fill ONLY the address fields from a suggestion — keep whatever contact the user typed.
  const fillPickup = (idx: number, addr: ReturnType<typeof emptyLocation>) => {
    const locs = [...formData.pickupLocations];
    locs[idx] = { ...locs[idx], plotNo: addr.plotNo, street: addr.street, city: addr.city, state: addr.state, country: addr.country };
    setFormData({ ...formData, pickupLocations: locs });
  };

  const fillDropoff = (idx: number, addr: ReturnType<typeof emptyLocation>) => {
    const locs = [...formData.dropoffLocations];
    locs[idx] = { ...locs[idx], plotNo: addr.plotNo, street: addr.street, city: addr.city, state: addr.state, country: addr.country };
    setFormData({ ...formData, dropoffLocations: locs });
  };

  const handleSubmit = async () => {
    if (!formData.clientId) { alert("Please select a client."); return; }
    if (formData.goodsType.length === 0) { alert("Please select at least one cargo type."); return; }
    if (!formData.pickupLocations.some(l => l.city && l.contactPerson && l.contact)) {
      alert("Please fill at least one complete pickup location."); return;
    }
    if (!formData.dropoffLocations.some(l => l.city && l.contactPerson && l.contact)) {
      alert("Please fill at least one complete dropoff location."); return;
    }

    try {
      await bookingService.create({
        clientId: formData.clientId,
        isSecret: true,
        withTax,
        cargoDetails: {
          goodsType: formData.goodsType,
          ...(formData.weight ? { weight: parseInt(formData.weight) } : {}),
          loadingDate: formData.scheduleDate,
        },
        pickupLocations: formData.pickupLocations.map((l, i) => ({
          sequence: i + 1,
          contactPerson: l.contactPerson,
          contactNumber: l.contactCode ? `${l.contactCode}${l.contact}` : l.contact,
          ...(l.contactPerson2.trim() && { contactPerson2: l.contactPerson2, contactNumber2: l.contact2Code ? `${l.contact2Code}${l.contact2}` : l.contact2 }),
          address: { plotNo: l.plotNo, street: l.street, country: l.country, state: l.state, city: l.city },
          gpsEnabled: false,
        })),
        dropoffLocations: formData.dropoffLocations.map((l, i) => ({
          sequence: i + 1,
          contactPerson: l.contactPerson,
          contactNumber: l.contactCode ? `${l.contactCode}${l.contact}` : l.contact,
          ...(l.contactPerson2.trim() && { contactPerson2: l.contactPerson2, contactNumber2: l.contact2Code ? `${l.contact2Code}${l.contact2}` : l.contact2 }),
          address: { plotNo: l.plotNo, street: l.street, country: l.country, state: l.state, city: l.city },
          gpsEnabled: false,
        })),
        requirement: { bodyType: formData.truckType },
        status: "active",
        metadata: { source: "secret_panel", createdAt: new Date().toISOString(), isSecret: true },
      } as any);

      onSubmit(formData);
      onClose();
      setStep(1);
      setShowContact2({ pickup: [false], dropoff: [false] });
      setFormData({ clientId: "", goodsType: [], weight: "", scheduleDate: todayAppDateKey(), pickupLocations: [emptyLocation()], dropoffLocations: [emptyLocation()], truckType: "Flat Bed" });
    } catch (err) {
      console.error(err);
      alert("Failed to create job. Please try again.");
    }
  };

  if (!isOpen) return null;

  // An address picked on one side must not appear as a suggestion on the other.
  const locKey = (l: any) =>
    `${(l?.city || "").trim().toLowerCase()}|${(l?.street || "").trim().toLowerCase()}|${(l?.plotNo || "").trim().toLowerCase()}`;
  const pickedPickupKeys = new Set(formData.pickupLocations.map(locKey));
  const pickedDropoffKeys = new Set(formData.dropoffLocations.map(locKey));
  const pickupSuggestions = clientSuggestions.filter((s) => !pickedDropoffKeys.has(locKey(s)));
  const dropoffSuggestions = clientSuggestions.filter((s) => !pickedPickupKeys.has(locKey(s)));

  return (
    <div className="fixed inset-0 z-[600] pointer-events-none">
      <div
        className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl pointer-events-auto flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">Create Special Job</h2>
            <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-widest">Secret panel · Tax configurable</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-xl text-neutral-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 bg-neutral-50/50 border-b border-neutral-100 flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step >= s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white border border-neutral-200 text-neutral-400"}`}>
                {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-[2px] rounded-full ${step > s ? "bg-primary" : "bg-neutral-200"}`} />}
            </div>
          ))}
          <span className="ml-auto text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Step {step} of 3</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Client, Cargo, Tax ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                {/* TAX TOGGLE — extra field */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[12px] font-bold text-neutral-900">Tax Configuration</h3>
                      <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Toggle GST/Tax inclusion for this job</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-neutral-100 shadow-sm">
                      <button
                        onClick={() => setWithTax(true)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${withTax ? "bg-primary text-white shadow-md" : "text-neutral-400 hover:text-neutral-600"}`}
                      >WITH TAX</button>
                      <button
                        onClick={() => setWithTax(false)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${!withTax ? "bg-amber-500 text-white shadow-md" : "text-neutral-400 hover:text-neutral-600"}`}
                      >WITHOUT TAX</button>
                    </div>
                  </div>
                  {!withTax && (
                    <div className="flex items-center gap-3 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                      <span>⚠️</span>
                      <p className="text-[10px] font-bold text-amber-700">Without Tax — ensure documentation is logged in the Special Ledger.</p>
                    </div>
                  )}
                </div>

                {/* Client */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2">Client & Cargo</h3>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest">Select Client <span className="text-red-500">*</span></label>
                      <Link href="/admin/clients" className="flex items-center gap-1 text-[9px] font-bold text-primary uppercase tracking-widest hover:underline">
                        <UserPlus className="w-3 h-3" /> Add Client
                      </Link>
                    </div>
                    <div className="relative group">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                      <select
                        value={formData.clientId}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                        className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-semibold text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm cursor-pointer appearance-none"
                      >
                        <option value="">Choose Client...</option>
                        {clients.map(c => <option key={c._id} value={c._id}>{c.company?.companyName ? `${c.company.companyName} (${c.name})` : c.name}</option>)}
                      </select>
                    </div>
                    {isLoadingClients && <p className="text-[9px] text-primary animate-pulse ml-1">Fetching clients...</p>}
                  </div>

                  <div className="space-y-4">
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
                            <input type="text" value={newGoodsInput} onChange={(e) => setNewGoodsInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGoodsType()} placeholder="New goods type..." className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg py-1.5 px-3 text-[12px] outline-none focus:border-primary/30" />
                            <button type="button" onClick={addGoodsType} className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all">Add</button>
                          </div>
                          <div className="max-h-36 overflow-y-auto space-y-1">
                            {goodsTypes.map(g => (
                              <div key={g._id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-neutral-50">
                                <span className="text-[12px] font-medium text-neutral-700">{g.name}</span>
                                <button type="button" onClick={() => deleteGoodsType(g._id, g.name)} className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
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
                      <input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="0" className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Schedule Date <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                      <input type="date" value={formData.scheduleDate} min={todayAppDateKey()} onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })} className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Requirement</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ name: "Flat Bed", icon: "🚛" }, { name: "Side Drop", icon: "🚚" }].map((truck) => (
                        <button
                          key={truck.name}
                          onClick={() => setFormData({ ...formData, truckType: truck.name })}
                          className={`p-3 rounded-xl border flex flex-col items-center transition-all group ${formData.truckType === truck.name ? "bg-primary border-primary shadow-lg shadow-primary/20 text-white" : "bg-white border-neutral-100 hover:border-primary/20 text-neutral-900"}`}
                        >
                          <span className={`text-xl mb-1 transition-transform group-hover:scale-110 ${formData.truckType === truck.name ? "" : "filter grayscale opacity-50"}`}>{truck.icon}</span>
                          <span className="text-[11px] font-semibold">{truck.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Locations ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2">Location Logistics</h3>

                {/* Pickup Locations */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pickup Locations</span>
                    <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">{formData.pickupLocations.length}</span>
                  </div>
                  {formData.pickupLocations.map((loc, idx) => (
                    <div key={idx} className="space-y-3 p-4 rounded-2xl bg-emerald-50/10 border border-emerald-100/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-bold">
                            {lbl(formData.pickupLocations.length, formData.dropoffLocations.length, true, idx)}
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-700">Pickup Stop</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => fetchGpsAddress("pickup", idx)} disabled={!!gpsLoading} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-100 transition-colors disabled:opacity-50">
                            {gpsLoading?.type === "pickup" && gpsLoading.idx === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                            GPS
                          </button>
                          {formData.pickupLocations.length > 1 && (
                            <button onClick={() => { setFormData({ ...formData, pickupLocations: formData.pickupLocations.filter((_, i) => i !== idx) }); setShowContact2(prev => ({ ...prev, pickup: prev.pickup.filter((_, i) => i !== idx) })); }} className="text-[10px] font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors">Remove</button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <input placeholder="Contact Person *" value={loc.contactPerson} onChange={(e) => updatePickup(idx, "contactPerson", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                        <div className="flex items-center bg-white border border-neutral-100 rounded-lg focus-within:border-neutral-300 transition-colors">
                          <Phone className="ml-3 w-3.5 h-3.5 text-neutral-300 shrink-0" />
                          <select value={loc.contactCode} onChange={(e) => updatePickup(idx, "contactCode", e.target.value)} className="bg-transparent py-2 pl-2 pr-1 text-[11px] font-semibold text-neutral-500 outline-none appearance-none cursor-pointer border-r border-neutral-100 shrink-0">
                            <option value="">+</option>
                            {DIAL_CODES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                          </select>
                          <input type="tel" placeholder="Contact Number *" value={loc.contact} maxLength={inputMaxLenFor(loc.contactCode)} onChange={(e) => updatePickup(idx, "contact", cleanLocalNumber(e.target.value, loc.contactCode))} className="flex-1 bg-transparent py-2 pl-3 pr-3 text-[12px] outline-none min-w-0" />
                        </div>
                      </div>
                      <button type="button" onClick={() => toggleContact2("pickup", idx)} className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${showContact2.pickup[idx] ? "text-emerald-600" : "text-neutral-400 hover:text-neutral-600"}`}>
                        <UserPlus className="w-3 h-3" />
                        {showContact2.pickup[idx] ? "Remove 2nd Contact" : "+ Add 2nd Contact (Optional)"}
                      </button>
                      {showContact2.pickup[idx] && (
                        <div className="grid grid-cols-1 gap-3 pt-1 border-t border-dashed border-neutral-100">
                          <input placeholder="2nd Contact Person" value={loc.contactPerson2} onChange={(e) => updatePickup(idx, "contactPerson2", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                          <div className="flex items-center bg-white border border-neutral-100 rounded-lg focus-within:border-neutral-300 transition-colors">
                            <Phone className="ml-3 w-3.5 h-3.5 text-neutral-300 shrink-0" />
                            <select value={loc.contact2Code} onChange={(e) => updatePickup(idx, "contact2Code", e.target.value)} className="bg-transparent py-2 pl-2 pr-1 text-[11px] font-semibold text-neutral-500 outline-none appearance-none cursor-pointer border-r border-neutral-100 shrink-0">
                              <option value="">+</option>
                              {DIAL_CODES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                            </select>
                            <input type="tel" placeholder="2nd Contact Number" value={loc.contact2} maxLength={inputMaxLenFor(loc.contact2Code)} onChange={(e) => updatePickup(idx, "contact2", cleanLocalNumber(e.target.value, loc.contact2Code))} className="flex-1 bg-transparent py-2 pl-3 pr-3 text-[12px] outline-none min-w-0" />
                          </div>
                        </div>
                      )}
                      <div className="relative">
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Plot/Shop No" value={loc.plotNo} onChange={(e) => updatePickup(idx, "plotNo", e.target.value)} onFocus={() => onAddrFocus(`pickup-${idx}`)} onBlur={onAddrBlur} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                        <input placeholder="Street/Building" value={loc.street} onChange={(e) => updatePickup(idx, "street", e.target.value)} onFocus={() => onAddrFocus(`pickup-${idx}`)} onBlur={onAddrBlur} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                      </div>
                      <div className="mt-3">
                        <ComboBox
                          value={loc.country}
                          options={countryOptions}
                          placeholder="Country *"
                          className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none disabled:opacity-50"
                          onChange={(name) => { updatePickup(idx, "country", name); updatePickup(idx, "state", ""); updatePickup(idx, "city", ""); }}
                          onCreate={(name) => createLocation("country", name, {})}
                          onDelete={deleteLocation}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <ComboBox
                          value={loc.state}
                          options={stateOptionsFor(loc.country)}
                          placeholder="State / Province"
                          disabled={!loc.country}
                          className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none disabled:opacity-50"
                          onChange={(name) => { updatePickup(idx, "state", name); updatePickup(idx, "city", ""); }}
                          onCreate={(name) => createLocation("state", name, { country: loc.country })}
                          onDelete={deleteLocation}
                        />
                        <ComboBox
                          value={loc.city}
                          options={cityOptionsFor(loc.country)}
                          placeholder="City *"
                          disabled={!loc.country}
                          className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none disabled:opacity-50"
                          onChange={(name) => { updatePickup(idx, "city", name); const st = loc.country ? (CITY_TO_STATE[loc.country]?.[name] || "") : ""; if (st) updatePickup(idx, "state", st); }}
                          onCreate={(name) => createLocation("city", name, { country: loc.country, state: loc.state })}
                          onDelete={deleteLocation}
                        />
                      </div>
                      {focusedAddr === `pickup-${idx}` && pickupSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border border-neutral-200 bg-white shadow-xl overflow-hidden">
                          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-neutral-50">
                            <Clock className="w-3 h-3 text-neutral-300" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Previous Addresses</span>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {pickupSuggestions.map((s, i) => (
                              <button key={i} type="button" onMouseDown={(e) => { e.preventDefault(); fillPickup(idx, s); setFocusedAddr(null); }} className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0 flex items-center gap-2.5">
                                <MapPin className="w-3 h-3 text-neutral-300 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold text-slate-700 truncate">{[s.plotNo, s.street, s.city, s.state, s.country].filter(Boolean).join(", ")}</p>
                                  {s.contactPerson && <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{s.contactPerson} · {s.contact}</p>}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { setFormData({ ...formData, pickupLocations: [...formData.pickupLocations, emptyLocation()] }); setShowContact2(prev => ({ ...prev, pickup: [...prev.pickup, false] })); }} className="w-full py-2.5 border border-dashed border-emerald-300 rounded-lg text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors">
                    + Add Pickup Location
                  </button>
                </div>

                {/* Dropoff Locations */}
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Dropoff Locations</span>
                    <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-2 py-1 rounded">{formData.dropoffLocations.length}</span>
                  </div>
                  {formData.dropoffLocations.map((loc, idx) => (
                    <div key={idx} className="space-y-3 p-4 rounded-2xl bg-rose-50/10 border border-rose-100/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-[11px] font-bold">
                            {lbl(formData.pickupLocations.length, formData.dropoffLocations.length, false, idx)}
                          </div>
                          <span className="text-[10px] font-semibold text-rose-700">Dropoff Stop</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => fetchGpsAddress("dropoff", idx)} disabled={!!gpsLoading} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-[9px] font-bold uppercase tracking-wider hover:bg-rose-100 transition-colors disabled:opacity-50">
                            {gpsLoading?.type === "dropoff" && gpsLoading.idx === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                            GPS
                          </button>
                          {formData.dropoffLocations.length > 1 && (
                            <button onClick={() => { setFormData({ ...formData, dropoffLocations: formData.dropoffLocations.filter((_, i) => i !== idx) }); setShowContact2(prev => ({ ...prev, dropoff: prev.dropoff.filter((_, i) => i !== idx) })); }} className="text-[10px] font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors">Remove</button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <input placeholder="Contact Person *" value={loc.contactPerson} onChange={(e) => updateDropoff(idx, "contactPerson", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                        <div className="flex items-center bg-white border border-neutral-100 rounded-lg focus-within:border-neutral-300 transition-colors">
                          <Phone className="ml-3 w-3.5 h-3.5 text-neutral-300 shrink-0" />
                          <select value={loc.contactCode} onChange={(e) => updateDropoff(idx, "contactCode", e.target.value)} className="bg-transparent py-2 pl-2 pr-1 text-[11px] font-semibold text-neutral-500 outline-none appearance-none cursor-pointer border-r border-neutral-100 shrink-0">
                            <option value="">+</option>
                            {DIAL_CODES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                          </select>
                          <input type="tel" placeholder="Contact Number *" value={loc.contact} maxLength={inputMaxLenFor(loc.contactCode)} onChange={(e) => updateDropoff(idx, "contact", cleanLocalNumber(e.target.value, loc.contactCode))} className="flex-1 bg-transparent py-2 pl-3 pr-3 text-[12px] outline-none min-w-0" />
                        </div>
                      </div>
                      <button type="button" onClick={() => toggleContact2("dropoff", idx)} className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${showContact2.dropoff[idx] ? "text-rose-600" : "text-neutral-400 hover:text-neutral-600"}`}>
                        <UserPlus className="w-3 h-3" />
                        {showContact2.dropoff[idx] ? "Remove 2nd Contact" : "+ Add 2nd Contact (Optional)"}
                      </button>
                      {showContact2.dropoff[idx] && (
                        <div className="grid grid-cols-1 gap-3 pt-1 border-t border-dashed border-neutral-100">
                          <input placeholder="2nd Contact Person" value={loc.contactPerson2} onChange={(e) => updateDropoff(idx, "contactPerson2", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                          <div className="flex items-center bg-white border border-neutral-100 rounded-lg focus-within:border-neutral-300 transition-colors">
                            <Phone className="ml-3 w-3.5 h-3.5 text-neutral-300 shrink-0" />
                            <select value={loc.contact2Code} onChange={(e) => updateDropoff(idx, "contact2Code", e.target.value)} className="bg-transparent py-2 pl-2 pr-1 text-[11px] font-semibold text-neutral-500 outline-none appearance-none cursor-pointer border-r border-neutral-100 shrink-0">
                              <option value="">+</option>
                              {DIAL_CODES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
                            </select>
                            <input type="tel" placeholder="2nd Contact Number" value={loc.contact2} maxLength={inputMaxLenFor(loc.contact2Code)} onChange={(e) => updateDropoff(idx, "contact2", cleanLocalNumber(e.target.value, loc.contact2Code))} className="flex-1 bg-transparent py-2 pl-3 pr-3 text-[12px] outline-none min-w-0" />
                          </div>
                        </div>
                      )}
                      <div className="relative">
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Plot/Shop No" value={loc.plotNo} onChange={(e) => updateDropoff(idx, "plotNo", e.target.value)} onFocus={() => onAddrFocus(`dropoff-${idx}`)} onBlur={onAddrBlur} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                        <input placeholder="Street/Building" value={loc.street} onChange={(e) => updateDropoff(idx, "street", e.target.value)} onFocus={() => onAddrFocus(`dropoff-${idx}`)} onBlur={onAddrBlur} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                      </div>
                      <div className="mt-3">
                        <ComboBox
                          value={loc.country}
                          options={countryOptions}
                          placeholder="Country *"
                          className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none disabled:opacity-50"
                          onChange={(name) => { updateDropoff(idx, "country", name); updateDropoff(idx, "state", ""); updateDropoff(idx, "city", ""); }}
                          onCreate={(name) => createLocation("country", name, {})}
                          onDelete={deleteLocation}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <ComboBox
                          value={loc.state}
                          options={stateOptionsFor(loc.country)}
                          placeholder="State / Province"
                          disabled={!loc.country}
                          className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none disabled:opacity-50"
                          onChange={(name) => { updateDropoff(idx, "state", name); updateDropoff(idx, "city", ""); }}
                          onCreate={(name) => createLocation("state", name, { country: loc.country })}
                          onDelete={deleteLocation}
                        />
                        <ComboBox
                          value={loc.city}
                          options={cityOptionsFor(loc.country)}
                          placeholder="City *"
                          disabled={!loc.country}
                          className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none disabled:opacity-50"
                          onChange={(name) => { updateDropoff(idx, "city", name); const st = loc.country ? (CITY_TO_STATE[loc.country]?.[name] || "") : ""; if (st) updateDropoff(idx, "state", st); }}
                          onCreate={(name) => createLocation("city", name, { country: loc.country, state: loc.state })}
                          onDelete={deleteLocation}
                        />
                      </div>
                      {focusedAddr === `dropoff-${idx}` && dropoffSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border border-neutral-200 bg-white shadow-xl overflow-hidden">
                          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-neutral-50">
                            <Clock className="w-3 h-3 text-neutral-300" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Previous Addresses</span>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {dropoffSuggestions.map((s, i) => (
                              <button key={i} type="button" onMouseDown={(e) => { e.preventDefault(); fillDropoff(idx, s); setFocusedAddr(null); }} className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0 flex items-center gap-2.5">
                                <MapPin className="w-3 h-3 text-neutral-300 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold text-slate-700 truncate">{[s.plotNo, s.street, s.city, s.state, s.country].filter(Boolean).join(", ")}</p>
                                  {s.contactPerson && <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{s.contactPerson} · {s.contact}</p>}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { setFormData({ ...formData, dropoffLocations: [...formData.dropoffLocations, emptyLocation()] }); setShowContact2(prev => ({ ...prev, dropoff: [...prev.dropoff, false] })); }} className="w-full py-2.5 border border-dashed border-rose-300 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
                    + Add Dropoff Location
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Review ── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-emerald-900">Review & Confirm</h4>
                    <p className="text-[10px] font-medium text-emerald-600/80">Special job will be created in active state.</p>
                  </div>
                </div>

                {/* Tax badge */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${withTax ? "bg-primary/5 border-primary/20 text-primary" : "bg-amber-50 border-amber-100 text-amber-700"}`}>
                  <span className="text-lg">{withTax ? "🧾" : "🔒"}</span>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest">{withTax ? "With Tax (GST Inclusive)" : "Without Tax Job"}</div>
                    <div className="text-[9px] font-medium opacity-70 mt-0.5">{withTax ? "Standard taxation applies" : "Ensure proper documentation is logged"}</div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-4">
                  <div className="space-y-2">
                    <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Selected Client</div>
                    <div className="text-[12px] font-semibold text-slate-900">{clients.find(c => c._id === formData.clientId)?.name || "N/A"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Cargo</div>
                      <div className="text-[11px] font-medium text-slate-700">{formData.goodsType.join(", ")} ({formData.weight}kg)</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Vehicle</div>
                      <div className="text-[11px] font-medium text-slate-700">{formData.truckType}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Pickup Route</div>
                  {formData.pickupLocations.map((loc, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {lbl(formData.pickupLocations.length, formData.dropoffLocations.length, true, idx)}
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-900 text-[11px]">{loc.city}</div>
                        <div className="text-emerald-600 text-[9px] mt-0.5">{loc.contactPerson} · {loc.contact}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center"><div className="text-2xl text-neutral-300">↓</div></div>

                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Dropoff Route</div>
                  {formData.dropoffLocations.map((loc, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {lbl(formData.pickupLocations.length, formData.dropoffLocations.length, false, idx)}
                      </div>
                      <div>
                        <div className="font-semibold text-rose-900 text-[11px]">{loc.city}</div>
                        <div className="text-rose-600 text-[9px] mt-0.5">{loc.contactPerson} · {loc.contact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 bg-white flex items-center gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-3 border border-neutral-100 rounded-xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          <button
            onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
            disabled={isNextDisabled}
            className={`flex-1 px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isNextDisabled ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" : "bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"}`}
          >
            {step === 3 ? "Create Special Job" : "Next Details"}
            {step < 3 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
