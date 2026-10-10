"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { NavGroup } from "./NavGroup";
import type { NavGroup as NavGroupType } from "@/lib/navigation";

interface SidebarNavProps {
  navigationGroups: NavGroupType[];
  isCollapsed?: boolean;
  expandedGroups?: Set<string>;
  onToggleGroup?: (groupLabel: string) => void;
}

export const SidebarNav = memo(function SidebarNav({
  navigationGroups,
  isCollapsed,
  expandedGroups,
  onToggleGroup,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto" role="navigation" aria-label="Main navigation">
      {navigationGroups.map((group) => (
        <NavGroup
          key={group.label}
          group={group}
          pathname={pathname}
          isCollapsed={isCollapsed}
          expandedGroups={expandedGroups}
          onToggleGroup={onToggleGroup}
        />
      ))}
    </nav>
  );
});