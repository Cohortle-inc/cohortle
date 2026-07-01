'use client';

import React, { useState, useEffect } from 'react';
import { useLearnerOperations } from '@/hooks/useLearnerOperations';
import { LearnerNote } from '@/lib/api/convener';

interface NotesPanelProps {
  enrollmentId: string;
  learnerName: string;
}

const NOTE_TYPE_COLORS: Record<string, string> = {
  support: 'bg-blue-100 text-blue-800',
  intervention: 'bg-yellow-100 text-yellow-800',
  engagement: 'bg-green-100 text-green-800',
  achievement: 'bg-purple-100 text-purple-800',
  issue: 'bg-red-100 text-red-800',
  follow_up: 'bg-orange-100 text-orange-800',
  general: 'bg-gray-100 text-gray-800'
};

/**
 * Panel displaying notes history for a learner
 */
export function NotesPanel({ enrollmentId, learnerName }: NotesPanelProps) {
  const [notes, setNotes] = useState<LearnerNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined);
  const { getNotes } = useLearnerOperations();

  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      const result = await getNotes(enrollmentId, selectedFilter, 50, 0);
      setNotes(result.notes);
      setIsLoading(false);
    };

    loadNotes();
  }, [enrollmentId, selectedFilter, getNotes]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin">⏳</div>
        <span className="ml-2 text-gray-600">Loading notes...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes for {learnerName}</h3>

      {/* Filter */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedFilter(undefined)}
          className={`px-3 py-1 text-sm rounded-full transition ${
            selectedFilter === undefined
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {Object.keys(NOTE_TYPE_COLORS).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedFilter(type)}
            className={`px-3 py-1 text-sm rounded-full transition capitalize ${
              selectedFilter === type
                ? `${NOTE_TYPE_COLORS[type]} border-2 border-gray-400`
                : `${NOTE_TYPE_COLORS[type]}`
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Notes List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No notes yet</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`p-3 rounded-lg border ${NOTE_TYPE_COLORS[note.noteType] || NOTE_TYPE_COLORS.general}`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold capitalize">
                    {note.noteType}
                  </span>
                  {note.creator && (
                    <span className="text-xs text-gray-600">
                      by {note.creator.firstName} {note.creator.lastName}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600">
                  {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
