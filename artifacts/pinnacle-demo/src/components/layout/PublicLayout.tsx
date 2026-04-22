import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Phone, MessageCircle, Info } from "lucide-react";
import { Link } from "wouter";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      
      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/919876543210" 
        target="_blank" 
        rel="norenoopener noreferrer"
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-8 h-8" />
      </a>

      {/* Mobile Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-background border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex items-center justify-around p-2 md:hidden z-40">
        <a href="tel:+919876543210" className="flex flex-col items-center justify-center text-primary gap-1 w-1/3">
          <Phone className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Call</span>
        </a>
        <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-[#25D366] gap-1 w-1/3 border-x border-border">
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-semibold">WhatsApp</span>
        </a>
        <Link href="/admissions" className="flex flex-col items-center justify-center text-accent gap-1 w-1/3">
          <Info className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Enquire</span>
        </Link>
      </div>
    </div>
  );
}
