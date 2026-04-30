import { requirePortalRole } from "@/lib/server/portal-auth";
import { PortalShell } from "@/components/portal/PortalShell";
import { LayoutDashboard, Calendar, BookOpen, Bell, Video, Bot } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/teacher", Icon: LayoutDashboard },
  { label: "Schedule", href: "/portal/teacher/schedule", Icon: Calendar },
  { label: "Materials", href: "/portal/teacher/materials", Icon: BookOpen },
  { label: "Notices", href: "/portal/teacher/notices", Icon: Bell },
  { label: "Live Classes", href: "/portal/teacher/live", Icon: Video },
  { label: "Tools", href: "#", Icon: Bot, divider: true },
  { label: "AI Assistant", href: "/portal/teacher/ai", Icon: Bot },
];

export default async function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalRole("teacher");
  return (
    <PortalShell
      navItems={NAV_ITEMS}
      portalLabel="Teacher Portal"
      userName={user.name}
      userRole="teacher"
    >
      {children}
    </PortalShell>
  );
}
