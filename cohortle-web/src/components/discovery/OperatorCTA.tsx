'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';

export function OperatorCTA() {
  const { user } = useAuth();

  // Hide for authenticated conveners and admins — they already have accounts
  if (user && (user.role === 'convener' || user.role === 'administrator')) {
    return null;
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-[#391D65]/10 flex items-center justify-center flex-none">
        <svg className="w-5 h-5 text-[#391D65]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <div className="flex-1">
        <h2 className="text-base font-semibold text-gray-950">Running a programme?</h2>
        <p className="mt-0.5 text-sm text-gray-600">
          Cohortle gives you everything to manage cohorts, track learner progress, and build community — all in one place.
        </p>
      </div>
      <Link
        href="/apply"
        className="flex-none px-5 py-2.5 rounded-md bg-[#391D65] text-white text-sm font-semibold hover:bg-[#5B3A8F] transition-colors whitespace-nowrap"
      >
        Get started →
      </Link>
    </section>
  );
}
