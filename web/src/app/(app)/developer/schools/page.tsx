"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSchool } from "@/lib/school-context";
import { apiFetch, ApiError } from "@/lib/api";

interface School {
  id: string;
  name: string;
  code: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    students: number;
    academicYears: number;
  };
}

export default function SchoolSwitcherPage() {
  const { user } = useAuth();
  const { schools, currentSchool, loading: schoolLoading, fetchSchools, switchSchool, clearSchool } = useSchool();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSchoolId, setExpandedSchoolId] = useState<string | null>(null);
  const [schoolDetails, setSchoolDetails] = useState<Record<string, School>>({});

  const isDeveloper = user?.roles.includes("Developer") ?? false;

  const loadSchools = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      await fetchSchools();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load schools");
    } finally {
      setLoading(false);
    }
  }, [fetchSchools]);

  const loadSchoolDetails = async (schoolId: string) => {
    try {
      const res = await apiFetch<{ data: School }>(`/developer/schools/${schoolId}`);
      setSchoolDetails(prev => ({ ...prev, [schoolId]: res.data }));
    } catch (err) {
      console.error("Failed to load school details:", err);
    }
  };

  const handleToggleExpand = (schoolId: string) => {
    if (expandedSchoolId === schoolId) {
      setExpandedSchoolId(null);
    } else {
      setExpandedSchoolId(schoolId);
      if (!schoolDetails[schoolId]?._count) {
        loadSchoolDetails(schoolId);
      }
    }
  };

  const handleSwitchSchool = async (schoolId: string) => {
    try {
      await switchSchool(schoolId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to switch school");
    }
  };

  const handleClearSchool = () => {
    clearSchool();
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  if (!isDeveloper) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to access the School Switcher.</p>
      </div>
    );
  }

  if (loading && schools.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Switcher</h1>
          <p className="text-gray-500 mt-1">Switch between schools to view school-scoped data</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900">Failed to Load Schools</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <button onClick={loadSchools} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Switcher</h1>
          <p className="text-gray-500 mt-1">Switch between schools to view school-scoped data</p>
        </div>
        {currentSchool && (
          <button
            onClick={handleClearSchool}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Selection (Current: {currentSchool.name})
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schools.map(school => {
          const details = schoolDetails[school.id];
          const isSelected = currentSchool?.id === school.id;
          const isExpanded = expandedSchoolId === school.id;

          return (
            <div
              key={school.id}
              className={`bg-white rounded-xl border shadow-sm transition-all ${
                isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <span className="text-2xl">🏫</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{school.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">{school.code}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                {details?._count && (
                  <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{details._count.users}</p>
                      <p className="text-xs text-gray-500">Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{details._count.students}</p>
                      <p className="text-xs text-gray-500">Students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{details._count.academicYears}</p>
                      <p className="text-xs text-gray-500">Academic Years</p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    school.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  }`}>
                    {school.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-gray-500">TZ: {school.timezone}</span>
                </div>
              </div>

              <div className="px-6 pb-4 border-t border-gray-100">
                <button
                  onClick={() => handleToggleExpand(school.id)}
                  className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-700"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {isSelected ? "✓ Current School" : "Select School"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {schools.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏫</div>
          <h2 className="text-xl font-semibold text-gray-900">No Schools Found</h2>
          <p className="text-gray-500 mt-2">There are no schools in the system yet.</p>
        </div>
      )}
    </div>
  );
}