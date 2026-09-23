"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface ExamSubject {
  id: string;
  examId: string;
  exam?: { id: string; name: string; code: string };
  subjectId: string;
  subject?: { id: string; name: string; code: string };
  classId: string;
  class?: { id: string; name: string };
  maxMarks: number;
  passMarks: number;
  weightage: number;
  isActive: boolean;
  components?: Array<{ id: string; name: string; code: string; maxMarks: number; type: string }>;
  createdAt: string;
  updatedAt: string;
}

interface Exam {
  id: string;
  name: string;
  code: string;
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

export default function ExamSubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<ExamSubject | null>(null);
  const [formData, setFormData] = useState({
    examId: "",
    subjectId: "",
    classId: "",
    maxMarks: 100,
    passMarks: 33,
    weightage: 1.0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/exams/subjects?page=${pagination.page}&limit=${pagination.limit}`);
      setSubjects(extractItems<ExamSubject>(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch exam subjects");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchExams = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: { items: Exam[] } }>("/exams?limit=100");
      setExams(res.data.items);
    } catch (err) {
      console.error("Failed to fetch exams", err);
    }
  }, []);

  const fetchSubjectsList = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: { items: Subject[] } }>("/subjects?limit=100");
      setSubjectsList(res.data.items);
    } catch (err) {
      console.error("Failed to fetch subjects", err);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: { items: SchoolClass[] } }>("/classes?limit=100");
      setClasses(res.data.items);
    } catch (err) {
      console.error("Failed to fetch classes", err);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
    fetchExams();
    fetchSubjectsList();
    fetchClasses();
  }, [fetchSubjects, fetchExams, fetchSubjectsList, fetchClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = { ...formData, maxMarks: Number(formData.maxMarks), passMarks: Number(formData.passMarks), weightage: Number(formData.weightage) };
      if (editingSubject) {
        await apiFetch(`/exams/subjects/${editingSubject.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/exams/subjects", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save exam subject");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam subject?")) return;
    try {
      await apiFetch(`/exams/subjects/${id}`, { method: "DELETE" });
      fetchSubjects();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete exam subject");
    }
  };

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData({
      examId: exams[0]?.id || "",
      subjectId: subjectsList[0]?.id || "",
      classId: classes[0]?.id || "",
      maxMarks: 100,
      passMarks: 33,
      weightage: 1.0,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (subject: ExamSubject) => {
    setEditingSubject(subject);
    setFormData({
      examId: subject.examId,
      subjectId: subject.subjectId,
      classId: subject.classId,
      maxMarks: subject.maxMarks,
      passMarks: subject.passMarks,
      weightage: subject.weightage,
      isActive: subject.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSubject(null);
  };

  const canCreate = user && user.permissions.includes("exam:create");
  const canUpdate = user && user.permissions.includes("exam:update");
  const canDelete = user && user.permissions.includes("exam:delete");
  const canManage = user && user.permissions.includes("exam:manage");
  const canView = user && user.permissions.includes("exam:view");

  if (!canView) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to view exam subjects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Subjects</h1>
          <p className="text-gray-500 mt-1">Manage subjects assigned to examinations per class</p>
        </div>
        {(canCreate || canManage) && (
          <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Add Exam Subject
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weightage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Components</th>
                {(canUpdate || canManage || canDelete) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">No exam subjects found</td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{subject.exam?.name || subject.examId}</div>
                      <div className="text-sm text-gray-500 font-mono">{subject.exam?.code || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{subject.subject?.name || subject.subjectId}</div>
                      <div className="text-sm text-gray-500 font-mono">{subject.subject?.code || ""}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{subject.class?.name || subject.classId}</td>
                    <td className="px-6 py-4 text-gray-900">{subject.maxMarks}</td>
                    <td className="px-6 py-4 text-gray-900">{subject.passMarks}</td>
                    <td className="px-6 py-4 text-gray-900">{subject.weightage}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${subject.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {subject.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{subject.components?.length || 0}</td>
                    {(canUpdate || canManage || canDelete) && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {((canUpdate || canManage) && (
                            <button
                              onClick={() => openEditModal(subject)}
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
                              onClick={() => handleDelete(subject.id)}
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
                <h2 className="text-xl font-semibold text-gray-900">{editingSubject ? "Edit Exam Subject" : "Add Exam Subject"}</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam *</label>
                  <select
                    required
                    value={formData.examId}
                    onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>{exam.name} ({exam.code})</option>
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
                    {subjectsList.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.maxMarks}
                      onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pass Marks *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.passMarks}
                      onChange={(e) => setFormData({ ...formData, passMarks: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weightage</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weightage}
                    onChange={(e) => setFormData({ ...formData, weightage: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? "Saving..." : editingSubject ? "Update" : "Create"}
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