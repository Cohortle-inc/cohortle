'use client';

import { useState, useEffect } from 'react';
import { getQuizResults } from '@/lib/api/lessons';
import type { QuizLearnerResult } from '@/types/quiz';

interface QuizResultsViewProps {
  lessonId: string;
}

export function QuizResultsView({ lessonId }: QuizResultsViewProps) {
  const [results, setResults] = useState<QuizLearnerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    getQuizResults(lessonId)
      .then(setResults)
      .catch((err) => setError(err.message || 'Failed to load results'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) {
    return (
      <div className="py-6 text-center text-sm text-gray-500">Loading results…</div>
    );
  }

  if (error) {
    return (
      <div className="py-4 px-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No learners have attempted this quiz yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 font-medium text-gray-700">Learner</th>
            <th className="px-4 py-3 font-medium text-gray-700">Score</th>
            <th className="px-4 py-3 font-medium text-gray-700">Status</th>
            <th className="px-4 py-3 font-medium text-gray-700">Attempts</th>
            <th className="px-4 py-3 font-medium text-gray-700">Last Submitted</th>
            <th className="px-4 py-3 font-medium text-gray-700 sr-only">Details</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <>
              <tr
                key={row.user_id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900">{row.learner_name}</td>
                <td className="px-4 py-3 text-gray-700">{row.latest_score}%</td>
                <td className="px-4 py-3">
                  {row.passed ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Failed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{row.attempt_count}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(row.last_submitted_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setExpandedRow(expandedRow === row.user_id ? null : row.user_id)}
                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                    aria-expanded={expandedRow === row.user_id}
                  >
                    {expandedRow === row.user_id ? 'Hide' : 'View answers'}
                  </button>
                </td>
              </tr>
              {expandedRow === row.user_id && (
                <tr key={`${row.user_id}-detail`} className="bg-blue-50">
                  <td colSpan={6} className="px-6 py-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                      Answer Breakdown
                    </p>
                    <div className="space-y-1">
                      {Object.entries(row.answers).map(([qId, answer]) => (
                        <div key={qId} className="text-xs text-gray-700">
                          <span className="font-mono text-gray-400 mr-2">{qId}:</span>
                          {String(answer)}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
