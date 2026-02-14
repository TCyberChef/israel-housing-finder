import { useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type { Marker as LeafletMarker } from 'leaflet';
import type { Listing } from '../../types/listing';

interface ClusterMarkersProps {
  listings: Listing[];
  onMarkerClick: (listingId: string) => void;
}

export function ClusterMarkers({ listings, onMarkerClick }: ClusterMarkersProps) {
  // Filter listings with valid coordinates
  const validListings = listings.filter(
    (listing) => listing.latitude && listing.longitude
  );

  return (
    <MarkerClusterGroup>
      {validListings.map((listing) => (
        <ListingMarker
          key={listing.id}
          listing={listing}
          onMarkerClick={onMarkerClick}
        />
      ))}
    </MarkerClusterGroup>
  );
}

interface ListingMarkerProps {
  listing: Listing;
  onMarkerClick: (listingId: string) => void;
}

function ListingMarker({ listing, onMarkerClick }: ListingMarkerProps) {
  const markerRef = useRef<LeafletMarker>(null);

  const handleClick = () => {
    // Open popup on map
    markerRef.current?.openPopup();

    // Scroll to corresponding listing card
    const cardElement = document.getElementById(`listing-${listing.id}`);
    cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Notify parent for highlighting
    onMarkerClick(listing.id);
  };

  return (
    <Marker
      ref={markerRef}
      position={[listing.latitude!, listing.longitude!]}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div style={{ minWidth: '150px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {listing.address}
          </p>
          <p style={{ margin: 0 }}>
            ₪{listing.price.toLocaleString()}/חודש
          </p>
          <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
            {listing.rooms} חדרים · {listing.size_sqm} מ"ר
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
