#!/usr/bin/env node
/**
 * Regression guard: forbid front-end code from linking directly to PDF blobs
 * in object storage. Every user-downloadable PDF must go through
 * `/api/v1/downloads/<docType>/<id>` so the watermarking + audit pipeline
 * runs server-side. This script greps the portal/component tree for the
 * patterns that historically bypassed it (raw fileUrl anchors, target=_blank
 * to .pdf URLs, direct /objects/<...>.pdf hrefs) and exits non-zero on any
 * hit. Wired into the workspace `lint:no-direct-pdf` script and the
 * project's validation step.
 *
 * To intentionally reference a stored PDF (e.g. when the resource is *not*
 * user-downloadable), add the literal token `// allow-direct-pdf` on the
 * same line as the offending pattern and the line will be ignored.
 */
import { execFileSync } from "node:child_process";

const ROOTS = [
  "artifacts/pinnacle-website/app",
  "artifacts/pinnacle-website/components",
];

// Each rule is a Perl-compatible regex passed to ripgrep. Keep the patterns
// narrow so they target the *bypass* shapes — not legitimate uses of
// fileUrl in admin upload widgets etc.
const RULES = [
  {
    name: "raw fileUrl in href",
    // href={something.fileUrl} or href={fileUrl} — but the new download
    // proxy URL contains "/api/v1/downloads/" so it never matches this rule.
    re: String.raw`href=\{[^}]*\bfileUrl\b[^}]*\}`,
  },
  {
    name: "target=_blank to a .pdf url literal",
    re: String.raw`target=["']_blank["'][^>]*\.pdf`,
  },
  {
    name: "direct /objects/.../*.pdf href",
    re: String.raw`href=["'][^"']*\/objects\/[^"']+\.pdf`,
  },
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
    // The download proxy URL contains "/api/v1/downloads/" — if a line
    // mentions both fileUrl (as a guard / falsy check) AND the proxy URL,
    // it's already going through the watermarking pipeline.
    .filter((line) => !line.includes("/api/v1/downloads/"));

  if (hits.length > 0) {
    failed = true;
    console.error(`\n✗ ${rule.name}`);
    for (const h of hits) console.error(`    ${h}`);
  }
}

if (failed) {
  console.error(
    "\nDirect PDF links are forbidden — route every user-downloadable PDF\nthrough /api/v1/downloads/<docType>/<id> so it picks up watermarking\nand audit logging. Add `// allow-direct-pdf` on the offending line if\nthis really is an internal/admin-only path.",
  );
  process.exit(1);
}

console.log("✓ no direct PDF links found");
