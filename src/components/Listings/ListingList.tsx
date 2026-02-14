import { useTranslation } from 'react-i18next';
import { ListingCard } from './ListingCard';
import type { Listing } from '../../types/listing';

interface ListingListProps {
  listings: Listing[];
  highlightedId: string | null;
  loading: boolean;
  error: Error | null;
}

export function ListingList({ listings, highlightedId, loading, error }: ListingListProps) {
  const { t } = useTranslation('common');

  if (loading) {
    return (
      <div className="listing-list-status">
        {t('map.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="listing-list-status error">
        {error.message}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="listing-list-status">
        {t('map.noListings')}
      </div>
    );
  }

  return (
    <div className="listing-list">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          highlighted={listing.id === highlightedId}
        />
      ))}
    </div>
  );
}
