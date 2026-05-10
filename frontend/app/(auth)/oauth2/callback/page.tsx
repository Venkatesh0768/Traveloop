"use client";
import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { userApi } from "@/lib/api/auth.api";

function OAuth2CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useAuth(); // ensure provider is mounted

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.replace("/login?error=oauth_failed");
      return;
    }
    setAccessToken(token);
    userApi
      .getMe()
      .then(() => router.replace("/dashboard"))
      .catch(() => {
        setAccessToken(null);
        router.replace("/login?error=oauth_failed");
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#f5f3f3] flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-[#2a676b] border-t-transparent animate-spin" />
        <p className="text-sm text-[#747878] font-sans">Completing sign-in...</p>
      </div>
    </div>
  );
}

export default function OAuth2CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f3f3] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-[#2a676b] border-t-transparent animate-spin" />
        </div>
      }
    >
      <OAuth2CallbackContent />
    </Suspense>
  );
}
