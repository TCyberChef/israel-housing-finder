import { useMemo } from 'react';
import type { Listing } from '../types/listing';
import type { Filters } from './useFilters';

/**
 * Apply filters and sorting to a listing array.
 * Pure client-side — no additional network requests.
 *
 * Filter logic:
 * - search: case-insensitive substring match on city OR address
 * - priceMin/priceMax: inclusive range (0-price listings are excluded unless priceMax is null)
 * - rooms: listings where rooms >= rooms (e.g. filter=2 includes 2, 2.5, 3, ...)
 * - sortBy: applied after filtering
 */
export function useFilteredListings(
  listings: Listing[],
  filters: Filters
): Listing[] {
  return useMemo(() => {
    let result = [...listings];

    // Text search: city or address
    if (filters.search.trim()) {
      const query = filters.search.trim().toLowerCase();
      result = result.filter(
        l =>
          l.city.toLowerCase().includes(query) ||
          l.address.toLowerCase().includes(query)
      );
    }

    // Price range
    if (filters.priceMin !== null) {
      result = result.filter(l => l.price >= filters.priceMin!);
    }
    if (filters.priceMax !== null) {
      result = result.filter(l => l.price <= filters.priceMax!);
    }

    // Rooms filter: show listings with rooms >= selected minimum
    // e.g. "3 rooms" shows 3, 3.5, 4, 4.5, ...
    if (filters.rooms !== null) {
      result = result.filter(l => l.rooms >= filters.rooms!);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'date_desc':
      default:
        result.sort((a, b) =>
          b.created_at.localeCompare(a.created_at)
        );
        break;
    }

    return result;
  }, [listings, filters]);
}
