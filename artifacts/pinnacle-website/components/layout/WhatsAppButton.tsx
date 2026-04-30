"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const phone = "919876543210";
  const message = encodeURIComponent(
    "Hello! I'm interested in joining Pinnacle Academic Classes. Could you please share details about courses, fees, and batches?"
  );

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-elevated hover:scale-110 transition-transform"
    >
      <MessageCircle size={28} fill="white" className="text-white" />
    </a>
  );
}
