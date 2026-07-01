'use client';

import React from 'react';
import Link from 'next/link';

export default function OrgHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[#391D65] hover:text-[#5B3A8F] transition-colors">
          Cohortle
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <a 
            href="#programmes" 
            className="text-sm sm:text-base text-gray-700 hover:text-[#391D65] transition-colors"
          >
            Programmes
          </a>
          <Link 
            href="/login" 
            className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#391D65] text-white rounded-md hover:bg-[#5B3A8F] transition-colors font-medium"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}
