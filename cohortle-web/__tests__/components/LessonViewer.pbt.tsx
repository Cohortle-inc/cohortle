/**
 * Property-based tests for LessonViewer component
 * Feature: mvp-completion-gaps
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import fc from 'fast-check';
import { LessonViewer } from '@/components/lessons/LessonViewer';
import * as lessonsApi from '@/lib/api/lessons';
import * as commentsApi from '@/lib/api/comments';
import { Lesson, LessonUnitType } from '@/types/lesson';
import { detectLessonType } from '@/lib/utils/lessonTypeDetection';

// Mock the APIs
jest.mock('@/lib/api/lessons');
jest.mock('@/lib/api/comments');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Arbitraries for generating test data
const textLessonArbitrary = () =>
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    text: fc.string({ minLength: 10, maxLength: 1000 }),
    media: fc.constant(undefined),
    module_id: fc.integer({ min: 1, max: 100 }),
    order_number: fc.integer({ min: 1, max: 50 }),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  });

const videoLessonArbitrary = () =>
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    text: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    media: fc.oneof(
      fc.constant('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      fc.constant('https://youtu.be/dQw4w9WgXcQ'),
      fc.constant('https://iframe.mediadelivery.net/embed/12345678/abcd1234')
    ),
    module_id: fc.integer({ min: 1, max: 100 }),
    order_number: fc.integer({ min: 1, max: 50 }),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  });

const pdfLessonArbitrary = () =>
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    text: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    media: fc.webUrl().map(url => url + '.pdf'),
    module_id: fc.integer({ min: 1, max: 100 }),
    order_number: fc.integer({ min: 1, max: 50 }),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  });

const linkLessonArbitrary = () =>
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    text: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    media: fc.webUrl().filter(url => !url.includes('youtube') && !url.includes('youtu.be') && !url.includes('mediadelivery.net') && !url.endsWith('.pdf')),
    module_id: fc.integer({ min: 1, max: 100 }),
    order_number: fc.integer({ min: 1, max: 50 }),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  });

const quizLessonArbitrary = () =>
  fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    text: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    media: fc.constant(undefined),
    module_id: fc.integer({ min: 1, max: 100 }),
    order_number: fc.integer({ min: 1, max: 50 }),
    created_at: fc.date().map(d => d.toISOString()),
    updated_at: fc.date().map(d => d.toISOString()),
  });

describe('Feature: mvp-completion-gaps - LessonViewer Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (commentsApi.fetchLessonComments as jest.Mock).mockResolvedValue([]);
  });

  it('Property 22: Component selection based on lesson type - Video', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          text: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          media: fc.constant('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
          module_id: fc.integer({ min: 1, max: 100 }),
          order_number: fc.integer({ min: 1, max: 50 }),
          lesson_type: fc.constant('video' as LessonUnitType),
          created_at: fc.date().map(d => d.toISOString()),
          updated_at: fc.date().map(d => d.toISOString()),
        }),
        async (lesson) => {
          (lessonsApi.fetchLesson as jest.Mock).mockResolvedValue(lesson);

          render(
            <LessonViewer lessonId={lesson.id.toString()} cohortId="1" />,
            { wrapper: createWrapper() }
          );

          // Wait for lesson to load
          await screen.findByText(lesson.name, {}, { timeout: 3000 });

          // Verify VideoLessonContent is rendered (it should contain an iframe)
          const videoElement = screen.getByTestId('video-lesson-content');
          expect(videoElement).toBeInTheDocument();
          
          const iframe = videoElement.querySelector('iframe');
          expect(iframe).toBeInTheDocument();
          expect(iframe?.src).toContain('youtube.com/embed');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Property 22: Component selection based on lesson type - PDF', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          text: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          media: fc.webUrl().map(url => url + '.pdf'),
          module_id: fc.integer({ min: 1, max: 100 }),
          order_number: fc.integer({ min: 1, max: 50 }),
          lesson_type: fc.constant('pdf' as LessonUnitType),
          created_at: fc.date().map(d => d.toISOString()),
          updated_at: fc.date().map(d => d.toISOString()),
        }),
        async (lesson) => {
          (lessonsApi.fetchLesson as jest.Mock).mockResolvedValue(lesson);

          render(
            <LessonViewer lessonId={lesson.id.toString()} cohortId="1" />,
            { wrapper: createWrapper() }
          );

          // Wait for lesson to load
          await screen.findByText(lesson.name, {}, { timeout: 3000 });

          // Verify PdfLessonContent is rendered
          const pdfElement = screen.getByTestId('pdf-lesson-content');
          expect(pdfElement).toBeInTheDocument();
          
          const iframe = pdfElement.querySelector('iframe');
          expect(iframe).toBeInTheDocument();
          expect(iframe?.src).toBe(lesson.media);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Property 22: Component selection based on lesson type - Link', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          text: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          media: fc.webUrl(),
          module_id: fc.integer({ min: 1, max: 100 }),
          order_number: fc.integer({ min: 1, max: 50 }),
          lesson_type: fc.constant('link' as LessonUnitType),
          created_at: fc.date().map(d => d.toISOString()),
          updated_at: fc.date().map(d => d.toISOString()),
        }),
        async (lesson) => {
          (lessonsApi.fetchLesson as jest.Mock).mockResolvedValue(lesson);

          render(
            <LessonViewer lessonId={lesson.id.toString()} cohortId="1" />,
            { wrapper: createWrapper() }
          );

          // Wait for lesson to load
          await screen.findByText(lesson.name, {}, { timeout: 3000 });

          // Verify LinkLessonContent is rendered
          const linkElement = screen.getByTestId('link-lesson-content');
          expect(linkElement).toBeInTheDocument();
          
          const link = linkElement.querySelector('a[target="_blank"]');
          expect(link).toBeInTheDocument();
          expect(link?.getAttribute('href')).toBe(lesson.media);
        }
      ),
      { numRuns: 20 }
    );
  });
});
