import { scrapeYad2 } from "./yad2";
import { upsertListings, markStaleListings } from "./db/operations";
import { log } from "./utils/logger";

/**
 * Main scraper entry point.
 *
 * Orchestrates the full scraping pipeline:
 * 1. Scrape listings from Yad2
 * 2. Upsert listings to Supabase (with deduplication)
 * 3. Mark stale listings as inactive
 */
export async function main(): Promise<void> {
  log("info", "Starting Yad2 scraper...");

  const result = await scrapeYad2();
  log("info", `Scraped ${result.count} listings`);

  if (result.count > 0) {
    try {
      await upsertListings(result.listings);
      log("info", "Listings saved to database");
    } catch (err) {
      log("error", "Failed to save listings to database", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  } else {
    log("warn", "No new listings to save — skipping upsert");
  }

  try {
    await markStaleListings();
    log("info", "Stale listings marked inactive");
  } catch (err) {
    log("error", "Failed to mark stale listings", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  log("info", "Scraper completed successfully");
}

// Execute when run directly: npx tsx src/scrapers/index.ts
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      log("error", "Scraper failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    });
}
