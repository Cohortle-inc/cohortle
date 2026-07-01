'use client';

/**
 * Module Header Component
 * Displays module name, description, and breadcrumb navigation
 */

import React from 'react';
import Link from 'next/link';

interface ModuleHeaderProps {
  module: {
    id: string;
    name: string;
    description: string;
  };
  programmeId?: string;
  programmeName?: string;
}

export function ModuleHeader({ module, programmeId, programmeName }: ModuleHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 hover:underline"
              >
                Dashboard
              </Link>
            </li>
            {programmeId && programmeName && (
              <>
                <li>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </li>
                <li>
                  <Link
                    href={`/programmes/${programmeId}`}
                    className="text-gray-500 hover:text-gray-700 hover:underline"
                  >
                    {programmeName}
                  </Link>
                </li>
              </>
            )}
            <li>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 font-medium">{module.name}</span>
            </li>
          </ol>
        </nav>

        {/* Module Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {module.name}
          </h1>
          <p className="text-gray-600">{module.description}</p>
        </div>
      </div>
    </div>
  );
}
