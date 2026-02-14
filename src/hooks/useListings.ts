import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getCityCoordinates } from '../lib/cities';
import type { Listing, ListingRow } from '../types/listing';

interface UseListingsResult {
  listings: Listing[];
  loading: boolean;
  error: Error | null;
}

/**
 * Fetch active listings from Supabase and enrich with city coordinates
 * Uses city-level coordinates until Phase 9 adds precise geocoding
 */
export function useListings(): UseListingsResult {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        // Query active listings from database
        // RLS policy allows public read access per Phase 2
        const { data, error: queryError } = await supabase
          .from('listings')
          .select('*')
          .eq('is_active', true) // Only active listings (added in Phase 3)
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;

        // Enrich with city-level coordinates for map display
        const enrichedListings: Listing[] = (data || []).map((row: ListingRow) => {
          const [latitude, longitude] = getCityCoordinates(row.city);
          return {
            ...row,
            latitude,
            longitude,
          };
        });

        setListings(enrichedListings);
      } catch (err) {
        console.error('Failed to fetch listings:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []); // Empty dependency array - fetch once on mount

  return { listings, loading, error };
}
