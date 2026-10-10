"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface AuditLog {
  id: string;
  schoolId: string | null;
  school?: { id: string; name: string; code: string };
  actorUserId: string | null;
  actor?: { id: string; firstName: string; lastName: string; email: string };
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string;
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

export default function SystemLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    schoolId: "",
    startDate: "",
    endDate: "",
  });

  const isDeveloper = user?.roles.includes("Developer") ?? false;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      const res = await apiFetch<PaginatedResponse<AuditLog>>(`/developer/logs?${params}`);
      setLogs(extractItems(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (!isDeveloper) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to view system logs.</p>
      </div>
    );
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getActionColor = (action: string) => {
    if (action.startsWith("CREATE")) return "bg-green-100 text-green-700";
    if (action.startsWith("UPDATE")) return "bg-blue-100 text-blue-700";
    if (action.startsWith("DELETE")) return "bg-red-100 text-red-700";
    if (action.startsWith("LOGIN")) return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  };

  const getEntityIcon = (entityType: string) => {
    const icons: Record<string, string> = {
      School: "🏫",
      User: "👤",
      Role: "🔐",
      Student: "🎓",
      Parent: "👨‍👩‍👧‍👦",
      AcademicYear: "📅",
      Class: "🏫",
      Section: "📚",
      Subject: "📖",
      Fee: "💰",
      Payment: "💳",
      Receipt: "🧾",
      Exam: "📝",
    };
    return icons[entityType] || "📄";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-500 mt-1">View system-wide audit trail</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => handleFilterChange("entityType", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="School">School</option>
              <option value="User">User</option>
              <option value="Role">Role</option>
              <option value="Student">Student</option>
              <option value="Parent">Parent</option>
              <option value="AcademicYear">Academic Year</option>
              <option value="Class">Class</option>
              <option value="Section">Section</option>
              <option value="Subject">Subject</option>
              <option value="Fee">Fee</option>
              <option value="Payment">Payment</option>
              <option value="Receipt">Receipt</option>
              <option value="Exam">Exam</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
            <select
              value={filters.schoolId}
              onChange={(e) => handleFilterChange("schoolId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Schools</option>
              {logs.map(log => log.school && (
                <option key={log.school!.id} value={log.school!.id}>
                  {log.school!.name} ({log.school!.code})
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
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
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No logs found</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 text-sm font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>{getEntityIcon(log.entityType)}</span>
                        <span className="font-medium text-gray-900">{log.entityType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm font-mono">
                      {log.entityId?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      {log.actor ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {log.actor.firstName} {log.actor.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{log.actor.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900 text-sm">
                      {log.school ? (
                        <div>
                          <div className="font-medium">{log.school.name}</div>
                          <div className="text-xs text-gray-500">{log.school.code}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Global</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm font-mono">
                      {log.ipAddress ?? "—"}
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
    </div>
  );
}