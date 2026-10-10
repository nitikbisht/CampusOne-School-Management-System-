"use client";

import { memo, useState, useEffect } from "react";
import { NavItem } from "./NavItem";
import type { NavGroup as NavGroupType } from "@/lib/navigation";

interface NavGroupProps {
  group: NavGroupType;
  pathname: string;
  isCollapsed?: boolean;
  expandedGroups?: Set<string>;
  onToggleGroup?: (groupLabel: string) => void;
}

export const NavGroup = memo(function NavGroup({
  group,
  pathname,
  isCollapsed,
  expandedGroups,
  onToggleGroup,
}: NavGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const groupKey = group.label;

  // Auto-expand if any child matches current route
  useEffect(() => {
    const hasActiveChild = group.items.some(
      (item) => item.href === pathname || item.children?.some((child) => child.href === pathname)
    );
    if (hasActiveChild) {
      setIsExpanded(true);
      onToggleGroup?.(groupKey);
    }
  }, [pathname, group.items, onToggleGroup, groupKey]);

  // Check if group is controlled externally
  const isControlledExpanded = expandedGroups?.has(groupKey) ?? false;
  const effectiveExpanded = expandedGroups ? isControlledExpanded : isExpanded;

  const handleToggle = () => {
    if (expandedGroups) {
      onToggleGroup?.(groupKey);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  if (isCollapsed) {
    // In collapsed mode, render items flat without group labels
    return (
      <>
        {group.items.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            isParentActive={item.children?.some((child) => child.href === pathname) ?? false}
            level={0}
            isCollapsed={true}
          />
        ))}
      </>
    );
  }

  return (
    <div className="space-y-1" role="navigation" aria-label={group.label}>
      {group.items.some((item) => !item.children || item.children.length === 0) && (
        <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {group.label}
        </p>
      )}
      {group.items.map((item) => {
        const isActive = pathname === item.href;
        const isParentActive = item.children?.some((child) => child.href === pathname) ?? false;
        const hasChildren = item.children && item.children.length > 0;

        return (
          <div key={item.href}>
            <NavItem
              item={item}
              isActive={effectiveExpanded && (isActive || isParentActive)}
              isParentActive={isParentActive}
              onClick={hasChildren ? handleToggle : undefined}
              level={0}
              isCollapsed={false}
            />
            {hasChildren && effectiveExpanded && (
              <div
                id={`nav-children-${item.href.replace(/\//g, "-")}`}
                role="group"
                aria-labelledby={`nav-trigger-${item.href.replace(/\//g, "-")}`}
                className="animate-slide-down"
              >
                {item.children!.map((child) => (
                  <NavItem
                    key={child.href}
                    item={child}
                    isActive={pathname === child.href}
                    isParentActive={false}
                    level={1}
                    isCollapsed={false}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});