'use client';

import React from 'react';
import { LearnerHistoryEntry } from '@/lib/api/convener';

interface LearnerProgrammeHistoryProps {
  history: LearnerHistoryEntry[];
}

export default function LearnerProgrammeHistory({ history = [] }: LearnerProgrammeHistoryProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'removed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Programme History</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme / Cohort</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(history || []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500 italic">
                  No programme history found.
                </td>
              </tr>
            ) : (
              (history || []).map((entry, idx) => (
                <tr key={`${entry.programmeId}-${entry.cohortId}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{entry.programmeName}</div>
                    <div className="text-xs text-gray-500">{entry.cohortName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.enrolledAt ? new Date(entry.enrolledAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(entry.status || '')}`}>
                      {(entry.status || 'unknown').charAt(0).toUpperCase() + (entry.status || 'unknown').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 w-24 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${entry.completionPercentage === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                          style={{ width: `${entry.completionPercentage || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-700">{Math.round(entry.completionPercentage || 0)}%</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {entry.completedLessons || 0} / {entry.totalLessons || 0} lessons
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
