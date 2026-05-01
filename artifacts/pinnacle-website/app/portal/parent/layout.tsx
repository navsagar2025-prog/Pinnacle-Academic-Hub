import { requirePortalRole } from "@/lib/server/portal-auth";
import { PortalShell } from "@/components/portal/PortalShell";
import { LayoutDashboard, CreditCard, Calendar, Bell, UserCheck, TrendingUp } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/parent", Icon: LayoutDashboard },
  { label: "Attendance", href: "/portal/parent/attendance", Icon: UserCheck },
  { label: "Performance", href: "/portal/parent/performance", Icon: TrendingUp },
  { label: "Fee Status", href: "/portal/parent/fees", Icon: CreditCard },
  { label: "Timetable", href: "/portal/parent/timetable", Icon: Calendar },
  { label: "Notices", href: "/portal/parent/notices", Icon: Bell },
];

export default async function ParentPortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalRole("parent");
  return (
    <PortalShell
      navItems={NAV_ITEMS}
      portalLabel="Parent Portal"
      userName={user.name}
      userRole="parent"
    >
      {children}
    </PortalShell>
  );
}
