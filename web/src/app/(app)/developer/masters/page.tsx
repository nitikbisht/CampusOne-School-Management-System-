"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface ConfigTemplate {
  id: string;
  name: string;
  description: string | null;
  template: Record<string, unknown>;
  isActive: boolean;
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

export default function DeveloperMastersPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ConfigTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: "",
    isActive: "",
  });
  const [activeTab, setActiveTab] = useState<"templates" | "leave-types" | "certificate-types" | "grade-scales">("templates");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ConfigTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    template: {} as Record<string, unknown>,
    isActive: true,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    template: {} as Record<string, unknown>,
    isActive: true,
  });

  const isDeveloper = user?.roles.includes("Developer") ?? false;

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      const res = await apiFetch<PaginatedResponse<ConfigTemplate>>(`/developer/masters?${params}`);
      setTemplates(extractItems(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch config templates");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  if (!isDeveloper) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to manage master configurations.</p>
      </div>
    );
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openCreateModal = () => {
    setCreateForm({ name: "", description: "", template: {}, isActive: true });
    setShowCreateModal(true);
  };

  const openEditModal = (template: ConfigTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || "",
      template: template.template,
      isActive: template.isActive,
    });
    setShowEditModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError("");
      await apiFetch("/developer/masters", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      setShowCreateModal(false);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create config template");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    if (!selectedTemplate) return;
    e.preventDefault();
    try {
      setUpdating(true);
      setError("");
      await apiFetch(`/developer/masters/${selectedTemplate.id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setShowEditModal(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update config template");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this config template?")) return;
    try {
      await apiFetch(`/developer/masters/${id}/deactivate`, { method: "POST" });
      fetchTemplates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate config template");
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm("PERMANENTLY delete this config template? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? Type 'DELETE' to confirm.")) return;
    try {
      await apiFetch(`/developer/masters/${id}?hard=true`, { method: "DELETE" });
      fetchTemplates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete config template");
    }
  };

  const handleClone = async (template: ConfigTemplate) => {
    const newName = prompt(`Enter name for cloned template:`, `${template.name} (Copy)`);
    if (!newName) return;
    try {
      await apiFetch(`/developer/masters/${template.id}/clone`, {
        method: "POST",
        body: JSON.stringify({ name: newName }),
      });
      fetchTemplates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to clone config template");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Configuration</h1>
          <p className="text-gray-500 mt-1">Manage global configuration templates</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Create Template
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <nav className="border-b border-gray-200" aria-label="Master config tabs">
          <ul className="flex -mb-px overflow-x-auto" role="tablist">
            {[
              { id: "templates", label: "Config Templates", icon: "📋" },
              { id: "leave-types", label: "Leave Types", icon: "🏖️" },
              { id: "certificate-types", label: "Certificate Types", icon: "📜" },
              { id: "grade-scales", label: "Grade Scales", icon: "📊" },
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

        {/* Config Templates Tab */}
        {activeTab === "templates" && (
          <div className="p-6">
            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search by name..."
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

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          Loading...
                        </div>
                      </td>
                    </tr>
                  ) : templates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No config templates found</td>
                    </tr>
                  ) : (
                    templates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{template.name}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">
                          {template.description || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${template.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                            {template.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {new Date(template.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(template)}
                              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleClone(template)}
                              className="px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                              Clone
                            </button>
                            {template.isActive ? (
                              <button
                                onClick={() => handleDeactivate(template.id)}
                                className="px-3 py-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleHardDelete(template.id)}
                                className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex items-center gap-2">
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
              </div>
            )}
          </div>
        )}

        {/* Placeholder tabs for Leave Types, Certificate Types, Grade Scales */}
        {activeTab === "leave-types" && (
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">🏖️</div>
            <h2 className="text-xl font-semibold text-gray-900">Leave Types</h2>
            <p className="text-gray-500 mt-2">Leave types are managed per-school in the school's administration area.</p>
            <p className="text-gray-400 mt-4 text-sm">This section will show global leave type templates once implemented.</p>
          </div>
        )}

        {activeTab === "certificate-types" && (
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">📜</div>
            <h2 className="text-xl font-semibold text-gray-900">Certificate Types</h2>
            <p className="text-gray-500 mt-2">Certificate types are managed per-school in the school's administration area.</p>
            <p className="text-gray-400 mt-4 text-sm">This section will show global certificate type templates once implemented.</p>
          </div>
        )}

        {activeTab === "grade-scales" && (
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-900">Grade Scales</h2>
            <p className="text-gray-500 mt-2">Grade scales are managed per-school in the school's administration area.</p>
            <p className="text-gray-400 mt-4 text-sm">This section will show global grade scale templates once implemented.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Create Config Template</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
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
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template (JSON)</label>
                  <textarea
                    value={JSON.stringify(createForm.template, null, 2)}
                    onChange={(e) => {
                      try {
                        setCreateForm(prev => ({ ...prev, template: JSON.parse(e.target.value) }));
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={10}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder='{"key": "value"}'
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter a valid JSON object for the template configuration</p>
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
                    {creating ? "Creating..." : "Create Template"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setShowEditModal(false); setSelectedTemplate(null); }} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Edit Config Template</h2>
                <button onClick={() => { setShowEditModal(false); setSelectedTemplate(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
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
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template (JSON)</label>
                  <textarea
                    value={JSON.stringify(editForm.template, null, 2)}
                    onChange={(e) => {
                      try {
                        setEditForm(prev => ({ ...prev, template: JSON.parse(e.target.value) }));
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={10}
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
                    onClick={() => { setShowEditModal(false); setSelectedTemplate(null); }}
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