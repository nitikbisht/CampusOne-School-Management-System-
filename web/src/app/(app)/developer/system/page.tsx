"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";

interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: { status: string; latency: number };
    redis: { status: string };
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
  school?: { id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ApiConfig {
  id: string;
  key: string;
  name: string;
  description: string | null;
  rateLimit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DeveloperSystemPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"health" | "feature-flags" | "api-config">("health");
  const [healthLoading, setHealthLoading] = useState(true);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(true);

  // Feature flag modal states
  const [showCreateFlagModal, setShowCreateFlagModal] = useState(false);
  const [showEditFlagModal, setShowEditFlagModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [creatingFlag, setCreatingFlag] = useState(false);
  const [updatingFlag, setUpdatingFlag] = useState(false);
  const [togglingFlagId, setTogglingFlagId] = useState<string | null>(null);

  // Feature flag form states
  const [createFlagForm, setCreateFlagForm] = useState({
    key: "new_fee_module",
    name: "",
    description: "",
    enabled: false,
    scope: "GLOBAL" as "GLOBAL" | "PER_SCHOOL",
    schoolId: "",
  });
  const [editFlagForm, setEditFlagForm] = useState({
    name: "",
    description: "",
    enabled: false,
    scope: "GLOBAL" as "GLOBAL" | "PER_SCHOOL",
    schoolId: "",
  });

  const isDeveloper = user?.roles.includes("Developer") ?? false;

  const fetchHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      const res = await apiFetch<{ data: SystemHealth }>("/developer/system/health");
      setHealth(res.data);
    } catch (err) {
      console.error("Failed to fetch health:", err);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchFeatureFlags = useCallback(async () => {
    try {
      setFlagsLoading(true);
      const res = await apiFetch<PaginatedResponse<FeatureFlag>>("/developer/system/feature-flags");
      setFeatureFlags(res.data.items);
    } catch (err) {
      console.error("Failed to fetch feature flags:", err);
    } finally {
      setFlagsLoading(false);
    }
  }, []);

  const fetchApiConfigs = useCallback(async () => {
    try {
      setApiLoading(true);
      const res = await apiFetch<{ data: ApiConfig[] }>("/developer/system/api-configs");
      setApiConfigs(res.data);
    } catch (err) {
      console.error("Failed to fetch API configs:", err);
    } finally {
      setApiLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchHealth();
    fetchFeatureFlags();
    fetchApiConfigs();
  }, [fetchHealth, fetchFeatureFlags, fetchApiConfigs]);

  if (!isDeveloper) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to access system monitoring.</p>
      </div>
    );
  }

  // Refresh health every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const handleFlagToggle = async (flag: FeatureFlag) => {
    setTogglingFlagId(flag.id);
    try {
      setError("");
      await apiFetch(`/developer/system/feature-flags/${flag.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      fetchFeatureFlags();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to toggle feature flag");
    } finally {
      setTogglingFlagId(null);
    }
  };

  const openCreateFlagModal = () => {
    setCreateFlagForm({
      key: "new_fee_module",
      name: "",
      description: "",
      enabled: false,
      scope: "GLOBAL",
      schoolId: "",
    });
    setShowCreateFlagModal(true);
  };

  const openEditFlagModal = (flag: FeatureFlag) => {
    setSelectedFlag(flag);
    setEditFlagForm({
      name: flag.name,
      description: flag.description || "",
      enabled: flag.enabled,
      scope: flag.scope,
      schoolId: flag.schoolId || "",
    });
    setShowEditFlagModal(true);
  };

  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingFlag(true);
      setError("");
      await apiFetch("/developer/system/feature-flags", {
        method: "POST",
        body: JSON.stringify(createFlagForm),
      });
      setShowCreateFlagModal(false);
      fetchFeatureFlags();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create feature flag");
    } finally {
      setCreatingFlag(false);
    }
  };

  const handleUpdateFlag = async (e: React.FormEvent) => {
    if (!selectedFlag) return;
    e.preventDefault();
    try {
      setUpdatingFlag(true);
      setError("");
      await apiFetch(`/developer/system/feature-flags/${selectedFlag.id}`, {
        method: "PATCH",
        body: JSON.stringify(editFlagForm),
      });
      setShowEditFlagModal(false);
      setSelectedFlag(null);
      fetchFeatureFlags();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update feature flag");
    } finally {
      setUpdatingFlag(false);
    }
  };

  const handleDeleteFlag = async (id: string) => {
    if (!confirm("Delete this feature flag?")) return;
    try {
      await apiFetch(`/developer/system/feature-flags/${id}`, { method: "DELETE" });
      fetchFeatureFlags();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete feature flag");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-green-500";
      case "degraded": return "bg-yellow-500";
      case "unhealthy": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "healthy": return "Healthy";
      case "degraded": return "Degraded";
      case "unhealthy": return "Unhealthy";
      default: return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-500 mt-1">Health checks, feature flags, and API configuration</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={healthLoading}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${healthLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <nav className="border-b border-gray-200" aria-label="System monitoring tabs">
          <ul className="flex -mb-px overflow-x-auto" role="tablist">
            {[
              { id: "health", label: "System Health", icon: "🏥" },
              { id: "feature-flags", label: "Feature Flags", icon: "🚩" },
              { id: "api-config", label: "API Config", icon: "🔧" },
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

        {/* Health Tab */}
        {activeTab === "health" && (
          <div className="p-6 space-y-6">
            {healthLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : health ? (
              <>
                {/* Overall Status */}
                <div className={`bg-white border border-gray-200 rounded-xl p-6 ${health.status === "healthy" ? "border-green-500" : health.status === "degraded" ? "border-yellow-500" : "border-red-500"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
                      <p className="text-gray-500 mt-1">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(health.status)}`} />
                      <span className="text-lg font-semibold text-gray-900 capitalize">{getStatusLabel(health.status)}</span>
                    </div>
                  </div>
                </div>

                {/* Health Checks */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${getStatusColor(health.checks.database.status)}`} />
                      Database
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status</span>
                        <span className={`font-medium capitalize ${health.checks.database.status === "healthy" ? "text-green-600" : "text-red-600"}`}>
                          {health.checks.database.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Latency</span>
                        <span className="font-medium text-gray-900">{health.checks.database.latency}ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${health.checks.redis.status === "healthy" ? "bg-green-500" : health.checks.redis.status === "not_configured" ? "bg-gray-500" : "bg-red-500"}`} />
                      Redis / Cache
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status</span>
                        <span className={`font-medium ${health.checks.redis.status === "healthy" ? "text-green-600" : health.checks.redis.status === "not_configured" ? "text-gray-600" : "text-red-600"}`}>
                          {health.checks.redis.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={fetchHealth}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Refresh Health Check
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏥</div>
                <h2 className="text-xl font-semibold text-gray-900">Health Check Unavailable</h2>
                <p className="text-gray-500 mt-2">Unable to fetch system health status.</p>
              </div>
            )}
          </div>
        )}

        {/* Feature Flags Tab */}
        {activeTab === "feature-flags" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Feature Flags</h2>
              <button
                onClick={openCreateFlagModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Flag
              </button>
            </div>

            {flagsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : featureFlags.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚩</div>
                <h2 className="text-xl font-semibold text-gray-900">No Feature Flags</h2>
                <p className="text-gray-500 mt-2">Create feature flags to control feature rollouts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {featureFlags.map(flag => (
                  <div key={flag.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-900">{flag.name}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${flag.scope === "GLOBAL" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                            {flag.scope}
                          </span>
                          {flag.schoolId && flag.school && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                              {flag.school.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{flag.description || "No description"}</p>
                        <p className="text-xs text-gray-400 mt-1">{flag.key}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleFlagToggle(flag)}
                          disabled={togglingFlagId === flag.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flag.enabled ? "bg-blue-600" : "bg-gray-200"}`}
                          role="switch"
                          aria-checked={flag.enabled}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.enabled ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditFlagModal(flag)}
                            className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFlag(flag.id)}
                            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* API Config Tab */}
        {activeTab === "api-config" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">API Configuration</h2>
            {apiLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : apiConfigs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔧</div>
                <h2 className="text-xl font-semibold text-gray-900">No API Configurations</h2>
                <p className="text-gray-500 mt-2">API configurations will appear here once implemented.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Limit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {apiConfigs.map(config => (
                      <tr key={config.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm text-gray-900">{config.key}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{config.name}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">{config.description || "—"}</td>
                        <td className="px-6 py-4 text-gray-900 text-sm">{config.rateLimit ? `${config.rateLimit}/min` : "Unlimited"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                            {config.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{new Date(config.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Feature Flag Modal */}
      {showCreateFlagModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateFlagModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Create Feature Flag</h2>
                <button onClick={() => setShowCreateFlagModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleCreateFlag} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key *</label>
                  <select
                    value={createFlagForm.key}
                    onChange={(e) => setCreateFlagForm(prev => ({ ...prev, key: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="new_fee_module">New Fee Module</option>
                    <option value="new_exam_module">New Exam Module</option>
                    <option value="advanced_reports">Advanced Reports</option>
                    <option value="parent_portal">Parent Portal</option>
                    <option value="mobile_app">Mobile App</option>
                    <option value="bulk_operations">Bulk Operations</option>
                    <option value="ai_insights">AI Insights</option>
                    <option value="attendance_biometric">Attendance Biometric</option>
                    <option value="online_exams">Online Exams</option>
                    <option value="fee_online_payment">Fee Online Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={createFlagForm.name}
                    onChange={(e) => setCreateFlagForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={createFlagForm.description}
                    onChange={(e) => setCreateFlagForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope *</label>
                  <select
                    value={createFlagForm.scope}
                    onChange={(e) => setCreateFlagForm(prev => ({ ...prev, scope: e.target.value as "GLOBAL" | "PER_SCHOOL" }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="GLOBAL">Global (All Schools)</option>
                    <option value="PER_SCHOOL">Per School</option>
                  </select>
                </div>
                {createFlagForm.scope === "PER_SCHOOL" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School ID</label>
                    <input
                      type="text"
                      value={createFlagForm.schoolId}
                      onChange={(e) => setCreateFlagForm(prev => ({ ...prev, schoolId: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabledCreate"
                    checked={createFlagForm.enabled}
                    onChange={(e) => setCreateFlagForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="enabledCreate" className="ml-2 text-sm text-gray-700">Enabled</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateFlagModal(false)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingFlag}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creatingFlag ? "Creating..." : "Create Flag"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Feature Flag Modal */}
      {showEditFlagModal && selectedFlag && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setShowEditFlagModal(false); setSelectedFlag(null); }} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Edit Feature Flag</h2>
                <button onClick={() => { setShowEditFlagModal(false); setSelectedFlag(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleUpdateFlag} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={editFlagForm.name}
                    onChange={(e) => setEditFlagForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editFlagForm.description}
                    onChange={(e) => setEditFlagForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                  <select
                    value={editFlagForm.scope}
                    onChange={(e) => setEditFlagForm(prev => ({ ...prev, scope: e.target.value as "GLOBAL" | "PER_SCHOOL" }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="GLOBAL">Global (All Schools)</option>
                    <option value="PER_SCHOOL">Per School</option>
                  </select>
                </div>
                {editFlagForm.scope === "PER_SCHOOL" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School ID</label>
                    <input
                      type="text"
                      value={editFlagForm.schoolId}
                      onChange={(e) => setEditFlagForm(prev => ({ ...prev, schoolId: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabledEdit"
                    checked={editFlagForm.enabled}
                    onChange={(e) => setEditFlagForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="enabledEdit" className="ml-2 text-sm text-gray-700">Enabled</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowEditFlagModal(false); setSelectedFlag(null); }}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingFlag}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatingFlag ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}