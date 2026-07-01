'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface DiscoverErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DiscoverError({ error, reset }: DiscoverErrorProps) {
  useEffect(() => {
    console.error('Discover page error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-50 pt-16 md:pt-32 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white border border-gray-200 rounded-lg p-10 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Couldn&apos;t load programmes
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            We had trouble fetching open programmes. This is usually temporary — try again in a moment.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-md bg-[#391D65] text-white text-sm font-semibold hover:bg-[#5B3A8F] transition-colors"
            >
              Try again
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 text-sm font-semibold hover:border-[#391D65] hover:text-[#391D65] transition-colors"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
