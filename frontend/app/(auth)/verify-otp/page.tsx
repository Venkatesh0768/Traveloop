"use client";
import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { AuthCard, AuthHeader } from "@/components/layout/AuthCard";
import { authApi } from "@/lib/api/auth.api";
import { isAxiosError } from "axios";

const RESEND_SECONDS = 60;

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = useCallback(async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.verifyOtp({ email, otp });
      setSuccess("Email verified! Redirecting to sign in...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Invalid or expired code.");
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [otp, email, router]);

  useEffect(() => {
    if (otp.length === 6) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleResend = async () => {
    setResendLoading(true);
    setError(null);
    try {
      await authApi.resendOtp(email);
      setSuccess("A new code has been sent to your email.");
      setCountdown(RESEND_SECONDS);
      setOtp("");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Failed to resend code.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return (
      <AuthCard>
        <Alert variant="error" message="No email provided. Please register first." />
        <Button className="mt-4" fullWidth onClick={() => router.push("/register")}>
          Back to register
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Verify your email"
        subtitle={`We sent a 6-digit code to ${email}`}
      />

      <div className="flex flex-col gap-6">
        <Alert variant="success" message={success} />
        <Alert variant="error" message={error} />

        <div className="flex justify-center py-2">
          <OtpInput
            value={otp}
            onChange={(v) => {
              setOtp(v);
              setError(null);
            }}
            error={!!error}
          />
        </div>

        <Button
          onClick={handleVerify}
          loading={loading}
          fullWidth
          size="lg"
          disabled={otp.length < 6}
        >
          {loading ? "Verifying..." : "Verify code"}
        </Button>

        <div className="text-center text-sm text-[#747878] font-sans">
          {countdown > 0 ? (
            <span>
              Resend code in{" "}
              <span className="text-[#1b1c1c] font-medium tabular-nums">{countdown}s</span>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-[#1b1c1c] font-medium hover:text-[#2a676b] transition-colors disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend code"}
            </button>
          )}
        </div>
      </div>
    </AuthCard>
  );
}

export default function VerifyOtpPage() {
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
      <VerifyOtpContent />
    </Suspense>
  );
}
