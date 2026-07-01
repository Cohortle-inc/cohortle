'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ApplicationPreviewModal from './ApplicationPreviewModal';

interface Programme {
  id: number;
  name: string;
  description: string;
  application_deadline: string | null;
  application_form_slug: string | null;
  onboarding_mode: string;
  format?: string | null;
  duration?: string | null;
  highlights?: string[] | null;
  learning_outcomes?: string[] | null;
  price_info?: string | null;
  thumbnail_url?: string | null;
}

interface OrgProgrammeCardProps {
  programme: Programme;
  applied: boolean;
  onCompare?: (id: number) => void;
  compareSelected?: boolean;
}

const FORMAT_LABELS: Record<string, string> = {
  online: 'Online',
  'in-person': 'In-Person',
  hybrid: 'Hybrid',
};

export default function OrgProgrammeCard({ programme, applied, onCompare, compareSelected }: OrgProgrammeCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const deadlineText = programme.application_deadline
    ? new Date(programme.application_deadline).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const applyUrl = programme.application_form_slug
    ? `/apply/${programme.application_form_slug}`
    : null;

  const daysUntilDeadline = programme.application_deadline
    ? Math.ceil((new Date(programme.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 7 && daysUntilDeadline > 0;

  return (
    <>
      <div className={`bg-white rounded-xl border flex flex-col shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden ${compareSelected ? 'border-[#391D65] ring-2 ring-[#391D65]/30' : 'border-gray-200'}`}>
        {programme.thumbnail_url && (
          <div className="relative h-40 w-full bg-gray-100">
            <Image src={programme.thumbnail_url} alt={programme.name} fill className="object-cover" />
          </div>
        )}

        <div className="p-6 flex flex-col gap-4 flex-1">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {programme.format && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                {FORMAT_LABELS[programme.format] || programme.format}
              </span>
            )}
            {programme.duration && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                {programme.duration}
              </span>
            )}
            {programme.price_info && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                {programme.price_info}
              </span>
            )}
            {isUrgent && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded animate-pulse">
                Closing Soon
              </span>
            )}
          </div>

          {/* Title & Description */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{programme.name}</h2>
            {programme.description && (
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{programme.description}</p>
            )}
          </div>

          {/* Highlights */}
          {programme.highlights && programme.highlights.length > 0 && (
            <ul className="space-y-1">
              {programme.highlights.slice(0, 3).map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {h}
                </li>
              ))}
            </ul>
          )}

          {/* Deadline */}
          {deadlineText && (
            <div className="pt-3 border-t border-gray-100">
              <p className={`text-sm font-medium ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                Deadline: {deadlineText}
                {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
                  <span className="text-gray-400 font-normal ml-1">({daysUntilDeadline}d left)</span>
                )}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-auto">
            {applied ? (
              <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 text-sm font-medium">Application Submitted</span>
              </div>
            ) : applyUrl ? (
              <>
                <Link
                  href={applyUrl}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#391D65] text-white text-sm font-semibold hover:bg-[#5B3A8F] transition-colors"
                >
                  Apply Now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <button
                  onClick={() => setShowPreview(true)}
                  className="text-xs font-medium py-2 rounded-md border border-gray-200 text-gray-600 hover:border-[#391D65] hover:text-[#391D65] transition-colors"
                >
                  Preview application questions
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center px-4 py-3 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium">
                Applications Opening Soon
              </div>
            )}

            {onCompare && (
              <button
                onClick={() => onCompare(programme.id)}
                className={`text-xs font-medium py-1.5 rounded-md border transition-colors ${
                  compareSelected
                    ? 'bg-[#391D65] text-white border-[#391D65]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#391D65] hover:text-[#391D65]'
                }`}
              >
                {compareSelected ? '✓ Added to Compare' : 'Compare'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showPreview && applyUrl && (
        <ApplicationPreviewModal
          programmeId={programme.id}
          programmeName={programme.name}
          applyUrl={applyUrl}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
