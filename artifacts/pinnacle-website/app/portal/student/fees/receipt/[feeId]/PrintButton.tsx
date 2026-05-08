"use client";

import { Download } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

export default function PrintButton({ feeId }: { feeId: string }) {
  return (
    <a
      href={`${BASE}/api/v1/downloads/receipt/${feeId}`}
      className="flex items-center gap-2 text-sm btn-secondary px-3 py-1.5"
    >
      <Download size={15} />
      Download PDF receipt
    </a>
  );
}
