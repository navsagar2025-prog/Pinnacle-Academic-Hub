import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admissions 2026–27 — Apply Now | Pinnacle Academic Classes",
  description:
    "Apply to Pinnacle Academic Classes, Gaur City 2, Greater Noida. JEE, NEET, and board exam coaching for 2026–27. Free demo class — book your seat today.",
  alternates: { canonical: "/admissions" },
  openGraph: {
    title: "Admissions 2026–27 — Apply Now | Pinnacle Academic Classes",
    description:
      "Apply for admission to Pinnacle Academic Classes, Greater Noida. JEE, NEET, and board exam coaching for 2026–27. Free demo class available.",
    url: "/admissions",
    siteName: "Pinnacle Academic Classes",
    type: "website",
    images: [{ url: `/api/og?title=${encodeURIComponent("Admissions 2026–27 — Apply Now | Pinnacle Academic Classes")}&description=${encodeURIComponent("Apply for admission to Pinnacle Academic Classes, Greater Noida. JEE, NEET, and board exam coaching for 2026–27. Free demo class available.")}`, width: 1200, height: 630, alt: "Admissions — Pinnacle Academic Classes" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`/api/og?title=${encodeURIComponent("Admissions 2026–27 — Apply Now | Pinnacle Academic Classes")}&description=${encodeURIComponent("Apply for admission to Pinnacle Academic Classes, Greater Noida. JEE, NEET, and board exam coaching for 2026–27. Free demo class available.")}`],
  },
};

export default function AdmissionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
