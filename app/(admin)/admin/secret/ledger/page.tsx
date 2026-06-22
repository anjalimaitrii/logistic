"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Users, User, Phone, Mail, BookOpen, ChevronRight } from "lucide-react";
import { companyService } from "@/services/companyService";
import { clientService } from "@/services/clientService";
import LedgerDrawer from "@/components/admin/LedgerDrawer";

export default function SecretLedgerPage() {
  const [viewType, setViewType] = useState<"companies" | "individuals">("companies");
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ledgerTarget, setLedgerTarget] = useState<{ id: string; name: string; type: "company" | "client" } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = viewType === "companies" ? await companyService.getAll() : await clientService.getAll();
      setData(res || []);
    } catch (e) {
      console.error("Secret ledger fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [viewType]);

  // Individuals view: only independent clients (not linked to a company)
  const filtered = viewType === "individuals" ? data.filter((c: any) => !c.company) : data;

  const tabBtn = (active: boolean) =>
    `px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
      active ? "bg-slate-900 text-white shadow-lg" : "text-neutral-400 hover:text-slate-600"
    }`;

  return (
    <div className="p-6 pb-20 space-y-6 bg-neutral-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[9px] font-medium text-neutral-400 uppercase tracking-widest">
        <Link href="/admin/secret" className="hover:text-indigo-600 transition-colors">Secret Dashboard</Link>
        <ChevronRight className="w-2.5 h-2.5" />
        <span className="text-indigo-600 font-bold">Secret Ledger</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-l-2xl" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Secret Ledger</h1>
          <p className="text-[11px] font-medium text-neutral-400 mt-0.5">Complete books — includes off-the-books secret trips</p>
        </div>
        <div className="bg-neutral-50 p-1 rounded-2xl border border-neutral-100 flex items-center">
          <button onClick={() => setViewType("companies")} className={tabBtn(viewType === "companies")}>
            <Building2 className="w-3 h-3" /> Businesses
          </button>
          <button onClick={() => setViewType("individuals")} className={tabBtn(viewType === "individuals")}>
            <Users className="w-3 h-3" /> Individuals
          </button>
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-neutral-100 rounded-3xl p-5 h-[160px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item: any) => (
            <div key={item._id} className="bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex gap-3 items-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm capitalize shrink-0">
                  {(item.companyName || item.name || "?").charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-bold text-slate-900 truncate">{item.companyName || item.name}</h3>
                  <p className="text-[10px] text-neutral-400 font-medium truncate">
                    {viewType === "companies"
                      ? [item.address?.city, item.address?.state].filter(Boolean).join(", ") || "Business account"
                      : item.designation || "Individual client"}
                  </p>
                </div>
              </div>

              {viewType === "individuals" ? (
                <div className="space-y-1.5 mb-4 bg-neutral-50/50 rounded-xl p-3 border border-neutral-100/40">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Phone className="w-3 h-3 text-neutral-300" />
                    <span className="text-[11px] font-medium">{item.contact || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Mail className="w-3 h-3 text-neutral-300" />
                    <span className="text-[11px] font-medium truncate">{item.email || "N/A"}</span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 bg-neutral-50/50 rounded-xl p-3 border border-neutral-100/40 flex items-center gap-2 text-neutral-500">
                  <Users className="w-3 h-3 text-neutral-300" />
                  <span className="text-[11px] font-medium">{item.clients?.length || 0} client{item.clients?.length === 1 ? "" : "s"} linked</span>
                </div>
              )}

              <button
                onClick={() => setLedgerTarget({ id: item._id, name: item.companyName || item.name, type: viewType === "companies" ? "company" : "client" })}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-all"
              >
                <BookOpen className="w-3 h-3" /> Open Ledger
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-neutral-100 rounded-[2rem] p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-neutral-50 flex items-center justify-center text-neutral-300 mb-4 border border-dashed border-neutral-200">
            {viewType === "companies" ? <Building2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
          </div>
          <h3 className="text-slate-900 font-bold text-[15px]">No {viewType} found</h3>
          <p className="text-neutral-400 text-[11px] max-w-[220px] mt-1">Clients are managed from the main admin portal.</p>
        </div>
      )}

      <LedgerDrawer
        isOpen={!!ledgerTarget}
        onClose={() => setLedgerTarget(null)}
        companyId={ledgerTarget?.type === "company" ? ledgerTarget.id : undefined}
        clientId={ledgerTarget?.type === "client" ? ledgerTarget.id : undefined}
        name={ledgerTarget?.name ?? ""}
        includeSecret
      />
    </div>
  );
}
