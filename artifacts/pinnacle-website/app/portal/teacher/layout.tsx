import { currentUser } from "@clerk/nextjs/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { PortalShell } from "@/components/portal/PortalShell";
import { LayoutDashboard, Calendar, BookOpen, Bell, Video } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/teacher", Icon: LayoutDashboard },
  { label: "Schedule", href: "/portal/teacher/schedule", Icon: Calendar },
  { label: "Materials", href: "/portal/teacher/materials", Icon: BookOpen },
  { label: "Notices", href: "/portal/teacher/notices", Icon: Bell },
  { label: "Live Classes", href: "/portal/teacher/live", Icon: Video },
];

export default async function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  await requirePortalRole("teacher");
  const clerkUser = await currentUser();
  return (
    <PortalShell
      navItems={NAV_ITEMS}
      portalLabel="Teacher Portal"
      userName={clerkUser?.fullName ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? "Teacher"}
      userRole="teacher"
    >
      {children}
    </PortalShell>
  );
}
