"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  Shield,
  Users,
  Map,
  Activity,
  DollarSign,
  Share2,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/utils/roles";
import { adminApi, PageResponse } from "@/lib/api/admin.api";
import { Navbar } from "@/components/layout/Navbar";
import { UserTable } from "@/components/admin/UserTable";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { User } from "@/types/auth.types";
import type { AdminDashboard, PopularCity, UserActivity } from "@/types/trip.types";
import { formatCurrency } from "@/components/trips/TripHelpers";

type AdminTab = "overview" | "users" | "cities" | "activity";

export default function AdminPage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  const [pageData, setPageData] = useState<PageResponse<User> | null>(null);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [popularCities, setPopularCities] = useState<PopularCity[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetchUsers = useCallback(async (p: number) => {
    try {
      const res = await adminApi.getAllUsers(p, 10);
      setPageData(res.data);
    } catch {
      setError("Failed to load users.");
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [dashRes, citiesRes, usersRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getPopularCities(),
        adminApi.getActiveUsers(),
      ]);
      setDashboard(dashRes.data);
      setPopularCities(citiesRes.data);
      setActiveUsers(usersRes.data);
    } catch {
      // Analytics may not be critical
    }
  }, []);

  const loadAll = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchUsers(p), fetchAnalytics()]);
    setLoading(false);
  }, [fetchUsers, fetchAnalytics]);

  useEffect(() => {
    if (status === "authenticated") {
      if (!isAdmin(user)) { router.replace("/dashboard"); return; }
      loadAll(page);
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, user, page, loadAll, router]);

  if (status === "loading" || (loading && !pageData && !dashboard)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (!isAdmin(user)) return null;

  const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={15} /> },
    { id: "users", label: "Manage Users", icon: <Users size={15} /> },
    { id: "cities", label: "Popular Cities", icon: <Map size={15} /> },
    { id: "activity", label: "User Activity", icon: <Activity size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Shield size={13} className="text-indigo-600" />
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Administration</p>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Platform analytics, user management, and insights.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => loadAll(page)} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {error && <Alert variant="error" message={error} />}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard icon={<Users size={18} className="text-indigo-600" />} label="Total Users" value={dashboard?.totalUsers ?? pageData?.totalElements ?? 0} bg="bg-indigo-50" />
              <StatCard icon={<Map size={18} className="text-emerald-600" />} label="Total Trips" value={dashboard?.totalTrips ?? 0} bg="bg-emerald-50" />
              <StatCard icon={<Activity size={18} className="text-orange-600" />} label="Activities" value={dashboard?.totalActivities ?? 0} bg="bg-orange-50" />
              <StatCard icon={<DollarSign size={18} className="text-red-600" />} label="Expenses" value={dashboard?.totalExpenses ?? 0} bg="bg-red-50" />
              <StatCard icon={<Share2 size={18} className="text-purple-600" />} label="Shared Trips" value={dashboard?.totalSharedTrips ?? 0} bg="bg-purple-50" />
              {dashboard?.totalRevenueTracked != null && (
                <Card>
                  <div className={`inline-flex p-2 rounded-lg bg-amber-50 mb-3`}>
                    <TrendingUp size={18} className="text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(Number(dashboard.totalRevenueTracked))}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Revenue Tracked</p>
                </Card>
              )}
            </div>

            {/* Popular cities preview */}
            {popularCities.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Destinations</h3>
                <div className="space-y-3">
                  {popularCities.slice(0, 5).map((city, idx) => {
                    const max = popularCities[0]?.totalTrips ?? 1;
                    const pct = (Number(city.totalTrips) / Number(max)) * 100;
                    return (
                      <div key={city.cityName}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}</span>
                            <span className="text-sm font-medium text-gray-900">{city.cityName}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{city.totalTrips} trips</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Users tab */}
        {activeTab === "users" && (
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">User Directory</h2>
              <span className="text-xs text-gray-500">{pageData?.totalElements ?? 0} total users</span>
            </div>
            <div className="p-6">
              <UserTable users={pageData?.content ?? []} onRefresh={() => fetchUsers(page)} />
              {pageData && pageData.totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-5">
                  <p className="text-sm text-gray-500">
                    Page <span className="font-medium text-gray-900">{pageData.number + 1}</span>
                    {" "}of <span className="font-medium text-gray-900">{pageData.totalPages}</span>
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" disabled={pageData.number === 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                      Previous
                    </Button>
                    <Button variant="secondary" size="sm" disabled={pageData.number >= pageData.totalPages - 1 || loading} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Popular cities tab */}
        {activeTab === "cities" && (
          <Card>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Popular Cities</h2>
            {popularCities.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No city data available yet.</p>
            ) : (
              <div className="space-y-3">
                {popularCities.map((city, idx) => {
                  const max = popularCities[0]?.totalTrips ?? 1;
                  const pct = (Number(city.totalTrips) / Number(max)) * 100;
                  return (
                    <div key={city.cityName} className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-400 w-6 shrink-0">{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{city.cityName}</span>
                          <span className="text-sm font-semibold text-gray-700">{city.totalTrips} trips</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* User activity tab */}
        {activeTab === "activity" && (
          <Card>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Most Active Users</h2>
            {activeUsers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No activity data available yet.</p>
            ) : (
              <div className="space-y-2">
                {activeUsers.map((u, idx) => (
                  <div key={u.userEmail} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                    <span className="text-sm font-bold text-gray-400 w-6 shrink-0">{idx + 1}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
                      {u.userEmail[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.userEmail}</p>
                    </div>
                    <span className="text-sm font-semibold text-indigo-600 shrink-0">{u.totalTrips} trips</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <Card>
      <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </Card>
  );
}
