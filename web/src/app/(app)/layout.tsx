"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SchoolProvider } from "@/lib/school-context";
import { getFilteredNavigation, flattenNavItems } from "@/lib/navigation";
import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const navigationGroups = getFilteredNavigation(user);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  // Find current page name for header (including nested items)
  const allItems = navigationGroups.flatMap((g) => flattenNavItems(g.items));
  const currentPageName = allItems.find((item) => item.href === pathname)?.name ?? "Dashboard";

  return (
    <SchoolProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <Sidebar navigationGroups={navigationGroups} user={user} onLogout={handleLogout} />

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:pl-64">
          {/* Top header */}
          <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900">{currentPageName}</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-sm text-gray-600">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                  {user?.firstName?.[0] ?? "U"}
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SchoolProvider>
  );
}