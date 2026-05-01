import { requirePortalRole } from "@/lib/server/portal-auth";
import { PortalShell } from "@/components/portal/PortalShell";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/student", icon: "LayoutDashboard" },
  { label: "Live Classes", href: "/portal/student/live", icon: "Radio" },
  { label: "Timetable", href: "/portal/student/timetable", icon: "Calendar" },
  { label: "Recordings", href: "/portal/student/recordings", icon: "Video" },
  { label: "Assignments", href: "/portal/student/assignments", icon: "ClipboardList" },
  { label: "Study Material", href: "/portal/student/materials", icon: "BookOpen" },
  { label: "Practice Papers", href: "/portal/student/papers", icon: "FileText" },
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

  return (
    <PortalShell
      navItems={NAV_ITEMS}
      portalLabel="Student Portal"
      userName={user.name}
      userRole="student"
    >
      {children}
    </PortalShell>
  );
}
