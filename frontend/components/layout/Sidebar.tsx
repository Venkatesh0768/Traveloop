"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/utils/roles";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile",   label: "Settings",   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const admin = isAdmin(user);

  const items = [
    ...navItems,
    ...(admin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-200 bg-white min-h-[calc(100vh-3.5rem)]">
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} className={active ? "text-indigo-600" : "text-gray-400"} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
