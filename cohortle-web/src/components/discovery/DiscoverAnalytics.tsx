'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/utils/analytics';

interface DiscoverAnalyticsProps {
  programmeCount: number;
  hasFilters: boolean;
  activeFilters: {
    query?: string;
    format?: string;
    free?: boolean;
    closingSoon?: boolean;
    sort?: string;
  };
}

export function DiscoverAnalytics({ programmeCount, hasFilters, activeFilters }: DiscoverAnalyticsProps) {
  useEffect(() => {
    // Track page view
    trackEvent('discover_page_view', {
      programme_count: programmeCount,
      has_filters: hasFilters,
    });

    // Track filter usage if filters are active
    if (hasFilters) {
      const filterTypes = [];
      if (activeFilters.query) filterTypes.push('keyword');
      if (activeFilters.format) filterTypes.push('format');
      if (activeFilters.free) filterTypes.push('free');
      if (activeFilters.closingSoon) filterTypes.push('closing_soon');
      if (activeFilters.sort && activeFilters.sort !== 'closing') filterTypes.push('sort');

      trackEvent('discover_filters_used', {
        filter_types: filterTypes.join(','),
        result_count: programmeCount,
      });
    }
  }, [programmeCount, hasFilters, activeFilters]);

  return null;
}
