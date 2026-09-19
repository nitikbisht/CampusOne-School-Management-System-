"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
interface Enrollment {
  id: string;
  studentId: string;
  student?: { admissionNumber: string; firstName: string; lastName: string; middleName?: string };
  classId: string;
  class?: { name: string; displayName: string };
  sectionId: string;
  section?: { name: string };
  academicYearId: string;
  academicYear?: { name: string };
  enrollmentDate: string;
  status: "ACTIVE" | "WITHDRAWN" | "COMPLETED" | "TRANSFERRED";
  rollNumber?: string;
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
export default function EnrollmentsPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [formData, setFormData] = useState({
    studentId: "",
    classId: "",
    sectionId: "",
    academicYearId: "",
    enrollmentDate: "",
    status: "ACTIVE" as "ACTIVE" | "WITHDRAWN" | "COMPLETED" | "TRANSFERRED",
    rollNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<{id: string, admissionNumber: string, firstName: string, lastName: string, middleName?: string}[]>([]);
  const [classes, setClasses] = useState<{id: string, name: string, displayName: string}[]>([]);
  const [sections, setSections] = useState<{id: string, name: string}[]>([]);
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);
  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<PaginatedResponse<Enrollment>>(
        `/student-enrollments?page=${pagination.page}&limit=${pagination.limit}`
      );
      setEnrollments(res.data.items);
      setPagination((prev) => ({ ...prev, total: res.data.total, totalPages: res.data.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch enrollments");
    } finally {
      setLoading(false);
    }
  };
  const fetchStudents = async () => {
    try {
      const res = await apiFetch<PaginatedResponse<{id: string, admissionNumber: string, firstName: string, lastName: string, middleName?: string}>>("/students?limit=200");
      setStudents(res.data.items);
    } catch (err) {
      console.error("Failed to fetch students", err);
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
    fetchEnrollments();
    fetchStudents();
    fetchClasses();
    fetchSections();
    fetchAcademicYears();
  }, [pagination.page]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = { ...formData };
      if (!payload.rollNumber) delete payload.rollNumber;
      if (editingEnrollment) {
        await apiFetch(`/student-enrollments/${editingEnrollment.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/student-enrollments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchEnrollments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save enrollment");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this enrollment?")) return;
    try {
      await apiFetch(`/student-enrollments/${id}`, { method: "DELETE" });
      fetchEnrollments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete enrollment");
    }
  };
  const openCreateModal = () => {
    setEditingEnrollment(null);
    const today = new Date().toISOString().split("T")[0];
    setFormData({
      studentId: students[0]?.id || "",
      classId: classes[0]?.id || "",
      sectionId: sections[0]?.id || "",
      academicYearId: academicYears[0]?.id || "",
      enrollmentDate: today,
      status: "ACTIVE",
      rollNumber: "",
    });
    setShowModal(true);
  };
  const openEditModal = (enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
    setFormData({
      studentId: enrollment.studentId,
      classId: enrollment.classId,
      sectionId: enrollment.sectionId,
      academicYearId: enrollment.academicYearId,
      enrollmentDate: enrollment.enrollmentDate.split("T")[0],
      status: enrollment.status,
      rollNumber: enrollment.rollNumber || "",
    });
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingEnrollment(null);
  };
  const canCreate = user && user.permissions.includes("student_enrollment:create");
  const canUpdate = user && user.permissions.includes("student_enrollment:update");
  const canDelete = user && user.permissions.includes("student_enrollment:delete");
  const canManage = user && user.permissions.includes("student_enrollment:manage");
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
          <p className="text-gray-500 mt-1">Manage student enrollments in classes and sections</p>
        </div>
        {(canCreate || canManage) && (
          <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Add Enrollment
          </button>
        )}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {(canUpdate || canManage || canDelete) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No enrollments found</td>
                </tr>
              ) : (
                enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {enrollment.student?.firstName} {enrollment.student?.middleName ? enrollment.student.middleName + " " : ""}{enrollment.student?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{enrollment.student?.admissionNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{enrollment.class?.displayName || enrollment.class?.name || enrollment.classId}</td>
                    <td className="px-6 py-4 text-gray-900">{enrollment.section?.name || enrollment.sectionId}</td>
                    <td className="px-6 py-4 text-gray-900">{enrollment.academicYear?.name || enrollment.academicYearId}</td>
                    <td className="px-6 py-4 text-gray-900">{new Date(enrollment.enrollmentDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-900 font-mono text-sm">{enrollment.rollNumber || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        enrollment.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                        enrollment.status === "WITHDRAWN" ? "bg-red-100 text-red-800" :
                        enrollment.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {enrollment.status}
                      </span>
                    </td>
                    {(canUpdate || canManage || canDelete) && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {((canUpdate || canManage) && (
                            <button
                              onClick={() => openEditModal(enrollment)}
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
                              onClick={() => handleDelete(enrollment.id)}
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
                <h2 className="text-xl font-semibold text-gray-900">{editingEnrollment ? "Edit Enrollment" : "Create Enrollment"}</h2>
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
                      <option key={s.id} value={s.id}>{s.admissionNumber} - {s.firstName} {s.middleName ? s.middleName + " " : ""}{s.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                    <select
                      required
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.displayName || c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                    <select
                      required
                      value={formData.sectionId}
                      onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.enrollmentDate}
                      onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as "ACTIVE" | "WITHDRAWN" | "COMPLETED" | "TRANSFERRED" })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="WITHDRAWN">Withdrawn</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="TRANSFERRED">Transferred</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? "Saving..." : editingEnrollment ? "Update" : "Create"}
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