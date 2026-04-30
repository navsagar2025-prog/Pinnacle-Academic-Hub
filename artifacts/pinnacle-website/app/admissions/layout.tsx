import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admissions 2026–27 — Apply Now | Pinnacle Academic Classes",
  description: "Apply for admission to Pinnacle Academic Classes, Greater Noida. JEE, NEET, and board exam coaching for 2026–27. Free demo class available.",
  openGraph: {
    title: "Admissions 2026–27 — Apply Now | Pinnacle Academic Classes",
    description: "Apply for admission to Pinnacle Academic Classes, Greater Noida. JEE, NEET, and board exam coaching for 2026–27. Free demo class available.",
    url: "https://pinnacleacademic.in/admissions",
    siteName: "Pinnacle Academic Classes",
    type: "website",
  },
};

export default function AdmissionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
