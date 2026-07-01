import Link from 'next/link';
import React from 'react';

interface FunnelLayoutProps {
  children: React.ReactNode;
}

/**
 * Stripped layout for funnel pages (/apply, /apply/form, /apply/confirmation).
 * No main site navigation — keeps visitors focused on the funnel.
 * Requirements: 2.3, 5.3
 */
export default function FunnelLayout({ children }: FunnelLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Minimal header — logo only, no nav */}
      <header className="border-b border-slate-100 py-4 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-xl font-bold text-[#391D65]">
            Cohortle
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Minimal footer */}
      <footer className="border-t border-slate-100 py-6 px-5 sm:px-8 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} Cohortle. All rights reserved.
      </footer>
    </div>
  );
}
