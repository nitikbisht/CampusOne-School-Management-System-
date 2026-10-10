"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { NAV_ICONS } from "@/lib/navigation";

interface SidebarHeaderProps {
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ onToggleCollapse, isCollapsed }, ref) => {
    return (
      <div
        ref={ref}
        className="flex items-center justify-between h-16 px-4 border-b border-gray-200"
        role="banner"
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xl font-bold text-gray-900 transition-opacity"
          aria-label="CampusOne Dashboard"
        >
          <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            C1
          </span>
          {!isCollapsed && <span className="whitespace-nowrap">CampusOne</span>}
        </Link>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <NAV_ICONS.chevronRight className="w-5 h-5" /> : <NAV_ICONS.chevronLeft className="w-5 h-5" />}
          </button>
        )}
      </div>
    );
  }
);

SidebarHeader.displayName = "SidebarHeader";