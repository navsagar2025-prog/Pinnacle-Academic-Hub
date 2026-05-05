/**
 * Validate that an image URL submitted with a question/option points to our own
 * object-storage serving route. This prevents arbitrary third-party embeds and
 * keeps tracking/payloads out of the question content.
 *
 * Accepts:
 *   - "" / null / undefined  → returns null
 *   - "/pinnacle-website/api/v1/storage/objects/public/mock-tests/<id>"
 *   - "/api/v1/storage/objects/public/mock-tests/<id>"
 *
 * Returns the trimmed string when valid, or null when empty/invalid.
 * Throws when the value is non-empty but does not match the allowed prefix.
 */
export function validateMockTestImageUrl(input: unknown): string | null {
  if (input === null || input === undefined) return null;
  if (typeof input !== "string") {
    throw new Error("Image URL must be a string");
  }
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Allow our own serving route, with or without the artifact base-path prefix.
  const allowedSuffix = "/api/v1/storage/objects/public/mock-tests/";
  const idx = trimmed.indexOf(allowedSuffix);
  if (idx === -1 || (idx !== 0 && trimmed[idx - 1] === ":")) {
    // Either the suffix isn't present, or it appears after a scheme like "https:" — reject.
    throw new Error("Image URL must point to an uploaded mock-test image (use the upload button)");
  }
  // Must start at index 0 (just the path) or after a single base-path prefix segment.
  // Reject any scheme/host (http://, https://, //evil.com, etc.).
  const prefix = trimmed.slice(0, idx);
  if (prefix.includes("://") || prefix.startsWith("//") || prefix.includes(":")) {
    throw new Error("Image URL must be a relative path to the storage route");
  }
  return trimmed;
}
