"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Academic Years", href: "/academic-years", icon: "📅" },
  { name: "Users", href: "/users", icon: "👥" },
  { name: "Roles", href: "/roles", icon: "🔐" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <span className="text-xl font-bold text-gray-900">CampusOne</span>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
            >
              <span className="text-lg">🚪</span>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {navigation.find((n) => n.href === pathname)?.name ?? "Dashboard"}
              </h2>
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
  );
}