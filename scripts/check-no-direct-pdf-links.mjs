#!/usr/bin/env node
// Forbid direct PDF links / raw fileUrl projections that bypass the
// watermarking download proxy. Use `// allow-direct-pdf` on a line to
// whitelist a legitimate exception (e.g. an admin upload write path).
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

if (failed) {
  console.error(
    "\nDirect PDF links are forbidden — route every user-downloadable PDF\nthrough /api/v1/downloads/<docType>/<id> so it picks up watermarking\nand audit logging. Add `// allow-direct-pdf` on the offending line if\nthis really is an internal/admin-only path.",
  );
  process.exit(1);
}

console.log("✓ no direct PDF links found");
