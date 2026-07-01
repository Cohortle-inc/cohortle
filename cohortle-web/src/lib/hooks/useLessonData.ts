/**
 * React Query hook for fetching lesson data
 * Provides caching, loading states, and error handling for lesson data
 */

import { useQuery } from '@tanstack/react-query';
import { fetchLesson } from '@/lib/api/lessons';
import { Lesson, LiveSessionData } from '@/types/lesson';

/**
 * Normalises a raw live session object to the canonical LiveSessionData shape.
 * The legacy module_lessons API stores session data in the `description` field using
 * camelCase keys. This function maps both legacy and canonical shapes.
 *
 * Legacy shape:  { sessionDate, duration, meetingLink, notes }
 * Canonical:     { scheduled_date, duration, join_url, description }
 */
function normaliseLiveSessionData(raw: any): LiveSessionData {
  return {
    // Prefer canonical key, fall back to legacy camelCase
    scheduled_date: raw.scheduled_date || raw.sessionDate || '',
    duration: typeof raw.duration === 'number' ? raw.duration : Number(raw.duration) || 0,
    join_url: raw.join_url || raw.meetingLink || raw.meeting_link || undefined,
    meeting_id: raw.meeting_id || raw.meetingId || undefined,
    passcode: raw.passcode || undefined,
    description: raw.description || raw.notes || undefined,
    status: raw.status || undefined,
  };
}

/**
 * Maps the raw API response to the Lesson interface expected by the viewer.
 * The newer week-based API returns content_type/content_url/content_text,
 * while the viewer expects lesson_type/media/text/live_session_data.
 */
function mapApiResponseToLesson(raw: any): Lesson {
  const lesson: Lesson = {
    id: raw.id,
    name: raw.name || raw.title,
    description: raw.description,
    module_id: raw.module_id ?? raw.week_id ?? 0,
    order_number: raw.order_number ?? raw.order_index ?? 0,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    estimated_duration: raw.estimated_duration,
    caption_url: raw.caption_url,
    transcript_url: raw.transcript_url,
    has_captions: raw.has_captions,
  };

  // Map content_type (newer API) → lesson_type (viewer)
  const contentType = raw.content_type || raw.lesson_type || raw.type;
  if (contentType === 'live_session') {
    lesson.lesson_type = 'live-session';
  } else {
    lesson.lesson_type = contentType;
  }

  // Map content_url → media
  lesson.media = raw.media || raw.content_url;

  // Map content_text → text (for text lessons)
  lesson.text = raw.text || (contentType === 'text' ? raw.content_text : undefined);

  // Map quiz_data
  if (raw.quiz_data) {
    lesson.quiz_data = typeof raw.quiz_data === 'string'
      ? JSON.parse(raw.quiz_data)
      : raw.quiz_data;
  }

  // Map live_session_data — prefer explicit field, fall back to parsing content_text or description.
  // The legacy module_lessons API stores session data as JSON in the `description` field using
  // camelCase keys (sessionDate, meetingLink, duration). Normalise to the canonical LiveSessionData shape.
  if (raw.live_session_data) {
    lesson.live_session_data = raw.live_session_data;
  } else if (contentType === 'live_session') {
    const rawSessionJson = raw.content_text || raw.description;
    if (rawSessionJson) {
      try {
        const parsed = typeof rawSessionJson === 'string' ? JSON.parse(rawSessionJson) : rawSessionJson;
        lesson.live_session_data = normaliseLiveSessionData(parsed);
      } catch {
        // leave undefined if not valid JSON — renderer will show a graceful fallback
      }
    }
  }

  return lesson;
}

/**
 * Hook to fetch lesson data with React Query
 * @param lessonId - The ID of the lesson to fetch
 * @returns React Query result with lesson data, loading state, and error state
 */
export function useLessonData(lessonId: string) {
  return useQuery<Lesson, Error>({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const raw = await fetchLesson(lessonId);
      return mapApiResponseToLesson(raw);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!lessonId, // Only run query if lessonId is provided
  });
}
