import { requirePortalRole, getRealAdminUser } from "@/lib/server/portal-auth";
import { PortalShell } from "@/components/portal/PortalShell";
import { db } from "@workspace/db";
import { questionBank } from "@workspace/db/schema";
import { and, isNotNull, isNull, sql } from "drizzle-orm";
import { readImpersonationContext } from "@/lib/server/impersonation";
import { ImpersonationBanner } from "@/components/portal/ImpersonationBanner";

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
  { label: "Question Bank", href: "/portal/admin/question-bank", icon: "BookOpen" },
  { label: "Pending Deletions", href: "/portal/admin/question-bank/pending", icon: "AlertTriangle" },
  { label: "QB Recycle Bin", href: "/portal/admin/question-bank/bin", icon: "Trash2" },
  { label: "Practice Sets", href: "/portal/admin/practice-sets", icon: "Library" },
  { label: "Mock Tests", href: "/portal/admin/mock-tests", icon: "Sparkles" },
  { label: "Doubt Q&A", href: "/portal/admin/doubts", icon: "MessageCircleQuestion" },
  { label: "Blog CMS", href: "/portal/admin/blog", icon: "FileText" },
  { label: "Gallery", href: "/portal/admin/gallery", icon: "Images" },
  { label: "Analytics", href: "#", icon: "FileBarChart", divider: true },
  { label: "Enrollment Funnel", href: "/portal/admin/analytics/enrollment", icon: "TrendingUp" },
  { label: "Fee Collection", href: "/portal/admin/analytics/fees", icon: "CreditCard" },
  { label: "Content Engagement", href: "/portal/admin/analytics/content", icon: "BookOpen" },
  { label: "Tools", href: "#", icon: "Bot", divider: true },
  { label: "AI Assistant", href: "/portal/admin/ai", icon: "Bot" },
  { label: "User Management", href: "/portal/admin/users", icon: "ShieldCheck" },
  { label: "SEO Health", href: "/portal/admin/seo", icon: "Search" },
  { label: "Audit Logs", href: "/portal/admin/audit-logs", icon: "ScrollText" },
  { label: "Settings", href: "/portal/admin/settings", icon: "Settings" },
  { label: "PDF Watermark", href: "/portal/admin/settings/watermark", icon: "Settings" },
  { label: "Operations", href: "#", icon: "Activity", divider: true },
  { label: "System Health", href: "/portal/admin/ops/health", icon: "Activity" },
  { label: "Test Email", href: "/portal/admin/ops/test-email", icon: "Mail" },
  { label: "AI Providers", href: "/portal/admin/ops/ai-providers", icon: "Cpu" },
  { label: "Impersonate", href: "/portal/admin/ops/impersonate", icon: "UserCog" },
  { label: "Audit Log Viewer", href: "/portal/admin/ops/audit-log", icon: "ScrollText" },
];

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  // Use real admin (not impersonation target) for the admin layout — admins
  // continue to see their own admin panel even while impersonating someone.
  const user = (await getRealAdminUser()) ?? (await requirePortalRole("admin"));
  if (user.role !== "admin") {
    // requirePortalRole would have redirected; this is a defensive fallback.
    await requirePortalRole("admin");
  }
  const impersonation = await readImpersonationContext();

  // Live badge counts so admins can see deletion-governance work without
  // navigating into the question-bank section.
  const [{ pending }, { binned }] = await Promise.all([
    db.select({ pending: sql<number>`count(*)::int` })
      .from(questionBank)
      .where(and(isNotNull(questionBank.deletionRequestedAt), isNull(questionBank.deletedAt)))
      .then((r) => r[0] ?? { pending: 0 }),
    db.select({ binned: sql<number>`count(*)::int` })
      .from(questionBank)
      .where(isNotNull(questionBank.deletedAt))
      .then((r) => r[0] ?? { binned: 0 }),
  ]);

  const navItems = NAV_ITEMS.map((item) => {
    if (item.href === "/portal/admin/question-bank/pending" && pending > 0) {
      return { ...item, badge: pending };
    }
    if (item.href === "/portal/admin/question-bank/bin" && binned > 0) {
      return { ...item, badge: binned };
    }
    return item;
  });

  return (
    <PortalShell
      navItems={navItems}
      portalLabel="Admin Panel"
      userName={user.name}
      userRole="admin"
    >
      {impersonation ? (
        <ImpersonationBanner
          adminName={impersonation.adminName ?? "Admin"}
          targetName={impersonation.targetName ?? "user"}
          expiresAt={impersonation.expiresAt.toISOString()}
        />
      ) : null}
      {children}
    </PortalShell>
  );
}
