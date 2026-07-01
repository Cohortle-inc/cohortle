'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ExternalOpportunity } from '@/lib/api/opportunities';
import { OPPORTUNITY_CATEGORY_LABELS } from '@/lib/api/opportunities';
import { SaveOpportunityModal } from '@/components/discovery/SaveOpportunityModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useDiscoverBookmarks } from '@/lib/hooks/useDiscoverBookmarks';
import { toIdSlug } from '@/lib/utils/slugUtils';

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
  if (days <= 0) return { text: `Closes ${date}`, urgent: false };
  if (days <= 7) return { text: `Closing soon: ${date}`, urgent: true };
  return { text: `Deadline: ${date}`, urgent: false };
}

interface ExternalOpportunityCardProps {
  opportunity: ExternalOpportunity;
}

export function ExternalOpportunityCard({ opportunity }: ExternalOpportunityCardProps) {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark, hydrated } = useDiscoverBookmarks();
  const [modalOpen, setModalOpen] = useState(false);

  const deadline = deadlineLabel(opportunity.deadline);
  const detailPage = `/discover/opportunities/${toIdSlug(opportunity.id, opportunity.title)}`;

  function handleBookmarkClick() {
    // Save for all users (localStorage) — nudge unauthenticated to sign up after
    toggleBookmark({
      id: opportunity.id,
      name: opportunity.title,
      organisation_name: opportunity.organisation,
      apply_url: opportunity.apply_url,
      organisation_url: null,
    });
    if (!user) {
      setModalOpen(true);
    }
  }

  const saved = hydrated && isBookmarked(opportunity.id);

  return (
    <article className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {opportunity.thumbnail_url && (
        <div className="relative h-40 bg-gray-100">
          <a href={detailPage} aria-label={`View ${opportunity.title}`}>
            <Image
              src={opportunity.thumbnail_url}
              alt={opportunity.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          </a>
        </div>
      )}

      <div className="p-5 flex flex-col gap-3">
        <div>
          {/* Source + category badges */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
              External
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-medium">
              {OPPORTUNITY_CATEGORY_LABELS[opportunity.category] || opportunity.category}
            </span>
            {opportunity.format && (
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                {formatLabels[opportunity.format] || opportunity.format}
              </span>
            )}
            {opportunity.price_info && (
              <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-medium">
                {opportunity.price_info}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-0.5">{opportunity.organisation}</p>
          <h2 className="text-base font-semibold text-gray-950 leading-snug">
            <a
              href={detailPage}
              className="hover:text-[#391D65] transition-colors"
            >
              {opportunity.title}
            </a>
          </h2>
          {opportunity.description && (
            <p className="mt-1.5 text-sm text-gray-500 leading-5 line-clamp-2">{opportunity.description}</p>
          )}
          {opportunity.location && (
            <p className="mt-1 text-xs text-gray-400">📍 {opportunity.location}</p>
          )}
        </div>

        {/* Deadline */}
        {deadline && (
          <p className={`text-xs font-medium ${deadline.urgent ? 'text-amber-700' : 'text-gray-500'}`}>
            {deadline.text}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-gray-100">
          <a
            href={detailPage}
            className="flex-1 inline-flex justify-center items-center px-3 py-2 rounded-md bg-[#391D65] text-white text-sm font-semibold hover:bg-[#5B3A8F] transition-colors"
          >
            View details
          </a>

          {/* Bookmark button — works for all users, nudges unauthenticated to sign up */}
          <button
            onClick={handleBookmarkClick}
            aria-label={saved ? 'Remove from saved' : 'Save opportunity'}
            aria-pressed={saved}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
              saved
                ? 'border-[#391D65] bg-[#391D65]/5 text-[#391D65] hover:bg-[#391D65]/10'
                : 'border-gray-300 text-gray-700 hover:border-[#391D65] hover:text-[#391D65]'
            }`}
          >
            <svg
              className="w-4 h-4"
              fill={saved ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <SaveOpportunityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        opportunityTitle={opportunity.title}
        pendingBookmark={{
          id: opportunity.id,
          name: opportunity.title,
          organisation_name: opportunity.organisation,
          apply_url: opportunity.apply_url,
        }}
      />
    </article>
  );
}
