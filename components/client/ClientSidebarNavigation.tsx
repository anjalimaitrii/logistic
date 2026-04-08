"use client";

import React from "react";
import {
    LayoutDashboard,
    Truck,
    FileText,
    User,
    Settings,
    HelpCircle
} from "lucide-react";
import { SidebarNavigationSlim } from "../application/app-navigation/sidebar-navigation/sidebar-slim";
import type { NavItemType } from "../application/app-navigation/config";

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
    return (
        <SidebarNavigationSlim
            items={navItems}
            isExpanded={isExpanded}
            onHover={onHover}
            footerItems={[
                {
                    label: "Support",
                    href: "/dashboard/support",
                    icon: HelpCircle,
                },
                {
                    label: "Settings",
                    href: "/dashboard/settings",
                    icon: Settings,
                },
            ]}
        />
    );
}
