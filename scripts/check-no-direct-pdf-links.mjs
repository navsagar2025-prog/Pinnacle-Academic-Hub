#!/usr/bin/env node
// Forbid direct PDF links / raw fileUrl projections that bypass the
// watermarking download proxy. Use `// allow-direct-pdf` on a line to
// whitelist a legitimate exception (e.g. an admin upload write path).
//
// The same guard applies to class recordings: student-facing pages must
// never render `recordingUrl` directly — playback has to go through the
// signed-stream proxy at /api/v1/recordings/[id]/stream so watermarking
// and view-logging are enforced. Use `// allow-direct-recording` on a
// line to whitelist a legitimate exception.
import { execFileSync } from "node:child_process";

const ROOTS = [
  "artifacts/pinnacle-website/app",
  "artifacts/pinnacle-website/components",
];

const API_FILEURL_ALLOWLIST = [
  "/api/v1/admin/",
  "/api/v1/downloads/",
  "/api/v1/upload",
  "/api/v1/assignments/schedules/", // teacher/admin schedule editor only
];

const RULES = [
  { name: "raw fileUrl in href", re: String.raw`href=\{[^}]*\bfileUrl\b[^}]*\}` },
  { name: "target=_blank to a .pdf url literal", re: String.raw`target=["']_blank["'][^>]*\.pdf` },
  { name: "direct /objects/.../*.pdf href", re: String.raw`href=["'][^"']*\/objects\/[^"']+\.pdf` },
];

// Student-facing roots: any reference to `recordingUrl` here must go
// through the signed-stream proxy. Admin paths and the stream API route
// itself are not listed here, so they're implicitly allowlisted.
const STUDENT_RECORDING_ROOTS = [
  "artifacts/pinnacle-website/app/portal/student",
];

const RECORDING_RULES = [
  { name: "raw recordingUrl in href", re: String.raw`href=\{[^}]*\brecordingUrl\b[^}]*\}` },
  { name: "recordingUrl reference in student page", re: String.raw`\brecordingUrl\b` },
];

let failed = false;

for (const rule of RULES) {
  let out = "";
  try {
    out = execFileSync(
      "rg",
      ["-n", "--no-heading", "--color=never", "-g", "*.{ts,tsx,jsx,js}", "-P", rule.re, ...ROOTS],
      { encoding: "utf8" },
    );
  } catch (err) {
    // ripgrep exits 1 when there are no matches — that's the success path.
    if (err && typeof err === "object" && "status" in err && err.status === 1) continue;
    throw err;
  }

  const hits = out
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .filter((line) => !line.includes("// allow-direct-pdf"))
    .filter((line) => !line.includes("/api/v1/downloads/"));

  if (hits.length > 0) {
    failed = true;
    console.error(`\n✗ ${rule.name}`);
    for (const h of hits) console.error(`    ${h}`);
  }
}

// API routes must not project raw `fileUrl:` unless allow-listed.
{
  let out = "";
  try {
    out = execFileSync(
      "rg",
      ["-n", "--no-heading", "--color=never", "-g", "*.{ts,tsx}", "fileUrl:\\s*[a-zA-Z]", "artifacts/pinnacle-website/app/api/v1"],
      { encoding: "utf8" },
    );
  } catch (err) {
    if (!(err && typeof err === "object" && "status" in err && err.status === 1)) throw err;
  }
  const apiHits = out
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .filter((line) => !line.includes("// allow-direct-pdf"))
    .filter((line) => !API_FILEURL_ALLOWLIST.some((p) => line.includes(p)));
  if (apiHits.length > 0) {
    failed = true;
    console.error(`\n✗ raw fileUrl projected from non-admin API route`);
    for (const h of apiHits) console.error(`    ${h}`);
  }
}

// Student-facing pages must never reference `recordingUrl` directly —
// they have to go through the signed-stream proxy so watermarking and
// view-logging are enforced. Admin pages are not scanned because they
// legitimately render the raw URL when teachers/admins edit it.
for (const rule of RECORDING_RULES) {
  let out = "";
  try {
    out = execFileSync(
      "rg",
      ["-n", "--no-heading", "--color=never", "-g", "*.{ts,tsx,jsx,js}", "-P", rule.re, ...STUDENT_RECORDING_ROOTS],
      { encoding: "utf8" },
    );
  } catch (err) {
    if (err && typeof err === "object" && "status" in err && err.status === 1) continue;
    throw err;
  }

  const hits = out
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .filter((line) => !line.includes("allow-direct-recording"));

  if (hits.length > 0) {
    failed = true;
    console.error(`\n✗ ${rule.name}`);
    for (const h of hits) console.error(`    ${h}`);
  }
}

if (failed) {
  console.error(
    "\nDirect PDF links are forbidden — route every user-downloadable PDF\nthrough /api/v1/downloads/<docType>/<id> so it picks up watermarking\nand audit logging. Add `// allow-direct-pdf` on the offending line if\nthis really is an internal/admin-only path.\n\nDirect recording URLs in student pages are also forbidden — playback\nmust go through /api/v1/recordings/<id>/stream so the signed-stream\nproxy can apply watermarking and log the view. Add\n`// allow-direct-recording` on the offending line if this really is a\nlegitimate exception (e.g. a non-watermarked live-class join link).",
  );
  process.exit(1);
}

console.log("✓ no direct PDF or recording links found");
