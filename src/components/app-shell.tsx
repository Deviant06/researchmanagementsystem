"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { SafeUser } from "@/lib/types";
import { LogoutButton } from "@/components/logout-button";
import { RealtimeNotifications } from "@/components/realtime-notifications";

interface AppShellProps {
  user: SafeUser;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems =
    user.role === "ADMIN"
      ? [
          { href: "/dashboard", label: "Overview" },
          { href: "/admin", label: "Management" }
        ]
      : [
          { href: "/dashboard", label: "Overview" },
          { href: "/student", label: "Workspace" }
        ];

  return (
    <div className="app-shell">
      <aside className={cn("sidebar", menuOpen && "sidebar-open")}>
        <div className="brand-block">
          <p className="eyebrow">Research Suite</p>
          <h1>{APP_NAME}</h1>
          <p className="brand-copy">
            {user.role === "ADMIN"
              ? "Monitor groups, approvals, and revision bottlenecks."
              : "Stay on track with submissions, tasks, and feedback."}
          </p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              className={cn(
                "nav-link",
                pathname === item.href && "nav-link-active"
              )}
              href={item.href}
              key={item.href}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <strong>{user.name}</strong>
            <span>{user.role === "ADMIN" ? "Teacher Admin" : "Student User"}</span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="main-shell">
        <RealtimeNotifications userId={user.id} />
        <header className="topbar">
          <button
            className="button button-ghost mobile-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
          <div>
            <p className="eyebrow">Logged in as</p>
            <strong>{user.email}</strong>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
