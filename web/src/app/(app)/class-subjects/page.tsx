"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";

interface ClassSubject {
  id: string;
  classId: string;
  class?: { name: string; displayName: string };
  subjectId: string;
  subject?: { name: string; code: string };
  teacherId?: string;
  teacher?: { firstName: string; lastName: string; email: string };
  academicYearId: string;
  academicYear?: { name: string };
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

export default function ClassSubjectsPage() {
  const { user } = useAuth();
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingCS, setEditingCS] = useState<ClassSubject | null>(null);
  const [formData, setFormData] = useState({
    classId: "",
    subjectId: "",
    teacherId: "",
    academicYearId: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<{id: string, name: string, displayName: string}[]>([]);
  const [subjects, setSubjects] = useState<{id: string, name: string, code: string}[]>([]);
  const [teachers, setTeachers] = useState<{id: string, firstName: string, lastName: string, email: string}[]>([]);
  const [academicYears, setAcademicYears] = useState<{id: string, name: string}[]>([]);

  const fetchClassSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<PaginatedResponse<ClassSubject>>(
        `/class-subjects?page=${pagination.page}&limit=${pagination.limit}`
      );
      setClassSubjects(res.data);
      setPagination((prev) => ({ ...prev, total: res.data.total, totalPages: res.data.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch class subjects");
    } finally {
      setLoading(false);
    }
  }, [pagination.page]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await apiFetch<PaginatedResponse<{id: string, name: string, displayName: string}>>("/classes?limit=100");
      setClasses(res.data);
    } catch (err) {
      console.error("Failed to fetch classes", err);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await apiFetch<PaginatedResponse<{id: string, name: string, code: string}>>("/subjects?limit=100");
      setSubjects(res.data);
    } catch (err) {
      console.error("Failed to fetch subjects", err);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await apiFetch<PaginatedResponse<{id: string, firstName: string, lastName: string, email: string}>>("/users?role=teacher&limit=100");
      setTeachers(res.data);
    } catch (err) {
      console.error("Failed to fetch teachers", err);
    }
  }, []);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await apiFetch<PaginatedResponse<{id: string, name: string}>>("/academic-years?limit=100");
      setAcademicYears(res.data);
    } catch (err) {
      console.error("Failed to fetch academic years", err);
    }
  }, []);

  useEffect(() => {
    fetchClassSubjects();
    fetchClasses();
    fetchSubjects();
    fetchTeachers();
    fetchAcademicYears();
  }, [fetchClassSubjects, fetchClasses, fetchSubjects, fetchTeachers, fetchAcademicYears]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        ...formData,
        teacherId: formData.teacherId || null,
      };
      if (editingCS) {
        await apiFetch(`/class-subjects/${editingCS.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/class-subjects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchClassSubjects();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save class subject");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class subject assignment?")) return;
    try {
      await apiFetch(`/class-subjects/${id}`, { method: "DELETE" });
      fetchClassSubjects();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete class subject");
    }
  };

  const openCreateModal = () => {
    setEditingCS(null);
    setFormData({
      classId: classes[0]?.id || "",
      subjectId: subjects[0]?.id || "",
      teacherId: "",
      academicYearId: academicYears[0]?.id || "",
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (cs: ClassSubject) => {
    setEditingCS(cs);
    setFormData({
      classId: cs.classId,
      subjectId: cs.subjectId,
      teacherId: cs.teacherId || "",
      academicYearId: cs.academicYearId,
      isActive: cs.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCS(null);
  };

  const canCreate = user && user.permissions.includes("class_subject:create");
  const canUpdate = user && user.permissions.includes("class_subject:update");
  const canDelete = user && user.permissions.includes("class_subject:delete");
  const canManage = user && user.permissions.includes("class_subject:manage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Subjects</h1>
          <p className="text-gray-500 mt-1">Manage subject assignments to classes with teachers</p>
        </div>
        {(canCreate || canManage) && (
          <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Assign Subject
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {(canUpdate || canManage || canDelete) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
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
              ) : classSubjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No class subjects found</td>
                </tr>
              ) : (
                classSubjects.map((cs) => (
                  <tr key={cs.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{cs.class?.displayName || cs.class?.name || cs.classId}</td>
                    <td className="px-6 py-4 text-gray-900">{cs.subject?.name || cs.subjectId} <span className="text-gray-400 ml-1">({cs.subject?.code})</span></td>
                    <td className="px-6 py-4 text-gray-900">
                      {cs.teacher ? `${cs.teacher.firstName} ${cs.teacher.lastName}` : "Unassigned"}
                    </td>
                    <td className="px-6 py-4 text-gray-900">{cs.academicYear?.name || cs.academicYearId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${cs.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {cs.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {(canUpdate || canManage || canDelete) && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {((canUpdate || canManage) && (
                            <button
                              onClick={() => openEditModal(cs)}
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
                              onClick={() => handleDelete(cs.id)}
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
                <h2 className="text-xl font-semibold text-gray-900">{editingCS ? "Edit Class Subject" : "Assign Subject to Class"}</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.displayName || cls.name}</option>
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
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">— Unassigned —</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.email})</option>
                    ))}
                  </select>
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
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? "Saving..." : editingCS ? "Update" : "Create"}
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