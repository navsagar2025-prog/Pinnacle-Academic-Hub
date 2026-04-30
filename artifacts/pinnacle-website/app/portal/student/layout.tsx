import { requirePortalRole } from "@/lib/server/portal-auth";
import { PortalShell } from "@/components/portal/PortalShell";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  FileText,
  CreditCard,
  Video,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/student", Icon: LayoutDashboard },
  { label: "Timetable", href: "/portal/student/timetable", Icon: Calendar },
  { label: "Study Material", href: "/portal/student/materials", Icon: BookOpen },
  { label: "Practice Papers", href: "/portal/student/papers", Icon: FileText },
  { label: "Fee Status", href: "/portal/student/fees", Icon: CreditCard },
  { label: "Recordings", href: "/portal/student/recordings", Icon: Video },
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
