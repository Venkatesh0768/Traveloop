"use client";
import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setAccessToken } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api/auth.api";

function OAuth2CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error || !token) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    // 1. Store the access token in memory
    setAccessToken(token);

    // 2. Fetch the user profile to populate AuthContext
    refreshUser()
      .then(() => router.replace("/dashboard"))
      .catch(() => {
        setAccessToken(null);
        router.replace("/login?error=oauth_failed");
      });
  }, [router, searchParams, refreshUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-gray-500">Completing sign-in…</p>
      </div>
    </div>
  );
}

export default function OAuth2CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <OAuth2CallbackContent />
    </Suspense>
  );
}
