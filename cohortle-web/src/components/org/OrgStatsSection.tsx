'use client';

import React from 'react';

interface OrgStatsSectionProps {
  stats: {
    total_learners: number;
    programmes_completed: number;
    success_rate: number;
    years_experience: number;
  } | null | undefined;
}

export default function OrgStatsSection({ stats }: OrgStatsSectionProps) {
  if (!stats) {
    return null;
  }

  const statItems = [
    {
      value: `${stats.total_learners}+`,
      label: 'Learners Trained',
      show: stats.total_learners > 0,
    },
    {
      value: stats.programmes_completed.toString(),
      label: 'Programmes Completed',
      show: stats.programmes_completed > 0,
    },
    {
      value: `${stats.success_rate}%`,
      label: 'Success Rate',
      show: stats.success_rate > 0,
    },
    {
      value: `${stats.years_experience}+`,
      label: 'Years Experience',
      show: stats.years_experience > 0,
    },
  ].filter(item => item.show);

  if (statItems.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className={`grid grid-cols-2 md:grid-cols-${Math.min(statItems.length, 4)} gap-6`}>
          {statItems.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#391D65] mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
