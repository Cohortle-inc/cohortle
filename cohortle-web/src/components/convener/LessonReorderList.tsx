'use client';

/**
 * Lesson Reorder List Component
 * Provides drag-and-drop and button-based reordering for lessons within a week
 */

import React, { useEffect, useState } from 'react';
import { reorderLessons } from '@/lib/api/convener';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  contentUrl?: string;
  orderIndex: number;
}

interface LessonReorderListProps {
  weekId: string;
  lessons: Lesson[];
  onReorderSuccess?: (lessons: Lesson[]) => void;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
}

export function LessonReorderList({
  weekId,
  lessons: initialLessons,
  onReorderSuccess,
  onEdit,
  onDelete,
}: LessonReorderListProps) {
  const [lessons, setLessons] = useState<Lesson[]>(
    [...initialLessons].sort((a, b) => a.orderIndex - b.orderIndex)
  );
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLessons([...initialLessons].sort((a, b) => a.orderIndex - b.orderIndex));
  }, [initialLessons]);

  /**
   * Handle drag start
   */
  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    const lesson = lessons[index];
    if (!lesson) return;

    setDraggedLessonId(lesson.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lesson.id);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  /**
   * Handle drag end
   */
  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedLessonId(null);
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedLessonId) {
      return;
    }

    const draggedIndex = lessons.findIndex(lesson => lesson.id === draggedLessonId);
    if (draggedIndex === -1 || draggedIndex === index) {
      return;
    }

    // Reorder lessons in state
    const newLessons = [...lessons];
    const draggedLesson = newLessons[draggedIndex];
    newLessons.splice(draggedIndex, 1);
    newLessons.splice(index, 0, draggedLesson);
    
    setLessons(newLessons);
  };

  /**
   * Handle drop - persist the new order to backend
   */
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedLessonId) {
      return;
    }

    // Persist to backend
    await persistReorder(lessons);
    setDraggedLessonId(null);
  };

  /**
   * Move lesson up
   */
  const moveUp = async (index: number) => {
    if (index === 0) return;
    
    const newLessons = [...lessons];
    [newLessons[index - 1], newLessons[index]] = [newLessons[index], newLessons[index - 1]];
    
    setLessons(newLessons);
    await persistReorder(newLessons);
  };

  /**
   * Move lesson down
   */
  const moveDown = async (index: number) => {
    if (index === lessons.length - 1) return;
    
    const newLessons = [...lessons];
    [newLessons[index], newLessons[index + 1]] = [newLessons[index + 1], newLessons[index]];
    
    setLessons(newLessons);
    await persistReorder(newLessons);
  };

  /**
   * Persist reorder to backend
   */
  const persistReorder = async (reorderedLessons: Lesson[]) => {
    setIsReordering(true);
    setError(null);
    
    try {
      const lessonIds = reorderedLessons.map(lesson => lesson.id);
      const updatedLessons = await reorderLessons(weekId, lessonIds);
      
      // Update local state with backend response
      setLessons(updatedLessons.sort((a, b) => a.orderIndex - b.orderIndex));
      
      // Notify parent component
      if (onReorderSuccess) {
        onReorderSuccess(updatedLessons);
      }
    } catch (err) {
      console.error('Failed to reorder lessons:', err);
      setError(err instanceof Error ? err.message : 'Failed to reorder lessons');
      
      // Rollback to initial order on error
      setLessons([...initialLessons].sort((a, b) => a.orderIndex - b.orderIndex));
    } finally {
      setIsReordering(false);
    }
  };

  if (lessons.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <p className="text-sm">No lessons yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs text-red-700 underline hover:text-red-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reordering indicator */}
      {isReordering && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg
              className="animate-spin h-4 w-4 text-blue-600 mr-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-sm text-blue-800">Updating lesson order...</p>
          </div>
        </div>
      )}

      {/* Lesson list */}
      {lessons.map((lesson, index) => (
        <div
          key={lesson.id}
          draggable={!isReordering}
          onDragStart={handleDragStart(index)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver(index)}
          onDrop={handleDrop}
          className={`
            border border-gray-200 rounded-lg p-4 transition-all
            ${draggedLessonId === lesson.id ? 'opacity-50' : 'opacity-100'}
            ${!isReordering ? 'hover:border-blue-300 cursor-move' : 'cursor-not-allowed'}
            ${isReordering ? 'bg-gray-50' : 'bg-white'}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* Drag Handle */}
              <div
                className={`flex flex-col gap-1 mt-2 ${!isReordering ? 'cursor-move' : 'cursor-not-allowed'}`}
                title="Drag to reorder"
              >
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>
              
              {/* Lesson Number */}
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-1">
                {index + 1}
              </div>
              
              {/* Lesson Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 mb-1">
                  {lesson.title}
                </h3>
                {lesson.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {lesson.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    {lesson.contentType}
                  </span>
                  {lesson.contentUrl && (
                    <span className="truncate max-w-xs">
                      {lesson.contentUrl}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              {/* Reorder buttons */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0 || isReordering}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                  aria-label="Move lesson up"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === lessons.length - 1 || isReordering}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                  aria-label="Move lesson down"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
              
              {/* Edit button */}
              {onEdit && (
                <button
                  onClick={() => onEdit(lesson.id)}
                  disabled={isReordering}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Edit lesson"
                  aria-label="Edit lesson"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
              
              {/* Delete button */}
              {onDelete && (
                <button
                  onClick={() => onDelete(lesson.id)}
                  disabled={isReordering}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Delete lesson"
                  aria-label="Delete lesson"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
