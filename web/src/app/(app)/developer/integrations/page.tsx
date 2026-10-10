"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface IntegrationConfig {
  id: string;
  key: string;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
  isActive: boolean;
  lastTestedAt: string | null;
  lastTestResult: string | null;
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

const INTEGRATION_TYPES = [
  { key: "smtp", label: "Email (SMTP)", icon: "📧", color: "bg-blue-100 text-blue-700" },
  { key: "sms_twilio", label: "SMS (Twilio)", icon: "📱", color: "bg-green-100 text-green-700" },
  { key: "sms_msg91", label: "SMS (MSG91)", icon: "📱", color: "bg-green-100 text-green-700" },
  { key: "payment_razorpay", label: "Payment (Razorpay)", icon: "💳", color: "bg-purple-100 text-purple-700" },
  { key: "payment_stripe", label: "Payment (Stripe)", icon: "💳", color: "bg-purple-100 text-purple-700" },
  { key: "storage_s3", label: "Storage (AWS S3)", icon: "☁️", color: "bg-orange-100 text-orange-700" },
  { key: "storage_gcs", label: "Storage (Google Cloud)", icon: "☁️", color: "bg-orange-100 text-orange-700" },
  { key: "oauth_google", label: "OAuth (Google)", icon: "🔐", color: "bg-red-100 text-red-700" },
  { key: "oauth_microsoft", label: "OAuth (Microsoft)", icon: "🔐", color: "bg-red-100 text-red-700" },
];

export default function DeveloperIntegrationsPage() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: "",
    isActive: "",
  });
  const [testingId, setTestingId] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    key: "smtp",
    name: "",
    description: "",
    config: {} as Record<string, unknown>,
    isActive: false,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    config: {} as Record<string, unknown>,
    isActive: false,
  });
  // testConfig state removed - was unused

  const isDeveloper = user?.roles.includes("Developer") ?? false;

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      const res = await apiFetch<PaginatedResponse<IntegrationConfig>>(`/developer/integrations?${params}`);
      setIntegrations(extractItems(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch integrations");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  if (!isDeveloper) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to manage integrations.</p>
      </div>
    );
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openCreateModal = () => {
    setCreateForm({ key: "smtp", name: "", description: "", config: {}, isActive: false });
    setShowCreateModal(true);
  };

  const openEditModal = (integration: IntegrationConfig) => {
    setSelectedIntegration(integration);
    setEditForm({
      name: integration.name,
      description: integration.description || "",
      config: integration.config,
      isActive: integration.isActive,
    });
    setShowEditModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError("");
      await apiFetch("/developer/integrations", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      setShowCreateModal(false);
      fetchIntegrations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create integration");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    if (!selectedIntegration) return;
    e.preventDefault();
    try {
      setUpdating(true);
      setError("");
      await apiFetch(`/developer/integrations/${selectedIntegration.id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setShowEditModal(false);
      setSelectedIntegration(null);
      fetchIntegrations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update integration");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this integration configuration?")) return;
    try {
      await apiFetch(`/developer/integrations/${id}`, { method: "DELETE" });
      fetchIntegrations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete integration");
    }
  };

  const handleTest = async (integration: IntegrationConfig) => {
    setTestingId(integration.id);
    try {
      setError("");
      const res = await apiFetch<{ data: { success: boolean; result: string } }>(`/developer/integrations/${integration.id}/test`, {
        method: "POST",
        body: JSON.stringify({ config: integration.config }),
      });
      if (res.data.success) {
        setError(`Test successful: ${res.data.result}`);
      } else {
        setError(`Test failed: ${res.data.result}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Test failed");
    } finally {
      setTestingId(null);
      fetchIntegrations();
    }
  };

  const getTypeInfo = (key: string) => {
    return INTEGRATION_TYPES.find(t => t.key === key) || { label: key, icon: "🔌", color: "bg-gray-100 text-gray-700" };
  };

  const getStatusBadge = (integration: IntegrationConfig) => {
    if (!integration.isActive) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">Inactive</span>;
    }
    if (integration.lastTestResult === "success") {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Connected</span>;
    }
    if (integration.lastTestResult === "failed") {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Error</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Not Tested</span>;
  };

  const maskConfig = (config: Record<string, unknown>): Record<string, unknown> => {
    const sensitiveKeys = [
      "password", "secret", "key", "token", "api_key", "apiKey", "access_token",
      "accessToken", "private_key", "privateKey", "client_secret", "clientSecret",
      "auth_token", "authToken", "pass", "secret_key", "secretKey"
    ];
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(s => lowerKey.includes(s));
      if (isSensitive && typeof value === "string" && value.length > 0) {
        masked[key] = value.length > 8
          ? `${value.substring(0, 4)}***${value.substring(value.length - 4)}`
          : "****";
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        masked[key] = maskConfig(value as Record<string, unknown>);
      } else {
        masked[key] = value;
      }
    }
    return masked;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integration Management</h1>
          <p className="text-gray-500 mt-1">Configure third-party service credentials</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Add Integration
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name, key..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange("isActive", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading && (
          <>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
                <div className="h-10 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </>
        )}

        {!loading && integrations.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🔌</div>
            <h2 className="text-xl font-semibold text-gray-900">No Integrations Configured</h2>
            <p className="text-gray-500 mt-2">Add your first integration to connect external services.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Integration
            </button>
          </div>
        )}

        {!loading && integrations.map(integration => {
          const typeInfo = getTypeInfo(integration.key);
          const maskedConfig = maskConfig(integration.config as Record<string, unknown>);

          return (
            <div key={integration.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${typeInfo.color}`}>
                    <span className="text-2xl">{typeInfo.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                    <p className="text-sm text-gray-500 font-mono">{integration.key}</p>
                  </div>
                </div>
                {testingId === integration.id && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Testing...
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-4">
                {integration.description && (
                  <p className="text-sm text-gray-600">{integration.description}</p>
                )}
                <div className="flex items-center gap-3">
                  {getStatusBadge(integration)}
                  {integration.lastTestedAt && (
                    <span className="text-xs text-gray-500">
                      Last tested: {new Date(integration.lastTestedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
                <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                  {JSON.stringify(maskedConfig, null, 2)}
                </pre>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTest(integration)}
                  disabled={testingId !== null}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Test Connection
                </button>
                <button
                  onClick={() => openEditModal(integration)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(integration.id)}
                  className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-700">Page {pagination.page} of {pagination.totalPages}</span>
          <button
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Add Integration</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Integration Type *</label>
                  <select
                    value={createForm.key}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, key: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {INTEGRATION_TYPES.map(type => (
                      <option key={type.key} value={type.key}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Configuration (JSON)</label>
                  <textarea
                    value={JSON.stringify(createForm.config, null, 2)}
                    onChange={(e) => {
                      try {
                        setCreateForm(prev => ({ ...prev, config: JSON.parse(e.target.value) }));
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={8}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder='{"host": "smtp.example.com", "port": 587, "user": "...", "pass": "..."}'
                  />
                  <p className="text-xs text-gray-500 mt-1">Secrets will be encrypted at rest. Use masked values for reference.</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActiveCreate"
                    checked={createForm.isActive}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActiveCreate" className="ml-2 text-sm text-gray-700">Active</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Integration"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedIntegration && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setShowEditModal(false); setSelectedIntegration(null); }} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Edit Integration</h2>
                <button onClick={() => { setShowEditModal(false); setSelectedIntegration(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Configuration (JSON)</label>
                  <textarea
                    value={JSON.stringify(editForm.config, null, 2)}
                    onChange={(e) => {
                      try {
                        setEditForm(prev => ({ ...prev, config: JSON.parse(e.target.value) }));
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={8}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActiveEdit" className="ml-2 text-sm text-gray-700">Active</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setSelectedIntegration(null); }}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updating ? "Saving..." : "Save Changes"}
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