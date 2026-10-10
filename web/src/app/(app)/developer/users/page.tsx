"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface School {
  id: string;
  name: string;
  code: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

interface User {
  id: string;
  schoolId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  school: School;
  roles: Array<{
    userId: string;
    roleId: string;
    role: Role;
  }>;
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

export default function DeveloperUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: "",
    schoolId: "",
    roleId: "",
    isActive: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    schoolId: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    roleIds: [] as string[],
    sendInvite: true,
  });
  const [editForm, setEditForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    isActive: true,
    roleIds: [] as string[],
    schoolId: "",
  });
  const [resetForm, setResetForm] = useState({
    newPassword: "",
    sendEmail: true,
  });

  const isDeveloper = user?.roles.includes("Developer") ?? false;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      const res = await apiFetch<PaginatedResponse<User>>(`/developer/users?${params}`);
      setUsers(extractItems(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: School[] }>("/developer/users/schools");
      setSchools(res.data);
    } catch {
      // ignore
    }
  }, []);

  const fetchRoles = useCallback(async (schoolId: string) => {
    try {
      const res = await apiFetch<{ data: Role[] }>(`/developer/users/roles?schoolId=${schoolId}`);
      setRoles(res.data);
    } catch {
      setRoles([]);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchUsers();
    fetchSchools();
  }, [fetchUsers, fetchSchools]);

  if (!isDeveloper) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to manage users.</p>
      </div>
    );
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSchoolChange = (schoolId: string) => {
    setFilters((prev) => ({ ...prev, schoolId }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    if (schoolId) fetchRoles(schoolId);
    else setRoles([]);
  };

  const openCreateModal = () => {
    setCreateForm({
      schoolId: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      roleIds: [],
      sendInvite: true,
    });
    setShowCreateModal(true);
    if (createForm.schoolId) fetchRoles(createForm.schoolId);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || "",
      isActive: user.isActive,
      roleIds: user.roles.map(r => r.roleId),
      schoolId: user.schoolId,
    });
    setShowEditModal(true);
    fetchRoles(user.schoolId);
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setResetForm({ newPassword: "", sendEmail: true });
    setShowResetPasswordModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError("");
      const { sendInvite, ...payload } = createForm;
      await apiFetch("/developer/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setShowCreateModal(false);
      fetchUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    if (!selectedUser) return;
    e.preventDefault();
    try {
      setUpdating(true);
      setError("");
      const { roleIds, schoolId, ...payload } = editForm;
      const body = { ...payload, ...(roleIds.length > 0 && { roleIds }), ...(schoolId && { schoolId }) };
      await apiFetch(`/developer/users/${selectedUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update user");
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    if (!selectedUser) return;
    e.preventDefault();
    try {
      setResetting(true);
      setError("");
      const payload = resetForm.newPassword ? { newPassword: resetForm.newPassword, sendEmail: resetForm.sendEmail } : { sendEmail: resetForm.sendEmail };
      const res = await apiFetch<{ data: { tempPassword: string; mustChange: boolean } }>(`/developer/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.data.tempPassword) {
        alert(`Temporary password: ${res.data.tempPassword}\n\nShare this securely with the user.`);
      }
      setShowResetPasswordModal(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm("Deactivate this user? They won't be able to log in.")) return;
    try {
      await apiFetch(`/developer/users/${userId}`, { method: "DELETE" });
      fetchUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate user");
    }
  };

  const handleHardDelete = async (userId: string) => {
    if (!confirm("PERMANENTLY delete this user? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? Type 'DELETE' to confirm.")) return;
    try {
      await apiFetch(`/developer/users/${userId}?hard=true`, { method: "DELETE" });
      fetchUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete user");
    }
  };

  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    const selectedIds = users.filter(u => u.isActive !== (action === "activate")).map(u => u.id);
    if (selectedIds.length === 0) return;
    if (action === "delete" && !confirm("PERMANENTLY delete selected users? This cannot be undone.")) return;
    try {
      await apiFetch("/developer/users/bulk", {
        method: "POST",
        body: JSON.stringify({ userIds: selectedIds, action }),
      });
      fetchUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to ${action} users`);
    }
  };

  const getStatusBadge = (isActive: boolean) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );

  const getRoleNames = (user: User) => user.roles.map(r => r.role.name).join(", ") || "No roles";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage users across all schools</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Add User
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name, email..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
            <select
              value={filters.schoolId}
              onChange={(e) => handleSchoolChange(e.target.value)}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.roleId}
              onChange={(e) => handleFilterChange("roleId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={roles.length === 0}
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
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
          <div className="flex items-end">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt">Created Date</option>
              <option value="email">Email</option>
              <option value="firstName">First Name</option>
              <option value="lastName">Last Name</option>
              <option value="lastLoginAt">Last Login</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{user.school.name}</div>
                      <div className="text-xs text-gray-500">{user.school.code}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 text-sm">{getRoleNames(user)}</td>
                    <td className="px-6 py-4">{getStatusBadge(user.isActive)}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(user)}
                          className="px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Reset Pwd
                        </button>
                        {user.isActive ? (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            className="px-3 py-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleHardDelete(user.id)}
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

        {/* Bulk actions */}
        {users.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Bulk actions:</span>
              <button
                onClick={() => handleBulkAction("activate")}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction("deactivate")}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Delete
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
                <h2 className="text-lg font-semibold text-gray-900">Create User</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
                    <select
                      value={createForm.schoolId}
                      onChange={(e) => {
                        const schoolId = e.target.value;
                        setCreateForm(prev => ({ ...prev, schoolId, roleIds: [] }));
                        if (schoolId) fetchRoles(schoolId);
                        else setRoles([]);
                      }}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select School</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id}>
                          {school.name} ({school.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={8}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                    <div className="flex flex-wrap gap-2">
                      {roles.map(role => (
                        <label key={role.id} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={createForm.roleIds.includes(role.id)}
                            onChange={(e) => setCreateForm(prev => ({
                              ...prev,
                              roleIds: e.target.checked
                                ? [...prev.roleIds, role.id]
                                : prev.roleIds.filter(id => id !== role.id),
                            }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{role.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      id="sendInvite"
                      checked={createForm.sendInvite}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, sendInvite: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="sendInvite" className="ml-2 text-sm text-gray-700">Send invitation email</label>
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
                    {creating ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setShowEditModal(false); setSelectedUser(null); }} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
                <button onClick={() => { setShowEditModal(false); setSelectedUser(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editForm.isActive.toString()}
                      onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.value === "true" }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                    <select
                      value={editForm.schoolId}
                      onChange={(e) => {
                        const schoolId = e.target.value;
                        setEditForm(prev => ({ ...prev, schoolId, roleIds: [] }));
                        if (schoolId) fetchRoles(schoolId);
                        else setRoles([]);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select School</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id}>
                          {school.name} ({school.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                    <div className="flex flex-wrap gap-2">
                      {roles.map(role => (
                        <label key={role.id} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={editForm.roleIds.includes(role.id)}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              roleIds: e.target.checked
                                ? [...prev.roleIds, role.id]
                                : prev.roleIds.filter(id => id !== role.id),
                            }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{role.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
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

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); }} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Reset Password</h2>
                <button onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                <p className="text-gray-600">
                  Reset password for <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password (optional)</label>
                  <input
                    type="password"
                    value={resetForm.newPassword}
                    onChange={(e) => setResetForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave blank to auto-generate"
                  />
                  <p className="text-xs text-gray-500 mt-1">If left blank, a secure temporary password will be generated.</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={resetForm.sendEmail}
                    onChange={(e) => setResetForm(prev => ({ ...prev, sendEmail: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="sendEmail" className="ml-2 text-sm text-gray-700">Send password via email</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); }}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetting}
                    className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {resetting ? "Resetting..." : "Reset Password"}
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