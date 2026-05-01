import { requirePortalRole } from "@/lib/server/portal-auth";
import { PortalShell } from "@/components/portal/PortalShell";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/parent", icon: "LayoutDashboard" },
  { label: "Attendance", href: "/portal/parent/attendance", icon: "UserCheck" },
  { label: "Performance", href: "/portal/parent/performance", icon: "TrendingUp" },
  { label: "Fee Status", href: "/portal/parent/fees", icon: "CreditCard" },
  { label: "Timetable", href: "/portal/parent/timetable", icon: "Calendar" },
  { label: "Notices", href: "/portal/parent/notices", icon: "Bell" },
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
