"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { useRouter } from "next/navigation";

interface School {
  id: string;
  name: string;
  code: string;
}

export default function SchoolOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: School Profile
  const [schoolForm, setSchoolForm] = useState({
    name: "",
    code: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    timezone: "UTC",
  });

  // Step 2: Initial User
  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "Principal" as "Principal" | "Admin",
    tempPassword: "",
    sendInvite: true,
  });

  const isDeveloper = user?.roles.includes("Developer") ?? false;

  if (!isDeveloper) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to onboard schools.</p>
      </div>
    );
  }

  const validateStep1 = () => {
    if (!schoolForm.name.trim()) return "School name is required";
    if (!schoolForm.code.trim()) return "School code is required";
    if (!schoolForm.contactEmail.trim()) return "Contact email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolForm.contactEmail)) return "Invalid email format";
    return null;
  };

  const validateStep2 = () => {
    if (!userForm.firstName.trim()) return "First name is required";
    if (!userForm.lastName.trim()) return "Last name is required";
    if (!userForm.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) return "Invalid email format";
    return null;
  };

  const checkUniqueness = async (skipEmailCheck = false) => {
    try {
      const params = new URLSearchParams({
        name: schoolForm.name,
        code: schoolForm.code,
      });
      if (!skipEmailCheck && userForm.email) {
        params.append("email", userForm.email);
      }
      const res = await apiFetch<{ data: { nameExists: boolean; codeExists: boolean; emailExists: boolean } }>(
        `/developer/schools/check-uniqueness?${params}`
      );
      if (res.data.nameExists) setError("School name already exists");
      else if (res.data.codeExists) setError("School code already exists");
      else if (!skipEmailCheck && res.data.emailExists) setError("Email already registered");
      else {
        setError("");
        setStep(2);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to check uniqueness");
    }
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    // Only check school name and code uniqueness at this step (email is in step 2)
    checkUniqueness(true);
  };

  const handleBack = () => {
    setStep(1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) {
      setError(err);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await apiFetch("/developer/schools/onboard", {
        method: "POST",
        body: JSON.stringify({
          school: {
            name: schoolForm.name,
            code: schoolForm.code.toUpperCase(),
            address: schoolForm.address || undefined,
            contactEmail: schoolForm.contactEmail,
            contactPhone: schoolForm.contactPhone || undefined,
            timezone: schoolForm.timezone,
          },
          initialUser: {
            firstName: userForm.firstName,
            lastName: userForm.lastName,
            email: userForm.email,
            role: userForm.role,
            tempPassword: userForm.tempPassword || undefined,
            sendInvite: userForm.sendInvite,
          },
        }),
      });

      setSuccess("School onboarded successfully! Redirecting...");
      setTimeout(() => router.push("/developer/schools"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to onboard school");
    } finally {
      setLoading(false);
    }
  };

  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Asia/Kolkata",
    "Australia/Sydney",
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Onboarding</h1>
          <p className="text-gray-500 mt-1">Add a new school to the platform</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center">
          <div className={`flex items-center ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium ${step >= 1 ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-400"}`}>
              1
            </div>
            <span className="ml-2 font-medium">School Profile</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200 relative">
            <div className={`h-full absolute top-0 rounded ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} style={{ width: step >= 2 ? "100%" : "0%" }} />
          </div>
          <div className={`flex items-center ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium ${step >= 2 ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-400"}`}>
              2
            </div>
            <span className="ml-2 font-medium">Initial User</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg" role="alert">
          {success}
        </div>
      )}

      {/* Step 1: School Profile */}
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">School Profile</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
              <input
                type="text"
                value={schoolForm.name}
                onChange={(e) => setSchoolForm(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Code *</label>
              <input
                type="text"
                value={schoolForm.code}
                onChange={(e) => setSchoolForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                required
                maxLength={10}
                placeholder="e.g., DEMO"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">2-10 characters, will be converted to uppercase</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
              <input
                type="email"
                value={schoolForm.contactEmail}
                onChange={(e) => setSchoolForm(prev => ({ ...prev, contactEmail: e.target.value.toLowerCase() }))}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={schoolForm.contactPhone}
                onChange={(e) => setSchoolForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={schoolForm.address}
                onChange={(e) => setSchoolForm(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone *</label>
              <select
                value={schoolForm.timezone}
                onChange={(e) => setSchoolForm(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Next: Initial User
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Initial User */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Initial User</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-800 mb-2">School Preview</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div><strong>Name:</strong> {schoolForm.name}</div>
              <div><strong>Code:</strong> {schoolForm.code.toUpperCase()}</div>
              <div><strong>Email:</strong> {schoolForm.contactEmail}</div>
              <div><strong>Timezone:</strong> {schoolForm.timezone}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={userForm.firstName}
                onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={userForm.lastName}
                onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as "Principal" | "Admin" }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Principal">Principal</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password (optional)</label>
              <input
                type="password"
                value={userForm.tempPassword}
                onChange={(e) => setUserForm(prev => ({ ...prev, tempPassword: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank to auto-generate a secure password</p>
            </div>
            <div className="md:col-span-2 flex items-center">
              <input
                type="checkbox"
                id="sendInvite"
                checked={userForm.sendInvite}
                onChange={(e) => setUserForm(prev => ({ ...prev, sendInvite: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="sendInvite" className="ml-2 text-sm text-gray-700">Send invitation email with credentials</label>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Creating School..." : "Create School"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}