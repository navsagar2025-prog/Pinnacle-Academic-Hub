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
    images: [{ url: "/opengraph.jpg", width: 1200, height: 630, alt: "Pinnacle Academic Classes" }],
  },
};

export default function AdmissionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
