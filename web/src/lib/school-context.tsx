"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { apiFetch, ApiError } from "./api";

interface School {
  id: string;
  name: string;
  code: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SchoolContextType {
  schools: School[];
  currentSchool: School | null;
  loading: boolean;
  error: string | null;
  fetchSchools: () => Promise<void>;
  switchSchool: (schoolId: string) => Promise<void>;
  clearSchool: () => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const DEFAULT_SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "demo";

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [schools, setSchools] = useState<School[]>([]);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // First try to get all schools (for Developer role)
      try {
        const res = await apiFetch<{ data: { items: School[] } }>("/developer/schools");
        setSchools(res.data.items);
      } catch {
        // Fallback: if not a developer, try to get current school
        try {
          const res = await apiFetch<{ data: School }>("/developer/current-school");
          setSchools([res.data]);
          setCurrentSchool(res.data);
        } catch {
          setError("Failed to fetch schools");
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch schools");
    } finally {
      setLoading(false);
    }
  }, []);

  const switchSchool = useCallback(async (schoolId: string) => {
    try {
      setError(null);
      const school = schools.find(s => s.id === schoolId);
      if (!school) throw new Error("School not found");
      setCurrentSchool(school);
      // Store in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedSchoolId", schoolId);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to switch school");
      throw err;
    }
  }, [schools]);

  const clearSchool = useCallback(() => {
    setCurrentSchool(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedSchoolId");
    }
  }, []);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSchoolId = localStorage.getItem("selectedSchoolId");
      if (storedSchoolId) {
        fetchSchools().then(() => {
          const school = schools.find(s => s.id === storedSchoolId);
          if (school) setCurrentSchool(school);
        });
      } else {
        fetchSchools();
      }
    }
  }, []);

  // When schools are loaded, try to restore from localStorage
  useEffect(() => {
    if (schools.length > 0 && !currentSchool && typeof window !== "undefined") {
      const storedSchoolId = localStorage.getItem("selectedSchoolId");
      if (storedSchoolId) {
        const school = schools.find(s => s.id === storedSchoolId);
        if (school) setCurrentSchool(school);
      }
    }
  }, [schools, currentSchool]);

  return (
    <SchoolContext.Provider value={{ schools, currentSchool, loading, error, fetchSchools, switchSchool, clearSchool }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) throw new Error("useSchool must be used within a SchoolProvider");
  return context;
}

export function useCurrentSchoolId(): string {
  const { currentSchool } = useSchool();
  // Return current school ID, or fall back to default
  return currentSchool?.id ?? DEFAULT_SCHOOL_ID;
}