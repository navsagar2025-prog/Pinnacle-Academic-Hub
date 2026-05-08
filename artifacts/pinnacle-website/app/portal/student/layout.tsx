import { requirePortalRole } from "@/lib/server/portal-auth";
import { PortalShell } from "@/components/portal/PortalShell";
import { readImpersonationContext } from "@/lib/server/impersonation";
import { ImpersonationBanner } from "@/components/portal/ImpersonationBanner";
import { PromoPopup } from "@/components/promo/PromoPopup";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/student", icon: "LayoutDashboard" },
  { label: "Live Classes", href: "/portal/student/live", icon: "Radio" },
  { label: "Timetable", href: "/portal/student/timetable", icon: "Calendar" },
  { label: "Recordings", href: "/portal/student/recordings", icon: "Video" },
  { label: "Assignments", href: "/portal/student/assignments", icon: "ClipboardList" },
  { label: "Study Material", href: "/portal/student/materials", icon: "BookOpen" },
  { label: "Practice Papers", href: "/portal/student/papers", icon: "FileText" },
  { label: "Practice Sets", href: "/portal/student/practice", icon: "Library" },
  { label: "Mock Tests", href: "/portal/student/mock-tests", icon: "Sparkles" },
  { label: "Practice History", href: "/portal/student/practice-history", icon: "History" },
  { label: "Attempt History", href: "/portal/student/question-bank/attempts", icon: "ListChecks" },
  { label: "Doubt Forum", href: "/portal/student/doubts", icon: "MessageCircleQuestion" },
  { label: "Attendance", href: "/portal/student/attendance", icon: "UserCheck" },
  { label: "Results", href: "/portal/student/results", icon: "TrendingUp" },
  { label: "Fee Status", href: "/portal/student/fees", icon: "CreditCard" },
  { label: "Notifications", href: "/portal/student/notifications", icon: "Bell" },
];

export default async function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePortalRole("student");
  const impersonation = await readImpersonationContext();

  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website").replace(/\/$/, "");

  return (
    <PortalShell
      navItems={NAV_ITEMS}
      portalLabel="Student Portal"
      userName={user.name}
      userRole="student"
    >
      <PromoPopup basePath={base} />
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
