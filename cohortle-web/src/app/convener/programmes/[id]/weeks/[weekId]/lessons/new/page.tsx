'use client';

/**
 * Lesson Creation Page
 * Page for creating a new lesson for a week
 */

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LessonForm } from '@/components/convener/LessonForm';
import { createLesson, getWeeks, LessonFormData } from '@/lib/api/convener';

export default function NewLessonPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;
  const weekId = params.weekId as string;
  
  const [suggestedOrderIndex, setSuggestedOrderIndex] = useState<number>(0);
  const [existingLessons, setExistingLessons] = useState<any[]>([]);
  const [weekTitle, setWeekTitle] = useState<string>('');
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);

  // Fetch existing lessons to calculate suggested order index
  useEffect(() => {
    async function fetchLessons() {
      try {
        const weeks = await getWeeks(programmeId);
        
        // Find the current week
        const currentWeek = weeks.find(w => w.id === weekId);
        
        if (currentWeek) {
          setWeekTitle(currentWeek.title);
          setExistingLessons(currentWeek.lessons || []);
          
          if (currentWeek.lessons.length > 0) {
            // Sort lessons by order index to find the highest
            const sortedLessons = [...currentWeek.lessons].sort((a, b) => b.orderIndex - a.orderIndex);
            const lastLesson = sortedLessons[0];
            
            // Suggest next order index
            setSuggestedOrderIndex(lastLesson.orderIndex + 1);
          }
        }
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
        // Continue with default (0) if fetch fails
      } finally {
        setIsLoadingLessons(false);
      }
    }

    fetchLessons();
  }, [programmeId, weekId]);

  const handleSubmit = async (data: LessonFormData) => {
    try {
      await createLesson(weekId, data);
      // Navigate back to programme detail page
      router.push(`/convener/programmes/${programmeId}`);
    } catch (error) {
      console.error('Failed to create lesson:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    router.push(`/convener/programmes/${programmeId}`);
  };

  // Show loading state while fetching lessons
  if (isLoadingLessons) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#391D65]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleCancel}
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

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create New Lesson
          </h1>
          <p className="text-gray-600 mb-6">
            Add a new lesson to this week with video, PDF, link, or text content.
          </p>

          <LessonForm
            weekId={weekId}
            weekTitle={weekTitle}
            mode="create"
            suggestedOrderIndex={suggestedOrderIndex}
            existingLessons={existingLessons}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
