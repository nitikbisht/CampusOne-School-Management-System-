"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface StudentFee {
  id: string;
  studentId: string;
  student: { id: string; firstName: string; lastName: string; admissionNo: string };
  feeId: string;
  fee: {
    id: string;
    name: string;
    amount: number;
    frequency: string;
    feeType?: { id: string; name: string };
  };
  academicYearId: string;
  academicYear: { id: string; name: string };
  discountAmount: number;
  discountReason?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate?: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED" | "CANCELLED";
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
export default function StudentFeesPage() {
  const { user } = useAuth();
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingStudentFee, setEditingStudentFee] = useState<StudentFee | null>(null);

  interface StudentFeeFormData {
    studentId: string;
    feeId: string;
    academicYearId: string;
    discountAmount: number;
    discountReason?: string;
    dueDate?: string;
    status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED" | "CANCELLED";
  }

  const [formData, setFormData] = useState<StudentFeeFormData>({
    studentId: "",
    feeId: "",
    academicYearId: "",
    discountAmount: 0,
    discountReason: "",
    dueDate: "",
    status: "PENDING",
  });
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<{id: string, firstName: string, lastName: string, admissionNo: string}[]>([]);
  const [fees, setFees] = useState<{id: string, name: string, amount: number, frequency: string, feeType?: {name: string}}[]>([]);
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);
  const [filters, setFilters] = useState({
    studentId: "",
    feeId: "",
    academicYearId: "",
    status: "",
    search: "",
  });

  const fetchStudentFees = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });
      const res = await apiFetch<PaginatedResponse<StudentFee>>(`/student-fees?${params}`);
      setStudentFees(extractItems(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch student fees");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await apiFetch<PaginatedResponse<{id: string, firstName: string, lastName: string, admissionNo: string}>>("/students?limit=200");
      setStudents(extractItems(res));
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  }, []);

  const fetchFees = useCallback(async () => {
    try {
      const res = await apiFetch<PaginatedResponse<{id: string, name: string, amount: number, frequency: string, feeType?: {name: string}}>>("/fees?limit=200");
      setFees(extractItems(res));
    } catch (err) {
      console.error("Failed to fetch fees", err);
    }
  }, []);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await apiFetch<PaginatedResponse<{id: string, name: string}>>("/academic-years?limit=100");
      setAcademicYears(extractItems(res));
    } catch (err) {
      console.error("Failed to fetch academic years", err);
    }
  }, []);

  useEffect(() => {
    fetchStudentFees();
    fetchStudents();
    fetchFees();
    fetchAcademicYears();
  }, [fetchStudentFees, fetchStudents, fetchFees, fetchAcademicYears]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = { ...formData };
      if (!payload.discountReason) delete payload.discountReason;
      if (!payload.dueDate) delete payload.dueDate;
      payload.discountAmount = Number(payload.discountAmount) || 0;
      if (editingStudentFee) {
        await apiFetch(`/student-fees/${editingStudentFee.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/student-fees", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchStudentFees();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save student fee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student fee?")) return;
    try {
      await apiFetch(`/student-fees/${id}`, { method: "DELETE" });
      fetchStudentFees();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete student fee");
    }
  };

  const openCreateModal = () => {
    setEditingStudentFee(null);
    setFormData({
      studentId: students[0]?.id || "",
      feeId: fees[0]?.id || "",
      academicYearId: academicYears[0]?.id || "",
      discountAmount: 0,
      discountReason: "",
      dueDate: "",
      status: "PENDING",
    });
    setShowModal(true);
  };

  const openEditModal = (studentFee: StudentFee) => {
    setEditingStudentFee(studentFee);
    setFormData({
      studentId: studentFee.studentId,
      feeId: studentFee.feeId,
      academicYearId: studentFee.academicYearId,
      discountAmount: studentFee.discountAmount,
      discountReason: studentFee.discountReason || "",
      dueDate: studentFee.dueDate ? studentFee.dueDate.split("T")[0] : "",
      status: studentFee.status,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudentFee(null);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const canCreate = user && user.permissions.includes("student_fee:create");
  const canUpdate = user && user.permissions.includes("student_fee:update");
  const canDelete = user && user.permissions.includes("student_fee:delete");
  const canManage = user && user.permissions.includes("student_fee:manage");
  const canBulkAssign = user && user.permissions.includes("student_fee:bulk_assign");
  const canView = user && user.permissions.includes("student_fee:view");

  if (!canView) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to view student fees.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "bg-green-100 text-green-800";
      case "PARTIAL": return "bg-blue-100 text-blue-800";
      case "OVERDUE": return "bg-red-100 text-red-800";
      case "WAIVED": return "bg-purple-100 text-purple-800";
      case "CANCELLED": return "bg-gray-100 text-gray-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Fees</h1>
          <p className="text-gray-500 mt-1">Manage fee assignments for students</p>
        </div>
        <div className="flex items-center gap-2">
          {(canCreate || canManage) && (
            <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + Assign Fee
            </button>
          )}
          {(canBulkAssign || canManage) && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Bulk Assign
            </button>
          )}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={filters.studentId}
              onChange={(e) => handleFilterChange("studentId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fee</label>
            <select
              value={filters.feeId}
              onChange={(e) => handleFilterChange("feeId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Fees</option>
              {fees.map((f) => (
                <option key={f.id} value={f.id}>{f.name} (₹{f.amount.toLocaleString()})</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="WAIVED">Waived</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search by student name, admission no, fee name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {(canUpdate || canManage || canDelete) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : studentFees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">No student fees found</td>
                </tr>
              ) : (
                studentFees.map((sf) => (
                  <tr key={sf.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{sf.student.firstName} {sf.student.lastName}</div>
                      <div className="text-sm text-gray-500">{sf.student.admissionNo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{sf.fee.name}</div>
                      <div className="text-sm text-gray-500">₹{sf.fee.amount.toLocaleString()} / {sf.fee.frequency.replace("_", " ")}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{sf.fee.feeType?.name || "—"}</td>
                    <td className="px-6 py-4 text-gray-900">{sf.academicYear.name}</td>
                    <td className="px-6 py-4 text-gray-900 font-mono">₹{Number(sf.totalAmount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-900 font-mono text-green-600">₹{Number(sf.paidAmount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-900 font-mono text-red-600">₹{Number(sf.balanceAmount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-900">{sf.dueDate ? new Date(sf.dueDate).toLocaleDateString() : "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sf.status)}`}>
                        {sf.status}
                      </span>
                    </td>
                    {(canUpdate || canManage || canDelete) && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {((canUpdate || canManage) && (
                            <button
                              onClick={() => openEditModal(sf)}
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          ))}
                          {((canDelete || canManage) && (
                            <button
                              onClick={() => handleDelete(sf.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
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
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/50" onClick={closeModal} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{editingStudentFee ? "Edit Student Fee" : "Assign Fee to Student"}</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                  <select
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee *</label>
                  <select
                    required
                    value={formData.feeId}
                    onChange={(e) => setFormData({ ...formData, feeId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {fees.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} - ₹{f.amount.toLocaleString()} ({f.frequency.replace("_", " ")})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                  <select
                    required
                    value={formData.academicYearId}
                    onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>{ay.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Reason</label>
                  <input
                    type="text"
                    value={formData.discountReason}
                    onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Sibling discount, Merit scholarship"
                  />
                </div>
                {editingStudentFee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="PAID">Paid</option>
                      <option value="OVERDUE">Overdue</option>
                      <option value="WAIVED">Waived</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? "Saving..." : editingStudentFee ? "Update" : "Assign"}
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