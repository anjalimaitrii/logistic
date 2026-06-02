"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  MapPin,
  Package,
  Phone,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  User,
  Hash,
  Building,
  Users,
  Navigation,
  Loader2,
  Trash2,
  Plus,
  UserPlus
} from "lucide-react";
import { clientService } from "@/services/clientService";
import { bookingService } from "@/services/bookingService";
import { goodsTypeService } from "@/services/goodsTypeService";

interface CreateBookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface LocationEntry {
  contactPerson: string;
  contact: string;
  contactPerson2: string;
  contact2: string;
  plotNo: string;
  street: string;
  city: string;
  lga: string;
}

const NIGERIAN_CITIES = [
  "Abuja", "Abeokuta", "Ado-Ekiti", "Akure", "Asaba", "Awka",
  "Bauchi", "Benin City", "Birnin Kebbi", "Calabar",
  "Damaturu", "Delta", "Dutse", "Effurun",
  "Enugu", "Gombe", "Gusau", "Ibadan", "Ikeja", "Ilorin",
  "Jalingo", "Jos", "Kaduna", "Kano", "Katsina",
  "Lagos", "Lafia", "Lekki", "Lokoja", "Maiduguri",
  "Makurdi", "Minna", "Onitsha", "Osogbo", "Owerri",
  "Oyo", "Port Harcourt", "Sapele", "Sokoto", "Surulere",
  "Umuahia", "Uyo", "Victoria Island", "Warri", "Yenagoa", "Yola", "Zaria",
];

const emptyLocation = (): LocationEntry => ({
  contactPerson: "",
  contact: "",
  contactPerson2: "",
  contact2: "",
  plotNo: "",
  street: "",
  city: "",
  lga: "",
});

export default function CreateBookingDrawer({ isOpen, onClose, onSubmit }: CreateBookingDrawerProps) {
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [gpsLoading, setGpsLoading] = useState<{ type: "pickup" | "dropoff"; idx: number } | null>(null);

  const [goodsTypes, setGoodsTypes] = useState<{ _id: string; name: string }[]>([]);
  const [showGoodsManager, setShowGoodsManager] = useState(false);
  const [newGoodsInput, setNewGoodsInput] = useState("");

  // Track which location cards have the 2nd contact expanded
  const [showContact2, setShowContact2] = useState<{ pickup: boolean[]; dropoff: boolean[] }>({
    pickup: [false],
    dropoff: [false],
  });

  const [formData, setFormData] = useState({
    clientId: "",
    goodsType: "",
    weight: "",
    scheduleDate: new Date().toISOString().split("T")[0],
    pickupLocations: [emptyLocation()],
    dropoffLocations: [emptyLocation()],
    truckType: "Flat Bed",
  });

  useEffect(() => {
    if (isOpen) {
      loadClients();
      loadGoodsTypes();
    }
  }, [isOpen]);

  const loadGoodsTypes = async () => {
    try {
      const data = await goodsTypeService.getAll();
      setGoodsTypes(data || []);
    } catch { /* silent */ }
  };

  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      const data = await clientService.getAll();
      setClients(data || []);
    } catch (error) {
      console.error("Failed to load clients:", error);
    } finally {
      setIsLoadingClients(false);
    }
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
      if (formData.goodsType === name) setFormData(f => ({ ...f, goodsType: "" }));
    } catch { /* silent */ }
  };

  const fetchGpsAddress = (type: "pickup" | "dropoff", idx: number) => {
    if (!navigator.geolocation) { alert("Geolocation not supported by this browser."); return; }
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
          const city   = addr.city || addr.town || addr.village || "";
          const lga    = addr.county || addr.state_district || "";
          const street = addr.road || addr.suburb || addr.neighbourhood || "";

          setFormData(prev => {
            const key = type === "pickup" ? "pickupLocations" : "dropoffLocations";
            const locs = prev[key].map((loc, i) =>
              i === idx ? { ...loc, city, lga, street } : loc
            );
            return { ...prev, [key]: locs };
          });
        } catch {
          alert("Failed to fetch address. Please try again.");
        } finally {
          setGpsLoading(null);
        }
      },
      () => { alert("Location access denied. Please allow location permission."); setGpsLoading(null); },
      { timeout: 10000 }
    );
  };

  const getLocationLabel = (pickupCount: number, dropoffCount: number, isPicking: boolean, idx: number) => {
    const charCode = 65;
    return isPicking
      ? String.fromCharCode(charCode + idx)
      : String.fromCharCode(charCode + pickupCount + idx);
  };

  const updateLoc = (
    type: "pickup" | "dropoff",
    idx: number,
    field: keyof LocationEntry,
    value: string
  ) => {
    const key = type === "pickup" ? "pickupLocations" : "dropoffLocations";
    setFormData(prev => {
      const locs = prev[key].map((loc, i) =>
        i === idx ? { ...loc, [field]: value } : loc
      );
      return { ...prev, [key]: locs };
    });
  };

  const addLocation = (type: "pickup" | "dropoff") => {
    const key = type === "pickup" ? "pickupLocations" : "dropoffLocations";
    setFormData(prev => ({ ...prev, [key]: [...prev[key], emptyLocation()] }));
    setShowContact2(prev => ({
      ...prev,
      [type]: [...prev[type], false],
    }));
  };

  const removeLocation = (type: "pickup" | "dropoff", idx: number) => {
    const key = type === "pickup" ? "pickupLocations" : "dropoffLocations";
    setFormData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
    setShowContact2(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== idx),
    }));
  };

  const toggleContact2 = (type: "pickup" | "dropoff", idx: number) => {
    setShowContact2(prev => {
      const arr = [...prev[type]];
      arr[idx] = !arr[idx];
      return { ...prev, [type]: arr };
    });
  };

  const isStep1Valid =
    !!formData.clientId &&
    !!formData.goodsType.trim() &&
    !!formData.weight &&
    !!formData.scheduleDate;

  const isStep2Valid =
    formData.pickupLocations.some(loc => loc.contactPerson.trim() && loc.contact.trim() && loc.city.trim()) &&
    formData.dropoffLocations.some(loc => loc.contactPerson.trim() && loc.contact.trim() && loc.city.trim());

  const isNextDisabled = step === 1 ? !isStep1Valid : step === 2 ? !isStep2Valid : false;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleFormSubmit = async () => {
    if (!formData.clientId) { alert("Please select a client."); return; }
    if (!formData.goodsType || !formData.weight) { alert("Please fill in cargo details."); return; }
    if (!formData.pickupLocations.some(loc => loc.city && loc.contactPerson && loc.contact)) {
      alert("Please fill at least one complete pickup location."); return;
    }
    if (!formData.dropoffLocations.some(loc => loc.city && loc.contactPerson && loc.contact)) {
      alert("Please fill at least one complete dropoff location."); return;
    }

    try {
      const selectedClient = clients.find(c => c._id === formData.clientId);

      const mapLocation = (loc: LocationEntry, idx: number) => ({
        sequence: idx + 1,
        contactPerson: loc.contactPerson,
        contactNumber: loc.contact,
        ...(loc.contactPerson2.trim() && {
          contactPerson2: loc.contactPerson2,
          contactNumber2: loc.contact2,
        }),
        address: {
          plotNo: loc.plotNo,
          street: loc.street,
          city: loc.city,
          lga: loc.lga,
        },
        gpsEnabled: false,
      });

      const payload = {
        clientId: formData.clientId,
        cargoDetails: {
          goodsType: formData.goodsType,
          weight: parseInt(formData.weight),
          loadingDate: formData.scheduleDate,
        },
        pickupLocations: formData.pickupLocations.map(mapLocation),
        dropoffLocations: formData.dropoffLocations.map(mapLocation),
        requirement: { bodyType: formData.truckType },
        status: "active",
        metadata: {
          source: "admin_manual_entry",
          createdAt: new Date().toISOString(),
          client: selectedClient?.name || "",
        },
      };

      const response = await bookingService.create(payload);
      if (response) {
        alert("Booking created successfully!");
        onSubmit(formData);
        onClose();
        setStep(1);
      }
    } catch (error) {
      console.error("Failed to create booking:", error);
      alert("Failed to create booking. Please try again.");
    }
  };

  if (!isOpen) return null;

  const LocationCard = ({
    type,
    location,
    idx,
    color,
  }: {
    type: "pickup" | "dropoff";
    location: LocationEntry;
    idx: number;
    color: "emerald" | "rose";
  }) => {
    const isPickup = type === "pickup";
    const totalPickups = formData.pickupLocations.length;
    const totalDropoffs = formData.dropoffLocations.length;
    const label = getLocationLabel(totalPickups, totalDropoffs, isPickup, idx);
    const show2 = showContact2[type][idx];
    const canRemove = isPickup ? totalPickups > 1 : totalDropoffs > 1;

    const inputCls = `w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none focus:border-${color}-200 transition-colors`;

    return (
      <div className={`space-y-3 p-4 rounded-2xl bg-${color}-50/10 border border-${color}-100/30`}>
        {/* Card header */}
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
              onClick={() => fetchGpsAddress(type, idx)}
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
                onClick={() => removeLocation(type, idx)}
                className="text-[10px] font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Primary contact */}
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Contact Person *"
            value={location.contactPerson}
            onChange={(e) => updateLoc(type, idx, "contactPerson", e.target.value.replace(/[0-9]/g, ""))}
            className={inputCls}
          />
          <input
            placeholder="Contact Number *"
            value={location.contact}
            inputMode="numeric"
            maxLength={15}
            onChange={(e) => updateLoc(type, idx, "contact", e.target.value.replace(/\D/g, "").slice(0, 15))}
            className={inputCls}
          />
        </div>

        {/* 2nd contact toggle */}
        <button
          type="button"
          onClick={() => toggleContact2(type, idx)}
          className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${show2 ? `text-${color}-600` : "text-neutral-400 hover:text-neutral-600"}`}
        >
          <UserPlus className="w-3 h-3" />
          {show2 ? "Remove 2nd Contact" : "+ Add 2nd Contact (Optional)"}
        </button>

        {/* 2nd contact fields */}
        {show2 && (
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-dashed border-neutral-100">
            <input
              placeholder="2nd Contact Person"
              value={location.contactPerson2}
              onChange={(e) => updateLoc(type, idx, "contactPerson2", e.target.value.replace(/[0-9]/g, ""))}
              className={inputCls}
            />
            <input
              placeholder="2nd Contact Number"
              value={location.contact2}
              inputMode="numeric"
              maxLength={15}
              onChange={(e) => updateLoc(type, idx, "contact2", e.target.value.replace(/\D/g, "").slice(0, 15))}
              className={inputCls}
            />
          </div>
        )}

        {/* Address row 1 */}
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Plot/Shop No"
            value={location.plotNo}
            onChange={(e) => updateLoc(type, idx, "plotNo", e.target.value)}
            className={inputCls}
          />
          <input
            placeholder="Street/Building"
            value={location.street}
            onChange={(e) => updateLoc(type, idx, "street", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Address row 2 — City + LGA */}
        <div className="grid grid-cols-2 gap-3">
          <select
            value={location.city}
            onChange={(e) => updateLoc(type, idx, "city", e.target.value)}
            className={`${inputCls} appearance-none cursor-pointer`}
          >
            <option value="">City *</option>
            {NIGERIAN_CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            placeholder="LGA"
            value={location.lga}
            onChange={(e) => updateLoc(type, idx, "lga", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-600 pointer-events-none">
      <div
        className={`absolute inset-0 bg-neutral-900/30 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-120 bg-white shadow-2xl transition-transform duration-300 pointer-events-auto flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">Create New Booking</h2>
            <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-widest">Manual entry from admin panel</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-xl text-neutral-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-neutral-50/50 border-b border-neutral-100 flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step >= s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white border border-neutral-200 text-neutral-400"}`}>
                {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 rounded-full ${step > s ? "bg-primary" : "bg-neutral-200"}`} />}
            </div>
          ))}
          <span className="ml-auto text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            Step {step} of 3
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2">Client & Cargo</h3>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Select Client <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                      <select
                        value={formData.clientId}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                        className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-semibold text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm cursor-pointer appearance-none"
                      >
                        <option value="">Choose Client...</option>
                        {clients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}
                      </select>
                    </div>
                    {isLoadingClients && <p className="text-[9px] text-primary animate-pulse ml-1">Fetching active clients...</p>}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest">Type of Goods <span className="text-red-500">*</span></label>
                      <button
                        type="button"
                        onClick={() => setShowGoodsManager(v => !v)}
                        className="flex items-center gap-1 text-[9px] font-bold text-primary uppercase tracking-widest hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Manage
                      </button>
                    </div>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                      <select
                        value={formData.goodsType}
                        onChange={(e) => setFormData({ ...formData, goodsType: e.target.value })}
                        className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="">Select goods type...</option>
                        {goodsTypes.map(g => <option key={g._id} value={g.name}>{g.name}</option>)}
                      </select>
                    </div>
                    {showGoodsManager && (
                      <div className="bg-white border border-neutral-100 rounded-xl p-3 shadow-sm space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newGoodsInput}
                            onChange={(e) => setNewGoodsInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addGoodsType()}
                            placeholder="New goods type..."
                            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg py-1.5 px-3 text-[12px] outline-none focus:border-primary/30"
                          />
                          <button
                            type="button"
                            onClick={addGoodsType}
                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all"
                          >
                            Add
                          </button>
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1">
                          {goodsTypes.map(g => (
                            <div key={g._id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-neutral-50">
                              <span className="text-[12px] font-medium text-neutral-700">{g.name}</span>
                              <button
                                type="button"
                                onClick={() => deleteGoodsType(g._id, g.name)}
                                className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Weight (kg) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="0"
                      className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Schedule Date <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                      <input
                        type="date"
                        value={formData.scheduleDate}
                        onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                        className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Requirement</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: "Flat Bed", icon: "🚜" },
                        { name: "Walled", icon: "🚛" },
                      ].map((truck) => (
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

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2">Location Logistics</h3>

                  {/* Pickup Locations */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pickup Locations</span>
                      <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">{formData.pickupLocations.length}</span>
                    </div>
                    {formData.pickupLocations.map((location, idx) => (
                      <LocationCard key={idx} type="pickup" location={location} idx={idx} color="emerald" />
                    ))}
                    <button
                      onClick={() => addLocation("pickup")}
                      className="w-full py-2.5 border border-dashed border-emerald-300 rounded-lg text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      + Add Pickup Location
                    </button>
                  </div>

                  {/* Dropoff Locations */}
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Dropoff Locations</span>
                      <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-2 py-1 rounded">{formData.dropoffLocations.length}</span>
                    </div>
                    {formData.dropoffLocations.map((location, idx) => (
                      <LocationCard key={idx} type="dropoff" location={location} idx={idx} color="rose" />
                    ))}
                    <button
                      onClick={() => addLocation("dropoff")}
                      className="w-full py-2.5 border border-dashed border-rose-300 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      + Add Dropoff Location
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-emerald-900">Review & Confirm</h4>
                    <p className="text-[10px] font-medium text-emerald-600/80">Manual booking will be created in active state.</p>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-4">
                  <div className="space-y-2">
                    <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Selected Client</div>
                    <div className="text-[12px] font-semibold text-slate-900">
                      {clients.find(c => c._id === formData.clientId)?.name || "N/A"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Cargo</div>
                      <div className="text-[11px] font-medium text-slate-700">{formData.goodsType} ({formData.weight}kg)</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Vehicle</div>
                      <div className="text-[11px] font-medium text-slate-700">{formData.truckType}</div>
                    </div>
                  </div>
                </div>

                {/* Pickup Summary */}
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Pickup Route</div>
                  <div className="space-y-2">
                    {formData.pickupLocations.map((location, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {getLocationLabel(formData.pickupLocations.length, formData.dropoffLocations.length, true, idx)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-emerald-900 text-[11px]">{location.city}{location.lga ? `, ${location.lga}` : ""}</div>
                          <div className="text-emerald-600 text-[9px] mt-0.5">{location.contactPerson} · {location.contact}</div>
                          {location.contactPerson2 && (
                            <div className="text-emerald-500 text-[9px]">{location.contactPerson2} · {location.contact2}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center py-2">
                  <div className="text-2xl text-neutral-300">↓</div>
                </div>

                {/* Dropoff Summary */}
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Dropoff Route</div>
                  <div className="space-y-2">
                    {formData.dropoffLocations.map((location, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {getLocationLabel(formData.pickupLocations.length, formData.dropoffLocations.length, false, idx)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-rose-900 text-[11px]">{location.city}{location.lga ? `, ${location.lga}` : ""}</div>
                          <div className="text-rose-600 text-[9px] mt-0.5">{location.contactPerson} · {location.contact}</div>
                          {location.contactPerson2 && (
                            <div className="text-rose-500 text-[9px]">{location.contactPerson2} · {location.contact2}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Journey Flow */}
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Complete Journey Path</div>
                  <div className="p-3 bg-gradient-to-r from-emerald-50 via-neutral-50 to-rose-50 rounded-xl border border-neutral-200">
                    <div className="space-y-2 text-[10px]">
                      <div className="flex items-center gap-1 flex-wrap">
                        {formData.pickupLocations.map((location, idx) => (
                          <div key={`pickup-${idx}`} className="flex items-center gap-1">
                            <div className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                              {getLocationLabel(formData.pickupLocations.length, formData.dropoffLocations.length, true, idx)}
                            </div>
                            <div className="text-neutral-600 font-medium">{location.city}</div>
                            {idx < formData.pickupLocations.length - 1 && <span className="text-neutral-400">→</span>}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center py-1">
                        <div className="text-lg text-neutral-300">↓</div>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {formData.dropoffLocations.map((location, idx) => (
                          <div key={`dropoff-${idx}`} className="flex items-center gap-1">
                            <div className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 font-bold">
                              {getLocationLabel(formData.pickupLocations.length, formData.dropoffLocations.length, false, idx)}
                            </div>
                            <div className="text-neutral-600 font-medium">{location.city}</div>
                            {idx < formData.dropoffLocations.length - 1 && <span className="text-neutral-400">→</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 bg-white flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-neutral-100 rounded-xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
          <button
            onClick={step === 3 ? handleFormSubmit : handleNext}
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
