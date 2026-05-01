import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admissions 2026–27 — Apply Now | Pinnacle Academic Classes",
  description: "Apply for admission to Pinnacle Academic Classes, Gaur City 2, Sec. 16C, Greater Noida — 201009. JEE, NEET, and board exam coaching for 2026–27. Free demo class available.",
  openGraph: {
    title: "Admissions 2026–27 — Apply Now | Pinnacle Academic Classes",
    description: "Apply for admission to Pinnacle Academic Classes, Gaur City 2, Sec. 16C, Greater Noida — 201009. JEE, NEET, and board exam coaching for 2026–27. Free demo class available.",
    url: "https://paconline.in/admissions",
    siteName: "Pinnacle Academic Classes",
    type: "website",
  },
};

export default function AdmissionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
