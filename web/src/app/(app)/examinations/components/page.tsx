"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface AssessmentComponent {
  id: string;
  examSubjectId: string;
  examSubject?: {
    id: string;
    exam?: { id: string; name: string; code: string };
    subject?: { id: string; name: string; code: string };
    class?: { id: string; name: string };
  };
  name: string;
  code: string;
  type: "THEORY" | "PRACTICAL" | "INTERNAL" | "PROJECT" | "VIVA" | "OTHER";
  maxMarks: number;
  passMarks: number;
  weightage: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExamSubject {
  id: string;
  exam?: { id: string; name: string; code: string };
  subject?: { id: string; name: string; code: string };
  class?: { id: string; name: string };
}

export default function AssessmentComponentsPage() {
  const { user } = useAuth();
  const [components, setComponents] = useState<AssessmentComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<AssessmentComponent | null>(null);
  const [formData, setFormData] = useState({
    examSubjectId: "",
    name: "",
    code: "",
    type: "THEORY" as "THEORY" | "PRACTICAL" | "INTERNAL" | "PROJECT" | "VIVA" | "OTHER",
    maxMarks: 100,
    passMarks: 33,
    weightage: 1.0,
    displayOrder: 0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);

  const fetchComponents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/exams/components?page=${pagination.page}&limit=${pagination.limit}`);
      setComponents(extractItems<AssessmentComponent>(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch assessment components");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchExamSubjects = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: { items: ExamSubject[] } }>("/exams/subjects?limit=200");
      setExamSubjects(res.data.items);
    } catch (err) {
      console.error("Failed to fetch exam subjects", err);
    }
  }, []);

  useEffect(() => {
    fetchComponents();
    fetchExamSubjects();
  }, [fetchComponents, fetchExamSubjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...formData,
        maxMarks: Number(formData.maxMarks),
        passMarks: Number(formData.passMarks),
        weightage: Number(formData.weightage),
        displayOrder: Number(formData.displayOrder),
      };
      if (editingComponent) {
        await apiFetch(`/exams/components/${editingComponent.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/exams/components", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowModal(false);
      fetchComponents();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save assessment component");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assessment component?")) return;
    try {
      await apiFetch(`/exams/components/${id}`, { method: "DELETE" });
      fetchComponents();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete assessment component");
    }
  };

  const openCreateModal = () => {
    setEditingComponent(null);
    setFormData({
      examSubjectId: examSubjects[0]?.id || "",
      name: "",
      code: "",
      type: "THEORY",
      maxMarks: 100,
      passMarks: 33,
      weightage: 1.0,
      displayOrder: 0,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (component: AssessmentComponent) => {
    setEditingComponent(component);
    setFormData({
      examSubjectId: component.examSubjectId,
      name: component.name,
      code: component.code,
      type: component.type,
      maxMarks: component.maxMarks,
      passMarks: component.passMarks,
      weightage: component.weightage,
      displayOrder: component.displayOrder,
      isActive: component.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingComponent(null);
  };

  const canCreate = user && user.permissions.includes("exam:create");
  const canUpdate = user && user.permissions.includes("exam:update");
  const canDelete = user && user.permissions.includes("exam:delete");
  const canManage = user && user.permissions.includes("exam:manage");
  const canView = user && user.permissions.includes("exam:view");

  const getTypeColor = (type: string) => {
    switch (type) {
      case "THEORY": return "bg-blue-100 text-blue-800";
      case "PRACTICAL": return "bg-green-100 text-green-800";
      case "INTERNAL": return "bg-purple-100 text-purple-800";
      case "PROJECT": return "bg-orange-100 text-orange-800";
      case "VIVA": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!canView) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to view assessment components.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessment Components</h1>
          <p className="text-gray-500 mt-1">Manage assessment components (Theory, Practical, Internal, etc.) for exam subjects</p>
        </div>
        {(canCreate || canManage) && (
          <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Add Component
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weightage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
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
              ) : components.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">No assessment components found</td>
                </tr>
              ) : (
                components.map((component) => (
                  <tr key={component.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {component.examSubject?.exam?.name} - {component.examSubject?.subject?.name} ({component.examSubject?.class?.name})
                      </div>
                      <div className="text-sm text-gray-500 font-mono">
                        {component.examSubject?.exam?.code} / {component.examSubject?.subject?.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{component.name}</td>
                    <td className="px-6 py-4 text-gray-900 font-mono">{component.code}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(component.type)}`}>
                        {component.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{component.maxMarks}</td>
                    <td className="px-6 py-4 text-gray-900">{component.passMarks}</td>
                    <td className="px-6 py-4 text-gray-900">{component.weightage}</td>
                    <td className="px-6 py-4 text-gray-900">{component.displayOrder}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${component.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {component.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {(canUpdate || canManage || canDelete) && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {((canUpdate || canManage) && (
                            <button
                              onClick={() => openEditModal(component)}
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
                              onClick={() => handleDelete(component.id)}
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
                <h2 className="text-xl font-semibold text-gray-900">{editingComponent ? "Edit Assessment Component" : "Add Assessment Component"}</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Subject *</label>
                  <select
                    required
                    value={formData.examSubjectId}
                    onChange={(e) => setFormData({ ...formData, examSubjectId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {examSubjects.map((es) => (
                      <option key={es.id} value={es.id}>
                        {es.exam?.name} - {es.subject?.name} ({es.class?.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Theory, Practical, Internal Assessment"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., TH, PR, IA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "THEORY" | "PRACTICAL" | "INTERNAL" | "PROJECT" | "VIVA" | "OTHER" })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="THEORY">Theory</option>
                    <option value="PRACTICAL">Practical</option>
                    <option value="INTERNAL">Internal Assessment</option>
                    <option value="PROJECT">Project</option>
                    <option value="VIVA">Viva Voce</option>
                    <option value="OTHER">Other</option>
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
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
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
                    {submitting ? "Saving..." : editingComponent ? "Update" : "Create"}
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