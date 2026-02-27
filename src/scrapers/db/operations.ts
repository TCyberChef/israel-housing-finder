import { getSupabaseClient } from "./client";
import { generateDedupeHash } from "../utils/hash";
import { Listing } from "../types";
import { log } from "../utils/logger";

/** Number of days after which unseen listings are marked inactive */
const STALE_DAYS = 7;

/**
 * Upsert scraped listings into the database.
 *
 * For each listing:
 * 1. Generate content_hash from address, rooms, size_sqm
 * 2. Check dedupe_hashes table for existing hash
 * 3. If found: update existing listing's mutable fields (price, photos, sources, last_seen, is_active)
 * 4. If not found: insert new listing + dedupe_hashes row
 *
 * Uses Phase 2's dedupe_hashes table for deduplication and
 * sources JSONB array format for source attribution.
 */
export async function upsertListings(listings: Listing[]): Promise<void> {
  const supabase = getSupabaseClient();
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const listing of listings) {
    try {
      const contentHash = generateDedupeHash(
        listing.address,
        listing.rooms,
        listing.size_sqm
      );

      // Check if this content hash already exists in dedupe_hashes
      const { data: existing, error: lookupError } = await supabase
        .from("dedupe_hashes")
        .select("listing_id")
        .eq("content_hash", contentHash)
        .maybeSingle();

      if (lookupError) {
        log("error", "Failed to look up dedupe hash", {
          content_hash: contentHash,
          error: lookupError.message,
        });
        errors++;
        continue;
      }

      const now = new Date().toISOString();

      // Build sources JSONB array from flat source fields
      const sources = [
        {
          platform: listing.source_platform,
          url: listing.source_url,
          scraped_at: now,
        },
      ];

      if (existing) {
        // Duplicate found: update existing listing's mutable fields
        // Fetch existing sources so we can append rather than overwrite
        const { data: existingListing } = await supabase
          .from("listings")
          .select("sources")
          .eq("id", existing.listing_id)
          .single();

        const existingSources: Array<{ platform: string; url: string; scraped_at: string }> =
          Array.isArray(existingListing?.sources) ? existingListing.sources : [];

        // Merge: replace entry for same platform, append if new platform
        const mergedSources = existingSources.filter(
          (s) => s.platform !== listing.source_platform
        );
        mergedSources.push(...sources);

        const { error: updateError } = await supabase
          .from("listings")
          .update({
            price: listing.price,
            photos: listing.photos,
            sources: mergedSources,
            last_seen: now,
            is_active: true,
          })
          .eq("id", existing.listing_id);

        if (updateError) {
          log("error", "Failed to update existing listing", {
            listing_id: existing.listing_id,
            error: updateError.message,
          });
          errors++;
          continue;
        }

        updated++;
        log("info", "Updated existing listing", {
          listing_id: existing.listing_id,
          address: listing.address,
        });
      } else {
        // New listing: insert into listings table
        const { data: newListing, error: insertError } = await supabase
          .from("listings")
          .insert({
            address: listing.address,
            city: listing.city,
            price: listing.price,
            rooms: listing.rooms,
            size_sqm: listing.size_sqm,
            floor: listing.floor,
            photos: listing.photos,
            sources,
            last_seen: now,
            is_active: true,
          })
          .select("id")
          .single();

        if (insertError || !newListing) {
          log("error", "Failed to insert new listing", {
            address: listing.address,
            error: insertError?.message || "No data returned",
          });
          errors++;
          continue;
        }

        // Insert hash row for deduplication tracking
        const { error: hashError } = await supabase
          .from("dedupe_hashes")
          .insert({
            listing_id: newListing.id,
            content_hash: contentHash,
          });

        if (hashError) {
          log("error", "Failed to insert dedupe hash", {
            listing_id: newListing.id,
            content_hash: contentHash,
            error: hashError.message,
          });
          errors++;
          continue;
        }

        inserted++;
        log("info", "Inserted new listing", {
          listing_id: newListing.id,
          address: listing.address,
          city: listing.city,
        });
      }
    } catch (error) {
      log("error", "Unexpected error processing listing", {
        address: listing.address,
        error: error instanceof Error ? error.message : String(error),
      });
      errors++;
    }
  }

  log("info", "Upsert complete", { inserted, updated, errors, total: listings.length });
}

/**
 * Mark listings as inactive if they haven't been seen in STALE_DAYS days.
 *
 * Updates is_active to false for all active listings whose last_seen
 * timestamp is older than the cutoff date.
 */
export async function markStaleListings(): Promise<void> {
  const supabase = getSupabaseClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALE_DAYS);
  const cutoffISO = cutoff.toISOString();

  const { data, error } = await supabase
    .from("listings")
    .update({ is_active: false })
    .lt("last_seen", cutoffISO)
    .eq("is_active", true)
    .select("id");

  if (error) {
    log("error", "Failed to mark stale listings", { error: error.message });
    throw error;
  }

  const count = data?.length || 0;
  log("info", "Marked stale listings inactive", {
    count,
    cutoff_date: cutoffISO,
    stale_days: STALE_DAYS,
  });
}
