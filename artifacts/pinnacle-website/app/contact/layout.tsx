import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Pinnacle Academic Classes, Greater Noida",
  description: "Get in touch with Pinnacle Academic Classes. Visit us at Knowledge Park II, Greater Noida, or call +91 98765 43210. We reply within 24 hours.",
  openGraph: {
    title: "Contact Us — Pinnacle Academic Classes, Greater Noida",
    description: "Get in touch with Pinnacle Academic Classes. Visit us at Knowledge Park II, Greater Noida, or call +91 98765 43210. We reply within 24 hours.",
    url: "https://pinnacleacademic.in/contact",
    siteName: "Pinnacle Academic Classes",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
