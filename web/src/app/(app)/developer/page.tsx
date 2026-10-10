"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSchool } from "@/lib/school-context";
import { apiFetch, ApiError, extractItems } from "@/lib/api";

interface DeveloperDashboardData {
  schools: {
    total: number;
    active: number;
    byYear: { year: string; count: number }[];
  };
  students: {
    total: number;
    active: number;
    bySchool: { schoolId: string; schoolName: string; count: number }[];
  };
  fees: {
    totalCollected: number;
    totalOutstanding: number;
    byMonth: { month: string; collected: number; outstanding: number }[];
    byType: { type: string; collected: number }[];
  };
  users: {
    total: number;
    byRole: { role: string; count: number }[];
  };
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
  trend?: { value: number; label: string };
}

function KPICard({ title, value, subtitle, icon, color, trend }: KPICardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium ${trend.value >= 0 ? "text-green-600" : "text-red-600"}`}>
                {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

function SimpleBarChart({ data, color = "bg-blue-500", height = 200 }: { data: ChartDataPoint[]; color?: string; height?: number }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[320px]">
      <div className="h-full flex items-end justify-between gap-2">
        {data.map((point, index) => (
          <div key={index} className="flex-1 flex flex-col items-center justify-end min-w-0">
            <div
              className={`${color} rounded-t transition-all duration-300 hover:opacity-80 w-full max-w-[40px]`}
              style={{ height: `${(point.value / maxValue) * (height - 40)}px` }}
              title={`${point.label}: ${point.value}`}
            />
            <span className="text-xs text-gray-500 mt-2 text-center w-20 truncate">{point.label}</span>
            <span className="text-xs font-medium text-gray-900">{point.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleLineChart({ data, color = "text-blue-600", height = 200 }: { data: ChartDataPoint[]; color?: string; height?: number }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const points = data.map((point, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - (point.value / maxValue) * 100,
    label: point.label,
    value: point.value,
  }));

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[320px] relative">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color.replace("text-", "").replace("-600", "")} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color.replace("text-", "").replace("-600", "")} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area */}
        <path
          d={[
            `M${points[0].x},100`,
            ...points.map(p => `L${p.x},${p.y}`),
            `L${points[points.length - 1].x},100`,
            "Z"
          ].join(" ")}
          fill="url(#lineGradient)"
        />
        {/* Line */}
        <path
          d={["M", ...points.map(p => `${p.x},${p.y}`)].join(" ")}
          stroke={color.replace("text-", "").replace("-600", "-500")}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={color.replace("text-", "").replace("-600", "-500")}
          />
        ))}
      </svg>
      <div className="flex justify-between items-end h-full pt-4">
        {data.map((point, index) => (
          <div key={index} className="flex-1 text-center">
            <span className="text-xs text-gray-500">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimplePieChart({ data, colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"] }: { data: { label: string; value: number }[]; colors?: string[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[320px]">
      <div className="flex h-full items-center justify-between">
        <div className="relative w-[200px] h-[200px] flex-shrink-0">
          <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
            {data.map((point, index) => {
              const percentage = total > 0 ? point.value / total : 0;
              const angle = percentage * 360;
              const radians = (angle * Math.PI) / 180;
              const startRadians = (cumulative * Math.PI) / 180;

              const x1 = 100 + 80 * Math.cos(startRadians);
              const y1 = 100 + 80 * Math.sin(startRadians);
              const x2 = 100 + 80 * Math.cos(startRadians + radians);
              const y2 = 100 + 80 * Math.sin(startRadians + radians);

              const largeArcFlag = angle > 180 ? 1 : 0;

              cumulative += angle;

              return (
                <path
                  key={index}
                  d={`M100,100 L${x1},${y1} A80,80 0 ${largeArcFlag},1 ${x2},${y2} Z`}
                  fill={colors[index % colors.length]}
                />
              );
            })}
            <circle cx="100" cy="100" r="50" fill="white" />
          </svg>
        </div>
        <div className="flex-1 ml-6">
          {data.map((point, index) => (
            <div key={index} className="flex items-center gap-3 mb-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="text-sm font-medium text-gray-900">{point.label}</span>
              <span className="text-sm text-gray-500 ml-auto">
                {point.value} ({(total > 0 ? (point.value / total * 100).toFixed(1) : 0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DeveloperDashboardPage() {
  const { user } = useAuth();
  const { currentSchool, schools, loading: schoolLoading, switchSchool } = useSchool();
  const [data, setData] = useState<DeveloperDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(currentSchool?.id ?? null);

  // Check if user is Developer
  const isDeveloper = user?.roles.includes("Developer") ?? false;

  if (!isDeveloper) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to access the Developer Dashboard.</p>
      </div>
    );
  }

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const schoolId = selectedSchoolId || currentSchool?.id;
      const params = schoolId ? `?schoolId=${schoolId}` : "";
      const res = await apiFetch<{ data: DeveloperDashboardData }>(`/developer/dashboard${params}`);
      setData(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchDashboard();
  }, [selectedSchoolId, currentSchool?.id]);

  const handleSchoolChange = async (schoolId: string) => {
    try {
      await switchSchool(schoolId);
      setSelectedSchoolId(schoolId);
    } catch (err) {
      console.error("Failed to switch school:", err);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
            <p className="text-gray-500 mt-1">System-wide metrics and analytics</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
        <h2 className="text-xl font-semibold text-gray-900">Failed to Load Dashboard</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <button onClick={fetchDashboard} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with School Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Developer Dashboard</h1>
          <p className="text-gray-500 mt-1">System-wide metrics and analytics</p>
        </div>
        <div className="flex items-center gap-4">
          {schools.length > 1 && (
            <div className="hidden md:flex items-center gap-2">
              <label className="text-sm text-gray-700">School:</label>
              <select
                value={selectedSchoolId || ""}
                onChange={(e) => handleSchoolChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Schools (Global View)</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Schools"
            value={data.schools.total}
            subtitle={`${data.schools.active} active`}
            icon="🏫"
            color="bg-blue-100 text-blue-600"
            trend={{ value: 5, label: "vs last month" }}
          />
          <KPICard
            title="Total Students"
            value={data.students.total.toLocaleString()}
            subtitle={`${data.students.active} active`}
            icon="🎓"
            color="bg-green-100 text-green-600"
            trend={{ value: 12, label: "vs last month" }}
          />
          <KPICard
            title="Fees Collected"
            value={`₹${(data.fees.totalCollected / 100000).toFixed(1)}L`}
            subtitle="This Year"
            icon="💰"
            color="bg-yellow-100 text-yellow-600"
            trend={{ value: 18, label: "vs last year" }}
          />
          <KPICard
            title="Outstanding"
            value={`₹${(data.fees.totalOutstanding / 100000).toFixed(1)}L`}
            subtitle="Pending Collection"
            icon="⏳"
            color="bg-red-100 text-red-600"
            trend={{ value: -8, label: "vs last month" }}
          />
        </div>
      )}

      {/* Charts Row 1 */}
      {data && (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schools by Academic Year</h3>
            <SimpleBarChart
              data={data.schools.byYear.map(d => ({ label: d.year, value: d.count }))}
              color="bg-blue-500"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Students per School</h3>
            <SimpleBarChart
              data={data.students.bySchool.slice(0, 10).map(d => ({ label: d.schoolName.length > 15 ? d.schoolName.slice(0, 15) + "..." : d.schoolName, value: d.count }))}
              color="bg-green-500"
            />
          </div>
        </div>
      )}

      {/* Charts Row 2 */}
      {data && (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Collection Trend (Last 12 Months)</h3>
            <SimpleLineChart
              data={data.fees.byMonth.map(d => ({ label: d.month, value: d.collected }))}
              color="text-blue-600"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fees by Type</h3>
            <SimplePieChart
              data={data.fees.byType.map(d => ({ label: d.type, value: d.collected }))}
            />
          </div>
        </div>
      )}

      {/* Charts Row 3 */}
      {data && (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
            <SimplePieChart
              data={data.users.byRole.map(d => ({ label: d.role, value: d.count }))}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Outstanding Trend</h3>
            <SimpleLineChart
              data={data.fees.byMonth.map(d => ({ label: d.month, value: d.outstanding }))}
              color="text-red-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}