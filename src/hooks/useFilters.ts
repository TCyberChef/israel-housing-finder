import { useState, useCallback } from 'react';

/**
 * Filter and sort state for the listing search UI.
 * All filters are optional — null means "no filter applied".
 */
export interface Filters {
  /** Text search — matched against city and address */
  search: string;
  /** Minimum monthly rent in ILS */
  priceMin: number | null;
  /** Maximum monthly rent in ILS */
  priceMax: number | null;
  /** Minimum number of rooms (e.g. 2 matches 2, 2.5, 3, ...) */
  roomsMin: number | null;
  /** Exact rooms value filter (e.g. 3 matches only 3 and 3.5) */
  rooms: number | null;
  /** Sort order for results */
  sortBy: 'date_desc' | 'price_asc' | 'price_desc';
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  priceMin: null,
  priceMax: null,
  roomsMin: null,
  rooms: null,
  sortBy: 'date_desc',
};

interface UseFiltersResult {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Manage search and filter state for listing discovery.
 * Client-side filtering applied by useFilteredListings.
 */
export function useFilters(): UseFiltersResult {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const setFilter = useCallback(<K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.roomsMin !== null ||
    filters.rooms !== null;

  return { filters, setFilter, clearFilters, hasActiveFilters };
}
