import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Pinnacle Academic Classes",
  description: "Answers to your questions about admissions, fees, batch timings, online classes, and programmes at Pinnacle Academic Classes, Greater Noida.",
  openGraph: {
    title: "Frequently Asked Questions — Pinnacle Academic Classes",
    description: "Answers to your questions about admissions, fees, batch timings, online classes, and programmes at Pinnacle Academic Classes, Greater Noida.",
    url: "https://pinnacleacademic.in/faq",
    siteName: "Pinnacle Academic Classes",
    type: "website",
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
