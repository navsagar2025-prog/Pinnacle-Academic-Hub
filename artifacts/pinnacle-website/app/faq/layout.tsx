import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Pinnacle Academic Classes",
  description:
    "Answers to your questions about admissions, fees, batch timings, online classes, and programmes at Pinnacle Academic Classes, Greater Noida.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Frequently Asked Questions — Pinnacle Academic Classes",
    description:
      "Answers to your questions about admissions, fees, batch timings, online classes, and programmes at Pinnacle Academic Classes, Greater Noida.",
    url: "/faq",
    siteName: "Pinnacle Academic Classes",
    type: "website",
    images: [{ url: "/opengraph.jpg", width: 1200, height: 630, alt: "Pinnacle Academic Classes" }],
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
