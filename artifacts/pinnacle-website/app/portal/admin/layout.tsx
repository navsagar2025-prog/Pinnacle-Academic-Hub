"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { LayoutDashboard, Users, GraduationCap, BookOpen, Bell, Settings, Menu, LogOut, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/admin", icon: LayoutDashboard },
  { label: "Students", href: "/portal/admin/students", icon: Users },
  { label: "Teachers", href: "/portal/admin/teachers", icon: UserCheck },
  { label: "Batches", href: "/portal/admin/batches", icon: BookOpen },
  { label: "Notices", href: "/portal/teacher/notices", icon: Bell },
];

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-slate-light)] flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn("fixed top-0 left-0 h-full w-64 bg-[var(--color-navy)] z-40 transition-transform duration-300 flex flex-col", sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-[var(--color-gold)] rounded-lg flex items-center justify-center">
            <GraduationCap size={18} className="text-[var(--color-navy)]" />
          </div>
          <div>
            <div className="text-white font-bold text-sm font-[family-name:var(--font-playfair)]">Pinnacle</div>
            <div className="text-[var(--color-gold)] text-xs font-medium">Admin Panel</div>
          </div>
        </div>
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm truncate">{user?.fullName ?? "Admin"}</div>
              <div className="text-white/40 text-xs">Administrator</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={cn("flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}>
                <Icon size={17} />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-white/10">
          <Link href="/" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <LogOut size={15} />Back to Website
          </Link>
        </div>
      </aside>
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <div className="lg:hidden flex items-center justify-between bg-[var(--color-navy)] px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-white/60 hover:bg-white/10"><Menu size={20} /></button>
          <div className="text-white font-bold text-sm font-[family-name:var(--font-playfair)]">Admin Panel</div>
          <UserButton afterSignOutUrl="/" />
        </div>
        <div className="flex-1 p-4 lg:p-8 max-w-7xl">{children}</div>
      </div>
    </div>
  );
}
