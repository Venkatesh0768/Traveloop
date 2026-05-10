"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api/auth.api";
import { AuthCard, AuthHeader } from "@/components/layout/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useAuth();

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors]   = useState<Partial<typeof form>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim())  e.lastName  = "Required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "At least 8 characters";
    if (!form.confirm) e.confirm = "Please confirm your password";
    else if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError(null); setLoading(true);
    try {
      await authApi.signup({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim().toLowerCase(), password: form.password });
      router.push(`/verify-otp?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
    } catch (err) {
      setApiError(isAxiosError(err) ? (err.response?.data?.message ?? "Registration failed.") : "Something went wrong.");
    } finally { setLoading(false); }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  return (
    <AuthCard>
      <AuthHeader title="Create an account" subtitle="Get started — it only takes a minute" />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Alert variant="error" message={apiError} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" placeholder="Jane" value={form.firstName} onChange={set("firstName")} error={errors.firstName} disabled={loading} autoFocus />
          <Input label="Last name"  placeholder="Doe"  value={form.lastName}  onChange={set("lastName")}  error={errors.lastName}  disabled={loading} />
        </div>

        <Input label="Email address" type="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} disabled={loading} />
        <Input label="Password" type="password" placeholder="Min. 8 characters" autoComplete="new-password" value={form.password} onChange={set("password")} error={errors.password} disabled={loading} />
        <Input label="Confirm password" type="password" placeholder="Repeat password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} disabled={loading} />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
