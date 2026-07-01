'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import type { DiscoverProgramme } from '@/lib/api/programmes';
import type { ExternalOpportunity } from '@/lib/api/opportunities';
import { ProgrammeCardAnalytics } from '@/components/discovery/ProgrammeCardAnalytics';
import { DiscoverBookmarkButton } from '@/components/discovery/DiscoverBookmarkButton';
import { ExternalOpportunityCard } from '@/components/discovery/ExternalOpportunityCard';

const PAGE_SIZE = 18;

const formatLabels: Record<string, string> = {
  online: 'Online',
  'in-person': 'In-person',
  hybrid: 'Hybrid',
};

// Use T00:00:00 to avoid UTC-offset date shift on DATEONLY strings
function deadlineLabel(deadline: string | null) {
  if (!deadline) return null;
  const deadlineDate = new Date(deadline + 'T00:00:00');
  const days = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const date = deadlineDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  if (days <= 0) return `Closes ${date}`;
  if (days <= 7) return `Closing soon: ${date}`;
  return `Deadline: ${date}`;
}

function CohortleProgrammeCard({ programme }: { programme: DiscoverProgramme }) {
  const deadline = deadlineLabel(programme.application_deadline);

  // Shareable programme page on Cohortle's own domain
  const programmePage = programme.application_form_slug
    ? `/discover/programmes/${programme.application_form_slug}`
    : `/programmes/${programme.id}/public`;

  return (
    <article className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {programme.thumbnail_url && (
        <div className="relative h-40 bg-gray-100">
          <a href={programmePage} aria-label={`View ${programme.name}`}>
            <Image
              src={programme.thumbnail_url}
              alt={programme.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          </a>
        </div>
      )}

      <div className="p-5 flex flex-col gap-3">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded bg-[#391D65]/10 text-[#391D65] text-xs font-medium border border-[#391D65]/20">
            Hosted on Cohortle
          </span>
          {programme.format && (
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
              {formatLabels[programme.format] || programme.format}
            </span>
          )}
          {programme.price_info && (
            <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-medium">
              {programme.price_info}
            </span>
          )}
        </div>

        {/* Title + org */}
        <div>
          <p className="text-xs text-gray-500 mb-0.5">{programme.organisation_name}</p>
          <h2 className="text-base font-semibold text-gray-950 leading-snug">
            <a href={programmePage} className="hover:text-[#391D65] transition-colors">
              {programme.name}
            </a>
          </h2>
          {programme.description && (
            <p className="mt-1.5 text-sm text-gray-500 leading-5 line-clamp-2">{programme.description}</p>
          )}
        </div>

        {/* Deadline */}
        {deadline && (
          <p className="text-xs font-medium text-amber-700">{deadline}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-gray-100">
          <ProgrammeCardAnalytics
            href={programmePage}
            programmeId={programme.id}
            programmeName={programme.name}
            actionType="view_org"
            className="flex-1 inline-flex justify-center items-center px-3 py-2 rounded-md bg-[#391D65] text-white text-sm font-semibold hover:bg-[#5B3A8F] transition-colors"
          >
            View programme
          </ProgrammeCardAnalytics>

          <DiscoverBookmarkButton
            programme={{
              id: programme.id,
              name: programme.name,
              organisation_name: programme.organisation_name,
              apply_url: programme.apply_url,
              organisation_url: programme.organisation_url,
            }}
          />
        </div>
      </div>
    </article>
  );
}

export type DiscoverItem =
  | (DiscoverProgramme & { source: 'cohortle' })
  | (ExternalOpportunity & { source: 'external' });

interface DiscoverProgrammeGridProps {
  items: DiscoverItem[];
}

export function DiscoverProgrammeGrid({ items }: DiscoverProgrammeGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  const visible = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const remaining = items.length - visibleCount;

  if (items.length === 0) {
    return (
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-10 text-center">
        <h2 className="text-lg font-semibold text-gray-900">No open opportunities found</h2>
        <p className="mt-2 text-sm text-gray-600">
          Try a broader search or check back when new opportunities are added.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((item) =>
          item.source === 'external' ? (
            <ExternalOpportunityCard key={`ext-${item.id}`} opportunity={item} />
          ) : (
            <CohortleProgrammeCard key={`prog-${item.id}`} programme={item} />
          )
        )}
      </div>

      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <button
            onClick={loadMore}
            className="px-6 py-3 rounded-md border border-[#391D65] text-[#391D65] text-sm font-semibold hover:bg-[#391D65] hover:text-white transition-colors"
          >
            Load more opportunities
          </button>
          <p className="text-xs text-gray-500">
            Showing {visible.length} of {items.length} — {remaining} more to show
          </p>
        </div>
      )}
    </>
  );
}
