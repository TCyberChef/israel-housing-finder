import { useState } from 'react';
import { AppHeader } from './components/Layout/AppHeader';
import { SplitLayout } from './components/Layout/SplitLayout';
import { LeafletMap } from './components/Map/LeafletMap';
import { ListingList } from './components/Listings/ListingList';
import { FilterPanel } from './components/Filters/FilterPanel';
import { useListings } from './hooks/useListings';
import { useFilters } from './hooks/useFilters';
import { useFilteredListings } from './hooks/useFilteredListings';
import { useRTL } from './hooks/useRTL';
import './App.css';

function App() {
  const { listings, loading, error } = useListings();
  const { filters, setFilter, clearFilters, hasActiveFilters } = useFilters();
  const filteredListings = useFilteredListings(listings, filters);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Apply RTL layout on language change
  useRTL();

  const handleMarkerClick = (listingId: string) => {
    setHighlightedId(listingId);
    // Clear highlight after 2 seconds
    setTimeout(() => setHighlightedId(null), 2000);
  };

  return (
    <div className="app">
      <AppHeader />
      <SplitLayout
        mapContent={
          <LeafletMap
            listings={filteredListings}
            onMarkerClick={handleMarkerClick}
          />
        }
        listContent={
          <>
            <FilterPanel
              filters={filters}
              onFilterChange={setFilter}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              resultCount={filteredListings.length}
            />
            <ListingList
              listings={filteredListings}
              highlightedId={highlightedId}
              loading={loading}
              error={error}
            />
          </>
        }
      />
    </div>
  );
}

export default App;
