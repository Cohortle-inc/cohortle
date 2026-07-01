/**
 * Lesson Type Detection Utilities
 * 
 * Functions for detecting the type of a lesson based on its content
 * and media URL. Supports text, video, PDF, and link lesson types.
 */

import { Lesson, LessonUnitType } from '@/types/lesson';
import { isYouTubeUrl, isBunnyStreamUrl } from './videoUrlHelpers';

/**
 * Detects if a URL points to a PDF document
 * 
 * Checks for:
 * - .pdf file extension
 * - content-type=application/pdf query parameter
 * 
 * @param url - The URL to check
 * @returns true if the URL is a PDF URL, false otherwise
 */
export function isPdfUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const lowerUrl = url.toLowerCase();
  
  // Check for .pdf extension
  if (lowerUrl.endsWith('.pdf')) {
    return true;
  }
  
  // Check for content-type parameter
  if (lowerUrl.includes('content-type=application/pdf')) {
    return true;
  }
  
  return false;
}

/**
 * Detects the lesson type based on lesson content
 * 
 * Priority order:
 * 1. Explicit lesson_type field (if present)
 * 2. Quiz data presence → 'quiz'
 * 3. Live session data presence → 'live-session'
 * 4. Media URL analysis:
 *    - YouTube/BunnyStream URLs → 'video'
 *    - PDF URLs → 'pdf'
 *    - Other URLs → 'link'
 * 5. Text-only fallback → 'text'
 * 
 * @param lesson - The lesson object to analyze
 * @returns The detected lesson type
 */
export function detectLessonType(lesson: Lesson): LessonUnitType {
  // Priority 1: Check explicit lesson_type field
  if (lesson.lesson_type) {
    return lesson.lesson_type;
  }
  
  // Priority 2: Check for quiz data
  if (lesson.quiz_data && lesson.quiz_data.questions && lesson.quiz_data.questions.length > 0) {
    return 'quiz';
  }
  
  // Priority 3: Check for live session data
  if (lesson.live_session_data && lesson.live_session_data.scheduled_date) {
    return 'live-session';
  }
  
  // Priority 4: Analyze media URL
  if (lesson.media) {
    // Check for video URLs (YouTube or BunnyStream)
    if (isYouTubeUrl(lesson.media)) {
      return 'video';
    }
    
    if (isBunnyStreamUrl(lesson.media)) {
      return 'video';
    }
    
    // Check for PDF URLs
    if (isPdfUrl(lesson.media)) {
      return 'pdf';
    }
    
    // Default to link for other URLs
    return 'link';
  }
  
  // Priority 5: Text-only lesson
  if (lesson.text) {
    return 'text';
  }
  
  // Fallback to text if no content is present
  return 'text';
}
