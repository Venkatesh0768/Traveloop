"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Legacy route — redirects to the canonical public trip URL.
 * Old links: /shared/{token}  →  New: /public/trips/{token}
 */
export default function SharedTripRedirect() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const router = useRouter();

  useEffect(() => {
    if (shareToken) {
      router.replace(`/public/trips/${shareToken}`);
    }
  }, [shareToken, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
    </div>
  );
}
