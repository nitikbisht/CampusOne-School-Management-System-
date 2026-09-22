"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface TeacherAssignment {
  id: string;
  teacherId: string;
  academicYearId: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  isPrimary: boolean;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
  teacher: { id: string; firstName: string; lastName: string; email: string };
  academicYear: { id: string; name: string };
  subject: { id: string; name: string; code: string };
  class: { id: string; name: string };
  section: { id: string; name: string };
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

interface Section {
  id: string;
  name: string;
  classId: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

interface AssignmentFormData {
  teacherId: string;
  academicYearId: string;
  subjectId: string;
  classId: string;
  sectionId: string;
  isPrimary: boolean;
}

export default function TeacherAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null);
  const [formData, setFormData] = useState<AssignmentFormData>({
    teacherId: "",
    academicYearId: "",
    subjectId: "",
    classId: "",
    sectionId: "",
    isPrimary: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [eligibilityWarning, setEligibilityWarning] = useState("");

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(
        `/teacher-assignments?page=${pagination.page}&limit=${pagination.limit}`
      );
      setAssignments(extractItems<TeacherAssignment>(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch teacher assignments");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await apiFetch("/users?limit=500");
      const users = extractItems<any>(res);
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

  const fetchSections = useCallback(async () => {
    try {
      const res = await apiFetch("/sections?limit=500");
      const sectionsData = extractItems<any>(res);
      setSections(sectionsData.map((s: any) => ({ id: s.id, name: s.name, classId: s.classId })));
    } catch (err) {
      console.error("Failed to fetch sections", err);
    }
  }, []);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await apiFetch("/academic-years?limit=500");
      const yearsData = extractItems<any>(res);
      setAcademicYears(yearsData.map((y: any) => ({ id: y.id, name: y.name })));
    } catch (err) {
      console.error("Failed to fetch academic years", err);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchTeachers();
    fetchSubjects();
    fetchClasses();
    fetchSections();
    fetchAcademicYears();
  }, [fetchAssignments, fetchTeachers, fetchSubjects, fetchClasses, fetchSections, fetchAcademicYears]);

  const checkEligibility = useCallback(async () => {
    if (!formData.teacherId || !formData.subjectId || !formData.classId) {
      setEligibilityWarning("");
      return;
    }
    try {
      const res = await apiFetch(
        `/teacher-eligibilities/check?teacherId=${formData.teacherId}&subjectId=${formData.subjectId}&classId=${formData.classId}`
      );
      const data = res as { data: { eligible: boolean } };
      if (!data.data.eligible) {
        setEligibilityWarning("Warning: This teacher is not eligible to teach this subject for this class.");
      } else {
        setEligibilityWarning("");
      }
    } catch (err) {
      console.error("Failed to check eligibility", err);
      setEligibilityWarning("");
    }
  }, [formData.teacherId, formData.subjectId, formData.classId]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = { ...formData };
      if (editingAssignment) {
        await apiFetch(`/teacher-assignments/${editingAssignment.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/teacher-assignments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchAssignments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment? This cannot be undone.")) return;
    try {
      await apiFetch(`/teacher-assignments/${id}`, { method: "DELETE" });
      fetchAssignments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete assignment");
    }
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    setFormData({ teacherId: "", academicYearId: "", subjectId: "", classId: "", sectionId: "", isPrimary: true });
    setEligibilityWarning("");
    setShowModal(true);
  };

  const openEditModal = (assignment: TeacherAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      teacherId: assignment.teacherId,
      academicYearId: assignment.academicYearId,
      subjectId: assignment.subjectId,
      classId: assignment.classId,
      sectionId: assignment.sectionId,
      isPrimary: assignment.isPrimary,
    });
    setEligibilityWarning("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
    setEligibilityWarning("");
  };

  const filteredSections = sections.filter((s) => s.classId === formData.classId);

  const canCreate = user && user.permissions.includes("teacher_assignment:create");
  const canUpdate = user && user.permissions.includes("teacher_assignment:update");
  const canDelete = user && user.permissions.includes("teacher_assignment:delete");
  const canManage = user && user.permissions.includes("teacher_assignment:manage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Assignments</h1>
          <p className="text-gray-500 mt-1">Assign teachers to class/section/subject combinations for an academic year</p>
        </div>
        {(canCreate || canManage) && (
          <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Add Assignment
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class / Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
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
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No teacher assignments found</td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{assignment.teacher.firstName} {assignment.teacher.lastName}</div>
                      <div className="text-sm text-gray-500">{assignment.teacher.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{assignment.academicYear.name}</td>
                    <td className="px-6 py-4 text-gray-900">{assignment.subject.name} ({assignment.subject.code})</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{assignment.class.name} - {assignment.section.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${assignment.isPrimary ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                        {assignment.isPrimary ? "Primary" : "Co-teacher"}
                      </span>
                    </td>
                    {(canUpdate || canManage || canDelete) && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {((canUpdate || canManage) && (
                            <button
                              onClick={() => openEditModal(assignment)}
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
                              onClick={() => handleDelete(assignment.id)}
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
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{editingAssignment ? "Edit Assignment" : "Create Assignment"}</h2>
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
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.email})</option>
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
                    <option value="">Select academic year</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>{y.name}</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => {
                      setFormData({ ...formData, classId: e.target.value, sectionId: "" });
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
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
                    disabled={filteredSections.length === 0}
                  >
                    <option value="">Select section</option>
                    {filteredSections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {filteredSections.length === 0 && formData.classId && (
                    <p className="mt-1 text-sm text-gray-500">No sections found for this class in the selected academic year.</p>
                  )}
                </div>
                {eligibilityWarning && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm" role="alert">
                    {eligibilityWarning}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700">Primary teacher (only one per subject/class/section)</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? "Saving..." : editingAssignment ? "Update" : "Create"}
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