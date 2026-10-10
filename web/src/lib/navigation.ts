"use client";

import { hasPermission, type User } from "./auth";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  roles?: string[];
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// Import Lucide icons
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  Calendar,
  Building2,
  BookOpen,
  BookA,
  Tag,
  Link as LinkIcon,
  Award,
  ClipboardList,
  FileText,
  CheckSquare,
  CalendarDays,
  PenTool,
  CreditCard,
  Receipt,
  Megaphone,
  Bell,
  ClipboardCheck,
  Shield,
  Wrench,
  PlugZap,
  Activity,
  Monitor,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  LogOut,
  UserCircle,
  ChevronLeft,
  Building as BuildingIcon,
  Users as UsersIcon,
  Database,
} from "lucide-react";

// Complete navigation structure with nested children
// Maps to actual existing routes in the application
export const NAVIGATION_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Students", href: "/students", icon: GraduationCap, permission: "student:view" },
      { name: "Parents", href: "/parents", icon: Users, permission: "parent:view" },
      { name: "Enrollments", href: "/enrollments", icon: LinkIcon, permission: "student_enrollment:view" },
    ],
  },
  {
    label: "Academics",
    items: [
      { name: "Academic Years", href: "/academic-years", icon: Calendar, permission: "academic_year:view" },
      { name: "Classes", href: "/classes", icon: Building2, permission: "class:view" },
      { name: "Sections", href: "/sections", icon: BookOpen, permission: "section:view" },
      { name: "Subjects", href: "/subjects", icon: BookA, permission: "subject:view" },
      { name: "Subject Types", href: "/subject-types", icon: Tag, permission: "subject_type:view" },
      { name: "Class Subjects", href: "/class-subjects", icon: LinkIcon, permission: "class_subject:view" },
      { name: "Teacher Assignments", href: "/teacher-assignments", icon: Award, permission: "teacher_assignment:view" },
      { name: "Teacher Eligibilities", href: "/teacher-eligibilities", icon: ClipboardList, permission: "teacher_eligibility:view" },
    ],
  },
  {
    label: "Examinations",
    items: [
      { name: "Examinations", href: "/examinations", icon: FileText, permission: "exam:view" },
      { name: "Exam Subjects", href: "/examinations/subjects", icon: BookA, permission: "exam:view" },
      { name: "Assessment Components", href: "/examinations/components", icon: ClipboardCheck, permission: "exam:view" },
      { name: "Exam Schedules", href: "/examinations/schedules", icon: CalendarDays, permission: "exam:view" },
      { name: "Student Marks", href: "/examinations/marks", icon: PenTool, permission: "student_mark:view" },
    ],
  },
  {
    label: "Attendance & Timetable",
    items: [
      { name: "Attendance", href: "/attendance", icon: CheckSquare, permission: "attendance:view" },
    ],
  },
  {
    label: "Fees & Finance",
    items: [
      { name: "Fee Types", href: "/fee-types", icon: Tag, permission: "fee_type:view" },
      { name: "Student Fees", href: "/student-fees", icon: CreditCard, permission: "student_fee:view" },
      { name: "Payments", href: "/payments", icon: CreditCard, permission: "payment:view" },
      { name: "Receipts", href: "/receipts", icon: Receipt, permission: "receipt:view" },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Notices", href: "/notices", icon: Megaphone, permission: "attendance:view" },
      { name: "Notifications", href: "/notifications", icon: Bell, permission: "attendance:view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { name: "Users", href: "/users", icon: UsersIcon, permission: "user:view" },
      { name: "Roles & Permissions", href: "/roles", icon: Shield, permission: "role:view" },
      { name: "Departments", href: "/departments", icon: BuildingIcon, permission: "user:view" },
    ],
  },
  {
    label: "Developer",
    items: [
      { name: "Developer Dashboard", href: "/developer", icon: Wrench, roles: ["Developer"] },
      { name: "School Switcher", href: "/developer/schools", icon: Building2, roles: ["Developer"] },
      { name: "School Onboarding", href: "/developer/schools/new", icon: UserPlus, roles: ["Developer"] },
      { name: "User Management", href: "/developer/users", icon: UsersIcon, roles: ["Developer"] },
      { name: "Role Management", href: "/developer/roles", icon: Shield, roles: ["Developer"] },
      { name: "Master Config", href: "/developer/masters", icon: Database, roles: ["Developer"] },
      { name: "Integrations", href: "/developer/integrations", icon: PlugZap, roles: ["Developer"] },
      { name: "System Logs", href: "/developer/logs", icon: Activity, roles: ["Developer"] },
      { name: "System Monitoring", href: "/developer/system", icon: Monitor, roles: ["Developer"] },
    ],
  },
];

// Flatten all nav items for easy lookup (including nested children)
export function flattenNavItems(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenNavItems(item.children) : [])]);
}

export const ALL_NAV_ITEMS: NavItem[] = NAVIGATION_GROUPS.flatMap((group) => flattenNavItems(group.items));

// Filter navigation based on user permissions and roles (recursive for children)
function filterNavItem(item: NavItem, user: User): boolean {
  const isDeveloper = user.roles.includes("Developer");

  // Developer-only items must never leak into a non-developer's menu
  if (item.roles?.includes("Developer") && !isDeveloper) return false;

  // If no permission required and no role restriction, show it
  if (!item.permission && !item.roles) return true;

  // Check role restriction if present
  if (item.roles && item.roles.length > 0) {
    const hasRole = item.roles.some((role) => user.roles.includes(role));
    if (!hasRole) return false;
  }

  // Check if user has the required permission
  if (item.permission && !hasPermission(user, item.permission)) return false;

  return true;
}

function filterNavItems(items: NavItem[], user: User): NavItem[] {
  return items
    .filter((item) => filterNavItem(item, user))
    .map((item) => ({
      ...item,
      children: item.children ? filterNavItems(item.children, user) : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0 || !item.permission); // Keep items with children or no permission requirement
}

export function getFilteredNavigation(user: User | null): NavGroup[] {
  if (!user) {
    return [{ label: "Dashboard", items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] }];
  }

  // Developer is a system-level role — only show Dashboard and Developer sections
  const isDeveloper = user.roles.includes("Developer");
  if (isDeveloper) {
    return NAVIGATION_GROUPS.filter(
      (group) => group.label === "Dashboard" || group.label === "Developer"
    ).map((group) => ({
      label: group.label,
      items: filterNavItems(group.items, user),
    }));
  }

  return NAVIGATION_GROUPS
    .map((group) => ({
      label: group.label,
      items: filterNavItems(group.items, user),
    }))
    .filter((group) => group.items.length > 0);
}

// Check if user has access to a specific path
export function canAccessPath(user: User | null, path: string): boolean {
  if (!user) return false;

  // Find the nav item matching the path
  const navItem = ALL_NAV_ITEMS.find((item) => item.href === path);
  if (!navItem) return true; // Allow unknown paths (might be sub-pages)

  // Check role restriction if present
  if (navItem.roles && navItem.roles.length > 0) {
    const hasRole = navItem.roles.some((role) => user.roles.includes(role));
    if (!hasRole) return false;
  }

  if (!navItem.permission) return true;
  return hasPermission(user, navItem.permission);
}

// Get user's primary role for display
export function getPrimaryRole(user: User | null): string {
  if (!user?.roles?.length) return "No Role";
  return user.roles[0];
}

// Navigation icons for UI components
export const NAV_ICONS = {
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  menu: Menu,
  x: X,
  logout: LogOut,
  userCircle: UserCircle,
  chevronLeft: ChevronLeft,
  home: LayoutDashboard,
} as const;