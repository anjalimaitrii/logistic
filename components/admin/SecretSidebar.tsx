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
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Secret Job Ledger",
      href: "/admin/secret/jobs",
      icon: (
        <svg className="w-4.5 h-4.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
  ];

  const adminItems: NavItem[] = [
    {
       label: "Tax Audit",
       href: "#",
       icon: (
          <svg className="w-4.5 h-4.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
       )
    }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 w-[240px] bg-white border-r border-neutral-200 flex flex-col z-200 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="p-5 pb-4 border-b border-neutral-100 flex items-center gap-2.5">
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-lg font-black text-white shadow-[0_4px_12px_rgba(79,70,229,0.2)]">
          SL
        </div>
        <div className="font-bold text-lg tracking-tight text-neutral-900">
          Special<span className="text-indigo-600">Ledger</span>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        <div className="text-[10px] font-black text-neutral-400 tracking-widest uppercase px-2.5 py-3 mt-1">Special Ops</div>
        {secretNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg font-bold relative transition-all text-[13.5px] ${
                isActive
                  ? "bg-indigo-50 text-indigo-600 shadow-sm"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              {isActive && <div className="absolute left-0 top-[20%] bottom-[20%] w-1 bg-indigo-600 rounded-full" />}
              {item.icon}
              {item.label}
            </Link>
          );
        })}

        <div className="text-[10px] font-black text-neutral-400 tracking-widest uppercase px-2.5 py-3 mt-4">Protocol Admin</div>
        {adminItems.map((item) => (
           <Link
             key={item.label}
             href={item.href}
             onClick={onClose}
             className="flex items-center gap-2.5 p-2.5 rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-all text-[13.5px] font-bold"
           >
             {item.icon}
             {item.label}
           </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-100 space-y-3">
         <div className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50 border border-neutral-100">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-black text-[10px] text-indigo-600">AO</div>
            <div className="min-w-0 flex-1">
               <div className="text-[12px] font-bold text-neutral-900 truncate">Master Admin</div>
               <div className="text-[9px] font-black text-neutral-400 uppercase tracking-tighter">Level 4 Clearance</div>
            </div>
         </div>

         <Link 
            href="/admin/dashboard" 
            className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-100 transition-all shadow-sm"
         >
            🚪 Exit Secret Mode
         </Link>
      </div>
    </aside>
  );
}
