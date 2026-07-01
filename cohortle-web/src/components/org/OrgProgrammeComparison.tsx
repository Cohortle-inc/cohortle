'use client';

import React from 'react';
import Link from 'next/link';

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
  prerequisites?: string | null;
  price_info?: string | null;
}

interface OrgProgrammeComparisonProps {
  programmes: Programme[];
  onClose: () => void;
}

const Row = ({ label, values }: { label: string; values: (string | null | undefined)[] }) => (
  <tr className="border-b border-gray-100">
    <td className="py-3 px-4 text-sm font-medium text-gray-600 bg-gray-50 w-32">{label}</td>
    {values.map((v, i) => (
      <td key={i} className="py-3 px-4 text-sm text-gray-800">
        {v || <span className="text-gray-400">—</span>}
      </td>
    ))}
  </tr>
);

const ListRow = ({ label, values }: { label: string; values: (string[] | null | undefined)[] }) => (
  <tr className="border-b border-gray-100">
    <td className="py-3 px-4 text-sm font-medium text-gray-600 bg-gray-50 align-top w-32">{label}</td>
    {values.map((v, i) => (
      <td key={i} className="py-3 px-4 text-sm text-gray-800 align-top">
        {v && v.length > 0 ? (
          <ul className="space-y-1">
            {v.map((item, j) => (
              <li key={j} className="flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
    ))}
  </tr>
);

export default function OrgProgrammeComparison({ programmes, onClose }: OrgProgrammeComparisonProps) {
  if (programmes.length < 2) return null;

  const FORMAT_LABELS: Record<string, string> = {
    online: 'Online', 'in-person': 'In-Person', hybrid: 'Hybrid',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Programme comparison">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Compare Programmes</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close comparison"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 bg-gray-50 w-32" />
                {programmes.map((p) => (
                  <th key={p.id} className="py-3 px-4 text-left">
                    <span className="text-base font-semibold text-gray-900">{p.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="Format" values={programmes.map(p => p.format ? FORMAT_LABELS[p.format] || p.format : null)} />
              <Row label="Duration" values={programmes.map(p => p.duration)} />
              <Row label="Price" values={programmes.map(p => p.price_info)} />
              <Row label="Deadline" values={programmes.map(p =>
                p.application_deadline
                  ? new Date(p.application_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : null
              )} />
              <Row label="Prerequisites" values={programmes.map(p => p.prerequisites)} />
              <ListRow label="Highlights" values={programmes.map(p => p.highlights)} />
              <ListRow label="Outcomes" values={programmes.map(p => p.learning_outcomes)} />
            </tbody>
          </table>
        </div>

        {/* Footer CTAs */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-4">
          <div className="w-32 flex-shrink-0" />
          {programmes.map((p) => (
            <div key={p.id} className="flex-1">
              {p.application_form_slug ? (
                <Link
                  href={`/apply/${p.application_form_slug}`}
                  className="block text-center px-4 py-2.5 bg-[#391D65] text-white text-sm font-semibold rounded-lg hover:bg-[#5B3A8F] transition-colors"
                >
                  Apply Now
                </Link>
              ) : (
                <div className="block text-center px-4 py-2.5 bg-gray-100 text-gray-400 text-sm rounded-lg">
                  Opening Soon
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
