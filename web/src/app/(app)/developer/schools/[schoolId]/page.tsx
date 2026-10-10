"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems } from "@/lib/api";

interface School {
  id: string;
  name: string;
  code: string;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  academicYears: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    isCurrent: boolean;
  }>;
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    roles: Array<{
      roleId: string;
      role: { id: string; name: string };
    }>;
  }>;
  _count: {
    users: number;
    students: number;
    classes: number;
  };
}

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  scope: "GLOBAL" | "PER_SCHOOL";
  schoolId: string | null;
}

export default function SchoolManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const schoolId = params.schoolId as string;

  const [school, setSchool] = useState<School | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "settings" | "users" | "stats">("profile");
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const isDeveloper = user?.roles.includes("Developer") ?? false;

  const fetchSchool = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ data: School }>(`/developer/schools/${schoolId}`);
      setSchool(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch school");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const fetchFeatureFlags = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: FeatureFlag[] }>(`/developer/system/feature-flags?schoolId=${schoolId}`);
      setFeatureFlags(res.data);
    } catch {
      // ignore
    }
  }, [schoolId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchSchool();
    fetchFeatureFlags();
  }, [fetchSchool, fetchFeatureFlags]);

  if (!isDeveloper) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to manage schools.</p>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!school) return;
    try {
      setSaving(true);
      setError("");
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get("name"),
        address: formData.get("address") || undefined,
        contactEmail: formData.get("contactEmail") || undefined,
        contactPhone: formData.get("contactPhone") || undefined,
        timezone: formData.get("timezone"),
      };
      const res = await apiFetch<{ data: School }>(`/developer/schools/${schoolId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setSchool(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update school");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (isActive: boolean) => {
    if (!school) return;
    try {
      setSaving(true);
      setError("");
      await apiFetch(`/developer/schools/${schoolId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      setSchool(prev => prev ? { ...prev, isActive } : null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update school status");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || confirmName !== school.name) {
      setError("Please type the school name to confirm deactivation");
      return;
    }
    try {
      setDeactivating(true);
      setError("");
      await apiFetch(`/developer/schools/${schoolId}/deactivate`, {
        method: "POST",
        body: JSON.stringify({ reason: "Deactivated by developer", confirmName }),
      });
      router.push("/developer/schools");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate school");
    } finally {
      setDeactivating(false);
    }
  };

  const handleFeatureFlagToggle = async (flag: FeatureFlag) => {
    try {
      await apiFetch(`/developer/system/feature-flags/${flag.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      fetchFeatureFlags();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update feature flag");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏫</div>
        <h2 className="text-xl font-semibold text-gray-900">School Not Found</h2>
        <p className="text-gray-500 mt-2">{error || "The school you're looking for doesn't exist."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏫</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded font-mono">{school.code}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${school.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {school.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-500 mt-2">Manage school settings, users, and configuration</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleToggleActive(!school.isActive)}
            disabled={saving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${school.isActive ? "bg-orange-600 text-white hover:bg-orange-700" : "bg-green-600 text-white hover:bg-green-700"}`}
          >
            {school.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <nav className="border-b border-gray-200" aria-label="School management tabs">
          <ul className="flex -mb-px overflow-x-auto" role="tablist">
            {[
              { id: "profile", label: "Profile", icon: "🏫" },
              { id: "settings", label: "Settings", icon: "⚙️" },
              { id: "users", label: "Users", icon: "👥" },
              { id: "stats", label: "Quick Stats", icon: "📊" },
            ].map(tab => (
              <li key={tab.id} role="presentation">
                <button
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <form onSubmit={handleUpdate} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                <input
                  name="name"
                  defaultValue={school.name}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Code</label>
                <input
                  value={school.code}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">School code cannot be changed after creation</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                <input
                  name="contactEmail"
                  type="email"
                  defaultValue={school.contactEmail || ""}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input
                  name="contactPhone"
                  type="tel"
                  defaultValue={school.contactPhone || ""}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  defaultValue={school.address || ""}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  name="timezone"
                  defaultValue={school.timezone}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Europe/Berlin">Berlin</option>
                  <option value="Asia/Dubai">Dubai</option>
                  <option value="Asia/Singapore">Singapore</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Kolkata">Kolkata</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="p-6 space-y-8">
            {/* Academic Years */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Years</h3>
              <div className="space-y-3">
                {school.academicYears.length === 0 ? (
                  <p className="text-gray-500">No academic years configured</p>
                ) : (
                  school.academicYears.map(ay => (
                    <div key={ay.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{ay.name}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(ay.startDate).toLocaleDateString()} - {new Date(ay.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${ay.isCurrent ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                            {ay.isCurrent ? "Current" : "Draft"}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            {ay.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Feature Flags */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Flags</h3>
              <div className="space-y-3">
                {featureFlags.length === 0 ? (
                  <p className="text-gray-500">No feature flags configured</p>
                ) : (
                  featureFlags.map(flag => (
                    <div key={flag.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <div className="font-medium text-gray-900">{flag.name}</div>
                        <div className="text-sm text-gray-500">{flag.description}</div>
                        <div className="text-xs text-gray-400 mt-1">{flag.scope} • {flag.key}</div>
                      </div>
                      <button
                        onClick={() => handleFeatureFlagToggle(flag)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flag.enabled ? "bg-blue-600" : "bg-gray-200"}`}
                        role="switch"
                        aria-checked={flag.enabled}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.enabled ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {school.users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No users found</td>
                    </tr>
                  ) : (
                    school.users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map(r => (
                              <span key={r.roleId} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                {r.role.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-3xl font-bold text-gray-900">{school._count.users}</div>
                <div className="text-gray-500 mt-1">Total Users</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-3xl font-bold text-gray-900">{school._count.students}</div>
                <div className="text-gray-500 mt-1">Total Students</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-3xl font-bold text-gray-900">{school._count.classes}</div>
                <div className="text-gray-500 mt-1">Total Classes</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><dt className="text-gray-500">Created</dt><dd className="font-medium text-gray-900">{new Date(school.createdAt).toLocaleString()}</dd></div>
                <div><dt className="text-gray-500">Last Updated</dt><dd className="font-medium text-gray-900">{new Date(school.updatedAt).toLocaleString()}</dd></div>
                <div><dt className="text-gray-500">Timezone</dt><dd className="font-medium text-gray-900">{school.timezone}</dd></div>
                <div><dt className="text-gray-500">Academic Years</dt><dd className="font-medium text-gray-900">{school.academicYears.length}</dd></div>
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone - Deactivate School */}
      {school.isActive && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
            <span>⚠️</span> Danger Zone
          </h3>
          <p className="text-red-700 mb-4">
            Deactivating this school will prevent all users from accessing it. This action requires typing the school name to confirm.
          </p>
          <form onSubmit={handleDeactivate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">Type school name to confirm</label>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={`Type "${school.name}" to confirm`}
                className="w-full px-4 py-2.5 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={deactivating || confirmName !== school.name}
              className="w-full px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deactivating ? "Deactivating..." : "Deactivate School"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}