"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export default function AdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
        <svg className="w-4.5 h-4.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
      label: "Jobs",
      href: "/admin/jobs",
      badge: "12",
      icon: (
        <svg className="w-4.5 h-4.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      label: "Trucks",
      href: "/admin/trucks",
      icon: (
        <svg className="w-4.5 h-4.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
        <svg className="w-4.5 h-4.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const operationsItems: NavItem[] = [
    {
      label: "Finance",
      href: "#",
      icon: (
        <svg className="w-4.5 h-4.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Reports",
      href: "#",
      icon: (
        <svg className="w-4.5 h-4.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
      className={`fixed top-0 left-0 bottom-0 w-[240px] bg-white border-r border-neutral-200 flex flex-col z-200 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="p-5 pb-4 border-b border-neutral-100 flex items-center gap-2.5">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-lg font-extrabold text-white shadow-[0_4px_12px_rgba(255,107,0,0.2)]">
          FT
        </div>
        <div className="font-bold text-lg tracking-tight text-neutral-900">
          Fleet<span className="text-primary">Track</span>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        <div className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase px-2.5 py-3 mt-1">Main</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg font-bold relative transition-all text-[13.5px] ${
                isActive
                  ? "bg-primary-light text-primary"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              {isActive && <div className="absolute left-0 top-[20%] bottom-[20%] w-1 bg-primary rounded-full" />}
              {item.icon}
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase px-2.5 py-3 mt-4">
          Operations
        </div>
        {operationsItems.map((item) => (
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

      <div className="p-3 border-t border-neutral-100">
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-neutral-50 cursor-pointer group transition-colors border border-transparent hover:border-neutral-100">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-primary-mid flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-lg shadow-primary/20">
            AO
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-neutral-900 truncate">Adebayo Okafor</div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
