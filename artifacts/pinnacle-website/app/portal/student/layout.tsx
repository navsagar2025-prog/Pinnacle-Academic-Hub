import { requirePortalRole } from "@/lib/server/portal-auth";
import { PortalShell } from "@/components/portal/PortalShell";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  FileText,
  CreditCard,
  Video,
  Radio,
  ClipboardList,
  UserCheck,
  TrendingUp,
  Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/student", Icon: LayoutDashboard },
  { label: "Live Classes", href: "/portal/student/live", Icon: Radio },
  { label: "Timetable", href: "/portal/student/timetable", Icon: Calendar },
  { label: "Recordings", href: "/portal/student/recordings", Icon: Video },
  { label: "Assignments", href: "/portal/student/assignments", Icon: ClipboardList },
  { label: "Study Material", href: "/portal/student/materials", Icon: BookOpen },
  { label: "Practice Papers", href: "/portal/student/papers", Icon: FileText },
  { label: "Attendance", href: "/portal/student/attendance", Icon: UserCheck },
  { label: "Results", href: "/portal/student/results", Icon: TrendingUp },
  { label: "Fee Status", href: "/portal/student/fees", Icon: CreditCard },
  { label: "Notifications", href: "/portal/student/notifications", Icon: Bell },
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
