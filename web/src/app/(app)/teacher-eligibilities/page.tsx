"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface TeacherEligibility {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  maxClassId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teacher: { id: string; firstName: string; lastName: string; email: string };
  subject: { id: string; name: string; code: string };
  class: { id: string; name: string };
  maxClass?: { id: string; name: string } | null;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface SchoolClass {
  id: string;
  name: string;
}

interface EligibilityFormData {
  teacherId: string;
  subjectId: string;
  classId: string;
  maxClassId?: string;
}

export default function TeacherEligibilitiesPage() {
  const { user } = useAuth();
  const [eligibilities, setEligibilities] = useState<TeacherEligibility[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingEligibility, setEditingEligibility] = useState<TeacherEligibility | null>(null);
  const [formData, setFormData] = useState<EligibilityFormData>({
    teacherId: "",
    subjectId: "",
    classId: "",
    maxClassId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchEligibilities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(
        `/teacher-eligibilities?page=${pagination.page}&limit=${pagination.limit}`
      );
      setEligibilities(extractItems<TeacherEligibility>(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch teacher eligibilities");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await apiFetch("/users?limit=500");
      const users = extractItems<any>(res);
      // Filter users who have Teacher role
      const teacherUsers = users.filter((u: any) => u.roles?.some((r: any) => r.role?.name === "Teacher"));
      setTeachers(teacherUsers.map((u: any) => ({
        id: u.id,
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        email: u.email,
      })));
    } catch (err) {
      console.error("Failed to fetch teachers", err);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await apiFetch("/subjects?limit=500");
      const subjectsData = extractItems<any>(res);
      setSubjects(subjectsData.map((s: any) => ({ id: s.id, name: s.name, code: s.code })));
    } catch (err) {
      console.error("Failed to fetch subjects", err);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await apiFetch("/classes?limit=500");
      const classesData = extractItems<any>(res);
      setClasses(classesData.map((c: any) => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error("Failed to fetch classes", err);
    }
  }, []);

  useEffect(() => {
    fetchEligibilities();
    fetchTeachers();
    fetchSubjects();
    fetchClasses();
  }, [fetchEligibilities, fetchTeachers, fetchSubjects, fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = { ...formData };
      if (!payload.maxClassId) delete payload.maxClassId;
      if (editingEligibility) {
        await apiFetch(`/teacher-eligibilities/${editingEligibility.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/teacher-eligibilities", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchEligibilities();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save eligibility");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this eligibility? This cannot be undone.")) return;
    try {
      await apiFetch(`/teacher-eligibilities/${id}`, { method: "DELETE" });
      fetchEligibilities();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete eligibility");
    }
  };

  const openCreateModal = () => {
    setEditingEligibility(null);
    setFormData({ teacherId: "", subjectId: "", classId: "", maxClassId: "" });
    setShowModal(true);
  };

  const openEditModal = (eligibility: TeacherEligibility) => {
    setEditingEligibility(eligibility);
    setFormData({
      teacherId: eligibility.teacherId,
      subjectId: eligibility.subjectId,
      classId: eligibility.classId,
      maxClassId: eligibility.maxClassId || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEligibility(null);
  };

  const canCreate = user && user.permissions.includes("teacher_eligibility:create");
  const canUpdate = user && user.permissions.includes("teacher_eligibility:update");
  const canDelete = user && user.permissions.includes("teacher_eligibility:delete");
  const canManage = user && user.permissions.includes("teacher_eligibility:manage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Eligibilities</h1>
          <p className="text-gray-500 mt-1">Configure which classes and subjects each teacher can teach</p>
        </div>
        {(canCreate || canManage) && (
          <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Add Eligibility
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {(canUpdate || canManage || canDelete) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
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
              ) : eligibilities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No teacher eligibilities found</td>
                </tr>
              ) : (
                eligibilities.map((eligibility) => (
                  <tr key={eligibility.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{eligibility.teacher.firstName} {eligibility.teacher.lastName}</div>
                      <div className="text-sm text-gray-500">{eligibility.teacher.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{eligibility.subject.name} ({eligibility.subject.code})</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{eligibility.class.name}</div>
                      {eligibility.maxClass && (
                        <div className="text-sm text-gray-500">to {eligibility.maxClass.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${eligibility.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {eligibility.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {(canUpdate || canManage || canDelete) && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {((canUpdate || canManage) && (
                            <button
                              onClick={() => openEditModal(eligibility)}
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
                              onClick={() => handleDelete(eligibility.id)}
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
                <h2 className="text-xl font-semibold text-gray-900">{editingEligibility ? "Edit Eligibility" : "Create Eligibility"}</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                  <select
                    required
                    disabled={!!editingEligibility}
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Class *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select minimum class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Class (optional)</label>
                  <select
                    value={formData.maxClassId}
                    onChange={(e) => setFormData({ ...formData, maxClassId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Single class only (no range)</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">Leave blank for single class eligibility. If set, must be same or higher than minimum class.</p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? "Saving..." : editingEligibility ? "Update" : "Create"}
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