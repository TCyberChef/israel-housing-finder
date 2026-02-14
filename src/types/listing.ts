/**
 * Listing type matching Supabase listings table schema
 * Schema defined in: supabase/migrations/20260213010445_create_core_schema.sql
 */

export interface Listing {
  id: string;
  address: string;
  city: string;
  price: number; // Rent price in ILS (shekels)
  rooms: number; // Room count (e.g., 2.5)
  size_sqm: number | null; // Square meters
  floor: number | null;
  photos: string[]; // JSONB array of photo URLs
  sources: Source[]; // JSONB array of platform sources
  description: string | null;
  contact_info: string | null;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp

  // Not in database - enriched by frontend for map display
  latitude?: number;
  longitude?: number;
}

export interface Source {
  platform: string; // e.g., "yad2", "homeless"
  listing_id: string; // Original listing ID from source
  url: string; // Original listing URL
  scraped_at: string; // ISO 8601 timestamp
}

/**
 * Database query result type
 * Before coordinate enrichment
 */
export type ListingRow = Omit<Listing, 'latitude' | 'longitude'>;
