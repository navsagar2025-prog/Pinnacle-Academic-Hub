import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { getContactSettings } from "@/lib/server/site-settings";
import { ContactDetails, ContactForm } from "./ContactForm";

export const metadata = {
  title: "Contact Us — Pinnacle Academic Classes, Gaur City 2, Greater Noida",
  description: "Get in touch with Pinnacle Academic Classes. Visit us at Shop Mart, Gaur City 2, Sec. 16C, Greater Noida, or call +91 99718 62138. We reply within 24 hours.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Us — Pinnacle Academic Classes",
    description: "Visit us at Shop Mart, Gaur City 2, Sec. 16C, Greater Noida, or call +91 99718 62138.",
    url: "/contact",
    siteName: "Pinnacle Academic Classes",
    type: "website",
    images: [{ url: "/opengraph.jpg", width: 1200, height: 630, alt: "Pinnacle Academic Classes" }],
  },
};

export default async function ContactPage() {
  const settings = await getContactSettings();

  const address = settings.address_city
    ? `${settings.address_line1}, ${settings.address_city}`
    : settings.address_line1;

  const contactInfo = {
    address,
    phone: settings.contact_phone,
    email: settings.contact_email,
    whatsapp: settings.whatsapp_number,
  };

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[var(--color-navy)] py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="badge-gold mb-4 inline-block">Get in Touch</span>
            <h1 className="font-[family-name:var(--font-playfair)] text-white text-4xl md:text-5xl font-bold">
              Contact Us
            </h1>
            <p className="text-white/70 text-lg mt-4">
              Have questions? We&apos;re here to help. Call, email, or visit our campus.
            </p>
          </div>
        </section>

        <section className="py-16 bg-[var(--color-slate-light)]">
          <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-5 gap-10">
            <ContactDetails info={contactInfo} />
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
