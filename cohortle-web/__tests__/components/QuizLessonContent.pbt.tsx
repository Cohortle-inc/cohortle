/**
 * Property-Based Tests: QuizLessonContent Component
 * Feature: native-quiz-system
 *
 * Properties 13, 15, 16 from design.md
 */

import fc from 'fast-check';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuizLessonContent } from '@/components/lessons/QuizLessonContent';
import type { QuizData, QuizQuestion } from '@/types/quiz';

// Mock API — no prior attempt by default
jest.mock('@/lib/api/lessons', () => ({
  getLatestQuizAttempt: jest.fn().mockResolvedValue(null),
  submitQuizAttempt: jest.fn().mockResolvedValue({
    id: 1, lesson_id: 1, user_id: 1, cohort_id: 1,
    answers: {}, score: 100, passed: true,
    submitted_at: new Date().toISOString(),
  }),
}));

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const safeText = fc.string({ minLength: 3, maxLength: 60 })
  .filter(s => !s.includes('<') && !s.includes('>') && s.trim().length > 0);

const tfQuestion = (id: string): QuizQuestion => ({
  id,
  type: 'true-false',
  question: `Question ${id}?`,
  correctAnswer: 'true',
});

const quizData = (questions: QuizQuestion[], allowRetakes = true): QuizData => ({
  questions,
  settings: { passing_score: null, time_limit: null, allow_retakes: allowRetakes },
});

const defaultProps = (data: QuizData) => ({
  lessonId: '1',
  cohortId: 1,
  title: 'Test Quiz',
  quizData: data,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Feature: native-quiz-system - QuizLessonContent', () => {
  beforeEach(() => jest.clearAllMocks());

  /**
   * Property 16: All N questions rendered for any quiz_data with N questions
   * Validates: Requirements 4.1
   */
  describe('Property 16: All N questions rendered', () => {
    it('renders exactly N question elements for any N-question quiz', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 6 }),
          async (n) => {
            const questions = Array.from({ length: n }, (_, i) => tfQuestion(`q${i}`));
            const data = quizData(questions);
            const { unmount } = render(<QuizLessonContent {...defaultProps(data)} />);
            await waitFor(() => expect(screen.queryByText('Loading quiz…')).not.toBeInTheDocument());

            expect(screen.getByText(`${n} questions`)).toBeInTheDocument();
            questions.forEach(q => {
              expect(screen.getByText(q.question)).toBeInTheDocument();
            });
            unmount();
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  /**
   * Property 13: Retake button visibility matches allow_retakes
   * Validates: Requirements 6.1, 6.3, 6.4
   */
  describe('Property 13: Retake button visibility matches allow_retakes', () => {
    it('shows Retake Quiz button only when allow_retakes is true (after submission)', async () => {
      for (const allowRetakes of [true, false]) {
        const q = tfQuestion('q1');
        const data = quizData([q], allowRetakes);
        const { unmount } = render(<QuizLessonContent {...defaultProps(data)} />);
        await waitFor(() => expect(screen.queryByText('Loading quiz…')).not.toBeInTheDocument());

        fireEvent.click(screen.getByLabelText('true'));
        fireEvent.click(screen.getByText('Submit Quiz'));
        await waitFor(() => expect(screen.getByText('Your Score: 100%')).toBeInTheDocument());

        if (allowRetakes) {
          expect(screen.getByText('Retake Quiz')).toBeInTheDocument();
        } else {
          expect(screen.queryByText('Retake Quiz')).not.toBeInTheDocument();
        }
        unmount();
      }
    });
  });

  /**
   * Property 15: Unanswered questions block submission
   * Validates: Requirements 4.9
   */
  describe('Property 15: Unanswered questions block submission', () => {
    it('prevents submission and shows error when questions are unanswered', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 4 }),
          async (n) => {
            const { submitQuizAttempt } = require('@/lib/api/lessons');
            submitQuizAttempt.mockClear();

            const questions = Array.from({ length: n }, (_, i) => tfQuestion(`q${i}`));
            const data = quizData(questions);
            const { unmount } = render(<QuizLessonContent {...defaultProps(data)} />);
            await waitFor(() => expect(screen.queryByText('Loading quiz…')).not.toBeInTheDocument());

            fireEvent.click(screen.getByText('Submit Quiz'));

            expect(await screen.findByText('Please answer all questions before submitting.')).toBeInTheDocument();
            expect(submitQuizAttempt).not.toHaveBeenCalled();
            unmount();
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});
