"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 text-sm btn-secondary px-3 py-1.5"
    >
      <Printer size={15} />
      Print / Save PDF
    </button>
  );
}
