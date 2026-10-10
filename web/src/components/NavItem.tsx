"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ICONS } from "@/lib/navigation";
import type { NavItem as NavItemType } from "@/lib/navigation";

interface NavItemProps {
  item: NavItemType;
  isActive: boolean;
  isParentActive: boolean;
  onClick?: () => void;
  level?: number;
  isCollapsed?: boolean;
}

export const NavItem = memo(function NavItem({
  item,
  isActive,
  isParentActive,
  onClick,
  level = 0,
  isCollapsed,
}: NavItemProps) {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  const isCurrentRoute = pathname === item.href;

  // For parent items with children, we don't navigate on click (accordion toggle)
  // For leaf items, we use Link for navigation
  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      onClick?.();
    }
  };

  const baseStyles = `
    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    ${isCollapsed ? "justify-center" : ""}
  `;

  const activeStyles = `
    bg-blue-50 text-blue-700
    ${isParentActive && !isActive ? "bg-blue-25 text-blue-600" : ""}
  `;

  const inactiveStyles = `
    text-gray-600 hover:bg-gray-100 hover:text-gray-900
  `;

  const indentStyles = level > 0 ? `pl-${4 + level * 4}` : "";

  if (hasChildren) {
    return (
      <button
        onClick={handleClick}
        className={`${baseStyles} ${indentStyles} ${isActive || isParentActive ? activeStyles : inactiveStyles} w-full text-left`}
        aria-expanded={isActive}
        aria-controls={`nav-children-${item.href.replace(/\//g, "-")}`}
        id={`nav-trigger-${item.href.replace(/\//g, "-")}`}
        type="button"
      >
        <span className="flex-shrink-0" aria-hidden="true">
          <item.icon className="w-5 h-5" />
        </span>
        {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
        {!isCollapsed && (
          <NAV_ICONS.chevronRight
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${isActive ? "rotate-90" : ""}`}
            aria-hidden="true"
          />
        )}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`${baseStyles} ${indentStyles} ${isCurrentRoute ? activeStyles : inactiveStyles}`}
      aria-current={isCurrentRoute ? "page" : undefined}
    >
      <span className="flex-shrink-0" aria-hidden="true">
        <item.icon className="w-5 h-5" />
      </span>
      {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
    </Link>
  );
});