"use client";

import React from "react";
import {
    LayoutDashboard,
    Truck,
    FileText,
    User,
    Settings,
    HelpCircle,
    LogOut
} from "lucide-react";
import { SidebarNavigationSlim } from "../application/app-navigation/sidebar-navigation/sidebar-slim";
import type { NavItemType } from "../application/app-navigation/config";
import { useRouter } from "next/navigation";

const navItems: (NavItemType & { icon: any })[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Jobs",
        href: "/dashboard/jobs",
        icon: Truck,
    },
    {
        label: "Ledger",
        href: "/dashboard/ledger",
        icon: FileText,
    },
    {
        label: "Profile",
        href: "/dashboard/profile",
        icon: User,
    },
];

export function ClientSidebarNavigation({ isExpanded, onHover }: { isExpanded: boolean; onHover: (expanded: boolean) => void }) {
    const router = useRouter();

    const handleLogout = () => {
        document.cookie = 'role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push("/");
    };

    return (
        <SidebarNavigationSlim
            items={navItems}
            isExpanded={isExpanded}
            onHover={onHover}
            footerItems={[
                {
                    label: "Logout",
                    onClick: handleLogout,
                    icon: LogOut,
                },
            ]}
        />
    );
}
