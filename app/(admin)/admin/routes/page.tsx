"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { routeService, RouteEntry } from "@/services/routeService";
import { mileageService, MileageConfig } from "@/services/mileageService";
import { AFRICAN_COUNTRIES, AFRICAN_STATES, AFRICAN_CITIES } from "@/lib/africaLocations";
import {
  Plus, MapPin, Ruler, Landmark, Wallet, Receipt,
  Pencil, Trash2, X, ChevronRight, CheckCircle2, ArrowRight, Gauge,
} from "lucide-react";

const emptyForm = (): Omit<RouteEntry, "_id"> => ({
  pickupCountry: "",
  pickupCity: "",
  pickupProvince: "",
  dropoffCountry: "",
  dropoffCity: "",
  dropoffProvince: "",
  distance: 0,
  tollCount: 0,
  tollAmount: 0,
  allocationMoney: 0,
  councilLevy: 0,
});

const inputCls = "w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 px-4 text-[13px] font-medium text-slate-900 outline-none focus:border-primary/40 focus:bg-white transition-all";
const selectCls = `${inputCls} appearance-none cursor-pointer`;

export default function RoutesMasterPage() {
  const [routes, setRoutes] = useState<RouteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Global mileage config
  const [mileageModal, setMileageModal] = useState(false);
  const [mileage, setMileage] = useState<MileageConfig>({ loadedMileage: 0, unloadedMileage: 0 });
  const [isSavingMileage, setIsSavingMileage] = useState(false);

  useEffect(() => {
    load();
    mileageService.get().then(setMileage).catch(() => {});
  }, []);

  const handleSaveMileage = async () => {
    setIsSavingMileage(true);
    try {
      const saved = await mileageService.save(mileage);
      setMileage(saved);
      setMileageModal(false);
    } catch { alert("Failed to save mileage."); }
    finally { setIsSavingMileage(false); }
  };

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await routeService.getAll();
      setRoutes(data);
    } catch { /* silent */ } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setDrawerOpen(true);
  };

  const openEdit = (r: RouteEntry) => {
    setForm({
      pickupCountry: r.pickupCountry || "",
      pickupCity: r.pickupCity,
      pickupProvince: r.pickupProvince,
      dropoffCountry: r.dropoffCountry || "",
      dropoffCity: r.dropoffCity,
      dropoffProvince: r.dropoffProvince,
      distance: r.distance,
      tollCount: r.tollCount,
      tollAmount: r.tollAmount,
      allocationMoney: r.allocationMoney,
      councilLevy: r.councilLevy,
    });
    setEditingId(r._id!);
    setDrawerOpen(true);
  };

  const closeDrawer = () => setDrawerOpen(false);

  const handleSave = async () => {
    if (!form.pickupCity || !form.dropoffCity || !form.distance || !form.allocationMoney) {
      alert("Pickup city, dropoff city, distance, and allocation money are required.");
      return;
    }
    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await routeService.update(editingId, form);
        setRoutes(prev => prev.map(r => r._id === editingId ? updated : r));
      } else {
        const created = await routeService.create(form);
        setRoutes(prev => [...prev, created]);
      }
      setDrawerOpen(false);
    } catch { alert("Failed to save route. Please try again."); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this route? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await routeService.remove(id);
      setRoutes(prev => prev.filter(r => r._id !== id));
    } catch { alert("Failed to delete route."); }
    finally { setDeletingId(null); }
  };

  const f = (n: number) => `K ${n.toLocaleString()}`;

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Route Master</h1>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
              Pre-configure city routes · distances · tolls · financials
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMileageModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm"
            >
              <Gauge className="w-4 h-4 text-emerald-500" />
              {mileage.loadedMileage ? `${mileage.loadedMileage} / ${mileage.unloadedMileage} km/L` : "Add Mileage"}
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Route
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Routes", value: routes.length, color: "text-slate-900" },
            { label: "Avg Distance", value: routes.length ? `${Math.round(routes.reduce((s, r) => s + r.distance, 0) / routes.length)} km` : "—", color: "text-blue-600" },
            { label: "Avg Allocation", value: routes.length ? f(Math.round(routes.reduce((s, r) => s + r.allocationMoney, 0) / routes.length)) : "—", color: "text-amber-600" },
            { label: "Avg Council Levy", value: routes.length ? f(Math.round(routes.reduce((s, r) => s + r.councilLevy, 0) / routes.length)) : "—", color: "text-emerald-600" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className={`text-[20px] font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Routes Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              {routes.length} Route{routes.length !== 1 ? "s" : ""} Configured
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : routes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <MapPin className="w-10 h-10 text-slate-100" />
              <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">No routes configured yet</p>
              <button onClick={openAdd} className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add your first route
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3 bg-slate-50/60">
                {["Route", "Distance", "Tolls", "Toll Amount", "Allocation", "Council Levy", ""].map((h, i) => (
                  <div key={i} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{h}</div>
                ))}
              </div>

              {routes.map((route) => (
                <div key={route._id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-5 items-center hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                      </div>
                      <div className="w-px h-3 bg-slate-200" />
                      <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-rose-600" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-slate-900 truncate">
                        {route.pickupCity}
                        <span className="text-slate-400 font-normal text-[11px]">
                          {route.pickupProvince ? ` · ${route.pickupProvince}` : ""}{route.pickupCountry ? `, ${route.pickupCountry}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                        <div className="text-[12px] font-semibold text-slate-600 truncate">
                          {route.dropoffCity}
                          <span className="text-slate-400 font-normal text-[11px]">
                            {route.dropoffProvince ? ` · ${route.dropoffProvince}` : ""}{route.dropoffCountry ? `, ${route.dropoffCountry}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest md:hidden mb-0.5">Distance</div>
                    <div className="flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-[13px] font-bold text-slate-900">{route.distance} km</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest md:hidden mb-0.5">Tolls</div>
                    <div className="flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[13px] font-semibold text-slate-700">{route.tollCount}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest md:hidden mb-0.5">Toll Amount</div>
                    <div className="flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span className="text-[13px] font-semibold text-violet-700">{f(route.tollAmount)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest md:hidden mb-0.5">Allocation</div>
                    <div className="flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-[13px] font-bold text-amber-700">{f(route.allocationMoney)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest md:hidden mb-0.5">Council Levy</div>
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[13px] font-semibold text-slate-700">{f(route.councilLevy)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(route)} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(route._id!)}
                      disabled={deletingId === route._id}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right-side Drawer ─────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-[600] pointer-events-none">
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-neutral-900/30 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={closeDrawer}
        />

        {/* Drawer panel */}
        <div className={`absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl transition-transform duration-300 pointer-events-auto flex flex-col ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
          {/* Header */}
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">
                {editingId ? "Edit Route" : "Add New Route"}
              </h2>
              <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-widest">Route Master Configuration</p>
            </div>
            <button onClick={closeDrawer} className="p-2 hover:bg-neutral-50 rounded-xl text-neutral-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

            {/* Pickup */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Route A</span>
              </div>
              <div className="space-y-2 pl-7">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Country *</label>
                  <select value={form.pickupCountry} onChange={e => setForm(f => ({ ...f, pickupCountry: e.target.value, pickupProvince: "", pickupCity: "" }))} className={selectCls}>
                    <option value="">Select country</option>
                    {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">State / Province</label>
                    <select value={form.pickupProvince} onChange={e => setForm(f => ({ ...f, pickupProvince: e.target.value, pickupCity: "" }))} className={selectCls} disabled={!form.pickupCountry}>
                      <option value="">Select state</option>
                      {(AFRICAN_STATES[form.pickupCountry] || []).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">City *</label>
                    <select value={form.pickupCity} onChange={e => setForm(f => ({ ...f, pickupCity: e.target.value }))} className={selectCls} disabled={!form.pickupCountry}>
                      <option value="">Select city</option>
                      {(AFRICAN_CITIES[form.pickupCountry] || []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider arrow */}
            <div className="flex items-center gap-3 pl-7">
              <div className="flex-1 border-t border-dashed border-slate-200" />
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <div className="flex-1 border-t border-dashed border-slate-200" />
            </div>

            {/* Dropoff */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Route B</span>
              </div>
              <div className="space-y-2 pl-7">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Country *</label>
                  <select value={form.dropoffCountry} onChange={e => setForm(f => ({ ...f, dropoffCountry: e.target.value, dropoffProvince: "", dropoffCity: "" }))} className={selectCls}>
                    <option value="">Select country</option>
                    {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">State / Province</label>
                    <select value={form.dropoffProvince} onChange={e => setForm(f => ({ ...f, dropoffProvince: e.target.value, dropoffCity: "" }))} className={selectCls} disabled={!form.dropoffCountry}>
                      <option value="">Select state</option>
                      {(AFRICAN_STATES[form.dropoffCountry] || []).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">City *</label>
                    <select value={form.dropoffCity} onChange={e => setForm(f => ({ ...f, dropoffCity: e.target.value }))} className={selectCls} disabled={!form.dropoffCountry}>
                      <option value="">Select city</option>
                      {(AFRICAN_CITIES[form.dropoffCountry] || []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Details */}
            <div className="border-t border-dashed border-slate-100 pt-5 space-y-4">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Route Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                    <Ruler className="w-3 h-3" /> Distance (km) *
                  </label>
                  <input
                    type="number" min="0"
                    value={form.distance || ""}
                    onChange={e => setForm(f => ({ ...f, distance: parseFloat(e.target.value) || 0 }))}
                    placeholder="e.g. 450"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                    <Landmark className="w-3 h-3" /> No. of Tolls
                  </label>
                  <input
                    type="number" min="0"
                    value={form.tollCount || ""}
                    onChange={e => setForm(f => ({ ...f, tollCount: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-violet-500 uppercase tracking-widest flex items-center gap-1">
                  <Landmark className="w-3 h-3" /> Toll Amount (ZMW)
                </label>
                <p className="text-[9px] text-neutral-400 -mt-0.5">Total amount deducted for all tolls on this route</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-neutral-400">K</span>
                  <input
                    type="number" min="0"
                    value={form.tollAmount || ""}
                    onChange={e => setForm(f => ({ ...f, tollAmount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className={`${inputCls} pl-7 bg-violet-50 border-violet-200 focus:border-violet-400`}
                  />
                </div>
              </div>
            </div>

            {/* Financials */}
            <div className="border-t border-dashed border-slate-100 pt-5 space-y-4">
              <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Financial Setup</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Allocation Money (ZMW) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-neutral-400">K</span>
                    <input
                      type="number" min="0"
                      value={form.allocationMoney || ""}
                      onChange={e => setForm(f => ({ ...f, allocationMoney: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className={`${inputCls} pl-7 bg-amber-50 border-amber-200 focus:border-amber-400`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                    <Receipt className="w-3 h-3" /> Council Levy (ZMW)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-neutral-400">K</span>
                    <input
                      type="number" min="0"
                      value={form.councilLevy || ""}
                      onChange={e => setForm(f => ({ ...f, councilLevy: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className={`${inputCls} pl-7`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-100 bg-white flex items-center gap-3 shrink-0">
            <button onClick={closeDrawer} className="px-6 py-3 border border-neutral-100 rounded-xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSaving ? "Saving..." : editingId ? "Update Route" : "Save Route"}
            </button>
          </div>
        </div>
      </div>
      {/* ── Mileage Modal ──────────────────────────────────────────────────────── */}
      {mileageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMileageModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="px-6 pt-6 pb-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Gauge className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Mileage Configuration</h2>
                  <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-widest">Global — applies to all routes</p>
                </div>
              </div>
              <button onClick={() => setMileageModal(false)} className="p-2 rounded-xl hover:bg-neutral-50 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" /> Loaded Mileage (km/L)
                </label>
                <p className="text-[9px] text-neutral-400">When the truck is carrying cargo</p>
                <input
                  type="number" min="0" step="0.1"
                  value={mileage.loadedMileage || ""}
                  onChange={e => setMileage(m => ({ ...m, loadedMileage: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g. 3.5"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" /> Unloaded Mileage (km/L)
                </label>
                <p className="text-[9px] text-neutral-400">When the truck is returning empty</p>
                <input
                  type="number" min="0" step="0.1"
                  value={mileage.unloadedMileage || ""}
                  onChange={e => setMileage(m => ({ ...m, unloadedMileage: parseFloat(e.target.value) || 0 }))}
                  placeholder="e.g. 5.0"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 flex gap-3">
              <button onClick={() => setMileageModal(false)} className="flex-1 py-3 border border-neutral-100 rounded-2xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50">
                Cancel
              </button>
              <button
                onClick={handleSaveMileage}
                disabled={isSavingMileage}
                className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSavingMileage ? "Saving..." : "Save Mileage"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
