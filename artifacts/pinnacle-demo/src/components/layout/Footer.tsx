import { Link } from "wouter";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="flex flex-col items-start gap-4">
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-white">
              PINNACLE
            </Link>
            <p className="text-primary-foreground/80 text-sm max-w-sm">
              A premium coaching institute dedicated to shaping the future of tomorrow's leaders through expert guidance and personal attention.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg text-accent">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/about" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">About Us</Link>
              <Link href="/courses" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Our Courses</Link>
              <Link href="/faculty" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Faculty</Link>
              <Link href="/results" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Results & Toppers</Link>
              <Link href="/admissions" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Admissions</Link>
            </nav>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg text-accent">Support</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/blog" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Blog & Insights</Link>
              <Link href="/notices" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Notice Board</Link>
              <Link href="/faq" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">FAQs</Link>
              <Link href="/fee-payment" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Fee Payment</Link>
              <Link href="/privacy-policy" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Terms & Conditions</Link>
              <Link href="/refund-policy" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Refund Policy</Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg text-accent">Contact Us</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 text-sm text-primary-foreground/80">
                <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>Shop No. 1–5, Shop Mart, Plot GH-03, Sector 16C, Gaur City 2, Greater Noida, UP 201009</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <span>+91-98765-43210</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <span>info@pinnacleacademic.in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Embed */}
        <div className="mb-10 rounded-xl overflow-hidden border border-primary-foreground/10" style={{ height: 220 }}>
          <iframe
            title="Pinnacle Academic Classes Location"
            src="https://maps.google.com/maps?q=Gaur+City+2,+Sector+16C,+Greater+Noida,+Uttar+Pradesh+201009&output=embed&z=15"
            width="100%"
            height="220"
            style={{ border: 0, display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/60 text-center md:text-left">
            © {new Date().getFullYear()} Pinnacle Academic Classes. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-colors cursor-pointer text-sm">f</div>
            <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-colors cursor-pointer text-sm">t</div>
            <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-colors cursor-pointer text-sm">in</div>
            <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-primary transition-colors cursor-pointer text-sm">ig</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
