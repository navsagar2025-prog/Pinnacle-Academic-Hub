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
    images: [{ url: `/api/og?title=${encodeURIComponent("Frequently Asked Questions — Pinnacle Academic Classes")}&description=${encodeURIComponent("Answers to your questions about admissions, fees, batch timings, online classes, and programmes at Pinnacle Academic Classes, Greater Noida.")}`, width: 1200, height: 630, alt: "FAQs — Pinnacle Academic Classes" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`/api/og?title=${encodeURIComponent("Frequently Asked Questions — Pinnacle Academic Classes")}&description=${encodeURIComponent("Answers to your questions about admissions, fees, batch timings, online classes, and programmes at Pinnacle Academic Classes, Greater Noida.")}`],
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
