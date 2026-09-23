"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface StudentMark {
  id: string;
  studentId: string;
  student?: {
    id: string;
    admissionNo: string;
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  academicYearId: string;
  academicYear?: { name: string };
  examId: string;
  exam?: { id: string; name: string; code: string };
  examSubjectId: string;
  examSubject?: {
    id: string;
    subject?: { id: string; name: string; code: string };
    class?: { id: string; name: string };
  };
  assessmentCompId: string;
  assessmentComp?: {
    id: string;
    name: string;
    code: string;
    maxMarks: number;
    passMarks: number;
    type: string;
    weightage: number;
  };
  marksObtained: number | null;
  isAbsent: boolean;
  isDraft: boolean;
  enteredById: string;
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
  exam?: { id: string; name: string; code: string; academicYearId: string };
  subject?: { id: string; name: string; code: string };
  class?: { id: string; name: string };
  components?: Array<{ id: string; name: string; code: string; maxMarks: number; passMarks: number; type: string; weightage: number; displayOrder: number }>;
}

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  rollNumber?: number;
}

interface Section {
  id: string;
  name: string;
}

interface MarkSheetData {
  examSubject: ExamSubject;
  components: Array<{ id: string; name: string; code: string; maxMarks: number; passMarks: number; type: string; weightage: number; displayOrder: number }>;
  students: Array<{
    student: Student;
    section: Section;
    rollNumber?: number;
    marks: Array<StudentMark | null>;
  }>;
}

export default function StudentMarksPage() {
  const { user } = useAuth();
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  // Mark sheet mode
  const [viewMode, setViewMode] = useState<"list" | "marksheet">("list");
  const [selectedExamSubjectId, setSelectedExamSubjectId] = useState<string>("");
  const [markSheet, setMarkSheet] = useState<MarkSheetData | null>(null);
  const [markSheetLoading, setMarkSheetLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{ studentId: string; compId: string } | null>(null);
  const [cellValue, setCellValue] = useState("");
  const [cellAbsent, setCellAbsent] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    examId: "",
    examSubjectId: "",
    studentId: "",
    isDraft: undefined as boolean | undefined,
    isAbsent: undefined as boolean | undefined,
  });

  // Dropdown data
  const [exams, setExams] = useState<Exam[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);

  const fetchMarks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      if (filters.examId) params.set("examId", filters.examId);
      if (filters.examSubjectId) params.set("examSubjectId", filters.examSubjectId);
      if (filters.studentId) params.set("studentId", filters.studentId);
      if (filters.isDraft !== undefined) params.set("isDraft", filters.isDraft.toString());
      if (filters.isAbsent !== undefined) params.set("isAbsent", filters.isAbsent.toString());

      const res = await apiFetch(`/student-marks?${params.toString()}`);
      setMarks(extractItems<StudentMark>(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch student marks");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchExams = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: { items: Exam[] } }>("/exams?limit=100");
      setExams(res.data.items);
    } catch (err) {
      console.error("Failed to fetch exams", err);
    }
  }, []);

  const fetchExamSubjects = useCallback(async () => {
    if (!filters.examId) {
      setExamSubjects([]);
      return;
    }
    try {
      const res = await apiFetch<{ data: { items: ExamSubject[] } }>(`/exams/subjects?examId=${filters.examId}&limit=200`);
      setExamSubjects(res.data.items);
    } catch (err) {
      console.error("Failed to fetch exam subjects", err);
    }
  }, [filters.examId]);

  useEffect(() => {
    fetchMarks();
    fetchExams();
  }, [fetchMarks, fetchExams]);

  useEffect(() => {
    fetchExamSubjects();
  }, [fetchExamSubjects]);

  const fetchMarkSheet = async (examSubjectId: string) => {
    setMarkSheetLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ data: MarkSheetData }>(`/student-marks/by-exam-subject/${examSubjectId}`);
      setMarkSheet(res.data);
      setSelectedExamSubjectId(examSubjectId);
      setViewMode("marksheet");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch mark sheet");
    } finally {
      setMarkSheetLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string | boolean | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCellEdit = (studentId: string, compId: string, currentMark: StudentMark | null) => {
    setEditingCell({ studentId, compId });
    setCellValue(currentMark?.marksObtained?.toString() || "");
    setCellAbsent(currentMark?.isAbsent || false);
  };

  const handleCellSave = async () => {
    if (!editingCell || !markSheet) return;

    const { studentId, compId } = editingCell;
    const marksObtained = cellAbsent ? null : (cellValue ? parseFloat(cellValue) : null);
    const isAbsent = cellAbsent;

    const examSubjectId = markSheet.examSubject.id;
    const assessmentCompId = compId;

    const academicYearId = markSheet.examSubject.exam?.academicYearId;
    const examId = markSheet.examSubject.exam?.id;

    if (!academicYearId || !examId) {
      setError("Missing exam/academic year info");
      return;
    }

    setError("");
    try {
      await apiFetch("/student-marks", {
        method: "POST",
        body: JSON.stringify({
          studentId,
          academicYearId,
          examId,
          examSubjectId,
          assessmentCompId,
          marksObtained,
          isAbsent,
          isDraft: true,
        }),
      });
      setSuccess("Marks saved successfully");
      fetchMarkSheet(examSubjectId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save marks");
    } finally {
      setEditingCell(null);
      setCellValue("");
      setCellAbsent(false);
    }
  };

  const handleBulkSave = async () => {
    if (!markSheet) return;

    setError("");
    try {
      const bulkData = {
        examSubjectId: markSheet.examSubject.id,
        marks: markSheet.students.flatMap((s) =>
          markSheet!.components.map((comp, idx) => ({
            studentId: s.student.id,
            assessmentCompId: comp.id,
            marksObtained: s.marks[idx]?.marksObtained ?? null,
            isAbsent: s.marks[idx]?.isAbsent ?? false,
            isDraft: true,
          }))
        ),
      };

      await apiFetch("/student-marks/bulk", {
        method: "POST",
        body: JSON.stringify(bulkData),
      });
      setSuccess("All marks saved successfully");
      fetchMarkSheet(markSheet.examSubject.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to bulk save marks");
    }
  };

  const handleBulkPublish = async () => {
    if (!markSheet) return;
    if (!confirm("Publish all draft marks for this exam subject? This action cannot be undone.")) return;

    setError("");
    try {
      await apiFetch("/student-marks/bulk-publish", {
        method: "POST",
        body: JSON.stringify({ examSubjectId: markSheet.examSubject.id }),
      });
      setSuccess("Marks published successfully");
      fetchMarkSheet(markSheet.examSubject.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to publish marks");
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setMarkSheet(null);
    setSelectedExamSubjectId("");
  };

  const getGrade = (marks: number | null, maxMarks: number, passMarks: number): { grade: string; color: string } | "-" => {
    if (marks === null) return "-";
    const percentage = (marks / maxMarks) * 100;
    if (marks < passMarks) return { grade: "F", color: "text-red-600" };
    if (percentage >= 90) return { grade: "A1", color: "text-green-600" };
    if (percentage >= 80) return { grade: "A2", color: "text-green-600" };
    if (percentage >= 70) return { grade: "B1", color: "text-blue-600" };
    if (percentage >= 60) return { grade: "B2", color: "text-blue-600" };
    if (percentage >= 50) return { grade: "C1", color: "text-yellow-600" };
    if (percentage >= 40) return { grade: "C2", color: "text-yellow-600" };
    if (percentage >= 33) return { grade: "D", color: "text-orange-600" };
    return { grade: "F", color: "text-red-600" };
  };

  const canView = user && user.permissions.includes("student_mark:view");
  const canCreate = user && user.permissions.includes("student_mark:create");
  const canUpdate = user && user.permissions.includes("student_mark:update");
  const canDelete = user && user.permissions.includes("student_mark:delete");
  const canManage = user && user.permissions.includes("student_mark:manage");

  if (!canView) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to view student marks.</p>
      </div>
    );
  }

  // Mark Sheet View
  if (viewMode === "marksheet" && markSheet) {
    const components = markSheet.components;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mark Sheet</h1>
            <p className="text-gray-500 mt-1">
              {markSheet.examSubject.exam?.name} - {markSheet.examSubject.subject?.name} ({markSheet.examSubject.class?.name})
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleBackToList} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              ← Back to List
            </button>
            {(canCreate || canManage) && (
              <button onClick={handleBulkSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save All (Draft)
              </button>
            )}
            {(canManage) && (
              <button onClick={handleBulkPublish} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Publish All
              </button>
            )}
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">{error}</div>}
        {success && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg" role="alert">{success}</div>}

        {markSheetLoading ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              Loading mark sheet...
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 border-r border-gray-200">Roll No.</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 border-r border-gray-200" style={{ left: '60px' }}>Student Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 border-r border-gray-200" style={{ left: '260px' }}>Section</th>
                    {components.map((comp) => (
                      <th key={comp.id} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[100px]">
                        <div className="font-medium">{comp.name}</div>
                        <div className="text-xs text-gray-400">({comp.code})</div>
                        <div className="text-xs text-gray-400">Max: {comp.maxMarks}</div>
                        <div className="text-xs text-gray-400">Pass: {comp.passMarks}</div>
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {markSheet.students.map((s, rowIdx) => (
                    <tr key={s.student.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-900 sticky left-0 bg-white border-r border-gray-200 font-mono">
                        {s.rollNumber || rowIdx + 1}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 sticky left-0 bg-white border-r border-gray-200" style={{ left: '60px' }}>
                        {s.student.firstName} {s.student.middleName ? s.student.middleName + " " : ""}{s.student.lastName}
                        <div className="text-xs text-gray-500 font-mono">{s.student.admissionNo}</div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 sticky left-0 bg-white border-r border-gray-200" style={{ left: '260px' }}>
                        {s.section.name}
                      </td>
                      {components.map((comp, compIdx) => {
                        const mark = s.marks[compIdx];
                        const isEditing = editingCell?.studentId === s.student.id && editingCell?.compId === comp.id;
                        const obtained = mark?.marksObtained;
                        const absent = mark?.isAbsent;
                        const isDraft = mark?.isDraft;

                        return (
                          <td key={comp.id} className="px-2 py-2 text-center border-r border-gray-200 min-w-[100px]">
                            {isEditing ? (
                              <div className="flex flex-col gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={comp.maxMarks}
                                  step="0.5"
                                  value={cellValue}
                                  onChange={(e) => { setCellValue(e.target.value); setCellAbsent(false); }}
                                  className="w-full px-1 py-1 text-sm border border-blue-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="Marks"
                                  autoFocus
                                />
                                <label className="flex items-center justify-center gap-1 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={cellAbsent}
                                    onChange={(e) => { setCellAbsent(e.target.checked); if (e.target.checked) setCellValue(""); }}
                                    className="w-3 h-3 text-blue-600 border-gray-300 rounded"
                                  />
                                  Absent
                                </label>
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={handleCellSave}
                                    className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingCell(null)}
                                    className="px-2 py-0.5 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div onClick={() => canCreate && handleCellEdit(s.student.id, comp.id, mark)}>
                                {absent ? (
                                  <span className="text-gray-400 font-medium">AB</span>
                                ) : obtained !== null && obtained !== undefined ? (
                                  <>
                                    {(() => {
                                      const grade = getGrade(obtained, comp.maxMarks, comp.passMarks);
                                      return grade !== "-" ? (
                                        <div className={`font-mono font-medium ${grade.color}`}>
                                          {obtained}
                                        </div>
                                      ) : (
                                        <div className="font-mono font-medium">{obtained}</div>
                                      );
                                    })()}
                                    {isDraft && <span className="text-xs text-yellow-600">(Draft)</span>}
                                    {!isDraft && <span className="text-xs text-green-600">(Published)</span>}
                                  </>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-r border-gray-200">
                        {components.reduce((sum, comp, idx) => {
                          const mark = s.marks[idx];
                          return sum + (mark?.marksObtained || 0);
                        }, 0)}
                        /
                        {components.reduce((sum, comp) => sum + comp.maxMarks, 0)}
                      </td>
                      <td className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-r border-gray-200">
                        {(() => {
                          const totalObtained = components.reduce((sum, comp, idx) => sum + (s.marks[idx]?.marksObtained || 0), 0);
                          const totalMax = components.reduce((sum, comp) => sum + comp.maxMarks, 0);
                          return totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "—";
                        })()}
                      </td>
                      <td className="px-3 py-2 text-center text-sm font-medium border-r border-gray-200">
                        {(() => {
                          const totalObtained = components.reduce((sum, comp, idx) => sum + (s.marks[idx]?.marksObtained || 0), 0);
                          const totalMax = components.reduce((sum, comp) => sum + comp.maxMarks, 0);
                          const totalPass = components.reduce((sum, comp) => sum + comp.passMarks, 0);
                          const grade = getGrade(totalObtained, totalMax, totalPass);
                          if (grade === "-") return <span className="text-gray-300">—</span>;
                          return <span className={grade.color}>{grade.grade}</span>;
                        })()}
                      </td>
                      <td className="px-3 py-2 text-center text-sm border-r border-gray-200">
                        {components.every((comp, idx) => {
                          const mark = s.marks[idx];
                          return mark && !mark.isDraft;
                        }) ? (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Published</span>
                        ) : components.some((comp, idx) => {
                          const mark = s.marks[idx];
                          return mark && mark.isDraft;
                        }) ? (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">Draft</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">Not Entered</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Marks</h1>
          <p className="text-gray-500 mt-1">View and manage student examination marks</p>
        </div>
        <div className="flex gap-2">
          {(canCreate || canManage) && (
            <button onClick={() => setViewMode("list")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + Add Mark Entry
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
            <select
              value={filters.examId}
              onChange={(e) => handleFilterChange("examId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Exams</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.name} ({exam.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Subject</label>
            <select
              value={filters.examSubjectId}
              onChange={(e) => handleFilterChange("examSubjectId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              {examSubjects.map((es) => (
                <option key={es.id} value={es.id}>
                  {es.subject?.name} ({es.class?.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.isDraft === undefined ? "" : filters.isDraft.toString()}
              onChange={(e) => handleFilterChange("isDraft", e.target.value === "" ? undefined : e.target.value === "true")}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Draft</option>
              <option value="false">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Absent</label>
            <select
              value={filters.isAbsent === undefined ? "" : filters.isAbsent.toString()}
              onChange={(e) => handleFilterChange("isAbsent", e.target.value === "" ? undefined : e.target.value === "true")}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Absent</option>
              <option value="false">Present</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">{error}</div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg" role="alert">{success}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject / Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
              ) : marks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No marks found. Use the Mark Sheet view for bulk entry.</td>
                </tr>
              ) : (
                marks.map((mark) => (
                  <tr key={mark.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {mark.student?.firstName} {mark.student?.middleName ? mark.student.middleName + " " : ""}{mark.student?.lastName}
                      </div>
                      <div className="text-sm text-gray-500 font-mono">{mark.student?.admissionNo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{mark.exam?.name || mark.examId}</div>
                      <div className="text-sm text-gray-500 font-mono">{mark.exam?.code || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{mark.examSubject?.subject?.name || mark.examSubjectId}</div>
                      <div className="text-sm text-gray-500">Class: {mark.examSubject?.class?.name || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{mark.assessmentComp?.name || mark.assessmentCompId}</div>
                      <div className="text-sm text-gray-500 font-mono">{mark.assessmentComp?.code || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      {mark.isAbsent ? (
                        <span className="text-gray-400 font-medium">ABSENT</span>
                      ) : mark.marksObtained !== null && mark.marksObtained !== undefined ? (
                        <span className="font-mono font-medium">{mark.marksObtained}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900">{mark.assessmentComp?.maxMarks || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${mark.isAbsent ? "bg-gray-100 text-gray-800" : mark.isDraft ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                        {mark.isAbsent ? "Absent" : mark.isDraft ? "Draft" : "Published"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(canUpdate || canManage) && !mark.isAbsent && (
                          <button
                            onClick={() => {}}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {(canDelete || canManage) && mark.isDraft && (
                          <button
                            onClick={() => {
                              if (confirm("Delete this mark entry?")) {
                                // Handle delete
                              }
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
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

      {/* Quick Mark Sheet Access */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Mark Sheet Access</h3>
        <p className="text-gray-500 mb-4">Select an exam subject to enter marks in a spreadsheet-style view</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
            <select
              value={filters.examId}
              onChange={(e) => handleFilterChange("examId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose an exam...</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.name} ({exam.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam Subject</label>
            <select
              value={filters.examSubjectId}
              onChange={(e) => handleFilterChange("examSubjectId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!filters.examId}
            >
              <option value="">Choose an exam subject...</option>
              {examSubjects.map((es) => (
                <option key={es.id} value={es.id}>
                  {es.subject?.name} - {es.class?.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => filters.examSubjectId && fetchMarkSheet(filters.examSubjectId)}
              disabled={!filters.examSubjectId || markSheetLoading}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markSheetLoading ? "Loading..." : "Open Mark Sheet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}