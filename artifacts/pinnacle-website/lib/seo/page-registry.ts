export type SeoStatus = "pass" | "warn" | "fail";

export interface PageSeoEntry {
  label: string;
  route: string;
  title: string;
  description: string;
  hasOgTitle: boolean;
  hasOgDescription: boolean;
  hasOgUrl: boolean;
  hasOgImage: boolean;
  hasCanonical: boolean;
  hasStructuredData: boolean;
  changefreq: "daily" | "weekly" | "monthly";
  priority: number;
}

export interface SeoAuditEntry extends PageSeoEntry {
  status: SeoStatus;
  issues: string[];
}

const SITE_URL = "https://pinnacleacademic.in";

export const PUBLIC_PAGES: PageSeoEntry[] = [
  {
    label: "Home",
    route: "/",
    title: "Pinnacle Academic Classes — JEE & NEET Coaching, Greater Noida",
    description: "Greater Noida's premier coaching institute for JEE Main, JEE Advanced, and NEET UG. Expert faculty, 2,000+ students, proven results since 2012.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "weekly",
    priority: 1.0,
  },
  {
    label: "About Us",
    route: "/about",
    title: "About Us — Pinnacle Academic Classes",
    description: "Learn about Pinnacle Academic Classes — Greater Noida's premier coaching institute for JEE, NEET, and board exams. Our story, mission, and faculty.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    label: "Courses",
    route: "/courses",
    title: "Courses — JEE, NEET, Class 10-12 | Pinnacle Academic Classes",
    description: "Explore Pinnacle's courses: JEE Main & Advanced, NEET UG, Class 11-12 Board, Class 9-10, and Foundation. Expert faculty, proven results.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    label: "Faculty",
    route: "/faculty",
    title: "Our Faculty — Expert Teachers | Pinnacle Academic Classes",
    description: "Meet Pinnacle's expert faculty — IIT/NIT alumni and PhD-qualified teachers with 7–14 years of coaching experience for JEE, NEET, and board exams.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    label: "Admissions",
    route: "/admissions",
    title: "Admissions 2026–27 — Apply Now | Pinnacle Academic Classes",
    description: "Apply for admission to Pinnacle Academic Classes, Greater Noida. JEE, NEET, and board exam coaching for 2026–27. Free demo class available.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    label: "Contact",
    route: "/contact",
    title: "Contact Us — Pinnacle Academic Classes, Greater Noida",
    description: "Get in touch with Pinnacle Academic Classes. Visit us at Knowledge Park II, Greater Noida, or call +91 98765 43210. We reply within 24 hours.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    label: "Results",
    route: "/results",
    title: "Results & Toppers 2024 — JEE, NEET | Pinnacle Academic Classes",
    description: "Pinnacle Academic Classes 2024 results: 85+ IIT/AIIMS selections, 320+ NIT selections. See our JEE and NEET toppers.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    label: "Achievements",
    route: "/achievements",
    title: "Toppers & Achievements — Pinnacle Academic Classes",
    description: "JEE and NEET selections, board exam toppers, and student achievements from Pinnacle Academic Classes, Greater Noida.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    label: "Gallery",
    route: "/gallery",
    title: "Gallery — Pinnacle Academic Classes",
    description: "Photos from classrooms, events, mock tests, and celebrations at Pinnacle Academic Classes, Greater Noida.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "monthly",
    priority: 0.5,
  },
  {
    label: "Blog",
    route: "/blog",
    title: "Study Tips & Blog — Pinnacle Academic Classes",
    description: "Expert study strategies, JEE & NEET preparation tips, and academic guidance from the faculty at Pinnacle Academic Classes, Greater Noida.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "weekly",
    priority: 0.6,
  },
  {
    label: "Notices",
    route: "/notices",
    title: "Notices & Announcements | Pinnacle Academic Classes",
    description: "Latest notices, events, and announcements from Pinnacle Academic Classes, Greater Noida.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "daily",
    priority: 0.6,
  },
  {
    label: "Fee Structure",
    route: "/fee-structure",
    title: "Fee Structure 2026–27 — Pinnacle Academic Classes",
    description: "Transparent course fees, instalment options, and scholarship information for all programmes at Pinnacle Academic Classes, Greater Noida.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    label: "FAQs",
    route: "/faq",
    title: "Frequently Asked Questions — Pinnacle Academic Classes",
    description: "Answers to your questions about admissions, fees, batch timings, online classes, and programmes at Pinnacle Academic Classes, Greater Noida.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    label: "Privacy Policy",
    route: "/privacy-policy",
    title: "Privacy Policy | Pinnacle Academic Classes",
    description: "How Pinnacle Academic Classes (KCK Corporate Services Pvt. Ltd.) collects, uses, and protects your personal data in compliance with Indian data protection laws.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "monthly",
    priority: 0.3,
  },
  {
    label: "Refund Policy",
    route: "/refund-policy",
    title: "Refund Policy | Pinnacle Academic Classes",
    description: "Pinnacle Academic Classes refund and cancellation policy for course fees, including timelines, eligibility, and process for raising a refund request.",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "monthly",
    priority: 0.3,
  },
  {
    label: "Terms & Conditions",
    route: "/terms",
    title: "Terms & Conditions | Pinnacle Academic Classes",
    description: "Terms and conditions governing enrolment, usage of digital resources, and the student-institute relationship at Pinnacle Academic Classes (KCK Corporate Services Pvt. Ltd.).",
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgUrl: true,
    hasOgImage: false,
    hasCanonical: false,
    hasStructuredData: false,
    changefreq: "monthly",
    priority: 0.3,
  },
];

export function auditPage(entry: PageSeoEntry): SeoAuditEntry {
  const issues: string[] = [];

  if (!entry.title || entry.title.length < 20) issues.push("Title missing or too short (< 20 chars)");
  else if (entry.title.length > 70) issues.push(`Title too long (${entry.title.length} chars, max 70)`);

  if (!entry.description || entry.description.length < 50) issues.push("Meta description missing or too short (< 50 chars)");
  else if (entry.description.length > 165) issues.push(`Description too long (${entry.description.length} chars, max 165)`);

  if (!entry.hasOgTitle) issues.push("Missing og:title");
  if (!entry.hasOgDescription) issues.push("Missing og:description");
  if (!entry.hasOgUrl) issues.push("Missing og:url");
  if (!entry.hasOgImage) issues.push("No og:image — social previews will lack a thumbnail");
  if (!entry.hasCanonical) issues.push("No canonical URL tag — duplicate content risk");
  if (!entry.hasStructuredData) issues.push("No structured data (schema.org)");

  let status: SeoStatus;

  const failIssues = issues.filter(
    (i) =>
      i.includes("Title missing") ||
      i.includes("description missing") ||
      i.includes("og:title") ||
      i.includes("og:description") ||
      i.includes("og:url")
  );

  const warnIssues = issues.filter(
    (i) =>
      i.includes("og:image") ||
      i.includes("Description too long") ||
      i.includes("Title too long")
  );

  if (failIssues.length > 0) status = "fail";
  else if (warnIssues.length > 0) status = "warn";
  else status = "pass";

  return { ...entry, status, issues };
}

export function runAudit(): SeoAuditEntry[] {
  return PUBLIC_PAGES.map(auditPage);
}

export { SITE_URL };
