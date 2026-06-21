"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isExpanded: boolean;
  onHover: (expanded: boolean) => void;
}

export default function AdminSidebar({ isOpen, onClose, isExpanded, onHover }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Booking Requests",
      href: "/admin/requests",
      badge: "5",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M16 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6z" />
          <polyline points="16 2 16 6 20 6" />
          <path d="M12 11h4" />
          <path d="M12 15h4" />
          <path d="M8 11h.01" />
          <path d="M8 15h.01" />
        </svg>
      ),
    },
    {
      label: "Operations",
      href: "/admin/operations",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M1 3h15v13H1z" />
          <path d="M16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      label: "Accountant",
      href: "/admin/accountant",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      label: "Jobs",
      href: "/admin/jobs",
      badge: "12",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      label: "Trucks",
      href: "/admin/trucks",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M1 3h15v13H1z" />
          <path d="M16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      label: "Drivers",
      href: "/admin/drivers",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      label: "Clients",
      href: "/admin/clients",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Route Master",
      href: "/admin/routes",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M3 12h18" />
          <path d="M3 12l4-4m-4 4 4 4" />
          <path d="M21 12l-4-4m4 4-4 4" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
    },
  ];

  const operationsItems: NavItem[] = [
    {
      label: "Reports",
      href: "/admin/reports",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      label: "Travel Summary",
      href: "/admin/travel-summary",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M3 12h18" />
          <path d="M3 6l9-3 9 3" />
          <path d="M3 18l9 3 9-3" />
        </svg>
      ),
    },
    {
      label: "Toll Account",
      href: "/admin/toll",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
    },
  ];

  return (
    <motion.aside
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      initial={false}
      animate={{ width: isExpanded ? 240 : 68 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 bottom-0 bg-slate-950 border-r border-white/5 flex flex-col z-200 shadow-2xl overflow-hidden ${isOpen ? "translate-x-0 w-[240px]!" : "-translate-x-full lg:translate-x-0"
        }`}
    >
      {/* ── LOGO SECTION ── */}
      <div className="h-16 flex items-center px-4 mb-2 overflow-hidden shrink-0 border-b border-white/5 font-display">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-lg shadow-primary/30">
          S
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="ml-3 flex flex-col"
            >
              <span className="font-bold text-white text-[15px] tracking-tight whitespace-nowrap leading-none">
                Speedo<span className="text-primary italic">gistic</span>
              </span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Administrator</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 p-2.5 overflow-y-auto overflow-x-hidden space-y-1 custom-scrollbar">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[9px] font-bold text-slate-500 tracking-widest uppercase px-3 py-3 mt-1"
          >
            Main
          </motion.div>
        )}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center h-10 rounded-lg group/item transition-all px-2 relative
                ${isActive ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              {isActive && !isExpanded && (
                <motion.div
                  layoutId="activeIndicatorAdmin"
                  className="absolute left-[-10px] top-2 bottom-2 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(212,23,39,0.8)]"
                />
              )}

              <div className={`w-9 h-9 flex items-center justify-center shrink-0 transition-all ${isActive ? "text-primary scale-110" : "opacity-70 group-hover/item:opacity-100 group-hover/item:scale-110"}`}>
                {item.icon}
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-3 text-[13px] font-medium tracking-tight whitespace-nowrap flex-1"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {item.badge && isExpanded && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-primary/20"
                >
                  {item.badge}
                </motion.span>
              )}

              {/* Tooltip on Collapsed */}
              {!isExpanded && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap uppercase tracking-widest shadow-xl border border-white/5">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[9px] font-bold text-slate-500 tracking-widest uppercase px-3 py-3 mt-4"
          >
            Operations
          </motion.div>
        )}
        {operationsItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="flex items-center h-10 rounded-lg px-2 group/item text-slate-400 hover:text-white hover:bg-white/5 transition-all relative"
          >
            <div className="w-9 h-9 flex items-center justify-center shrink-0 opacity-70 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all">
              {item.icon}
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-3 text-[13px] font-medium tracking-tight whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {!isExpanded && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap uppercase tracking-widest shadow-xl border border-white/5">
                {item.label}
              </div>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <motion.div
          animate={{
            backgroundColor: isExpanded ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0)",
            padding: isExpanded ? "8px" : "4px"
          }}
          className="flex items-center gap-2.5 rounded-xl transition-all border border-white/5"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0 shadow-sm shadow-primary/10">
            AO
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="min-w-0 flex-1"
              >
                <div className="text-[13px] font-semibold text-white truncate">Piyush Goyal</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Fleet Admin</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.aside>
  );
}
