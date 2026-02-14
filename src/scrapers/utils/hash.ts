import { createHash } from "node:crypto";

/**
 * Generate a SHA-256 deduplication hash for a listing.
 * Uses address, rooms, and size_sqm to identify duplicate listings
 * across different platforms.
 *
 * Hash format: "${address}|${rooms}|${size_sqm || 0}"
 * Matches the dedupe_hashes table schema from Phase 2.
 */
export function generateDedupeHash(
  address: string,
  rooms: number,
  size_sqm?: number
): string {
  const content = `${address}|${rooms}|${size_sqm || 0}`;
  return createHash("sha256").update(content).digest("hex");
}
