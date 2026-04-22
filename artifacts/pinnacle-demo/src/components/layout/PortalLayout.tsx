import { useLocation, Link } from "wouter";
import { useState } from "react";
import { Menu, X, LogOut, GraduationCap, Users, BookOpen, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PortalLayoutProps {
  children: React.ReactNode;
  role: "student" | "parent" | "teacher" | "admin";
  navItems: NavItem[];
  userName?: string;
  userSub?: string;
}

const roleConfig = {
  student: { label: "Student Portal", color: "bg-primary",        icon: GraduationCap },
  parent:  { label: "Parent Portal",  color: "bg-secondary",      icon: Users },
  teacher: { label: "Teacher Portal", color: "bg-[#8B1A1A]",      icon: BookOpen },
  admin:   { label: "Admin Panel",    color: "bg-[#1a3a5c]",      icon: ShieldCheck },
};

export function PortalLayout({ children, role, navItems, userName = "Demo User", userSub }: PortalLayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cfg = roleConfig[role];
  const RoleIcon = cfg.icon;

  const Sidebar = () => (
    <aside className="flex flex-col h-full">
      <div className={`${cfg.color} text-white px-5 py-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <RoleIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm">{userName}</div>
            <div className="text-xs text-white/70">{userSub || cfg.label}</div>
          </div>
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest text-white/60">{cfg.label}</div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-1 transition-all ${
                active
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link href="/login">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
            Switch Role
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground mt-1 text-xs">
            ← Back to Website
          </Button>
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <div className="hidden md:flex flex-col w-64 bg-card border-r border-border shrink-0 fixed top-0 left-0 h-screen z-30">
        <div className="p-4 border-b border-border">
          <Link href="/" className="font-serif text-xl font-bold text-primary">PINNACLE</Link>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <Sidebar />
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-card shadow-xl flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <Link href="/" className="font-serif text-xl font-bold text-primary">PINNACLE</Link>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col md:ml-64">
        <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-4 sticky top-0 z-20">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className={`text-xs font-semibold uppercase tracking-widest text-white ${cfg.color} px-3 py-1 rounded-full`}>
            Demo Mode
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
