import { MessageCircle } from "lucide-react";
import { CONTACT } from "@/lib/contact";

export default function WhatsAppButton() {
  const message = encodeURIComponent(
    "Hello! I'm interested in joining Pinnacle Academic Classes. Could you please share details about courses, fees, and batches?"
  );

  return (
    <a
      href={`${CONTACT.whatsappHref}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(10,31,92,0.12)] hover:scale-110 transition-transform"
    >
      <MessageCircle size={28} fill="white" className="text-white" />
    </a>
  );
}
