"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { Lock, LogOut, Loader2, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { userApi } from "@/lib/api/auth.api";
import { initials } from "@/lib/utils/roles";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function ProfilePage() {
  const { user, status, refreshUser, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?redirect=/profile");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-1">Account</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your profile and security preferences.</p>
      </div>

      <ProfileSection user={user} refreshUser={refreshUser} />
      <SecuritySection user={user} logout={logout} router={router} />
      <SessionsSection logout={logout} router={router} />
    </div>
  );
}

/* ── Profile section ──────────────────────────────────────────────────────── */
function ProfileSection({ user, refreshUser }: { user: any; refreshUser: () => Promise<void> }) {
  const [form, setForm] = useState({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setSuccess(null); setError(null); setLoading(true);
    try {
      await userApi.updateProfile({ firstName: form.firstName.trim(), lastName: form.lastName.trim() });
      await refreshUser();
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to update.") : "Failed to update.");
    } finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader icon={<User size={16} />} title="Profile" description="Update your display name" />

      {/* Avatar row */}
      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-lg font-bold shrink-0">
          {initials(user)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
          <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.provider} account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert variant="success" message={success} />
        <Alert variant="error" message={error} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} disabled={loading} />
          <Input label="Last name"  value={form.lastName}  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}  disabled={loading} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={loading}>Save changes</Button>
        </div>
      </form>
    </Card>
  );
}

/* ── Security section ─────────────────────────────────────────────────────── */
function SecuritySection({ user, logout, router }: { user: any; logout: () => Promise<void>; router: any }) {
  const [form, setForm]       = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [errors, setErrors]   = useState<Partial<typeof form>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Partial<typeof form> = {};
    if (!form.currentPassword) errs.currentPassword = "Required";
    if (!form.newPassword) errs.newPassword = "Required";
    else if (form.newPassword.length < 8) errs.newPassword = "Min. 8 characters";
    if (form.newPassword !== form.confirm) errs.confirm = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSuccess(null); setError(null); setLoading(true);
    try {
      await userApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      await logout();
      router.push("/login");
    } catch (err) {
      setError(isAxiosError(err) ? (err.response?.data?.message ?? "Failed to change password.") : "Failed.");
    } finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader icon={<Lock size={16} />} title="Security" description="Change your password" />

      {user?.provider !== "local" ? (
        <Alert variant="info" message={`You signed in with ${user?.provider}. Password management is handled by your OAuth provider.`} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert variant="success" message={success} />
          <Alert variant="error" message={error} />
          <Input label="Current password" type="password" placeholder="••••••••" value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} error={errors.currentPassword} disabled={loading} />
          <Input label="New password" type="password" placeholder="Min. 8 characters" value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} error={errors.newPassword} disabled={loading} />
          <Input label="Confirm new password" type="password" placeholder="Repeat new password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} error={errors.confirm} disabled={loading} />
          <Alert variant="warning" message="Changing your password will sign you out of all devices." />
          <div className="flex justify-end">
            <Button type="submit" variant="danger" size="sm" loading={loading}>Change password</Button>
          </div>
        </form>
      )}
    </Card>
  );
}

/* ── Sessions section ─────────────────────────────────────────────────────── */
function SessionsSection({ logout, router }: { logout: () => Promise<void>; router: any }) {
  const [loading, setLoading] = useState(false);

  const handleLogoutAll = async () => {
    if (!confirm("Sign out of all devices?")) return;
    setLoading(true);
    try { await userApi.logoutAllDevices(); await logout(); router.push("/login"); }
    catch { await logout(); router.push("/login"); }
    finally { setLoading(false); }
  };

  return (
    <Card className="border-red-200">
      <CardHeader icon={<LogOut size={16} />} title="Sessions" description="Revoke all active sessions" />
      <p className="text-sm text-gray-600 mb-4">
        Sign out from all devices including this one. You will need to sign in again.
      </p>
      <Button variant="danger" size="sm" onClick={handleLogoutAll} loading={loading}>
        <LogOut size={13} />
        Sign out all devices
      </Button>
    </Card>
  );
}
