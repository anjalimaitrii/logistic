"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, ChevronLeft, ChevronRight, Wallet, Truck } from "lucide-react";
import { tollService } from "@/services/tollService";
import { truckService } from "@/services/truckService";
import { getComplianceAlerts, ComplianceAlert } from "@/lib/complianceAlerts";

// Wallet alert threshold (K) — keep in sync with LOW_BALANCE_THRESHOLD in backend tollController
export const TOLL_LOW_BALANCE = 3000;

const POLL_MS = 60_000;

// Floating right-edge alert center, mounted once in AdminLayout so it shows on
// every admin page. Renders nothing while there are no active alerts.
export default function AlertsSidebar() {
  const [balance, setBalance] = useState<number | null>(null);
  const [renewals, setRenewals] = useState<ComplianceAlert[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      // Each source fails independently — keep last known values on transient errors
      try {
        const acc = await tollService.getAccount();
        if (alive) setBalance(Number(acc?.balance ?? 0));
      } catch {}
      try {
        const trucks = await truckService.getAll();
        if (alive) setRenewals(getComplianceAlerts(trucks || []));
      } catch {}
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  const lowBalance = balance !== null && balance < TOLL_LOW_BALANCE;
  const alertCount = (lowBalance ? 1 : 0) + renewals.length;

  if (alertCount === 0) return null;

  return (
    <>
      {/* Collapsed tab on the right edge */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ x: 48 }}
            animate={{ x: 0 }}
            exit={{ x: 48 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={() => setOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-[160] flex flex-col items-center gap-2 bg-slate-900 text-white rounded-l-xl px-2 py-4 shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-colors"
          >
            <span className="absolute -top-2 -left-2 min-w-[22px] h-[22px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
              {alertCount}
            </span>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
            <Bell className="w-4 h-4" />
            <span className="text-[9px] font-bold uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
              Alerts
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 340 }}
            animate={{ x: 0 }}
            exit={{ x: 340 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-[160] w-67.5 bg-white rounded-l-xl border border-r-0 border-slate-100 shadow-2xl shadow-slate-900/10 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-900">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <h3 className="text-[11px] font-bold text-white">Alerts</h3>
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">{alertCount}</span>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* Alert cards */}
            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {lowBalance && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 border-l-4 border-l-amber-400 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-900">Low Toll Balance</p>
                      <p className="text-[9px] text-slate-500">
                        <span className="font-bold text-rose-600">K{Number(balance).toLocaleString()}</span> left · below K{TOLL_LOW_BALANCE.toLocaleString()}
                      </p>
                    </div>
                    <Link
                      href="/admin/toll"
                      onClick={() => setOpen(false)}
                      className="px-2 py-1 bg-slate-900 text-white rounded-md text-[8px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors shrink-0"
                    >
                      Recharge
                    </Link>
                  </div>
                </div>
              )}

              {renewals.length > 0 && (
                <div className={`rounded-lg border border-l-4 px-3 py-2 ${
                  renewals.some(a => a.days <= 7)
                    ? "border-rose-200 bg-rose-50 border-l-rose-400"
                    : "border-amber-200 bg-amber-50 border-l-amber-400"
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Truck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-900">Renewals Due</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[8px] font-bold">{renewals.length}</span>
                    <Link
                      href="/admin/trucks"
                      onClick={() => setOpen(false)}
                      className="ml-auto px-2 py-1 bg-slate-900 text-white rounded-md text-[8px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors shrink-0"
                    >
                      View
                    </Link>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5">
                    {renewals.map((a, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white/70 rounded-md px-2 py-1">
                        <p className="text-[9px] text-slate-700 truncate flex-1 min-w-0">
                          <span className="font-bold text-slate-900">{a.truckId}</span> · {a.label}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 ${
                          a.days <= 0 ? "bg-rose-100 text-rose-600" : a.days <= 7 ? "bg-rose-50 text-rose-500" : "bg-amber-100 text-amber-600"
                        }`}>
                          {a.days <= 0 ? "Expired" : `${a.days}d`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
