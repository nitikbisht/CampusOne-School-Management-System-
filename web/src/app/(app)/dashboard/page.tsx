import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user.firstName}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Your Role</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{user.roles.join(", ") || "No roles assigned"}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">School ID</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 font-mono text-sm">{user.schoolId}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Email</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 text-sm">{user.email}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Permissions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{user.permissions.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Permissions</h2>
        <div className="flex flex-wrap gap-2">
          {user.permissions.map((permission) => (
            <span
              key={permission}
              className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full"
            >
              {permission}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}