'use client';

import { useDiscoverBookmarks, BookmarkedProgramme } from '@/lib/hooks/useDiscoverBookmarks';

interface DiscoverBookmarkButtonProps {
  programme: Omit<BookmarkedProgramme, 'savedAt'>;
  className?: string;
}

export function DiscoverBookmarkButton({ programme, className = '' }: DiscoverBookmarkButtonProps) {
  const { isBookmarked, toggleBookmark, hydrated } = useDiscoverBookmarks();

  // Don't render until hydrated to avoid SSR mismatch
  if (!hydrated) {
    return (
      <button
        disabled
        aria-label="Save programme"
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-200 text-gray-400 text-sm ${className}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Save
      </button>
    );
  }

  const saved = isBookmarked(programme.id);

  return (
    <button
      onClick={() => toggleBookmark(programme)}
      aria-label={saved ? 'Remove from saved' : 'Save programme'}
      aria-pressed={saved}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
        saved
          ? 'border-[#391D65] bg-[#391D65]/5 text-[#391D65] hover:bg-[#391D65]/10'
          : 'border-gray-300 text-gray-700 hover:border-[#391D65] hover:text-[#391D65]'
      } ${className}`}
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
  );
}
