"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock, Loader2, Shield, User, XCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/utils/roles";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?redirect=/dashboard");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  const admin = isAdmin(user);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-1">Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Account */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <User size={15} className="text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Account</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-3">{user?.email}</p>
          <div className="flex flex-wrap gap-1.5">
            {user?.roles.map((role) => (
              <Badge key={role} variant={role === "ROLE_ADMIN" ? "indigo" : "gray"}>
                {role.replace("ROLE_", "")}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Session */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Session</span>
          </div>
          <div className="space-y-2.5">
            <InfoRow label="Provider" value={<span className="capitalize">{user?.provider}</span>} />
            <InfoRow
              label="Email verified"
              value={
                user?.emailVerified
                  ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={13} /> Verified</span>
                  : <span className="flex items-center gap-1 text-red-500"><XCircle size={13} /> Unverified</span>
              }
            />
            <InfoRow
              label="Status"
              value={
                <span className={`flex items-center gap-1 ${user?.enabled ? "text-emerald-600" : "text-red-500"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${user?.enabled ? "bg-emerald-500" : "bg-red-500"}`} />
                  {user?.enabled ? "Active" : "Disabled"}
                </span>
              }
            />
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">Quick actions</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/profile">
            <Button variant="secondary" size="sm">
              <User size={13} />
              Account settings
              <ArrowRight size={13} />
            </Button>
          </Link>
          {admin && (
            <Link href="/admin">
              <Button size="sm">
                <Shield size={13} />
                Admin panel
                <ArrowRight size={13} />
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-700">{value}</span>
    </div>
  );
}
