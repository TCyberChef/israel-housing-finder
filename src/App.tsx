import { useState } from 'react';
import { AppHeader } from './components/Layout/AppHeader';
import { SplitLayout } from './components/Layout/SplitLayout';
import { LeafletMap } from './components/Map/LeafletMap';
import { ListingList } from './components/Listings/ListingList';
import { useListings } from './hooks/useListings';
import { useRTL } from './hooks/useRTL';
import './App.css';

function App() {
  const { listings, loading, error } = useListings();
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
            listings={listings}
            onMarkerClick={handleMarkerClick}
          />
        }
        listContent={
          <ListingList
            listings={listings}
            highlightedId={highlightedId}
            loading={loading}
            error={error}
          />
        }
      />
    </div>
  );
}

export default App;
