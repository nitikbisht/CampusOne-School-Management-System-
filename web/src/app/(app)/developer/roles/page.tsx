"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  schoolId: string | null;
  school?: { id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  key: string;
  module: string;
  action: string;
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

interface SchoolOption {
  id: string;
  name: string;
  code: string;
}

const MODULES = [
  "auth",
  "academic_year",
  "class",
  "section",
  "subject",
  "subject_type",
  "class_subject",
  "student",
  "parent",
  "student_enrollment",
  "fee",
  "fee_type",
  "student_fee",
  "payment",
  "receipt",
  "user",
  "role",
  "permission",
  "teacher_eligibility",
  "teacher_assignment",
  "attendance",
  "exam",
  "student_mark",
  "audit",
  "school",
  "developer_user",
  "master",
  "integration",
  "feature_flag",
  "system",
];

const ACTIONS = ["view", "create", "update", "delete", "manage", "test"];

export default function DeveloperRolesPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: "",
    isSystem: "",
    schoolId: "",
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, string[]>>({});

  const isDeveloper = user?.roles.includes("Developer") ?? false;

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      const res = await apiFetch<PaginatedResponse<Role>>(`/developer/roles?${params}`);
      setRoles(extractItems(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Permission[] }>("/auth/permissions?limit=500");
      setPermissions(res.data);
    } catch {
      // ignore
    }
  }, []);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: { items: SchoolOption[] } }>("/developer/schools");
      setSchools(res.data.items);
    } catch {
      // ignore
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchSchools();
  }, [fetchRoles, fetchPermissions, fetchSchools]);

  if (!isDeveloper) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to manage roles.</p>
      </div>
    );
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openCreateModal = () => {
    setCreateForm({ name: "", description: "", permissions: [] });
    setShowCreateModal(true);
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setEditForm({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions,
    });
    setShowEditModal(true);
  };

  const openPermissionModal = (role: Role) => {
    setSelectedRole(role);
    // Initialize permission matrix
    const matrix: Record<string, string[]> = {};
    MODULES.forEach(module => {
      matrix[module] = role.permissions
        .filter(p => p.startsWith(`${module}:`))
        .map(p => p.split(":")[1]);
    });
    setPermissionMatrix(matrix);
    setShowPermissionModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError("");
      await apiFetch("/developer/roles", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      setShowCreateModal(false);
      fetchRoles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create role");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    if (!selectedRole) return;
    e.preventDefault();
    try {
      setUpdating(true);
      setError("");
      await apiFetch(`/developer/roles/${selectedRole.id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setShowEditModal(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update role");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm("Delete this role? This cannot be undone.")) return;
    try {
      await apiFetch(`/developer/roles/${roleId}`, { method: "DELETE" });
      fetchRoles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete role");
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      setSavingPermissions(true);
      setError("");
      // Flatten permission matrix
      const flatPermissions: string[] = [];
      Object.entries(permissionMatrix).forEach(([module, actions]) => {
        actions.forEach(action => flatPermissions.push(`${module}:${action}`));
      });
      await apiFetch(`/developer/roles/${selectedRole.id}`, {
        method: "PATCH",
        body: JSON.stringify({ permissions: flatPermissions }),
      });
      setShowPermissionModal(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  const togglePermission = (module: string, action: string) => {
    setPermissionMatrix(prev => {
      const current = prev[module] || [];
      const hasPermission = current.includes(action);
      return {
        ...prev,
        [module]: hasPermission
          ? current.filter(a => a !== action)
          : [...current, action],
      };
    });
  };

  const hasPermission = (module: string, action: string) => {
    return permissionMatrix[module]?.includes(action) ?? false;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      view: "bg-blue-100 text-blue-700",
      create: "bg-green-100 text-green-700",
      update: "bg-yellow-100 text-yellow-700",
      delete: "bg-red-100 text-red-700",
      manage: "bg-purple-100 text-purple-700",
      test: "bg-indigo-100 text-indigo-700",
    };
    return colors[action] || "bg-gray-100 text-gray-700";
  };

  const getRoleNames = (role: Role) => {
    if (role.permissions.length === 0) return "No permissions";
    return role.permissions.slice(0, 3).map(p => {
      const [, action] = p.split(":");
      return <span key={p} className={`px-2 py-0.5 text-xs rounded ${getActionColor(action)}`}>{action}</span>;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-500 mt-1">Manage roles and permissions across the system</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Create Role
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.isSystem}
              onChange={(e) => handleFilterChange("isSystem", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">System Roles</option>
              <option value="false">Custom Roles</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
            <select
              value={filters.schoolId}
              onChange={(e) => handleFilterChange("schoolId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Schools</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No roles found</td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{role.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">
                      {role.description || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${role.isSystem ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                        {role.isSystem ? "System" : "Custom"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 text-sm">
                      {role.school ? (
                        <div>
                          <div className="font-medium">{role.school.name}</div>
                          <div className="text-xs text-gray-500">{role.school.code}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Global</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 4).map(p => {
                          const [, action] = p.split(":");
                          return <span key={p} className={`px-2 py-0.5 text-xs rounded ${getActionColor(action)}`}>{action}</span>;
                        })}
                        {role.permissions.length > 4 && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                            +{role.permissions.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(role.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(role)}
                          className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openPermissionModal(role)}
                          className="px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Permissions
                        </button>
                        {!role.isSystem && (
                          <button
                            onClick={() => handleDelete(role.id)}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Create Role</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-2">
                    {MODULES.map(module => (
                      <div key={module} className="border-b border-gray-100 pb-2 last:border-0">
                        <div className="font-medium text-gray-700 capitalize mb-2">{module.replace("_", " ")}</div>
                        <div className="flex flex-wrap gap-2">
                          {ACTIONS.map(action => (
                            <label key={action} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={createForm.permissions.includes(`${module}:${action}`)}
                                onChange={(e) => setCreateForm(prev => ({
                                  ...prev,
                                  permissions: e.target.checked
                                    ? [...prev.permissions, `${module}:${action}`]
                                    : prev.permissions.filter(p => p !== `${module}:${action}`),
                                }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm capitalize">{action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
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
                    {creating ? "Creating..." : "Create Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setShowEditModal(false); setSelectedRole(null); }} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Edit Role</h2>
                <button onClick={() => { setShowEditModal(false); setSelectedRole(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-2">
                    {MODULES.map(module => (
                      <div key={module} className="border-b border-gray-100 pb-2 last:border-0">
                        <div className="font-medium text-gray-700 capitalize mb-2">{module.replace("_", " ")}</div>
                        <div className="flex flex-wrap gap-2">
                          {ACTIONS.map(action => (
                            <label key={action} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={editForm.permissions.includes(`${module}:${action}`)}
                                onChange={(e) => setEditForm(prev => ({
                                  ...prev,
                                  permissions: e.target.checked
                                    ? [...prev.permissions, `${module}:${action}`]
                                    : prev.permissions.filter(p => p !== `${module}:${action}`),
                                }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm capitalize">{action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setSelectedRole(null); }}
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

      {/* Permission Matrix Modal */}
      {showPermissionModal && selectedRole && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setShowPermissionModal(false); setSelectedRole(null); }} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Permission Matrix: {selectedRole.name}</h2>
                <button onClick={() => { setShowPermissionModal(false); setSelectedRole(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleSavePermissions} className="p-6 space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 w-48">Module</th>
                        {ACTIONS.map(action => (
                          <th key={action} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {action.charAt(0).toUpperCase() + action.slice(1)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {MODULES.map(module => (
                        <tr key={module} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900 capitalize sticky left-0 bg-white z-10 w-48 border-r border-gray-200">
                            {module.replace("_", " ")}
                          </td>
                          {ACTIONS.map(action => (
                            <td key={action} className="px-4 py-3 text-center">
                              <label className="inline-flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={hasPermission(module, action)}
                                  onChange={() => togglePermission(module, action)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                />
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowPermissionModal(false); setSelectedRole(null); }}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPermissions}
                    className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {savingPermissions ? "Saving..." : "Save Permissions"}
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