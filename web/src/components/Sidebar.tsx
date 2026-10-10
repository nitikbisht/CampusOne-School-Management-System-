"use client";

import { useState, useCallback } from "react";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNav } from "./SidebarNav";
import { UserProfile } from "./UserProfile";
import type { NavGroup } from "@/lib/navigation";
import type { User } from "@/lib/auth";

interface SidebarProps {
  navigationGroups: NavGroup[];
  user: User | null;
  onLogout: () => void;
}

export function Sidebar({ navigationGroups, user, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleToggleGroup = useCallback((groupLabel: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupLabel)) {
        next.delete(groupLabel);
      } else {
        next.add(groupLabel);
      }
      return next;
    });
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0">
      <div className="flex flex-col h-full">
        <SidebarHeader onToggleCollapse={handleToggleCollapse} isCollapsed={isCollapsed} />
        <SidebarNav
          navigationGroups={navigationGroups}
          isCollapsed={isCollapsed}
          expandedGroups={expandedGroups}
          onToggleGroup={handleToggleGroup}
        />
        <UserProfile user={user} onLogout={onLogout} isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}