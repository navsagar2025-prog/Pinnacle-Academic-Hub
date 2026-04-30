import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pinnacle Academic Classes | JEE · NEET · Class 10-12 | Greater Noida",
    template: "%s | Pinnacle Academic Classes",
  },
  description:
    "Pinnacle Academic Classes — Greater Noida's premier coaching institute for JEE Main, JEE Advanced, NEET UG, and Class 10–12 board exams. Expert faculty, proven results.",
  keywords: [
    "JEE coaching Greater Noida",
    "NEET coaching Greater Noida",
    "Class 12 coaching",
    "Pinnacle Academic Classes",
    "KCK Corporate Services",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "Pinnacle Academic Classes | JEE · NEET · Class 10-12",
    description:
      "Greater Noida's premier coaching institute. Expert faculty, proven results, modern learning.",
    siteName: "Pinnacle Academic Classes",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${playfair.variable} ${jakarta.variable}`}>
        <body className="font-[family-name:var(--font-jakarta)]">{children}</body>
      </html>
    </ClerkProvider>
  );
}
