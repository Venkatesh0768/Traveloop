"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Shield, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/utils/roles";
import { adminApi, PageResponse } from "@/lib/api/admin.api";
import { Navbar } from "@/components/layout/Navbar";
import { UserTable } from "@/components/admin/UserTable";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { User } from "@/types/auth.types";

export default function AdminPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  const [pageData, setPageData] = useState<PageResponse<User> | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [page, setPage]         = useState(0);

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true); setError(null);
    try { setPageData((await adminApi.getAllUsers(p, 10)).data); }
    catch { setError("Failed to load users."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      if (!isAdmin(user)) { router.replace("/dashboard"); return; }
      fetchUsers(page);
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, user, page, fetchUsers, router]);

  if (status === "loading" || (loading && !pageData)) {
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Panel</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage users, assign roles, and control access.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => fetchUsers(page)} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {error && <Alert variant="error" message={error} />}

        {/* Stat */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Users size={15} className="text-gray-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Users</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{pageData?.totalElements ?? 0}</p>
          </Card>
        </div>

        {/* Table */}
        <Card padding={false}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">User Directory</h2>
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
      </div>
    </div>
  );
}
