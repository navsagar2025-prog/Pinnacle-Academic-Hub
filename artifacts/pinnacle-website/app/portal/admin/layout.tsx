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
  Search,
  Bot,
  Video,
  Trophy,
  FileText,
  Users2,
  Settings,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/admin", Icon: LayoutDashboard },
  { label: "Students", href: "/portal/admin/students", Icon: Users },
  { label: "Teachers", href: "/portal/admin/teachers", Icon: GraduationCap },
  { label: "Batches", href: "/portal/admin/batches", Icon: BookOpen },
  { label: "Live Classes", href: "/portal/admin/live-classes", Icon: Video },
  { label: "Admissions", href: "/portal/admin/admissions", Icon: Users2 },
  { label: "Enquiries", href: "/portal/admin/enquiries", Icon: MessageSquare },
  { label: "Academics", href: "#", Icon: FileBarChart, divider: true },
  { label: "Courses", href: "/portal/admin/courses", Icon: BookOpen },
  { label: "Fee Management", href: "/portal/admin/fees", Icon: CreditCard },
  { label: "Results & Toppers", href: "/portal/admin/results", Icon: Trophy },
  { label: "Test Scores", href: "/portal/admin/test-scores", Icon: ClipboardList },
  { label: "Blog CMS", href: "/portal/admin/blog", Icon: FileText },
  { label: "Analytics", href: "#", Icon: FileBarChart, divider: true },
  { label: "Enrollment Funnel", href: "/portal/admin/analytics/enrollment", Icon: TrendingUp },
  { label: "Fee Collection", href: "/portal/admin/analytics/fees", Icon: CreditCard },
  { label: "Content Engagement", href: "/portal/admin/analytics/content", Icon: BookOpen },
  { label: "Tools", href: "#", Icon: Bot, divider: true },
  { label: "AI Assistant", href: "/portal/admin/ai", Icon: Bot },
  { label: "SEO Health", href: "/portal/admin/seo", Icon: Search },
  { label: "Audit Logs", href: "/portal/admin/audit-logs", Icon: ShieldCheck },
  { label: "Settings", href: "/portal/admin/settings", Icon: Settings },
];

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortalRole("admin");
  return (
    <PortalShell
      navItems={NAV_ITEMS}
      portalLabel="Admin Panel"
      userName={user.name}
      userRole="admin"
    >
      {children}
    </PortalShell>
  );
}
