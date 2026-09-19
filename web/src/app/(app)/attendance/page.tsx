"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
interface AttendanceRecord {
  id: string;
  studentId: string;
  student?: { admissionNumber: string; firstName: string; lastName: string; middleName?: string };
  classId: string;
  class?: { name: string; displayName: string };
  sectionId: string;
  section?: { name: string };
  academicYearId: string;
  academicYear?: { name: string };
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks?: string;
  recordedBy?: string;
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
export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    classId: "",
    sectionId: "",
    academicYearId: "",
    date: new Date().toISOString().split("T")[0],
    status: "",
  });
  const [classes, setClasses] = useState<{id: string, name: string, displayName: string}[]>([]);
  const [sections, setSections] = useState<{id: string, name: string}[]>([]);
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filters.classId) params.append("classId", filters.classId);
      if (filters.sectionId) params.append("sectionId", filters.sectionId);
      if (filters.academicYearId) params.append("academicYearId", filters.academicYearId);
      if (filters.date) params.append("date", filters.date);
      if (filters.status) params.append("status", filters.status);
      const res = await apiFetch<PaginatedResponse<AttendanceRecord>>(`/attendance?${params.toString()}`);
      setRecords(res.data.items);
      setPagination((prev) => ({ ...prev, total: res.data.total, totalPages: res.data.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch attendance records");
    } finally {
      setLoading(false);
    }
  };
  const fetchClasses = async () => {
    try {
      const res = await apiFetch<PaginatedResponse<{id: string, name: string, displayName: string}>>("/classes?limit=100");
      setClasses(res.data.items);
    } catch (err) {
      console.error("Failed to fetch classes", err);
    }
  };
  const fetchSections = async () => {
    try {
      const res = await apiFetch<PaginatedResponse<{id: string, name: string}>>("/sections?limit=100");
      setSections(res.data.items);
    } catch (err) {
      console.error("Failed to fetch sections", err);
    }
  };
  const fetchAcademicYears = async () => {
    try {
      const res = await apiFetch<PaginatedResponse<{id: string, name: string}>>("/academic-years?limit=100");
      setAcademicYears(res.data.items);
    } catch (err) {
      console.error("Failed to fetch academic years", err);
    }
  };
  useEffect(() => {
    fetchClasses();
    fetchSections();
    fetchAcademicYears();
  }, []);
  useEffect(() => {
    fetchRecords();
  }, [pagination.page, filters.classId, filters.sectionId, filters.academicYearId, filters.date, filters.status]);
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };
  const canView = user && user.permissions.includes("attendance:view");
  const canCreate = user && user.permissions.includes("attendance:create");
  const canUpdate = user && user.permissions.includes("attendance:update");
  const canManage = user && user.permissions.includes("attendance:manage");
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "bg-green-100 text-green-800";
      case "ABSENT": return "bg-red-100 text-red-800";
      case "LATE": return "bg-yellow-100 text-yellow-800";
      case "EXCUSED": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  if (!canView) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to view attendance records.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 mt-1">View and manage student attendance records</p>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={filters.classId}
              onChange={(e) => handleFilterChange("classId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.displayName || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={filters.sectionId}
              onChange={(e) => handleFilterChange("sectionId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={filters.academicYearId}
              onChange={(e) => handleFilterChange("academicYearId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Years</option>
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>{ay.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
              <option value="EXCUSED">Excused</option>
            </select>
          </div>
        </div>
      </div>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">
          {error}
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No attendance records found</td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {record.student?.firstName} {record.student?.middleName ? record.student.middleName + " " : ""}{record.student?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{record.student?.admissionNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{record.class?.displayName || record.class?.name || record.classId}</td>
                    <td className="px-6 py-4 text-gray-900">{record.section?.name || record.sectionId}</td>
                    <td className="px-6 py-4 text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{record.remarks || "—"}</td>
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
      {(!canCreate && !canManage && !canUpdate) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg" role="alert">
          <p className="font-medium">Note:</p>
          <p className="text-sm mt-1">You have view-only access to attendance. Contact an administrator for create/edit permissions.</p>
        </div>
      )}
    </div>
  );
}