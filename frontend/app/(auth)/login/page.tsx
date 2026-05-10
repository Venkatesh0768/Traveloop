"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import { AuthCard, AuthHeader } from "@/components/layout/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const { login, status } = useAuth();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [errors, setErrors]   = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(redirect);
  }, [status, redirect, router]);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError(null); setLoading(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      router.push(redirect);
    } catch (err) {
      if (isAxiosError(err)) {
        setApiError(err.response?.status === 403
          ? "Please verify your email before signing in."
          : (err.response?.data?.message ?? "Invalid email or password."));
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    } finally { setLoading(false); }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  return (
    <AuthCard>
      <AuthHeader title="Welcome back" subtitle="Sign in to your account to continue" />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Alert variant="error" message={apiError} />

        <Input label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set("email")} error={errors.email} disabled={loading} autoFocus />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors">
              Forgot password?
            </Link>
          </div>
          <Input type="password" autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={set("password")} error={errors.password} disabled={loading} />
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wide">or</span>
          </div>
        </div>

        {/* Google OAuth */}
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </a>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCard><div className="flex justify-center py-12"><div className="h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" /></div></AuthCard>}>
      <LoginForm />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9L37.1 9.6C33.7 6.5 29.1 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5c10.6 0 19.5-7.7 19.5-19.5 0-1.3-.1-2.6-.3-3.9z"/>
      <path fill="#FF3D00" d="M6.3 15.2l6.6 4.8C14.5 16.4 18.9 13 24 13c3 0 5.7 1.1 7.8 2.9L37.1 9.6C33.7 6.5 29.1 4.5 24 4.5c-7.4 0-13.7 4.1-17.1 10.2z"/>
      <path fill="#4CAF50" d="M24 45.5c5 0 9.5-1.9 12.9-5l-6-4.7C29.1 37.4 26.7 38 24 38c-5.2 0-9.6-3.2-11.2-7.8l-6.5 5C9.9 41.5 16.5 45.5 24 45.5z"/>
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.5l6 4.7c3.5-3.2 5.8-8 5.8-13.2 0-1.3-.1-2.6-.4-4z"/>
    </svg>
  );
}
