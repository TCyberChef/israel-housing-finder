/**
 * Type definitions for the scraper system.
 * Matches the Phase 2 database schema (listings table).
 */

export interface Listing {
  /** UUID primary key */
  id: string;
  /** Street address of the listing */
  address: string;
  /** City name */
  city: string;
  /** Monthly rent in ILS */
  price: number;
  /** Number of rooms (e.g. 3, 3.5) */
  rooms: number;
  /** Size in square meters - matches database column name size_sqm */
  size_sqm?: number;
  /** Floor number */
  floor?: number;
  /** Array of photo URLs */
  photos: string[];
  /** Full URL of the original listing */
  source_url: string;
  /** Platform identifier (e.g. "yad2", "facebook") */
  source_platform: string;
  /** Platform-specific listing ID */
  source_id: string;
}

export interface ScraperResult {
  /** Array of scraped listings */
  listings: Listing[];
  /** ISO 8601 timestamp of when the scrape was performed */
  scrapedAt: string;
  /** Total number of listings scraped */
  count: number;
}
