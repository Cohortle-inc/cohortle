'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useDiscoverBookmarks } from '@/lib/hooks/useDiscoverBookmarks';
import { SaveOpportunityModal } from '@/components/discovery/SaveOpportunityModal';

interface DetailPageSaveButtonProps {
  id: number;
  title: string;
  organisationName: string;
  applyUrl: string | null;
}

export function DetailPageSaveButton({
  id,
  title,
  organisationName,
  applyUrl,
}: DetailPageSaveButtonProps) {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark, hydrated } = useDiscoverBookmarks();
  const [modalOpen, setModalOpen] = useState(false);

  // Saved state works for all users (localStorage)
  const saved = hydrated && isBookmarked(id);

  function handleClick() {
    toggleBookmark({
      id,
      name: title,
      organisation_name: organisationName,
      apply_url: applyUrl,
      organisation_url: null,
    });
    // Prompt unauthenticated users to sign up after saving
    if (!user && !saved) {
      setModalOpen(true);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={saved ? 'Remove from saved' : 'Save this opportunity'}
        aria-pressed={saved}
        className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
          saved
            ? 'border-[#391D65] bg-[#391D65]/5 text-[#391D65] hover:bg-[#391D65]/10'
            : 'border-gray-300 text-gray-700 hover:border-[#391D65] hover:text-[#391D65]'
        }`}
      >
        <svg
          className="w-4 h-4 flex-none"
          fill={saved ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {saved ? 'Saved to your list' : 'Save opportunity'}
      </button>

      {/* Soft nudge for unauthenticated users — not a gate */}
      {!user && (
        <p className="text-xs text-gray-500 text-center mt-1">
          <a href="/signup" className="underline hover:text-[#391D65]">Sign up free</a> to sync your saved list across devices
        </p>
      )}

      {/* Modal shown after saving when not logged in */}
      <SaveOpportunityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        opportunityTitle={title}
        pendingBookmark={{ id, name: title, organisation_name: organisationName, apply_url: applyUrl }}
      />
    </>
  );
}
