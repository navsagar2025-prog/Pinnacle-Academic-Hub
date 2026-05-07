import { requirePortalRole } from "@/lib/server/portal-auth";
import { PortalShell } from "@/components/portal/PortalShell";
import { readImpersonationContext } from "@/lib/server/impersonation";
import { ImpersonationBanner } from "@/components/portal/ImpersonationBanner";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/teacher", icon: "LayoutDashboard" },
  { label: "My Batches", href: "/portal/teacher/batches", icon: "Layers" },
  { label: "Schedule", href: "/portal/teacher/schedule", icon: "Calendar" },
  { label: "Attendance", href: "/portal/teacher/attendance", icon: "CheckSquare" },
  { label: "Assignments", href: "/portal/teacher/assignments", icon: "ClipboardList" },
  { label: "Performance", href: "/portal/teacher/performance", icon: "TrendingUp" },
  { label: "Materials", href: "/portal/teacher/materials", icon: "BookOpen" },
  { label: "Notices", href: "/portal/teacher/notices", icon: "Bell" },
  { label: "Practice Sets", href: "/portal/teacher/practice-sets", icon: "Library" },
  { label: "Question Bank", href: "/portal/teacher/question-bank", icon: "BookOpen" },
  { label: "Mock Tests", href: "/portal/teacher/mock-tests", icon: "Sparkles" },
  { label: "Live Classes", href: "/portal/teacher/live", icon: "Video" },
  { label: "Tools", href: "#", icon: "Bot", divider: true },
  { label: "AI Assistant", href: "/portal/teacher/ai", icon: "Bot" },
];

export default async function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalRole("teacher");
  const impersonation = await readImpersonationContext();
  return (
    <PortalShell
      navItems={NAV_ITEMS}
      portalLabel="Teacher Portal"
      userName={user.name}
      userRole="teacher"
    >
      {impersonation ? (
        <ImpersonationBanner
          adminName={impersonation.adminName ?? "Admin"}
          targetName={impersonation.targetName ?? "user"}
          expiresAt={impersonation.expiresAt.toISOString()}
        />
      ) : null}
      {children}
    </PortalShell>
  );
}
