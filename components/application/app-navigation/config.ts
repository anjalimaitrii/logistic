import type { FC } from "react";

export interface NavItemType {
  label: string;
  href?: string;
  icon?: FC<{ className?: string }>;
  badge?: number | string;
  items?: NavItemType[];
}

export interface SidebarSlimProps {
  items: (NavItemType & { icon: FC<{ className?: string }> })[];
  footerItems?: NavItemType[];
}
