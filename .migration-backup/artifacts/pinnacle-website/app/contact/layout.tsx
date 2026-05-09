import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — Pinnacle Academic Classes, Gaur City 2, Greater Noida",
  description: "Get in touch with Pinnacle Academic Classes. Visit us at Shop Mart, Gaur City 2, Sec. 16C, Greater Noida, or call +91 99718 62138. We reply within 24 hours.",
  openGraph: {
    title: "Contact Us — Pinnacle Academic Classes, Gaur City 2, Greater Noida",
    description: "Get in touch with Pinnacle Academic Classes. Visit us at Shop Mart, Gaur City 2, Sec. 16C, Greater Noida, or call +91 99718 62138. We reply within 24 hours.",
    url: "/contact",
    siteName: "Pinnacle Academic Classes",
    type: "website",
    images: [{ url: `/api/og?title=${encodeURIComponent("Contact Us — Pinnacle Academic Classes, Gaur City 2, Greater Noida")}&description=${encodeURIComponent("Get in touch with Pinnacle Academic Classes. Visit us at Shop Mart, Gaur City 2, Sec. 16C, Greater Noida, or call +91 99718 62138. We reply within 24 hours.")}`, width: 1200, height: 630, alt: "Contact — Pinnacle Academic Classes" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`/api/og?title=${encodeURIComponent("Contact Us — Pinnacle Academic Classes, Gaur City 2, Greater Noida")}&description=${encodeURIComponent("Get in touch with Pinnacle Academic Classes. Visit us at Shop Mart, Gaur City 2, Sec. 16C, Greater Noida, or call +91 99718 62138. We reply within 24 hours.")}`],
  },
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
