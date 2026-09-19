"use client";

import { hasPermission, type User } from "./auth";

// Define all navigation items with their required permissions
export interface NavItem {
  name: string;
  href: string;
  icon: string;
  permission?: string;
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// Complete navigation structure with permissions
export const NAVIGATION_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: "📊" },
    ],
  },
  {
    label: "Academic Structure",
    items: [
      { name: "Academic Years", href: "/academic-years", icon: "📅", permission: "academic_year:view" },
      { name: "Classes", href: "/classes", icon: "🏫", permission: "class:view" },
      { name: "Sections", href: "/sections", icon: "📚", permission: "section:view" },
      { name: "Subjects", href: "/subjects", icon: "📖", permission: "subject:view" },
      { name: "Subject Types", href: "/subject-types", icon: "🏷️", permission: "subject_type:view" },
      { name: "Class Subjects", href: "/class-subjects", icon: "🔗", permission: "class_subject:view" },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Students", href: "/students", icon: "🎓", permission: "student:view" },
      { name: "Parents", href: "/parents", icon: "👨‍👩‍👧‍👦", permission: "parent:view" },
      { name: "Enrollments", href: "/enrollments", icon: "📋", permission: "student_enrollment:view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { name: "Users", href: "/users", icon: "👥", permission: "user:view" },
      { name: "Roles", href: "/roles", icon: "🔐", permission: "role:view" },
    ],
  },
  {
    label: "Reports",
    items: [
      { name: "Attendance", href: "/attendance", icon: "✅", permission: "attendance:view" },
      { name: "Examinations", href: "/examinations", icon: "📝", permission: "exam:view" },
      { name: "Fees", href: "/fees", icon: "💰", permission: "fee:view" },
    ],
  },
];

// Flatten all nav items for easy lookup
export const ALL_NAV_ITEMS: NavItem[] = NAVIGATION_GROUPS.flatMap((group) => group.items);

// Filter navigation based on user permissions
export function getFilteredNavigation(user: User | null): NavGroup[] {
  if (!user) {
    return [{ label: "Dashboard", items: [{ name: "Dashboard", href: "/dashboard", icon: "📊" }] }];
  }

  return NAVIGATION_GROUPS
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) => {
        // If no permission required, show it
        if (!item.permission) return true;
        // Check if user has the required permission
        return hasPermission(user, item.permission);
      }),
    }))
    .filter((group) => group.items.length > 0);
}

// Check if user has access to a specific path
export function canAccessPath(user: User | null, path: string): boolean {
  if (!user) return false;

  // Find the nav item matching the path
  const navItem = ALL_NAV_ITEMS.find((item) => item.href === path);
  if (!navItem) return true; // Allow unknown paths (might be sub-pages)

  if (!navItem.permission) return true;
  return hasPermission(user, navItem.permission);
}

// Get user's primary role for display
export function getPrimaryRole(user: User | null): string {
  if (!user?.roles?.length) return "No Role";
  return user.roles[0];
}