"use client";

import Link from "next/link";
import { Lock, Mail, RefreshCw, Shield, ShieldCheck, Users, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";

const features = [
  { icon: Lock,       title: "JWT + Refresh Tokens",    desc: "Access tokens in memory, HttpOnly refresh cookies, silent rotation." },
  { icon: Mail,       title: "OTP Email Verification",  desc: "6-digit codes via Gmail SMTP. Forgot password and reset flows included." },
  { icon: Zap,        title: "Google OAuth2",           desc: "Social login wired up. Session restores silently on page load." },
  { icon: Shield,     title: "Role-based Access",       desc: "ROLE_USER and ROLE_ADMIN. Middleware + page guards on every route." },
  { icon: Users,      title: "Admin Panel",             desc: "Paginated user directory, role assignment, enable/disable accounts." },
  { icon: RefreshCw,  title: "Token Rotation",          desc: "Refresh tokens rotate on every use. Expired tokens cleaned up nightly." },
];

export default function HomePage() {
  const { user, status } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700 mb-6">
          <ShieldCheck size={12} />
          Production-ready auth starter
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
          Authentication,{" "}
          <span className="text-indigo-600">done right.</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          A complete auth system with JWT, OTP verification, OAuth2, RBAC, and admin panel.
          Clone it and start building your product.
        </p>

        {status === "loading" ? (
          <div className="h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
        ) : user ? (
          <Link href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        ) : (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register"><Button size="lg">Get started free</Button></Link>
            <Link href="/login"><Button variant="secondary" size="lg">Sign in</Button></Link>
          </div>
        )}

        <p className="mt-5 text-xs text-gray-400">
          Spring Boot 4 · Next.js 16 · MySQL · Redis · Docker
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 mb-3">
                <Icon size={16} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white">
              <ShieldCheck size={12} />
            </div>
            <span className="text-sm font-bold text-gray-900">AuthKit</span>
          </div>
          <div className="flex gap-5">
            {[["Sign in", "/login"], ["Register", "/register"], ["Admin", "/admin"]].map(([label, href]) => (
              <Link key={href} href={href} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
