'use client';

import { QuizSettings as QuizSettingsType } from '@/types/quiz';

interface QuizSettingsProps {
  settings: QuizSettingsType;
  onChange: (settings: QuizSettingsType) => void;
}

/**
 * QuizSettings — convener sub-component for configuring quiz-level settings.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export function QuizSettings({ settings, onChange }: QuizSettingsProps) {
  const handlePassingScore = (value: string) => {
    if (value === '') {
      onChange({ ...settings, passing_score: null });
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      onChange({ ...settings, passing_score: num });
    }
  };

  const handleTimeLimit = (value: string) => {
    if (value === '') {
      onChange({ ...settings, time_limit: null });
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      onChange({ ...settings, time_limit: num });
    }
  };

  const passingScoreError =
    settings.passing_score !== null &&
    (settings.passing_score < 1 || settings.passing_score > 100)
      ? 'Passing score must be between 1 and 100'
      : null;

  const timeLimitError =
    settings.time_limit !== null && settings.time_limit <= 0
      ? 'Time limit must be a positive number'
      : null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Quiz Settings</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Passing Score */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Passing Score (%) <span className="text-gray-400">optional</span>
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.passing_score ?? ''}
            onChange={(e) => handlePassingScore(e.target.value)}
            placeholder="e.g. 70"
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#391D65] ${
              passingScoreError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {passingScoreError && (
            <p className="mt-1 text-xs text-red-600">{passingScoreError}</p>
          )}
        </div>

        {/* Time Limit */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Time Limit (minutes) <span className="text-gray-400">optional</span>
          </label>
          <input
            type="number"
            min={1}
            value={settings.time_limit ?? ''}
            onChange={(e) => handleTimeLimit(e.target.value)}
            placeholder="e.g. 30"
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#391D65] ${
              timeLimitError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {timeLimitError && (
            <p className="mt-1 text-xs text-red-600">{timeLimitError}</p>
          )}
        </div>

        {/* Allow Retakes */}
        <div className="flex items-center pt-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allow_retakes}
              onChange={(e) =>
                onChange({ ...settings, allow_retakes: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-[#391D65] focus:ring-[#391D65]"
            />
            <span className="text-sm text-gray-700">Allow retakes</span>
          </label>
        </div>
      </div>
    </div>
  );
}
