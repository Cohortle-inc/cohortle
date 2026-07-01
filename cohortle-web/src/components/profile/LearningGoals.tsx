'use client';

import { useState } from 'react';
import ProgressIndicator from '../learning/ProgressIndicator';

interface LearningGoal {
  type: 'lessons_per_week' | 'hours_per_week';
  target: number;
  current: number;
}

interface LearningGoalsProps {
  currentGoal?: LearningGoal;
  onSetGoal: (goal: LearningGoal) => Promise<void>;
}

export default function LearningGoals({ currentGoal, onSetGoal }: LearningGoalsProps) {
  const [isEditing, setIsEditing] = useState(!currentGoal);
  const [goalType, setGoalType] = useState<'lessons_per_week' | 'hours_per_week'>(
    currentGoal?.type || 'lessons_per_week'
  );
  const [target, setTarget] = useState(currentGoal?.target.toString() || '5');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetNum = parseInt(target);
    if (isNaN(targetNum) || targetNum <= 0) {
      setError('Please enter a valid target number');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onSetGoal({
        type: goalType,
        target: targetNum,
        current: 0,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set goal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Learning Goals</h2>
        {currentGoal && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Edit Goal
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="lessons_per_week"
                  checked={goalType === 'lessons_per_week'}
                  onChange={(e) => setGoalType(e.target.value as 'lessons_per_week')}
                  className="mr-2"
                />
                <span className="text-gray-700">Lessons per week</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="hours_per_week"
                  checked={goalType === 'hours_per_week'}
                  onChange={(e) => setGoalType(e.target.value as 'hours_per_week')}
                  className="mr-2"
                />
                <span className="text-gray-700">Hours per week</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-1">
              Target {goalType === 'lessons_per_week' ? 'Lessons' : 'Hours'}
            </label>
            <input
              type="number"
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              min="1"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Set Goal'}
            </button>
            {currentGoal && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : currentGoal ? (
        <div>
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              <span className="font-medium">Goal:</span>{' '}
              {currentGoal.target} {currentGoal.type === 'lessons_per_week' ? 'lessons' : 'hours'} per week
            </p>
            <p className="text-gray-700 mb-4">
              <span className="font-medium">This week:</span>{' '}
              {currentGoal.current} / {currentGoal.target}{' '}
              {currentGoal.type === 'lessons_per_week' ? 'lessons' : 'hours'}
            </p>
          </div>
          <ProgressIndicator
            current={currentGoal.current}
            total={currentGoal.target}
            label="Weekly Progress"
            size="medium"
          />
        </div>
      ) : null}
    </div>
  );
}
