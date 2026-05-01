import { requirePortalRole } from "@/lib/server/portal-auth";
import { PortalShell } from "@/components/portal/PortalShell";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal/admin", icon: "LayoutDashboard" },
  { label: "Students", href: "/portal/admin/students", icon: "Users" },
  { label: "Teachers", href: "/portal/admin/teachers", icon: "GraduationCap" },
  { label: "Batches", href: "/portal/admin/batches", icon: "BookOpen" },
  { label: "Live Classes", href: "/portal/admin/live-classes", icon: "Video" },
  { label: "Admissions", href: "/portal/admin/admissions", icon: "Users2" },
  { label: "Enquiries", href: "/portal/admin/enquiries", icon: "MessageSquare" },
  { label: "Academics", href: "#", icon: "FileBarChart", divider: true },
  { label: "Courses", href: "/portal/admin/courses", icon: "BookOpen" },
  { label: "Fee Management", href: "/portal/admin/fees", icon: "CreditCard" },
  { label: "Results & Toppers", href: "/portal/admin/results", icon: "Trophy" },
  { label: "Test Scores", href: "/portal/admin/test-scores", icon: "ClipboardList" },
  { label: "Blog CMS", href: "/portal/admin/blog", icon: "FileText" },
  { label: "Analytics", href: "#", icon: "FileBarChart", divider: true },
  { label: "Enrollment Funnel", href: "/portal/admin/analytics/enrollment", icon: "TrendingUp" },
  { label: "Fee Collection", href: "/portal/admin/analytics/fees", icon: "CreditCard" },
  { label: "Content Engagement", href: "/portal/admin/analytics/content", icon: "BookOpen" },
  { label: "Tools", href: "#", icon: "Bot", divider: true },
  { label: "AI Assistant", href: "/portal/admin/ai", icon: "Bot" },
  { label: "SEO Health", href: "/portal/admin/seo", icon: "Search" },
  { label: "Audit Logs", href: "/portal/admin/audit-logs", icon: "ShieldCheck" },
  { label: "Settings", href: "/portal/admin/settings", icon: "Settings" },
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
