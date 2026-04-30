import { currentUser } from "@clerk/nextjs/server";
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
  await requirePortalRole("student");
  const clerkUser = await currentUser();

  return (
    <PortalShell
      navItems={NAV_ITEMS}
      portalLabel="Student Portal"
      userName={clerkUser?.fullName ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? "Student"}
      userRole="student"
    >
      {children}
    </PortalShell>
  );
}
