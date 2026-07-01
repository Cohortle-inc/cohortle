'use client';

import { useParams, useSearchParams } from 'next/navigation';
import dynamicImport from 'next/dynamic';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT_TRANSITION, REDUCED_MOTION_TRANSITION } from '@/lib/utils/animation';

// Dynamic imports for lesson viewers to reduce initial bundle size
const LessonViewer = dynamicImport(
  () => import('@/components/lessons/LessonViewer').then(mod => ({ default: mod.LessonViewer })),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" role="status" aria-label="Loading"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

const WLIMPLessonViewer = dynamicImport(
  () => import('@/components/lessons/WLIMPLessonViewer').then(mod => ({ default: mod.WLIMPLessonViewer })),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" role="status" aria-label="Loading"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

/**
 * Lesson Page
 * Handles both module-based lessons (with cohortId) and WLIMP lessons (UUID-based).
 * Wraps content in a directional slide transition (Requirement 8).
 */
export default function LessonPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const lessonId = params.lessonId as string;
  const cohortId = searchParams.get('cohortId');
  const previewMode = searchParams.get('preview') === 'true';

  // Determine slide direction from ?dir=forward|backward search param (Requirement 8.1)
  const dir = searchParams.get('dir');
  const isForward = dir !== 'backward'; // default to forward when not specified

  const slideInitial = isForward ? { x: '100%', opacity: 0 } : { x: '-100%', opacity: 0 };
  const slideExit = isForward ? { x: '-100%', opacity: 0 } : { x: '100%', opacity: 0 };
  const transition = shouldReduceMotion ? REDUCED_MOTION_TRANSITION : EASE_OUT_TRANSITION;

  // Check if this is a WLIMP lesson (UUID format) or module lesson (numeric)
  const isWLIMPLesson = lessonId && !isNaN(Number(lessonId)) === false && lessonId.includes('-');

  let content: React.ReactNode;

  if (isWLIMPLesson) {
    content = <WLIMPLessonViewer lessonId={lessonId} />;
  } else if (!lessonId || !cohortId) {
    content = (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Invalid Lesson URL
          </h2>
          <p className="text-yellow-700 mb-4">
            {!lessonId && 'Lesson ID is missing. '}
            {!cohortId && 'Cohort ID is missing. '}
            Please check the URL and try again.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  } else if (isNaN(Number(lessonId)) || isNaN(Number(cohortId))) {
    content = (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Invalid Parameters
          </h2>
          <p className="text-red-700 mb-4">
            The lesson ID and cohort ID must be valid numbers.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  } else {
    content = <LessonViewer lessonId={lessonId} cohortId={cohortId} previewMode={previewMode} />;
  }

  return (
    <AnimatePresence mode="wait">
      {/* key={lessonId} tells AnimatePresence to animate when the lesson changes (Requirement 8) */}
      <motion.div
        key={lessonId}
        initial={slideInitial}
        animate={{ x: 0, opacity: 1 }}
        exit={slideExit}
        transition={transition}
        // No pointer-events restriction — incoming page is interactive immediately (Requirement 8.5)
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}
