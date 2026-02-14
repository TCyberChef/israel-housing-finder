import { useTranslation } from 'react-i18next';
import type { Listing } from '../../types/listing';

interface ListingCardProps {
  listing: Listing;
  highlighted?: boolean;
}

export function ListingCard({ listing, highlighted }: ListingCardProps) {
  const { t } = useTranslation('common');

  // Use first photo or placeholder
  const photoUrl = listing.photos[0] || 'https://via.placeholder.com/150x100?text=No+Photo';

  return (
    <div
      id={`listing-${listing.id}`}
      className={`listing-card ${highlighted ? 'highlighted' : ''}`}
    >
      <img
        src={photoUrl}
        alt={listing.address}
        className="listing-photo"
      />
      <div className="listing-details">
        <div className="listing-price">
          {t('listing.price', { price: listing.price.toLocaleString() })}
        </div>
        <div className="listing-specs">
          <span>{t('listing.rooms', { count: listing.rooms })}</span>
          {listing.size_sqm && (
            <span> · {t('listing.sqm', { size: listing.size_sqm })}</span>
          )}
          {listing.floor !== null && (
            <span> · {t('listing.floor', { floor: listing.floor })}</span>
          )}
        </div>
        <div className="listing-address">
          {listing.address}, {listing.city}
        </div>
        {listing.description && (
          <div className="listing-description">
            {listing.description.slice(0, 150)}
            {listing.description.length > 150 ? '...' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
