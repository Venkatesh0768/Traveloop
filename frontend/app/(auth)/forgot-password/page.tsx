"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { AuthCard, AuthHeader } from "@/components/layout/AuthCard";
import { authApi } from "@/lib/api/auth.api";
import { isAxiosError } from "axios";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setEmailError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError("Enter a valid email address"); return; }

    setEmailError(undefined);
    setApiError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSuccess("If an account exists with that email, you will receive a reset code shortly.");
    } catch {
      setApiError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center gap-5 py-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(42,103,107,0.1)] border border-[rgba(42,103,107,0.2)]">
            <Mail size={20} className="text-[#2a676b]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1b1c1c] font-sans mb-2">Check your inbox</h2>
            <p className="text-sm text-[#444748] font-sans leading-relaxed">{success}</p>
          </div>
          <Button
            fullWidth
            size="lg"
            onClick={() =>
              router.push(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`)
            }
          >
            Enter reset code
          </Button>
          <Link href="/login" className="text-sm text-[#747878] hover:text-[#1b1c1c] font-sans transition-colors">
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Reset your password"
        subtitle="Enter your email and we'll send you a verification code"
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Alert variant="error" message={apiError} />

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError(undefined); }}
          error={emailError}
          disabled={loading}
          autoFocus
        />

        <Button type="submit" loading={loading} fullWidth size="lg">
          {loading ? "Sending..." : "Send reset code"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#747878] font-sans">
        Remember your password?{" "}
        <Link href="/login" className="text-[#1b1c1c] font-semibold hover:text-[#2a676b] transition-colors">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
