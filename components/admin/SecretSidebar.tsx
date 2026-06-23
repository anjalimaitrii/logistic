"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function SecretSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const secretNavItems: NavItem[] = [
    {
      label: "Secret Dashboard",
      href: "/admin/secret",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Secret Jobs",
      href: "/admin/secret/jobs",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      label: "Secret Ledger",
      href: "/admin/secret/ledger",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
  ];

  const adminItems: NavItem[] = [
    {
      label: "Report",
      href: "/admin/secret/report",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 w-[240px] bg-slate-950 border-r border-white/5 flex flex-col z-200 shadow-2xl transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* ── LOGO ── */}
      <div className="h-16 flex items-center px-4 mb-2 shrink-0 border-b border-white/5">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-lg shadow-primary/30">
          SL
        </div>
        <div className="ml-3 flex flex-col">
          <span className="font-bold text-white text-[15px] tracking-tight whitespace-nowrap leading-none">
            Special<span className="text-primary italic">Ledger</span>
          </span>
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Secret Mode</span>
        </div>
      </div>

      <nav className="flex-1 p-2.5 overflow-y-auto space-y-1 custom-scrollbar">
        <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase px-3 py-3 mt-1">
          Special Ops
        </div>

        {secretNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center h-10 rounded-lg group/item transition-all px-2 relative ${
                isActive
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <div className="absolute -left-2.5 top-2 bottom-2 w-1 bg-primary rounded-full shadow-[0_0_8px_rgba(212,23,39,0.8)]" />
              )}
              <div
                className={`w-9 h-9 flex items-center justify-center shrink-0 transition-all ${
                  isActive
                    ? "text-primary scale-110"
                    : "opacity-70 group-hover/item:opacity-100 group-hover/item:scale-110"
                }`}
              >
                {item.icon}
              </div>
              <span className="ml-3 text-[13px] font-medium tracking-tight whitespace-nowrap flex-1">
                {item.label}
              </span>
            </Link>
          );
        })}

        <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase px-3 py-3 mt-4">
          Protocol Admin
        </div>

        {adminItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="flex items-center h-10 rounded-lg px-2 group/item text-slate-400 hover:text-white hover:bg-white/5 transition-all relative"
          >
            <div className="w-9 h-9 flex items-center justify-center shrink-0 opacity-70 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all">
              {item.icon}
            </div>
            <span className="ml-3 text-[13px] font-medium tracking-tight whitespace-nowrap">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5 space-y-2">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0 shadow-sm shadow-primary/10">
            AO
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-white truncate">Master Admin</div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Level 4 Clearance</div>
          </div>
        </div>

        <Link
          href="/admin/dashboard"
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 text-slate-400 border border-white/5 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Exit Secret Mode
        </Link>
      </div>
    </aside>
  );
}
