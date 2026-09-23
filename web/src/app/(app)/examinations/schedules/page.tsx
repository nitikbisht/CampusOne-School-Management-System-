"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface ExamSchedule {
  id: string;
  examId: string;
  exam?: { id: string; name: string; code: string };
  examSubjectId: string;
  examSubject?: {
    id: string;
    subject?: { id: string; name: string; code: string };
    class?: { id: string; name: string };
  };
  classId: string;
  class?: { id: string; name: string };
  sectionId?: string;
  section?: { id: string; name: string };
  date: string;
  startTime: string;
  endTime: string;
  roomId?: string;
  room?: { id: string; name: string; code: string };
  invigilatorId?: string;
  invigilator?: { id: string; firstName: string; lastName: string };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Exam {
  id: string;
  name: string;
  code: string;
}

interface ExamSubject {
  id: string;
  exam?: { id: string; name: string; code: string };
  subject?: { id: string; name: string; code: string };
  class?: { id: string; name: string };
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

interface Room {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

export default function ExamSchedulesPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [formData, setFormData] = useState({
    examId: "",
    examSubjectId: "",
    classId: "",
    sectionId: "",
    date: "",
    startTime: "09:00",
    endTime: "11:00",
    roomId: "",
    invigilatorId: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [invigilators, setInvigilators] = useState<User[]>([]);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/exams/schedules?page=${pagination.page}&limit=${pagination.limit}`);
      setSchedules(extractItems<ExamSchedule>(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch exam schedules");
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

  const fetchExamSubjects = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: { items: ExamSubject[] } }>("/exams/subjects?limit=200");
      setExamSubjects(res.data.items);
    } catch (err) {
      console.error("Failed to fetch exam subjects", err);
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

  const fetchSections = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: { items: Section[] } }>("/sections?limit=200");
      setSections(res.data.items);
    } catch (err) {
      console.error("Failed to fetch sections", err);
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: { items: Room[] } }>("/rooms?limit=100");
      setRooms(res.data.items);
    } catch (err) {
      console.error("Failed to fetch rooms", err);
    }
  }, []);

  const fetchInvigilators = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: { items: User[] } }>("/users?limit=100&role=Teacher");
      setInvigilators(res.data.items);
    } catch (err) {
      console.error("Failed to fetch invigilators", err);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchExams();
    fetchExamSubjects();
    fetchClasses();
    fetchSections();
    fetchRooms();
    fetchInvigilators();
  }, [fetchSchedules, fetchExams, fetchExamSubjects, fetchClasses, fetchSections, fetchRooms, fetchInvigilators]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...formData,
        sectionId: formData.sectionId || undefined,
        roomId: formData.roomId || undefined,
        invigilatorId: formData.invigilatorId || undefined,
        notes: formData.notes || undefined,
      };
      if (editingSchedule) {
        await apiFetch(`/exams/schedules/${editingSchedule.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/exams/schedules", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowModal(false);
      fetchSchedules();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save exam schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam schedule?")) return;
    try {
      await apiFetch(`/exams/schedules/${id}`, { method: "DELETE" });
      fetchSchedules();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete exam schedule");
    }
  };

  const openCreateModal = () => {
    setEditingSchedule(null);
    setFormData({
      examId: exams[0]?.id || "",
      examSubjectId: examSubjects[0]?.id || "",
      classId: classes[0]?.id || "",
      sectionId: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "11:00",
      roomId: "",
      invigilatorId: "",
      notes: "",
    });
    setShowModal(true);
  };

  const openEditModal = (schedule: ExamSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      examId: schedule.examId,
      examSubjectId: schedule.examSubjectId,
      classId: schedule.classId,
      sectionId: schedule.sectionId || "",
      date: schedule.date.split("T")[0],
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      roomId: schedule.roomId || "",
      invigilatorId: schedule.invigilatorId || "",
      notes: schedule.notes || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
  };

  const canCreate = user && user.permissions.includes("exam:create");
  const canUpdate = user && user.permissions.includes("exam:update");
  const canDelete = user && user.permissions.includes("exam:delete");
  const canManage = user && user.permissions.includes("exam:manage");
  const canView = user && user.permissions.includes("exam:view");

  const filteredSections = formData.classId
    ? sections.filter((s) => s.classId === formData.classId)
    : [];

  // Update sections when class changes
  useEffect(() => {
    if (formData.classId && !filteredSections.find((s) => s.id === formData.sectionId)) {
      setFormData((prev) => ({ ...prev, sectionId: "" }));
    }
  }, [formData.classId, filteredSections]);

  if (!canView) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to view exam schedules.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Schedules</h1>
          <p className="text-gray-500 mt-1">Manage examination timetable - date, time, room, and invigilator</p>
        </div>
        {(canCreate || canManage) && (
          <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Add Schedule
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class / Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invigilator</th>
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
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No exam schedules found</td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{schedule.exam?.name || schedule.examId}</div>
                      <div className="text-sm text-gray-500 font-mono">{schedule.exam?.code || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{schedule.examSubject?.subject?.name || schedule.examSubjectId}</div>
                      <div className="text-sm text-gray-500 font-mono">{schedule.examSubject?.subject?.code || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{schedule.class?.name || schedule.classId}</div>
                      {schedule.section && <div className="text-sm text-gray-500">Section: {schedule.section.name}</div>}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {new Date(schedule.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-mono">
                      {schedule.startTime} - {schedule.endTime}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {schedule.room?.name || schedule.roomId || "—"}
                      {schedule.room?.code && <div className="text-sm text-gray-500 font-mono">{schedule.room.code}</div>}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {schedule.invigilator
                        ? `${schedule.invigilator.firstName} ${schedule.invigilator.lastName}`
                        : schedule.invigilatorId
                        ? "Assigned"
                        : "—"}
                    </td>
                    {(canUpdate || canManage || canDelete) && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {((canUpdate || canManage) && (
                            <button
                              onClick={() => openEditModal(schedule)}
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
                              onClick={() => handleDelete(schedule.id)}
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
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{editingSchedule ? "Edit Exam Schedule" : "Add Exam Schedule"}</h2>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section (Optional)</label>
                  <select
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Sections</option>
                    {filteredSections.map((section) => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
                  <select
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No Room Assigned</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>{room.name} ({room.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invigilator (Optional)</label>
                  <select
                    value={formData.invigilatorId}
                    onChange={(e) => setFormData({ ...formData, invigilatorId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No Invigilator Assigned</option>
                    {invigilators.map((inv) => (
                      <option key={inv.id} value={inv.id}>{inv.firstName} {inv.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes for the schedule"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? "Saving..." : editingSchedule ? "Update" : "Create"}
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