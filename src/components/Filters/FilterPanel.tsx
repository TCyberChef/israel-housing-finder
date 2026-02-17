import { useTranslation } from 'react-i18next';
import type { Filters } from '../../hooks/useFilters';
import './FilterPanel.css';

interface FilterPanelProps {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
}

/** Room options shown as quick-select buttons */
const ROOM_OPTIONS = [1, 2, 3, 4, 5] as const;

/** Sort options */
const SORT_OPTIONS: Array<{ value: Filters['sortBy']; labelKey: string }> = [
  { value: 'date_desc', labelKey: 'filters.sortNewest' },
  { value: 'price_asc', labelKey: 'filters.sortPriceAsc' },
  { value: 'price_desc', labelKey: 'filters.sortPriceDesc' },
];

/**
 * Search and filter panel for listing discovery.
 * Positioned above the listing list in SplitLayout.
 *
 * Filters: text search, price range, rooms, sort order
 * All changes propagate to parent immediately (no submit button).
 */
export function FilterPanel({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  resultCount,
}: FilterPanelProps) {
  const { t } = useTranslation('common');

  return (
    <div className="filter-panel" role="search" aria-label={t('filters.ariaLabel')}>
      {/* Text search */}
      <div className="filter-row">
        <input
          type="text"
          className="filter-search"
          placeholder={t('filters.searchPlaceholder')}
          value={filters.search}
          onChange={e => onFilterChange('search', e.target.value)}
          aria-label={t('filters.searchPlaceholder')}
        />
      </div>

      {/* Price range */}
      <div className="filter-row filter-price-row">
        <input
          type="number"
          className="filter-price-input"
          placeholder={t('filters.priceMin')}
          value={filters.priceMin ?? ''}
          min={0}
          step={500}
          onChange={e =>
            onFilterChange(
              'priceMin',
              e.target.value ? Number(e.target.value) : null
            )
          }
          aria-label={t('filters.priceMin')}
        />
        <span className="filter-price-sep">–</span>
        <input
          type="number"
          className="filter-price-input"
          placeholder={t('filters.priceMax')}
          value={filters.priceMax ?? ''}
          min={0}
          step={500}
          onChange={e =>
            onFilterChange(
              'priceMax',
              e.target.value ? Number(e.target.value) : null
            )
          }
          aria-label={t('filters.priceMax')}
        />
        <span className="filter-price-unit">₪</span>
      </div>

      {/* Rooms quick-select */}
      <div className="filter-row filter-rooms-row">
        <span className="filter-label">{t('filters.rooms')}</span>
        <div className="filter-rooms-buttons" role="group" aria-label={t('filters.rooms')}>
          {ROOM_OPTIONS.map(n => (
            <button
              key={n}
              className={`filter-room-btn ${filters.rooms === n ? 'active' : ''}`}
              onClick={() =>
                onFilterChange('rooms', filters.rooms === n ? null : n)
              }
              aria-pressed={filters.rooms === n}
            >
              {n === 5 ? '5+' : n}
            </button>
          ))}
        </div>
      </div>

      {/* Sort and result count */}
      <div className="filter-row filter-sort-row">
        <select
          className="filter-sort-select"
          value={filters.sortBy}
          onChange={e =>
            onFilterChange('sortBy', e.target.value as Filters['sortBy'])
          }
          aria-label={t('filters.sortLabel')}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>

        <span className="filter-result-count">
          {t('filters.resultCount', { count: resultCount })}
        </span>

        {hasActiveFilters && (
          <button
            className="filter-clear-btn"
            onClick={onClearFilters}
            aria-label={t('filters.clearAll')}
          >
            {t('filters.clearAll')}
          </button>
        )}
      </div>
    </div>
  );
}
