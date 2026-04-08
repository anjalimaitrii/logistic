"use client";

import { useState } from "react";
import {
  Play,
  Package,
  PackageCheck,
  MapPin,
  Fuel,
  Moon,
  LogOut,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { nav } from "framer-motion/m";
import { navigate } from "next/dist/client/components/segment-cache/navigation";

type TripStatus = "idle" | "started" | "loaded" | "offloaded" | "reached";

export default function DriverDashboard() {
  const [currentStatus, setCurrentStatus] = useState<TripStatus>("idle");
  const [showConfirm, setShowConfirm] = useState<{ type: TripStatus | "fuel" | "rest"; show: boolean }>({ type: "idle", show: false });
  const [logs, setLogs] = useState<{ action: string; time: string }[]>([]);



  const handleAction = (type: TripStatus | "fuel" | "rest") => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (type === "fuel") {
      setLogs([{ action: "Requested Fuel", time: now }, ...logs]);
    } else if (type === "rest") {
      setLogs([{ action: "Started Rest Break", time: now }, ...logs]);
    } else {
      setCurrentStatus(type);
      setLogs([{ action: `Status Changed: ${type.toUpperCase()}`, time: now }, ...logs]);
    }
    setShowConfirm({ type: "idle", show: false });
  };

  const confirmAction = (type: TripStatus | "fuel" | "rest") => {
    setShowConfirm({ type, show: true });
  };

  const statusHierarchy: TripStatus[] = ["idle", "started", "loaded", "offloaded", "reached"];

  const getButtonStyles = (type: TripStatus) => {
    if (currentStatus === type) return "bg-emerald-600 text-white shadow-lg shadow-emerald-200 active:scale-95";
    return "bg-white border-2 border-neutral-100 text-slate-600 hover:border-primary/30 hover:bg-primary/5 shadow-sm active:scale-95";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-6 border-b border-neutral-100 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-lg font-bold">
            AO
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 underline decoration-primary decoration-2 underline-offset-4">Adaeze Okafor</h1>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Fleet Driver • TRK-2201</p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Current Duty Card */}


        {/* Action Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Start Journey */}
          <button
            onClick={() => handleAction("started")}
            className={`flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-[20px] transition-all ${getButtonStyles("started")}`}
          >
            <div className={`p-2.5 rounded-xl ${currentStatus === "started" ? "bg-white/20" : "bg-primary/10"}`}>
              <Play className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight text-center">Start Journey</span>
          </button>

          {/* Loaded */}
          <button
            onClick={() => handleAction("loaded")}
            className={`flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-[20px] transition-all ${getButtonStyles("loaded")}`}
          >
            <div className={`p-2.5 rounded-xl ${currentStatus === "loaded" ? "bg-white/20" : "bg-blue-500/10"}`}>
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight text-center">Loaded</span>
          </button>

          {/* Offloaded */}
          <button
            onClick={() => confirmAction("offloaded")}
            className={`flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-[20px] transition-all ${getButtonStyles("offloaded")}`}
          >
            <div className={`p-2.5 rounded-xl ${currentStatus === "offloaded" ? "bg-white/20" : "bg-orange-500/10"}`}>
              <PackageCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight text-center">Offloaded</span>
          </button>

          {/* Reached */}
          <button
            onClick={() => confirmAction("reached")}
            className={`flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-[20px] transition-all ${getButtonStyles("reached")}`}
          >
            <div className={`p-2.5 rounded-xl ${currentStatus === "reached" ? "bg-white/20" : "bg-emerald-500/10"}`}>
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight text-center">Reached</span>
          </button>

          {/* Need Fuel */}
          <button
            onClick={() => confirmAction("fuel")}
            className={`flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-[20px] bg-amber-50 text-amber-600 border-2 border-amber-100/50 transition-all active:scale-95 ${currentStatus as any === "fuel" ? "border-amber-400" : ""}`}
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10">
              <Fuel className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight text-center">Need Fuel</span>
          </button>

          {/* Rest */}
          <button
            onClick={() => confirmAction("rest")}
            className={`flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-[20px] bg-indigo-50 text-indigo-600 border-2 border-indigo-100/50 transition-all active:scale-95 ${currentStatus as any === "rest" ? "border-indigo-400" : ""}`}
          >
            <div className="p-2.5 rounded-xl bg-indigo-500/10">
              <Moon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight text-center">Rest</span>
          </button>
        </div>


      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm.show && (
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-500 mb-6">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-[20px] font-bold text-slate-900 mb-2">Are you sure?</h3>
                <p className="text-[13px] font-medium text-neutral-400 px-6 mb-8 leading-relaxed">
                  You are about to confirm the <span className="text-slate-900 font-bold uppercase">{showConfirm.type}</span> status for this trip. This action will be logged.
                </p>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => setShowConfirm({ type: "idle", show: false })}
                    className="py-4 rounded-2xl bg-neutral-100 text-slate-500 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAction(showConfirm.type as any)}
                    className="py-4 rounded-2xl bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
