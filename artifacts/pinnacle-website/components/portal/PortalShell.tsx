"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Menu,
  GraduationCap,
  LogOut,
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  TrendingUp,
  CreditCard,
  FileBarChart,
  Search,
  Bot,
  Video,
  Trophy,
  FileText,
  Users2,
  Settings,
  ShieldCheck,
  ClipboardList,
  Calendar,
  Bell,
  Layers,
  CheckSquare,
  Radio,
  UserCheck,
  Images,
  ScrollText,
  Sparkles,
  MessageCircleQuestion,
  History,
  Library,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  MessageSquare,
  TrendingUp,
  CreditCard,
  FileBarChart,
  Search,
  Bot,
  Video,
  Trophy,
  FileText,
  Users2,
  Settings,
  ShieldCheck,
  ClipboardList,
  Calendar,
  Bell,
  Layers,
  CheckSquare,
  Radio,
  UserCheck,
  Images,
  ScrollText,
  Sparkles,
  MessageCircleQuestion,
  History,
  Library,
};

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  divider?: boolean;
}

interface PortalShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  portalLabel: string;
  userName: string;
  userRole: string;
}

export function PortalShell({
  children,
  navItems,
  portalLabel,
  userName,
  userRole,
}: PortalShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-slate-light)] flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-40 transition-transform duration-300 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-9 h-9 bg-[var(--color-navy)] rounded-lg flex items-center justify-center">
            <GraduationCap size={18} className="text-[var(--color-gold)]" />
          </div>
          <div>
            <div className="text-[var(--color-navy)] font-bold text-sm font-[family-name:var(--font-playfair)]">
              Pinnacle
            </div>
            <div className="text-[var(--color-teal)] text-xs font-medium">{portalLabel}</div>
          </div>
        </div>

        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="min-w-0">
              <div className="text-[var(--color-navy)] font-semibold text-sm truncate">{userName}</div>
              <div className="text-slate-400 text-xs capitalize">{userRole} Account</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item, i) => {
            if (item.divider) {
              return (
                <div key={`divider-${i}`} className="pt-4 pb-1 px-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {item.label.replace(/^─\s*/, "")}
                  </span>
                </div>
              );
            }
            const isActive = pathname === item.href || (item.href !== "/" && item.href !== "#" && pathname.startsWith(item.href) && item.href.split("/").length > 3);
            const IconComponent = ICON_MAP[item.icon] ?? LayoutDashboard;
            return (
              <Link
                key={item.href + i}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "portal-nav-link",
                  isActive && "portal-nav-link-active"
                )}
              >
                <IconComponent size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-slate-100">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-slate-500 hover:text-[var(--color-maroon)] hover:bg-[var(--color-maroon)]/5 transition-all"
          >
            <LogOut size={15} />
            Back to Website
          </Link>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <div className="text-[var(--color-navy)] font-bold text-sm font-[family-name:var(--font-playfair)]">
            {portalLabel}
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>

        <div className="flex-1 p-4 lg:p-8 max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
