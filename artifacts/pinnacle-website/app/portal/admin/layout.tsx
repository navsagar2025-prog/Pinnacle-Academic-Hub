import { currentUser } from "@clerk/nextjs/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { PortalShell } from "@/components/portal/PortalShell";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  MessageSquare,
  TrendingUp,
  CreditCard,
  FileBarChart,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/admin", Icon: LayoutDashboard },
  { label: "Students", href: "/portal/admin/students", Icon: Users },
  { label: "Teachers", href: "/portal/admin/teachers", Icon: GraduationCap },
  { label: "Batches", href: "/portal/admin/batches", Icon: BookOpen },
  { label: "Enquiries", href: "/portal/admin/enquiries", Icon: MessageSquare },
  { label: "Analytics", href: "#", Icon: FileBarChart, divider: true },
  { label: "Enrollment Funnel", href: "/portal/admin/analytics/enrollment", Icon: TrendingUp },
  { label: "Fee Collection", href: "/portal/admin/analytics/fees", Icon: CreditCard },
  { label: "Content Engagement", href: "/portal/admin/analytics/content", Icon: BookOpen },
];

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  await requirePortalRole("admin");
  const clerkUser = await currentUser();
  return (
    <PortalShell
      navItems={NAV_ITEMS}
      portalLabel="Admin Panel"
      userName={clerkUser?.fullName ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? "Admin"}
      userRole="admin"
    >
      {children}
    </PortalShell>
  );
}
