// Fix Leaflet default marker icons for Vite/Webpack bundlers
// Source: https://github.com/Leaflet/Leaflet/issues/4968
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Remove default icon URL detection (broken in bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Explicitly set icon paths
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default L;
