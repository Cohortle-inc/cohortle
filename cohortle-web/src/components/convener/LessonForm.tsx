'use client';

/**
 * Lesson Form Component
 * Form for creating and editing lessons with dynamic content fields based on content type
 * Enhanced with UX improvements: existing lessons display, character counters, and helpful tips
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LessonFormData } from '@/lib/api/convener';
import { QuizBuilder } from './QuizBuilder';
import type { QuizData } from '@/types/quiz';
import DrivePickerButton from '@/components/convener/DrivePickerButton';
import { mimeTypeToLessonType, isDriveUrl } from '@/lib/utils/driveUrlUtils';
import type { DriveFile } from '@/lib/hooks/useDrivePicker';

interface ExistingLesson {
  id: string;
  title: string;
  contentType: string;
  orderIndex: number;
}

interface LessonFormProps {
  weekId: string;
  weekTitle?: string;
  mode: 'create' | 'edit';
  initialData?: Partial<LessonFormData>;
  suggestedOrderIndex?: number;
  existingLessons?: ExistingLesson[];
  onSubmit: (data: LessonFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate video URL (YouTube or Vimeo)
 */
function isValidVideoUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  const videoPatterns = [
    /youtube\.com\/watch\?v=/i,
    /youtu\.be\//i,
    /vimeo\.com\//i,
  ];
  return videoPatterns.some((pattern) => pattern.test(url));
}

/**
 * Validate PDF URL
 */
function isValidPdfUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  return url.toLowerCase().endsWith('.pdf') || url.includes('/pdf/');
}

/**
 * Get content type display name and icon
 */
function getContentTypeInfo(type: string): { label: string; icon: string } {
  const types: Record<string, { label: string; icon: string }> = {
    video: { label: 'Video', icon: '🎥' },
    pdf: { label: 'PDF', icon: '📄' },
    link: { label: 'Link', icon: '🔗' },
    text: { label: 'Text', icon: '📝' },
    live_session: { label: 'Live Session', icon: '📹' },
    quiz: { label: 'Quiz', icon: '✅' },
    assignment: { label: 'Assignment', icon: '📋' },
  };
  return types[type] || { label: type, icon: '📚' };
}

export function LessonForm({
  weekId,
  weekTitle,
  mode,
  initialData,
  suggestedOrderIndex = 0,
  existingLessons = [],
  onSubmit,
  onCancel,
}: LessonFormProps) {
  const [descriptionLength, setDescriptionLength] = useState(
    initialData?.description?.length || 0
  );
  const [textContentLength, setTextContentLength] = useState(
    initialData?.contentText?.length || 0
  );
  const [quizData, setQuizData] = useState<QuizData | undefined>(
    initialData?.quizData
  );
  const [assignmentData, setAssignmentData] = useState<LessonFormData['assignmentData']>(
    initialData?.assignmentData ?? {
      instructions: '',
      due_date: null,
      allow_text_answer: true,
      allow_file_uploads: true,
      max_file_size_mb: 10,
      allowed_file_types: [],
    }
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
    setValue,
  } = useForm<LessonFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: initialData || {
      title: '',
      description: '',
      contentType: 'video',
      contentUrl: '',
      contentText: '',
      orderIndex: suggestedOrderIndex,
      liveSessionDate: '',
      liveSessionDuration: 60,
      liveSessionJoinUrl: '',
      liveSessionMeetingId: '',
      liveSessionPasscode: '',
    },
  });

  const contentType = watch('contentType');

  const handleDriveFileSelected = (file: DriveFile) => {
    setValue('contentUrl', file.webViewLink, { shouldValidate: false });
    setValue('contentType', mimeTypeToLessonType(file.mimeType) as LessonFormData['contentType'], { shouldValidate: false });
  };

  const onFormSubmit = async (data: LessonFormData) => {
    // Validate quiz data when content type is quiz
    if (data.contentType === 'quiz') {
      if (!quizData || quizData.questions.length === 0) {
        setError('root', { message: 'Quiz must contain at least one question.' });
        return;
      }
    }
    // Validate assignment data when content type is assignment
    if (data.contentType === 'assignment') {
      if (!assignmentData?.instructions?.trim()) {
        setError('root', { message: 'Assignment instructions are required.' });
        return;
      }
    }
    try {
      console.log('LessonForm: Submitting data for week', weekId, ':', data);
      await onSubmit({
        ...data,
        quizData: data.contentType === 'quiz' ? quizData : undefined,
        assignmentData: data.contentType === 'assignment' ? assignmentData : undefined,
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setError('root', {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to save lesson. Please try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Display existing lessons - collapsible if more than 5 */}
      {mode === 'create' && existingLessons.length > 0 && (
        <details 
          className="p-3 bg-blue-50 border border-blue-200 rounded-md group"
          open={existingLessons.length <= 5}
        >
          <summary className="text-sm font-medium text-blue-900 cursor-pointer list-none flex items-center justify-between">
            <span>
              {weekTitle ? `Existing lessons in ${weekTitle}` : 'Existing lessons'} ({existingLessons.length})
            </span>
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-180"
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
          </summary>
          <div className="mt-2 space-y-1">
            {existingLessons
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((lesson) => {
                const typeInfo = getContentTypeInfo(lesson.contentType);
                return (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between px-2 py-1.5 bg-blue-100 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-700">#{lesson.orderIndex}</span>
                      <span className="text-blue-900 font-medium">{lesson.title}</span>
                    </div>
                    <span className="text-blue-700">
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                  </div>
                );
              })}
          </div>
        </details>
      )}

      {/* Helpful tips banner for create mode */}
      {mode === 'create' && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-md p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-800 font-medium mb-1">
                Tips for creating effective lessons:
              </p>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>Use clear, descriptive titles that tell learners what they'll learn</li>
                <li>Choose the right content type for your material</li>
                <li>Order index determines lesson sequence (0 = first, 1 = second, etc.)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {errors.root && errors.root.message && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800"
          role="alert"
        >
          {errors.root.message}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Lesson Title
        </label>
        <input
          id="title"
          type="text"
          {...register('title', {
            required: 'Lesson title is required',
            minLength: {
              value: 3,
              message: 'Lesson title must be between 3 and 200 characters',
            },
            maxLength: {
              value: 200,
              message: 'Lesson title must be between 3 and 200 characters',
            },
          })}
          className={`
            w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
          placeholder="Enter lesson title"
          autoComplete="off"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (Optional)
        </label>
        <textarea
          id="description"
          {...register('description', {
            maxLength: {
              value: 1000,
              message: 'Description must be 1000 characters or less',
            },
            onChange: (e) => setDescriptionLength(e.target.value.length),
          })}
          className={`
            w-full px-3 py-3 min-h-[100px] border rounded-md shadow-sm text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
          placeholder="Briefly describe what learners will learn in this lesson"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : 'description-helper'}
        />
        {errors.description ? (
          <p id="description-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        ) : (
          <div className="mt-1 flex items-center justify-between">
            <p id="description-helper" className="text-xs text-gray-600">
              Help learners understand what this lesson covers
            </p>
            <p
              className={`text-xs ${
                descriptionLength > 900
                  ? 'text-orange-600 font-medium'
                  : 'text-gray-500'
              }`}
            >
              {descriptionLength}/1000
            </p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="contentType"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Content Type
        </label>
        <select
          id="contentType"
          {...register('contentType', {
            required: 'Content type is required',
          })}
          className={`
            w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errors.contentType ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
          aria-invalid={!!errors.contentType}
          aria-describedby={errors.contentType ? 'contentType-error' : undefined}
        >
          <option value="video">Video (YouTube/Vimeo)</option>
          <option value="pdf">PDF Document</option>
          <option value="link">External Link</option>
          <option value="text">Text Content</option>
          <option value="live_session">Live Session</option>
          <option value="quiz">Quiz</option>
          <option value="assignment">Assignment</option>
        </select>
        {errors.contentType && (
          <p id="contentType-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.contentType.message}
          </p>
        )}
      </div>

      {/* Dynamic content fields based on content type */}
      {contentType === 'video' && (
        <div className="mb-4">
          <label
            htmlFor="contentUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Video URL
          </label>
          <input
            id="contentUrl"
            type="url"
            {...register('contentUrl', {
              required: 'Video URL is required for video content',
              validate: (value) => {
                if (!isValidVideoUrl(value)) {
                  return 'Video URL must be a valid YouTube or Vimeo link (e.g., https://www.youtube.com/watch?v=...)';
                }
                return true;
              },
            })}
            className={`
              w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${errors.contentUrl ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
            `}
            disabled={isSubmitting}
            placeholder="https://www.youtube.com/watch?v=..."
            aria-invalid={!!errors.contentUrl}
            aria-describedby={errors.contentUrl ? 'contentUrl-error' : undefined}
          />
          {errors.contentUrl && (
            <p id="contentUrl-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.contentUrl.message}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Supported: YouTube and Vimeo videos
          </p>
          <div className="mt-2">
            <DrivePickerButton
              onFileSelected={handleDriveFileSelected}
              disabled={isSubmitting}
            />
          </div>
        </div>
      )}

      {contentType === 'pdf' && (
        <div className="mb-4">
          <label
            htmlFor="contentUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            PDF URL
          </label>
          <input
            id="contentUrl"
            type="url"
            {...register('contentUrl', {
              required: 'PDF URL is required for PDF content',
              validate: (value) => {
                if (!isValidUrl(value)) {
                  return 'Please enter a valid URL starting with http:// or https://';
                }
                if (!isValidPdfUrl(value) && !isDriveUrl(value)) {
                  return 'PDF URL must end with .pdf, contain /pdf/ in the path, or be a Google Drive link';
                }
                return true;
              },
            })}
            className={`
              w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${errors.contentUrl ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
            `}
            disabled={isSubmitting}
            placeholder="https://example.com/document.pdf"
            aria-invalid={!!errors.contentUrl}
            aria-describedby={errors.contentUrl ? 'contentUrl-error' : undefined}
          />
          {errors.contentUrl && (
            <p id="contentUrl-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.contentUrl.message}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            URL must end with .pdf, contain /pdf/, or be a Google Drive link
          </p>
          <div className="mt-2">
            <DrivePickerButton
              onFileSelected={handleDriveFileSelected}
              disabled={isSubmitting}
            />
          </div>
        </div>
      )}

      {contentType === 'link' && (
        <div className="mb-4">
          <label
            htmlFor="contentUrl"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            External Link URL
          </label>
          <input
            id="contentUrl"
            type="url"
            {...register('contentUrl', {
              required: 'Link URL is required for external link content',
              validate: (value) => {
                if (!isValidUrl(value)) {
                  return 'Please enter a valid URL starting with http:// or https://';
                }
                return true;
              },
            })}
            className={`
              w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${errors.contentUrl ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
            `}
            disabled={isSubmitting}
            placeholder="https://example.com"
            aria-invalid={!!errors.contentUrl}
            aria-describedby={errors.contentUrl ? 'contentUrl-error' : undefined}
          />
          {errors.contentUrl && (
            <p id="contentUrl-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.contentUrl.message}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Any valid web URL
          </p>
          <div className="mt-2">
            <DrivePickerButton
              onFileSelected={handleDriveFileSelected}
              disabled={isSubmitting}
            />
          </div>
        </div>
      )}

      {contentType === 'text' && (
        <div className="mb-4">
          <label
            htmlFor="contentText"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Text Content
          </label>
          <textarea
            id="contentText"
            {...register('contentText', {
              required: 'Text content is required for text lessons',
              maxLength: {
                value: 50000,
                message: 'Text content must be 50,000 characters or less',
              },
              onChange: (e) => setTextContentLength(e.target.value.length),
            })}
            className={`
              w-full px-3 py-3 min-h-[200px] border rounded-md shadow-sm text-base
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${errors.contentText ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
            `}
            disabled={isSubmitting}
            placeholder="Enter the lesson content here. You can include instructions, explanations, or any text-based material."
            aria-invalid={!!errors.contentText}
            aria-describedby={errors.contentText ? 'contentText-error' : 'contentText-helper'}
          />
          {errors.contentText ? (
            <p id="contentText-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.contentText.message}
            </p>
          ) : (
            <div className="mt-1 flex items-center justify-between">
              <p id="contentText-helper" className="text-xs text-gray-600">
                Plain text content for the lesson
              </p>
              <p
                className={`text-xs ${
                  textContentLength > 45000
                    ? 'text-orange-600 font-medium'
                    : 'text-gray-500'
                }`}
              >
                {textContentLength}/50,000
              </p>
            </div>
          )}
        </div>
      )}

      {contentType === 'live_session' && (
        <div className="space-y-4">
          <div className="mb-4">
            <label
              htmlFor="liveSessionDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Session Date & Time
            </label>
            <input
              id="liveSessionDate"
              type="datetime-local"
              {...register('liveSessionDate', {
                required: 'Session date and time is required for live sessions',
              })}
              className={`
                w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${errors.liveSessionDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
              `}
              disabled={isSubmitting}
              aria-invalid={!!errors.liveSessionDate}
              aria-describedby={errors.liveSessionDate ? 'liveSessionDate-error' : undefined}
            />
            {errors.liveSessionDate && (
              <p id="liveSessionDate-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.liveSessionDate.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="liveSessionDuration"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Duration (minutes)
            </label>
            <input
              id="liveSessionDuration"
              type="number"
              {...register('liveSessionDuration', {
                required: 'Duration is required for live sessions',
                min: { value: 5, message: 'Duration must be at least 5 minutes' },
                max: { value: 480, message: 'Duration cannot exceed 480 minutes (8 hours)' },
                valueAsNumber: true,
              })}
              className={`
                w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${errors.liveSessionDuration ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
              `}
              disabled={isSubmitting}
              placeholder="60"
              min="5"
              max="480"
              step="5"
              aria-invalid={!!errors.liveSessionDuration}
              aria-describedby={errors.liveSessionDuration ? 'liveSessionDuration-error' : 'liveSessionDuration-helper'}
            />
            {errors.liveSessionDuration ? (
              <p id="liveSessionDuration-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.liveSessionDuration.message}
              </p>
            ) : (
              <p id="liveSessionDuration-helper" className="mt-1 text-xs text-gray-600">
                How long the session will run
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="liveSessionJoinUrl"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Join URL
            </label>
            <div className="flex gap-2 mb-2">
              <a
                href="https://meet.google.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Create Google Meet
              </a>
              <a
                href="https://zoom.us/meeting/schedule"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#2D8CFF" aria-hidden="true">
                  <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM9.5 7.5v5.25l5.25 3v-1.5L11 12.25V7.5H9.5zm5.25 0v1.5l3.75 2.25V9l-3.75-1.5z"/>
                </svg>
                Schedule Zoom
              </a>
            </div>
            <p className="text-xs text-gray-500 mb-2">Create a meeting above, then paste the link below.</p>
            <input
              id="liveSessionJoinUrl"
              type="url"
              {...register('liveSessionJoinUrl', {
                required: 'Join URL is required for live sessions',
                validate: (value) => {
                  if (!value || !isValidUrl(value)) {
                    return 'Please enter a valid URL starting with http:// or https://';
                  }
                  return true;
                },
              })}
              className={`
                w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${errors.liveSessionJoinUrl ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
              `}
              disabled={isSubmitting}
              placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              aria-invalid={!!errors.liveSessionJoinUrl}
              aria-describedby={errors.liveSessionJoinUrl ? 'liveSessionJoinUrl-error' : undefined}
            />
            {errors.liveSessionJoinUrl && (
              <p id="liveSessionJoinUrl-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.liveSessionJoinUrl.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="liveSessionMeetingId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Meeting ID (Optional)
            </label>
            <input
              id="liveSessionMeetingId"
              type="text"
              {...register('liveSessionMeetingId')}
              className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              placeholder="123 456 789"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="liveSessionPasscode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Passcode (Optional)
            </label>
            <input
              id="liveSessionPasscode"
              type="text"
              {...register('liveSessionPasscode')}
              className="w-full px-3 py-3 min-h-[44px] border border-gray-300 rounded-md shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              placeholder="abc123"
            />
          </div>
        </div>
      )}

      {contentType === 'quiz' && (
        <div className="mb-4">
          <QuizBuilder
            initialData={quizData}
            onChange={(data) => setQuizData(data)}
          />
        </div>
      )}

      {contentType === 'assignment' && (
        <div className="mb-4 space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="text-sm font-semibold text-amber-900">Assignment Settings</h3>

          {/* Instructions */}
          <div>
            <label htmlFor="assignment-instructions" className="block text-sm font-medium text-gray-700 mb-1">
              Instructions <span className="text-red-500">*</span>
            </label>
            <textarea
              id="assignment-instructions"
              value={assignmentData?.instructions ?? ''}
              onChange={e => setAssignmentData(prev => ({ ...prev!, instructions: e.target.value }))}
              rows={5}
              maxLength={5000}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Describe what learners need to do for this assignment…"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500 text-right">
              {(assignmentData?.instructions ?? '').length}/5000
            </p>
          </div>

          {/* Due date */}
          <div>
            <label htmlFor="assignment-due-date" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="assignment-due-date"
              type="datetime-local"
              value={assignmentData?.due_date ?? ''}
              onChange={e => setAssignmentData(prev => ({ ...prev!, due_date: e.target.value || null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={assignmentData?.allow_text_answer ?? true}
                onChange={e => setAssignmentData(prev => ({ ...prev!, allow_text_answer: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
                disabled={isSubmitting}
              />
              <span className="text-sm text-gray-700">Allow written text answer</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={assignmentData?.allow_file_uploads ?? true}
                onChange={e => setAssignmentData(prev => ({ ...prev!, allow_file_uploads: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
                disabled={isSubmitting}
              />
              <span className="text-sm text-gray-700">Allow file uploads</span>
            </label>
          </div>

          {/* File upload settings */}
          {assignmentData?.allow_file_uploads && (
            <div className="space-y-3">
              <div>
                <label htmlFor="assignment-max-size" className="block text-sm font-medium text-gray-700 mb-1">
                  Max file size (MB)
                </label>
                <input
                  id="assignment-max-size"
                  type="number"
                  min={1}
                  max={100}
                  value={assignmentData?.max_file_size_mb ?? 10}
                  onChange={e => setAssignmentData(prev => ({ ...prev!, max_file_size_mb: Number(e.target.value) }))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed file types
                </p>
                <div className="flex flex-wrap gap-2">
                  {(['pdf', 'word', 'image', 'any'] as const).map(type => {
                    const labels: Record<string, string> = { pdf: 'PDF', word: 'Word (.doc/.docx)', image: 'Images', any: 'Any file type' };
                    const isAny = type === 'any';
                    // "Any" is checked when the list is empty (meaning no restriction)
                    // Specific types are checked when they appear in the list
                    const isChecked = isAny
                      ? !assignmentData?.allowed_file_types?.length
                      : (assignmentData?.allowed_file_types ?? []).includes(type);
                    return (
                      <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            setAssignmentData(prev => {
                              const current = prev?.allowed_file_types ?? [];
                              if (isAny) {
                                // Toggling "Any": checked → clear list (allow any), unchecked → no-op (must pick a specific type)
                                return { ...prev!, allowed_file_types: [] };
                              }
                              if (e.target.checked) {
                                // Adding a specific type — remove 'any' sentinel if present
                                return { ...prev!, allowed_file_types: current.filter(t => t !== 'any').concat(type) };
                              } else {
                                return { ...prev!, allowed_file_types: current.filter(t => t !== type) };
                              }
                            });
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                          disabled={isSubmitting || (isAny && isChecked)} // can't uncheck "Any" directly — uncheck by selecting a specific type
                        />
                        <span className="text-sm text-gray-700">{labels[type]}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-gray-500">Leave all unchecked to allow any file type.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="orderIndex"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Order Index
        </label>
        <input
          id="orderIndex"
          type="number"
          {...register('orderIndex', {
            required: 'Order index is required',
            min: {
              value: 0,
              message: 'Order index must be 0 or greater (0 = first lesson)',
            },
            valueAsNumber: true,
          })}
          className={`
            w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errors.orderIndex ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
          placeholder="0"
          min="0"
          step="1"
          aria-invalid={!!errors.orderIndex}
          aria-describedby={errors.orderIndex ? 'orderIndex-error' : 'orderIndex-helper'}
        />
        {errors.orderIndex ? (
          <p id="orderIndex-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.orderIndex.message}
          </p>
        ) : (
          <p id="orderIndex-helper" className="mt-1 text-sm text-gray-600">
            {suggestedOrderIndex > 0 
              ? `Suggested: ${suggestedOrderIndex} (next available position)`
              : 'Position 0 = first lesson in the week'}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="
            flex-1 px-4 py-3 min-h-[44px] border border-gray-300 text-gray-700 rounded-md
            font-medium hover:bg-gray-50
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-gray-500
            transition-colors duration-200
          "
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            flex-1 px-4 py-3 min-h-[44px] bg-[#391D65] text-white rounded-md
            font-medium hover:bg-[#391D65]/90
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-[#391D65]
            transition-colors duration-200
          "
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
            ? 'Create Lesson'
            : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
