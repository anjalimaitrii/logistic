"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import { ChevronRight, Eye, Plus, X, Building2, Mail, Phone, User, MapPin, CreditCard, ArrowRight, MoreVertical, Users, UserPlus, Check } from "lucide-react";
import { companyService } from "@/services/companyService";
import { clientService } from "@/services/clientService";

interface Client {
  id: string;
  name: string;
  email: string;
  contact: string;
  designation: string;
  status: string;
  type: string;
}

export default function AdminClients() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isCompanyModalOpen, setCompanyModalOpen] = useState(false);
  const [viewType, setViewType] = useState<'companies' | 'individuals'>('companies');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    designation: "",
    password: "",
  });
  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    cinNumber: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    billingName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);

  // Relationship State
  const [targetCompanyForForm, setTargetCompanyForForm] = useState<any>(null);
  const [selectedCompanyForView, setSelectedCompanyForView] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const responseData = viewType === 'companies'
        ? await companyService.getAll()
        : await clientService.getAll();
      setData(responseData);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [viewType]);

  const filteredData = viewType === 'individuals'
    ? data.filter(client => !client.company) // Show only independent clients in Individuals view
    : data;

  const totalCount = filteredData.length;
  const activeCount = filteredData.filter(c => c.status === "Active").length;
  const inactiveCount = filteredData.filter(c => c.status === "Inactive").length;

  const kpis = [
    { label: `Total ${viewType === 'companies' ? 'Businesses' : 'Individuals'}`, value: totalCount.toString(), icon: viewType === 'companies' ? <Building2 className="w-5 h-5" /> : <Users className="w-5 h-5" />, subText: "Registered on platform", trend: "↑ Live", variant: "primary" as const },
    { label: "Active Status", value: activeCount.toString(), icon: "✅", subText: "Currently operational", trend: `↑ ${totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(0) : 0}%`, variant: "success" as const },
    { label: "Inactive", value: inactiveCount.toString(), icon: "💤", subText: "No recent activity", trend: "↓ Monitoring", variant: "warning" as const },
    { label: "New Entries", value: "+4", icon: "🆕", subText: "This month", trend: "↑ 12%", variant: "success" as const },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await clientService.create({
        ...formData,
        status: "Active",
        company: targetCompanyForForm?._id // Pass company ID if creating for a company
      });

      const successMsg = targetCompanyForForm
        ? `${formData.name} added to ${targetCompanyForForm.companyName}!`
        : `${formData.name} registered as an individual client!`;

      alert(`Success: ${successMsg}`);

      fetchData(); // Refresh current view
      setFormData({ name: "", email: "", contact: "", designation: "", password: "" });
      setTargetCompanyForForm(null);
      setModalOpen(false);
    } catch (error: any) {
      console.error("❌ Submission Error:", error);
      alert(error.message || "Error: Could not register client.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
    setShowPassword(true);
  };

  const handleCompanySubmit = async () => {
    setIsSubmitting(true);

    const payload = {
      companyName: companyForm.companyName,
      cinNumber: companyForm.cinNumber,
      address: {
        street: companyForm.street,
        city: companyForm.city,
        state: companyForm.state,
        pincode: companyForm.pincode,
      },
      accounting: {
        billingName: companyForm.billingName || companyForm.companyName,
      },
      status: "Active"
    };

    console.log("🚀 Submitting Company Payload:", payload);
    try {
      const response = await companyService.create(payload);
      console.log("✅ Company registration response:", response);
      alert(`Success: ${payload.companyName} registered successfully!`);
      if (viewType === 'companies') fetchData();

      setCompanyForm({
        companyName: "", cinNumber: "", street: "", city: "", state: "", pincode: "",
        billingName: ""
      });
      setCompanyModalOpen(false);
    } catch (error: any) {
      console.error("❌ Submission Error:", error);
      alert(error.message || "Error: Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddClientClick = (company: any) => {
    setTargetCompanyForForm(company);
    setFormData({ name: "", email: "", contact: "", designation: "", password: "" }); // Reset
    setFormStep(1);
    setModalOpen(true);
  };

  const handleViewClientsClick = (company: any) => {
    setSelectedCompanyForView(company);
    setIsViewModalOpen(true);
  };

  const inputClass = "w-full bg-neutral-50 border border-neutral-100 rounded-xl py-2.5 px-4 text-[13px] font-medium text-slate-900 outline-none focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all";


  return (
    <AdminLayout>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      <div className="p-6 pb-20 space-y-8 bg-neutral-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1.5">
              <span className="hover:text-primary cursor-pointer transition-colors">Admin</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary/80">Client Directory</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Manage Clients</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Oversee registered clients and their booking activity.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* View Type Toggle */}
            <div className="bg-white p-1 rounded-2xl border border-neutral-100 flex items-center shadow-sm">
              <button
                onClick={() => setViewType('companies')}
                className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${viewType === 'companies' ? 'bg-slate-900 text-white shadow-lg' : 'text-neutral-400 hover:text-slate-600'}`}
              >
                <Building2 className="w-3 h-3" />
                Businesses
              </button>
              <button
                onClick={() => setViewType('individuals')}
                className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${viewType === 'individuals' ? 'bg-slate-900 text-white shadow-lg' : 'text-neutral-400 hover:text-slate-600'}`}
              >
                <Users className="w-3 h-3" />
                Individuals
              </button>
            </div>

            {viewType === 'companies' ? (
              <button
                onClick={() => setCompanyModalOpen(true)}
                className="bg-white text-slate-900 border border-neutral-200 px-5 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest shadow-sm hover:bg-neutral-50 hover:border-neutral-300 transition-all w-fit flex items-center gap-2 cursor-pointer"
              >
                <div className="p-0.5 rounded-md bg-neutral-100">
                  <Building2 className="w-3 h-3" />
                </div>
                Register New Company
              </button>
            ) : (
              <button
                onClick={() => {
                  setTargetCompanyForForm(null);
                  setFormStep(1);
                  setModalOpen(true);
                }}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:brightness-110 transition-all w-fit flex items-center gap-2 cursor-pointer"
              >
                <div className="p-0.5 rounded-md bg-white/20">
                  <Plus className="w-3 h-3" />
                </div>
                Add New Individual Client
              </button>
            )}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))}
        </div>

        {/* ── Directory Header ── */}
        <div className="space-y-6">
          <div>
            <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              {viewType === 'companies' ? 'Company Directory' : 'Individual Clients'}
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-neutral-50 rounded-3xl p-6 h-[200px] animate-pulse flex flex-col gap-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-neutral-100 rounded w-3/4" />
                      <div className="h-3 bg-neutral-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-neutral-100 rounded w-full mt-4" />
                </div>
              ))}
            </div>
          ) : filteredData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.map((item) => (
                <div key={item._id} className="bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group relative">
                  {/* Status Badge */}
                  <div className="absolute top-5 right-5">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 ${item.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-400"
                      }`}>
                      <div className={`w-1 h-1 rounded-full ${item.status === "Active" ? "bg-emerald-500" : "bg-neutral-400"}`} />
                      {item.status}
                    </span>
                  </div>

                  <div className="flex gap-3 items-center mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm capitalize">
                      {(item.companyName || item.name).charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold text-slate-900 leading-tight truncate max-w-[150px]">
                        {item.companyName || item.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium">
                        {item.designation ? (
                          <span className="text-primary font-bold">{item.designation}</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-primary/40" />
                              {item.address?.city}, {item.address?.state}
                            </div>
                            {item.clients && item.clients.length > 0 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Users className="w-2.5 h-2.5 text-emerald-400" />
                                <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-tighter">
                                  {item.clients.length} Clients Linked
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-2 bg-neutral-50/40 rounded-xl p-3.5 border border-neutral-100/30">
                    {/* Display linked staff names for Companies */}
                    {viewType === 'companies' && item.clients && item.clients.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-wider mb-1.5 ">Assigned Clients</p>
                        <div className="flex flex-wrap gap-1">
                          {item.clients.map((staff: any) => (
                            <span key={staff._id || staff} className="px-2 py-0.5 bg-white border border-neutral-100 rounded-md text-[9px] font-bold text-slate-600 flex items-center gap-1 shadow-sm">
                              <div className="w-1 h-1 rounded-full bg-emerald-400" />
                              {staff.name || "Unknown"}
                            </span>
                          ))}
                        </div>
                        <div className="h-px bg-neutral-100/50 my-2" />
                      </div>
                    )}

                    {viewType === 'individuals' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-neutral-500">
                          <User className="w-3 h-3 text-neutral-300" />
                          <span className="text-[11px] font-bold text-slate-700 truncate">{item.name || "N/A"}</span>
                        </div>
                        <a href={`tel:${item.contact}`} className="flex items-center gap-2 text-neutral-500 hover:text-primary transition-colors">
                          <Phone className="w-3 h-3 text-neutral-300" />
                          <span className="text-[11px] font-medium">{item.contact || "N/A"}</span>
                        </a>
                        <a href={`mailto:${item.email}`} className="flex items-center gap-2 text-neutral-500 hover:text-primary transition-colors">
                          <Mail className="w-3 h-3 text-neutral-300" />
                          <span className="text-[11px] font-medium truncate">{item.email || "N/A"}</span>
                        </a>
                      </div>
                    ) : (
                      <div className="py-2 italic text-center">
                        <p className="text-[10px] text-neutral-400">Business account details listed below.</p>
                      </div>
                    )}

                    <div className="h-px bg-neutral-100/50 my-1" />

                    <div className="grid grid-cols-2 gap-2">
                      {viewType === 'companies' ? (
                        <>
                          <div>
                            <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-wider mb-0.5">Registration (CIN)</p>
                            <p className="text-[10px] font-bold text-slate-600 truncate">{item.cinNumber || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-wider mb-0.5">Billing Unit</p>
                            <p className="text-[10px] font-bold text-slate-600 truncate">{item.accounting?.billingName || "Default"}</p>
                          </div>
                        </>
                      ) : (
                        <>


                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {viewType === 'companies' ? (
                      <>
                        <button
                          onClick={() => handleAddClientClick(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-sm"
                        >
                          <UserPlus className="w-3 h-3" />
                          Add Clients
                        </button>
                        <button
                          onClick={() => handleViewClientsClick(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-200 transition-all cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          View Details
                        </button>
                      </>
                    ) : <div />}

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-neutral-50 flex items-center justify-center text-neutral-300 mb-4 border border-dashed border-neutral-200">
                {viewType === 'companies' ? <Building2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
              </div>
              <h3 className="text-slate-900 font-bold text-[15px]">No {viewType} Found</h3>
              <p className="text-neutral-400 text-[11px] max-w-[200px] mt-1">Start by adding your first {viewType === 'companies' ? 'business' : 'individual'} client.</p>
              <button
                onClick={() => viewType === 'companies' ? setCompanyModalOpen(true) : setModalOpen(true)}
                className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-slate-200 hover:brightness-110 transition-all"
              >
                Add First {viewType === 'companies' ? 'Company' : 'Client'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Add Client — Side Drawer ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex justify-end bg-slate-900/30 backdrop-blur-[2px]">
          <div className="absolute inset-0" onClick={() => setModalOpen(false)} />
          <div
            className="relative bg-white w-full max-w-md h-screen shadow-2xl flex flex-col"
            style={{ animation: "slideInRight 0.3s ease-out" }}
          >
            {/* Header */}
            <div className="px-7 pt-8 pb-5 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">
                  {targetCompanyForForm ? "Add New Client" : "Add New Individual Client"}
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {targetCompanyForForm
                    ? `Step ${formStep} of 2 • Linking to: ${targetCompanyForForm.companyName}`
                    : `Step ${formStep} of 2 • Fill in the client details.`}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-slate-900 hover:bg-neutral-100 transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-7 py-6 flex-1 overflow-y-auto custom-scrollbar">
              {formStep === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Full Name</label>
                    <input type="text" placeholder="e.g. John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Email Address</label>
                    <input type="email" placeholder="e.g. john@company.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Contact Number</label>
                    <input type="tel" placeholder="e.g. +234 803 123 4567" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Designation</label>
                    <input type="text" placeholder="e.g. Logistics Head" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className={inputClass} />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-bold text-slate-900">Security Credentials</h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Create a secure password for the client to access their portal.</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Client Password</label>
                      <button 
                        type="button" 
                        onClick={generatePassword}
                        className="text-[10px] font-bold text-primary uppercase tracking-tight hover:underline cursor-pointer"
                      >
                        Auto-Generate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`${inputClass} pr-12`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-slate-900 transition-colors cursor-pointer">
                        {showPassword ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-neutral-100">
                    <p className="text-[10px] text-neutral-400 italic">
                      Tip: Ensure the client is notified of their credentials securely.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-5 border-t border-neutral-100 flex gap-3 shrink-0">
              {formStep === 1 ? (
                <>
                  <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl bg-neutral-100 text-slate-500 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all cursor-pointer">Cancel</button>
                  <button
                    onClick={() => setFormStep(2)}
                    disabled={!formData.name || !formData.email}
                    className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-slate-200 hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    Setup Password
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setFormStep(1)} className="px-5 py-3 rounded-xl bg-neutral-100 text-slate-500 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all cursor-pointer">Back</button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.password}
                    className={`flex-1 py-3 rounded-xl text-white text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-slate-200 cursor-pointer ${isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:brightness-110"
                      }`}
                  >
                    {isSubmitting ? "Registering..." : "Add Client"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Add Company — Side Drawer ═══ */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[999] flex justify-end bg-slate-900/30 backdrop-blur-[2px]">
          <div className="absolute inset-0" onClick={() => setCompanyModalOpen(false)} />
          <div
            className="relative bg-white w-full max-w-lg h-screen shadow-2xl flex flex-col"
            style={{ animation: "slideInRight 0.3s ease-out" }}
          >
            {/* Header */}
            <div className="px-7 pt-8 pb-5 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">Register Company</h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Add a new company to the platform.</p>
                </div>
              </div>
              <button onClick={() => setCompanyModalOpen(false)} className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-slate-900 hover:bg-neutral-100 transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-7 py-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
              {/* Company Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Company Name *</label>
                  <input type="text" placeholder="e.g. Acme Corp" value={companyForm.companyName} onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">CIN Number</label>
                  <input type="text" placeholder="U74140DL2023..." value={companyForm.cinNumber} onChange={(e) => setCompanyForm({ ...companyForm, cinNumber: e.target.value })} className={inputClass} />
                </div>
              </div>

              {/* ── Company Address ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-neutral-100" />
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Company Address</span>
                  <div className="h-px flex-1 bg-neutral-100" />
                </div>
                <input type="text" placeholder="Street / Building" value={companyForm.street} onChange={(e) => setCompanyForm({ ...companyForm, street: e.target.value })} className={inputClass} />
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="City" value={companyForm.city} onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })} className={inputClass} />
                  <input type="text" placeholder="State" value={companyForm.state} onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })} className={inputClass} />
                  <input type="text" placeholder="Pincode" value={companyForm.pincode} onChange={(e) => setCompanyForm({ ...companyForm, pincode: e.target.value })} className={inputClass} />
                </div>
              </div>

              {/* ── Billing Details ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-neutral-100" />
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Billing Details</span>
                  <div className="h-px flex-1 bg-neutral-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Billing Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp (Billing Unit)"
                    value={companyForm.billingName}
                    onChange={(e) => setCompanyForm({ ...companyForm, billingName: e.target.value })}
                    className={inputClass}
                  />
                  <p className="text-[9px] text-neutral-400 italic">Defaults to primary company name if left blank.</p>
                </div>
              </div>

              {/* Contact details removed as per requirement */}
            </div>

            {/* Footer */}
            <div className="px-7 py-5 border-t border-neutral-100 flex gap-3 shrink-0">
              <button onClick={() => setCompanyModalOpen(false)} className="flex-1 py-3 rounded-xl bg-neutral-100 text-slate-500 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all cursor-pointer">Cancel</button>
              <button
                disabled={isSubmitting}
                onClick={handleCompanySubmit}
                className={`flex-1 py-3 rounded-xl text-white text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-slate-200 cursor-pointer ${isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:brightness-110"
                  }`}
              >
                {isSubmitting ? "Registering..." : "Register Company"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Old Assign Staff Drawer Removed per requirement */}

      {/* ═══ View Clients — Side Drawer ═══ */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-[999] flex justify-end bg-slate-900/30 backdrop-blur-[2px]">
          <div className="absolute inset-0" onClick={() => setIsViewModalOpen(false)} />
          <div
            className="relative bg-white w-full max-w-md h-screen shadow-2xl flex flex-col"
            style={{ animation: "slideInRight 0.3s ease-out" }}
          >
            {/* Header */}
            <div className="px-7 pt-8 pb-5 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">Company Clients</h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Directory for <span className="font-bold text-slate-900">{selectedCompanyForView?.companyName}</span></p>
                </div>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-slate-900 transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-7 space-y-4 custom-scrollbar bg-neutral-50/30">
              {selectedCompanyForView?.clients && selectedCompanyForView.clients.length > 0 ? (
                selectedCompanyForView.clients.map((staff: any) => (
                  <div key={staff._id} className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm hover:border-primary/20 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold text-slate-900 leading-tight">{staff.name}</h4>
                          <p className="text-[10px] font-bold text-primary mt-0.5 uppercase tracking-wider">{staff.designation}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${staff.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-400"}`}>
                        {staff.status}
                      </span>
                    </div>

                    <div className="space-y-2 bg-neutral-50/50 p-3 rounded-xl border border-neutral-100/50">
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Mail className="w-3 h-3 text-neutral-300" />
                        <span className="text-[11px] font-medium truncate">{staff.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Phone className="w-3 h-3 text-neutral-300" />
                        <span className="text-[11px] font-medium">{staff.contact}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-300 mb-3 border border-dashed border-neutral-200">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <p className="text-neutral-400 text-[12px] font-medium">No Client linked yet.</p>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleAddClientClick(selectedCompanyForView);
                    }}
                    className="mt-4 text-primary text-[11px] font-bold uppercase tracking-widest hover:underline"
                  >
                    Add First Client
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-5 border-t border-neutral-100 bg-white">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="w-full py-3 rounded-xl bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-slate-100"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
