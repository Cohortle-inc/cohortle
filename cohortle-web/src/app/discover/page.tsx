import type { Metadata } from 'next';
import Link from 'next/link';
import type { DiscoverProgrammesResponse, DiscoverProgramme } from '@/lib/api/programmes';
import type { ExternalOpportunity, PublicOpportunitiesResponse } from '@/lib/api/opportunities';
import { DiscoverAnalytics } from '@/components/discovery/DiscoverAnalytics';
import { SavedProgrammesPanel } from '@/components/discovery/SavedProgrammesPanel';
import { DiscoverProgrammeGrid, type DiscoverItem } from '@/components/discovery/DiscoverProgrammeGrid';
import { OpportunityAlertsForm } from '@/components/discovery/OpportunityAlertsForm';
import { OperatorCTA } from '@/components/discovery/OperatorCTA';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Discover Learning Opportunities | Cohortle',
  description: 'Browse fellowships, bootcamps, scholarships, accelerators, and cohort-based programmes. Find your next learning opportunity.',
  openGraph: {
    title: 'Discover Learning Opportunities | Cohortle',
    description: 'Fellowships, bootcamps, scholarships, and cohort programmes — all in one place.',
    type: 'website',
  },
};

interface DiscoverPageProps {
  searchParams?: {
    q?: string;
    format?: string;
    free?: string;
    closingSoon?: string;
    sort?: string;
  };
}

function buildQueryString(searchParams: DiscoverPageProps['searchParams']) {
  const params = new URLSearchParams();
  for (const key of ['q', 'format', 'free', 'closingSoon', 'sort'] as const) {
    const value = searchParams?.[key];
    if (value) params.set(key, value);
  }
  return params.toString();
}

function sortItems(items: DiscoverItem[]): DiscoverItem[] {
  return [...items].sort((a, b) => {
    // Featured first
    const aFeatured = 'is_featured' in a ? (a.is_featured ? 1 : 0) : 0;
    const bFeatured = 'is_featured' in b ? (b.is_featured ? 1 : 0) : 0;
    if (bFeatured !== aFeatured) return bFeatured - aFeatured;

    // Then by deadline ascending (nulls last)
    const aDeadline = ('application_deadline' in a ? a.application_deadline : null) ?? ('deadline' in a ? a.deadline : null);
    const bDeadline = ('application_deadline' in b ? b.application_deadline : null) ?? ('deadline' in b ? b.deadline : null);

    if (!aDeadline && !bDeadline) return 0;
    if (!aDeadline) return 1;
    if (!bDeadline) return -1;
    return new Date(aDeadline).getTime() - new Date(bDeadline).getTime();
  });
}

async function getDiscoverData(searchParams: DiscoverPageProps['searchParams']) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cohortle.com';
  const qs = buildQueryString(searchParams);
  const suffix = qs ? `?${qs}` : '';

  const [programmesRes, opportunitiesRes] = await Promise.allSettled([
    fetch(`${apiUrl}/v1/api/programmes/discover${suffix}`, { next: { revalidate: 300 } }),
    fetch(`${apiUrl}/v1/api/opportunities/public${suffix}`, { next: { revalidate: 300 } }),
  ]);

  const programmes: DiscoverProgramme[] =
    programmesRes.status === 'fulfilled' && programmesRes.value.ok
      ? ((await programmesRes.value.json()) as DiscoverProgrammesResponse).programmes || []
      : [];

  const opportunities: ExternalOpportunity[] =
    opportunitiesRes.status === 'fulfilled' && opportunitiesRes.value.ok
      ? ((await opportunitiesRes.value.json()) as PublicOpportunitiesResponse).opportunities || []
      : [];

  const merged: DiscoverItem[] = sortItems([
    ...programmes.map((p) => ({ ...p, source: 'cohortle' as const })),
    ...opportunities.map((o) => ({ ...o, source: 'external' as const })),
  ]);

  return { merged, programmeCount: programmes.length, opportunityCount: opportunities.length };
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const { merged, programmeCount, opportunityCount } = await getDiscoverData(searchParams);

  const activeQuery = searchParams?.q || '';
  const activeFormat = searchParams?.format || '';
  const activeSort = searchParams?.sort || 'closing';
  const freeOnly = searchParams?.free === 'true';
  const closingSoon = searchParams?.closingSoon === 'true';
  const hasFilters = !!(activeQuery || activeFormat || freeOnly || closingSoon || (activeSort && activeSort !== 'closing'));

  return (
    <main className="min-h-screen bg-gray-50 pt-16 md:pt-32">
      <DiscoverAnalytics
        programmeCount={merged.length}
        hasFilters={hasFilters}
        activeFilters={{
          query: activeQuery,
          format: activeFormat,
          free: freeOnly,
          closingSoon: closingSoon,
          sort: activeSort,
        }}
      />

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-sm font-semibold text-[#391D65] mb-2">Open opportunities</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-950">Discover opportunities</h1>
          <p className="mt-3 max-w-2xl text-gray-600 leading-7">
            Fellowships, bootcamps, scholarships, accelerators, and cohort-based programmes — all in one place.
          </p>
        </div>
      </section>

      <SavedProgrammesPanel />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form className="bg-white border border-gray-200 rounded-lg p-4 grid gap-3 lg:grid-cols-[1fr_180px_160px_160px_140px]">
          <label className="block">
            <span className="text-xs font-medium text-gray-600">Keyword</span>
            <input
              name="q"
              defaultValue={activeQuery}
              placeholder="Leadership, founders, NGO, remote..."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-600">Format</span>
            <select
              name="format"
              defaultValue={activeFormat}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
            >
              <option value="">Any format</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
              <option value="in-person">In-person</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-600">Sort</span>
            <select
              name="sort"
              defaultValue={activeSort}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65]"
            >
              <option value="closing">Closing soon</option>
              <option value="newest">Newest</option>
              <option value="name">Name</option>
            </select>
          </label>

          <div className="flex items-end gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="free" value="true" defaultChecked={freeOnly} className="h-4 w-4 rounded border-gray-300 text-[#391D65]" />
              Free/funded
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="closingSoon" value="true" defaultChecked={closingSoon} className="h-4 w-4 rounded border-gray-300 text-[#391D65]" />
              7 days
            </label>
          </div>

          <div className="flex items-end">
            <button className="w-full px-4 py-2.5 rounded-md bg-[#391D65] text-white text-sm font-semibold hover:bg-[#5B3A8F] transition-colors">
              Search
            </button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {merged.length} {merged.length === 1 ? 'opportunity' : 'opportunities'} found
            {programmeCount > 0 && opportunityCount > 0 && (
              <span className="text-gray-400 ml-1">
                ({programmeCount} on Cohortle, {opportunityCount} external)
              </span>
            )}
          </p>
          {hasFilters && (
            <Link href="/discover" className="text-sm font-medium text-[#391D65] hover:text-[#5B3A8F]">
              Clear filters
            </Link>
          )}
        </div>

        <DiscoverProgrammeGrid items={merged} />

        {/* Operator CTA */}
        <div className="mt-10">
          <OperatorCTA />
        </div>

        {/* Opportunity alerts */}
        <div className="mt-6">
          <OpportunityAlertsForm />
        </div>
      </section>
    </main>
  );
}
