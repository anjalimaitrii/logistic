"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarSlimProps } from "../config";
import { motion, AnimatePresence } from "framer-motion";

interface ControlledSidebarProps extends SidebarSlimProps {
  isExpanded: boolean;
  onHover: (expanded: boolean) => void;
}

export function SidebarNavigationSlim({ items, footerItems, isExpanded, onHover }: ControlledSidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
  }, []);

  return (
    <motion.aside
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      initial={false}
      animate={{ width: isExpanded ? 240 : 68 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-screen bg-slate-950 border-r border-white/5 flex flex-col group shadow-2xl relative z-50 overflow-hidden"
    >
      {/* ── LOGO SECTION ── */}
      <div className="h-16 flex items-center px-4 mb-2 overflow-hidden shrink-0 border-b border-white/5 font-display">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-lg shadow-primary/30">
          S
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="ml-3 font-semibold text-white text-sm tracking-tight whitespace-nowrap"
            >
              Speedo<span className="text-primary tracking-tight">gistic</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── NAV ITEMS ── */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          const sharedClass = `w-full flex items-center h-10 rounded-lg transition-all group/item px-2 relative ${
            isActive ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5"
          }`;

          const content = (
            <>
              {isActive && !isExpanded && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute left-[-12px] top-2 bottom-2 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(212,23,39,0.8)]" 
                />
              )}
              
              <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-primary stroke-[2.5px]" : "opacity-70 stroke-[2px] group-hover/item:opacity-100"}`} />
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-3 text-[12px] font-medium tracking-tight whitespace-nowrap flex-1 text-left"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              
              {!isExpanded && (
                 <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap uppercase tracking-widest shadow-xl border border-white/5">
                    {item.label}
                 </div>
              )}
            </>
          );

          if (item.onClick) {
            return (
              <button key={item.label} onClick={item.onClick} className={sharedClass}>
                {content}
              </button>
            );
          }

          return (
            <Link key={item.label} href={item.href || "#"} className={sharedClass}>
              {content}
            </Link>
          );
        })}
      </nav>

      {/* ── FOOTER ITEMS ── */}
      {footerItems && (
        <div className="p-3 border-t border-white/5 space-y-1">
          {footerItems.map((item) => {
            const Icon = item.icon as any;
            const sharedClass = "w-full h-10 flex items-center px-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all group/foot relative";
            
            const content = (
              <>
                <Icon className="w-5 h-5 shrink-0 opacity-70 stroke-[2px] group-hover/foot:opacity-100" />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="ml-3 text-[12px] font-medium tracking-tight whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!isExpanded && (
                   <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded opacity-0 group-hover/foot:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap uppercase tracking-widest shadow-xl border border-white/5">
                      {item.label}
                   </div>
                )}
              </>
            );

            if (item.onClick) {
              return (
                <button key={item.label} onClick={item.onClick} className={sharedClass}>
                  {content}
                </button>
              );
            }

            return (
              <Link key={item.label} href={item.href || "#"} className={sharedClass}>
                {content}
              </Link>
            );
          })}
          
          {/* User Profile in Footer */}
          <motion.div 
            animate={{ 
              backgroundColor: isExpanded ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0)",
              y: isExpanded ? 0 : 4
            }}
            className="mt-4 p-2 rounded-xl border border-white/5 flex items-center overflow-hidden"
          >
             <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-semibold text-[10px] shrink-0">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
             <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-3 min-w-0"
                  >
                    <p className="text-[11px] font-semibold text-white truncate capitalize">{user?.name || "User"}</p>
                    <p className="text-[9px] text-slate-500 truncate capitalize">{user?.designation || "Client"}</p>
                  </motion.div>
                )}
             </AnimatePresence>
          </motion.div>
        </div>
      )}
    </motion.aside>
  );
}
