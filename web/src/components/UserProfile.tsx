"use client";

import { NAV_ICONS } from "@/lib/navigation";
import { getPrimaryRole } from "@/lib/navigation";
import type { User } from "@/lib/auth";

interface UserProfileProps {
  user: User | null;
  onLogout: () => void;
  isCollapsed?: boolean;
}

export function UserProfile({ user, onLogout, isCollapsed }: UserProfileProps) {
  if (!user) return null;

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
        {!isCollapsed && <p className="text-xs text-gray-500">Signed in as</p>}
        <p className="text-sm font-medium text-gray-900 capitalize truncate">
          {getPrimaryRole(user).toLowerCase()}
        </p>
      </div>
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
      >
        <span className="flex-shrink-0" aria-hidden="true">
          <NAV_ICONS.logout className="w-5 h-5" />
        </span>
        {!isCollapsed && <span className="flex-1 truncate">Sign out</span>}
      </button>
    </div>
  );
}