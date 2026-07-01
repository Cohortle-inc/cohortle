'use client';

/**
 * Week Detail Page
 * Page for viewing and managing a specific week and its lessons
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LessonReorderList } from '@/components/convener/LessonReorderList';
import { useWeekDetail } from '@/lib/hooks/useWeekDetail';
import EditWeekModal from '@/components/convener/EditWeekModal';
import EditLessonModal from '@/components/convener/EditLessonModal';
import DeleteConfirmModal from '@/components/convener/DeleteConfirmModal';
import { QuizResultsView } from '@/components/convener/QuizResultsView';
import { AssignmentSubmissionsView } from '@/components/convener/AssignmentSubmissionsView';
import { deleteWeek, deleteLesson } from '@/lib/api/convener';

export default function WeekDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;
  const weekId = params.weekId as string;

  const { data: week, isLoading, error, refetch } = useWeekDetail(programmeId, weekId);
  const [showEditWeekModal, setShowEditWeekModal] = useState(false);
  const [showDeleteWeekModal, setShowDeleteWeekModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [deletingLesson, setDeletingLesson] = useState<any>(null);

  const handleEditWeekSuccess = () => {
    setShowEditWeekModal(false);
    refetch();
  };

  const handleDeleteWeekConfirm = async () => {
    await deleteWeek(weekId);
    router.push(`/convener/programmes/${programmeId}`);
  };

  const handleDeleteLessonConfirm = async () => {
    if (deletingLesson) {
      await deleteLesson(deletingLesson.id);
      setDeletingLesson(null);
      refetch();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-red-600 mt-0.5 mr-3"
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
              <h3 className="text-lg font-medium text-red-800 mb-1">
                Failed to load week
              </h3>
              <p className="text-sm text-red-700">{error?.message}</p>
              <button
                onClick={() => router.push(`/convener/programmes/${programmeId}`)}
                className="mt-4 text-sm text-red-800 underline hover:text-red-900"
              >
                Return to programme
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!week) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push(`/convener/programmes/${programmeId}`)}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Programme
      </button>

      {/* Week Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Week {week.weekNumber}: {week.title}
            </h1>
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 mr-1.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Start Date: {new Date(week.startDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowEditWeekModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit Week
          </button>
          <Link
            href={`/convener/programmes/${programmeId}/weeks/${weekId}/lessons/new`}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Add Lesson
          </Link>
          <button 
            onClick={() => setShowDeleteWeekModal(true)}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete Week
          </button>
        </div>
      </div>

      {/* Lessons Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Lessons ({week.lessons.length})
          </h2>
          <Link
            href={`/convener/programmes/${programmeId}/weeks/${weekId}/lessons/new`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Lesson
          </Link>
        </div>

        <LessonReorderList
          weekId={weekId}
          lessons={week.lessons}
          onReorderSuccess={(updatedLessons) => {
            console.log('Lessons reordered successfully:', updatedLessons);
            refetch();
          }}
          onEdit={(lessonId) => {
            const lesson = week.lessons.find(l => l.id === lessonId);
            if (lesson) {
              setEditingLesson(lesson);
            }
          }}
          onDelete={(lessonId) => {
            const lesson = week.lessons.find(l => l.id === lessonId);
            if (lesson) {
              setDeletingLesson(lesson);
            }
          }}
        />
      </div>

      {/* Modals */}
      {showEditWeekModal && week && (
        <EditWeekModal
          weekId={weekId}
          initialData={{
            weekNumber: week.weekNumber,
            title: week.title,
            startDate: week.startDate,
          }}
          onClose={() => setShowEditWeekModal(false)}
          onSuccess={handleEditWeekSuccess}
        />
      )}

      {showDeleteWeekModal && week && (
        <DeleteConfirmModal
          title="Delete Week"
          message="Are you sure you want to delete this week? All lessons in this week will also be deleted."
          itemName={`Week ${week.weekNumber}: ${week.title}`}
          onConfirm={handleDeleteWeekConfirm}
          onCancel={() => setShowDeleteWeekModal(false)}
        />
      )}

      {editingLesson && (
        <EditLessonModal
          lessonId={editingLesson.id}
          initialData={{
            title: editingLesson.title,
            description: editingLesson.description,
            contentType: editingLesson.contentType,
            contentUrl: editingLesson.contentUrl,
            contentText: editingLesson.contentText,
            assignmentData: editingLesson.contentType === 'assignment' && editingLesson.contentText
              ? (() => {
                  try { return JSON.parse(editingLesson.contentText); } catch { return undefined; }
                })()
              : undefined,
          }}
          onClose={() => setEditingLesson(null)}
          onSuccess={() => {
            setEditingLesson(null);
            refetch();
          }}
        />
      )}

      {deletingLesson && (
        <DeleteConfirmModal
          title="Delete Lesson"
          message="Are you sure you want to delete this lesson?"
          itemName={deletingLesson.title}
          onConfirm={handleDeleteLessonConfirm}
          onCancel={() => setDeletingLesson(null)}
        />
      )}

      {/* Quiz Results — shown when a quiz lesson is selected for editing */}
      {editingLesson && editingLesson.contentType === 'quiz' && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quiz Results — {editingLesson.title}
          </h2>
          <QuizResultsView lessonId={editingLesson.id} />
        </div>
      )}

      {/* Assignment Submissions — shown for all assignment lessons in this week */}
      {week.lessons.filter(l => l.contentType === 'assignment').map(lesson => (
        <div key={lesson.id} className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📋 Assignment Submissions — {lesson.title}
          </h2>
          <AssignmentSubmissionsView lessonId={lesson.id} />
        </div>
      ))}
    </div>
  );
}