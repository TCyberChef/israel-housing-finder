import { MapContainer, TileLayer } from 'react-leaflet';
import { ClusterMarkers } from './ClusterMarkers';
import type { Listing } from '../../types/listing';

interface LeafletMapProps {
  listings: Listing[];
  onMarkerClick: (listingId: string) => void;
}

// Israel center and zoom level to show entire country
const ISRAEL_CENTER: [number, number] = [31.5, 34.8];
const ISRAEL_ZOOM = 7;

export function LeafletMap({ listings, onMarkerClick }: LeafletMapProps) {
  return (
    <MapContainer
      center={ISRAEL_CENTER}
      zoom={ISRAEL_ZOOM}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ClusterMarkers listings={listings} onMarkerClick={onMarkerClick} />
    </MapContainer>
  );
}
