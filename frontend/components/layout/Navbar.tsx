"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, Shield, ShieldCheck, User, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { displayName, initials, isAdmin } from "@/lib/utils/roles";

export function Navbar() {
  const { user, logout, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const admin = isAdmin(user);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); router.push("/"); }
    finally { setLoggingOut(false); setMobileOpen(false); }
  };

  const navLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/profile", label: "Profile" },
        ...(admin ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white group-hover:bg-indigo-700 transition-colors">
              <ShieldCheck size={14} />
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight">AuthKit</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <NavLink key={href} href={href} active={pathname === href || pathname.startsWith(href + "/")}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {status === "loading" ? (
              <div className="h-4 w-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            ) : user ? (
              <div className="relative group">
                <button
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 transition-colors"
                  aria-label="Account menu"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                    {initials(user)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {displayName(user)}
                  </span>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName(user)}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <DropdownLink href="/profile" icon={<User size={14} />}>Account settings</DropdownLink>
                    {admin && <DropdownLink href="/admin" icon={<Shield size={14} />}>Admin panel</DropdownLink>}
                  </div>
                  <div className="border-t border-gray-100 p-1">
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <LogOut size={14} />
                      {loggingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors">
                  Sign in
                </Link>
                <Link href="/register" className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg transition-colors">
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pb-4 pt-2">
          {user && (
            <div className="flex items-center gap-3 py-3 mb-2 border-b border-gray-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
                {initials(user)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName(user)}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <div className="space-y-0.5">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
              >
                <LogOut size={14} />
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Sign in</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {children}
    </Link>
  );
}

function DropdownLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      {children}
    </Link>
  );
}
