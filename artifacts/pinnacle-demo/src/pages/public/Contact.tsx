import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});
type FormData = z.infer<typeof schema>;

function ContactForm() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function onSubmit() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success("Message sent! We'll get back to you shortly.");
        reset();
        resolve();
      }, 800);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="c-name">Full Name *</Label>
          <Input id="c-name" {...register("name")} placeholder="Your name" className="mt-1.5" />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="c-phone">Phone Number *</Label>
          <Input id="c-phone" {...register("phone")} placeholder="+91-XXXXX-XXXXX" className="mt-1.5" />
          {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="c-email">Email Address *</Label>
        <Input id="c-email" type="email" {...register("email")} placeholder="you@email.com" className="mt-1.5" />
        {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="c-message">Message *</Label>
        <Textarea id="c-message" {...register("message")} placeholder="How can we help you?" className="mt-1.5 min-h-28" />
        {errors.message && <p className="text-destructive text-xs mt-1">{errors.message.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}

export default function Contact() {
  return (
    <PublicLayout>
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            We're here to answer all your queries. Reach out and we'll respond within 24 hours.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-primary mb-6">Get in Touch</h2>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="tel:+919876543210"
                  className="flex-1 flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-xl py-4 px-6 font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Call Now
                </a>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 bg-[#25D366] text-white rounded-xl py-4 px-6 font-semibold hover:bg-[#22C05A] transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4 p-5 bg-card border border-border rounded-xl">
                  <MapPin className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground mb-1">Visit Us</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Shop No. 1–5, Shop Mart, Plot GH-03<br />
                      Gaur City 2, Sector 16C<br />
                      Greater Noida, Uttar Pradesh — 201009
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-card border border-border rounded-xl">
                  <Phone className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground mb-1">Call Us</div>
                    <a href="tel:+919876543210" className="text-sm text-primary hover:underline font-medium">+91-98765-43210</a>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-card border border-border rounded-xl">
                  <Mail className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground mb-1">Email Us</div>
                    <a href="mailto:info@pinnacleacademic.in" className="text-sm text-primary hover:underline font-medium">info@pinnacleacademic.in</a>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-card border border-border rounded-xl">
                  <Clock className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground mb-1">Office Hours</div>
                    <p className="text-sm text-muted-foreground">Monday – Saturday: 9:00 AM – 7:00 PM</p>
                    <p className="text-sm text-muted-foreground">Sunday: 10:00 AM – 2:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-border h-56">
              <iframe
                title="Pinnacle Academic Classes Location"
                src="https://maps.google.com/maps?q=Shop+Mart+Plot+GH-03+Gaur+City+2+Sector+16C+Greater+Noida+UP+201009&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-serif font-bold text-primary mb-6">Send a Message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
