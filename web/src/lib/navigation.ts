"use client";

import { hasPermission, type User } from "./auth";

export interface NavItem {
  name: string;
  href: string;
  icon: string;
  permission?: string;
  roles?: string[];
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
    label: "Teacher Management",
    items: [
      { name: "Teacher Eligibilities", href: "/teacher-eligibilities", icon: "🎯", permission: "teacher_eligibility:view" },
      { name: "Teacher Assignments", href: "/teacher-assignments", icon: "📝", permission: "teacher_assignment:view" },
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
    label: "Examinations",
    items: [
      { name: "Examinations", href: "/examinations", icon: "📝", permission: "exam:view" },
      { name: "Exam Subjects", href: "/examinations/subjects", icon: "📚", permission: "exam:view" },
      { name: "Assessment Components", href: "/examinations/components", icon: "📊", permission: "exam:view" },
      { name: "Exam Schedules", href: "/examinations/schedules", icon: "📅", permission: "exam:view" },
      { name: "Student Marks", href: "/examinations/marks", icon: "📈", permission: "student_mark:view" },
    ],
  },
  {
    label: "Reports",
    items: [
      { name: "Attendance", href: "/attendance", icon: "✅", permission: "attendance:view" },
      { name: "Fees", href: "/fees", icon: "💰", permission: "fee:view" },
    ],
  },
  {
    label: "Finance",
    items: [
      { name: "Fee Types", href: "/fee-types", icon: "🏷️", permission: "fee_type:view" },
      { name: "Student Fees", href: "/student-fees", icon: "👨‍🎓", permission: "student_fee:view" },
      { name: "Payments", href: "/payments", icon: "💳", permission: "payment:view" },
      { name: "Receipts", href: "/receipts", icon: "🧾", permission: "receipt:view" },
    ],
  },
  {
    label: "Developer",
    items: [
      { name: "Developer Dashboard", href: "/developer", icon: "🛠️", roles: ["Developer"] },
      { name: "School Switcher", href: "/developer/schools", icon: "🏫", roles: ["Developer"] },
      { name: "School Onboarding", href: "/developer/schools/new", icon: "➕", roles: ["Developer"] },
      { name: "User Management", href: "/developer/users", icon: "👥", roles: ["Developer"] },
      { name: "Role Management", href: "/developer/roles", icon: "🔐", roles: ["Developer"] },
      { name: "Master Config", href: "/developer/masters", icon: "⚙️", roles: ["Developer"] },
      { name: "Integrations", href: "/developer/integrations", icon: "🔌", roles: ["Developer"] },
      { name: "System Logs", href: "/developer/logs", icon: "📋", roles: ["Developer"] },
      { name: "System Monitoring", href: "/developer/system", icon: "📊", roles: ["Developer"] },
    ],
  },
];

// Flatten all nav items for easy lookup
export const ALL_NAV_ITEMS: NavItem[] = NAVIGATION_GROUPS.flatMap((group) => group.items);

// Filter navigation based on user permissions and roles
export function getFilteredNavigation(user: User | null): NavGroup[] {
  if (!user) {
    return [{ label: "Dashboard", items: [{ name: "Dashboard", href: "/dashboard", icon: "📊" }] }];
  }

  // Developer is a system-level role, not a school role — it should never see
  // school-operational menus (Academic Structure, People, Finance, etc.),
  // even if a permission check would otherwise pass for it.
  const isDeveloper = user.roles.includes("Developer");
  if (isDeveloper) {
    return NAVIGATION_GROUPS.filter(
      (group) => group.label === "Dashboard" || group.label === "Developer"
    );
  }

  return NAVIGATION_GROUPS
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) => {
        // Developer-only items must never leak into a non-developer's menu,
        // regardless of their permissions.
        if (item.roles?.includes("Developer")) return false;

        // If no permission required and no role restriction, show it
        if (!item.permission && !item.roles) return true;
        // Check role restriction if present
        if (item.roles && item.roles.length > 0) {
          const hasRole = item.roles.some(role => user.roles.includes(role));
          if (!hasRole) return false;
        }
        // Check if user has the required permission
        if (item.permission && !hasPermission(user, item.permission)) return false;
        return true;
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

  // Check role restriction if present
  if (navItem.roles && navItem.roles.length > 0) {
    const hasRole = navItem.roles.some(role => user.roles.includes(role));
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