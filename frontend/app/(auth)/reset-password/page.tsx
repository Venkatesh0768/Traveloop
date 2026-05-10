"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OtpInput } from "@/components/auth/OtpInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { AuthCard, AuthHeader } from "@/components/layout/AuthCard";
import { authApi } from "@/lib/api/auth.api";
import { isAxiosError } from "axios";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ otp?: string; newPassword?: string; confirm?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (otp.length !== 6) e.otp = "Please enter the complete 6-digit code";
    if (!newPassword) e.newPassword = "New password is required";
    else if (newPassword.length < 8) e.newPassword = "At least 8 characters";
    if (!confirm) e.confirm = "Please confirm the new password";
    else if (confirm !== newPassword) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError(null);
    setLoading(true);
    try {
      await authApi.resetPassword({ email: emailParam, otp, newPassword });
      router.push("/login?reset=1");
    } catch (err) {
      if (isAxiosError(err)) {
        setApiError(err.response?.data?.message ?? "Reset failed. Check your code and try again.");
      } else {
        setApiError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Set new password"
        subtitle={emailParam ? `For ${emailParam}` : "Enter your verification code and new password"}
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Alert variant="error" message={apiError} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1b1c1c] font-sans">
            Verification code
          </label>
          <OtpInput value={otp} onChange={setOtp} error={!!errors.otp} />
          {errors.otp && (
            <p className="text-xs text-[#ba1a1a] font-sans">⚠ {errors.otp}</p>
          )}
        </div>

        <Input
          label="New password"
          type="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setErrors((er) => ({ ...er, newPassword: undefined })); }}
          error={errors.newPassword}
          disabled={loading}
        />

        <Input
          label="Confirm new password"
          type="password"
          placeholder="Repeat new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setErrors((er) => ({ ...er, confirm: undefined })); }}
          error={errors.confirm}
          disabled={loading}
        />

        <Button type="submit" loading={loading} fullWidth size="lg">
          {loading ? "Resetting..." : "Reset password"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-[#747878] font-sans">
        <Link href="/forgot-password" className="text-[#1b1c1c] hover:text-[#2a676b] transition-colors">
          ← Resend code
        </Link>
      </p>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCard>
          <div className="flex justify-center items-center h-48">
            <div className="h-6 w-6 rounded-full border-2 border-[#2a676b] border-t-transparent animate-spin" />
          </div>
        </AuthCard>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
