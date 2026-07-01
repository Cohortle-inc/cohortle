'use client';

import Link from 'next/link';
import { useDiscoverBookmarks } from '@/lib/hooks/useDiscoverBookmarks';

export function SavedProgrammesPanel() {
  const { bookmarks, hydrated, removeBookmark, count } = useDiscoverBookmarks();

  if (!hydrated || count === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
      <details className="bg-white border border-[#391D65]/20 rounded-lg overflow-hidden">
        <summary className="px-5 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50 transition-colors">
          <span className="text-sm font-semibold text-[#391D65] flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved programmes ({count})
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <ul className="divide-y divide-gray-100 px-5 pb-3">
          {bookmarks.map((b) => (
            <li key={b.id} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                <p className="text-xs text-gray-500 truncate">{b.organisation_name}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {b.apply_url && (
                  <Link
                    href={b.apply_url}
                    className="text-xs font-semibold text-white bg-[#391D65] px-3 py-1.5 rounded-md hover:bg-[#5B3A8F] transition-colors"
                  >
                    Apply
                  </Link>
                )}
                <button
                  onClick={() => removeBookmark(b.id)}
                  aria-label={`Remove ${b.name} from saved`}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
