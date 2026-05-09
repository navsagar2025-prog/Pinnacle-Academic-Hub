"use client";

import { useState } from "react";
import { Upload, CheckCircle } from "lucide-react";

export function AssignmentSubmitButton({ assignmentId }: { assignmentId: string }) {
  const [state, setState] = useState<"idle" | "submitted">("idle");

  if (state === "submitted") {
    return (
      <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-700 cursor-default">
        <CheckCircle size={14} />Submitted
      </span>
    );
  }

  return (
    <button
      onClick={() => {
        // Submission flow placeholder — file upload integration coming soon
        if (window.confirm("Submission portal is being set up. Your teacher has been notified of your intent to submit. Continue?")) {
          setState("submitted");
        }
      }}
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-navy)] text-white text-sm font-semibold hover:bg-[var(--color-navy)]/90 transition-colors flex-shrink-0"
      data-assignment-id={assignmentId}
    >
      <Upload size={14} />Submit
    </button>
  );
}
