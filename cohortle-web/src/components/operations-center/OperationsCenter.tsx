'use client';

import React, { useState } from 'react';
import { Learner } from '@/lib/api/convener';
import { LearnerListWithActions } from './LearnerListWithActions';
import { NotesPanel } from './NotesPanel';

interface OperationsCenterProps {
  learners: Learner[];
  cohortName: string;
  programmeName: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

/**
 * Main Operations Center component
 * Combines learner management, notes, and communication features
 */
export function OperationsCenter({
  learners,
  cohortName,
  programmeName,
  isLoading = false,
  onRefresh
}: OperationsCenterProps) {
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes'>('overview');

  const selectedLearner = selectedLearnerId
    ? learners.find((l) => l.enrollmentId === selectedLearnerId)
    : null;

  const stats = {
    total: learners.length,
    active: learners.filter((l) => l.status === 'active').length,
    suspended: learners.filter((l) => l.status === 'suspended').length,
    completed: learners.filter((l) => l.status === 'completed').length,
    avgProgress: learners.length > 0
      ? Math.round(
          learners.reduce((sum, l) => sum + (l.progress || 0), 0) / learners.length
        )
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Learner Operations Center</h1>
        <p className="text-blue-100 mb-4">
          Manage learners in <strong>{programmeName}</strong> - <strong>{cohortName}</strong>
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="text-sm opacity-90">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-green-500 bg-opacity-30 rounded-lg p-3">
            <div className="text-sm opacity-90">Active</div>
            <div className="text-2xl font-bold">{stats.active}</div>
          </div>
          <div className="bg-yellow-500 bg-opacity-30 rounded-lg p-3">
            <div className="text-sm opacity-90">Suspended</div>
            <div className="text-2xl font-bold">{stats.suspended}</div>
          </div>
          <div className="bg-blue-500 bg-opacity-30 rounded-lg p-3">
            <div className="text-sm opacity-90">Completed</div>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </div>
          <div className="bg-purple-500 bg-opacity-30 rounded-lg p-3">
            <div className="text-sm opacity-90">Avg Progress</div>
            <div className="text-2xl font-bold">{stats.avgProgress}%</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 disabled:opacity-50 transition"
          >
            {isLoading ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium transition border-b-2 ${
              activeTab === 'overview'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            📋 Learner List
          </button>
          {selectedLearner && (
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-3 font-medium transition border-b-2 ${
                activeTab === 'notes'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              📝 Notes - {selectedLearner.name}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' ? (
        <LearnerListWithActions
          learners={learners}
          isLoading={isLoading}
          onLearnerUpdated={onRefresh}
        />
      ) : (
        selectedLearner && (
          <NotesPanel
            enrollmentId={selectedLearner.enrollmentId}
            learnerName={selectedLearner.name}
          />
        )
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Quick Guide</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>📝 Note</strong>: Add support, intervention, or general notes</li>
          <li>• <strong>💬 Message</strong>: Send email, SMS, or in-app notification</li>
          <li>• <strong>⏸ Suspend</strong>: Temporarily restrict access (reason required)</li>
          <li>• <strong>✓ Reactivate</strong>: Restore access for suspended learners</li>
          <li>• <strong>✕ Remove</strong>: Permanently remove learner (irreversible)</li>
        </ul>
      </div>
    </div>
  );
}
