/**
 * Unit tests for Programme Page
 * Tests programme display, week grouping, and lesson rendering
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ProgrammePage from '@/app/programmes/[id]/page';
import { getProgrammeWeeks, getEnrolledProgrammes, isEnrolledInProgramme, WLIMPWeek } from '@/lib/api/programmes';
import { useAuth } from '@/lib/contexts/AuthContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api/programmes', () => ({
  getProgrammeWeeks: jest.fn(),
  getEnrolledProgrammes: jest.fn(),
  isEnrolledInProgramme: jest.fn(),
}));

jest.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Programme Page', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  const mockWeeks: WLIMPWeek[] = [
    {
      id: 'week-1',
      programme_id: 'prog-123',
      week_number: 1,
      title: 'Introduction to Leadership',
      start_date: '2026-01-01',
      isCurrent: false,
      lessons: [
        {
          id: 'lesson-1',
          title: 'Welcome Video',
          description: 'Introduction to the programme',
          content_type: 'video',
          content_url: 'https://youtube.com/watch?v=abc123',
          order_index: 0,
          completed: true,
          completed_at: '2026-01-02T10:00:00Z',
        },
        {
          id: 'lesson-2',
          title: 'Course Materials',
          description: 'Download the course materials',
          content_type: 'pdf',
          content_url: 'https://drive.google.com/file/d/xyz789',
          order_index: 1,
          completed: false,
        },
      ],
    },
    {
      id: 'week-2',
      programme_id: 'prog-123',
      week_number: 2,
      title: 'Leadership Fundamentals',
      start_date: '2026-01-08',
      isCurrent: true,
      lessons: [
        {
          id: 'lesson-3',
          title: 'Leadership Styles',
          description: 'Understanding different leadership approaches',
          content_type: 'video',
          content_url: 'https://youtube.com/watch?v=def456',
          order_index: 0,
          completed: false,
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, email: 'test@example.com' },
    });
    // Mock default successful enrollment check
    (isEnrolledInProgramme as jest.Mock).mockResolvedValue(true);
    (getEnrolledProgrammes as jest.Mock).mockResolvedValue([
      {
        id: 123,
        name: 'WLIMP',
        description: 'Test programme',
        currentWeek: 2,
        totalWeeks: 10,
        cohortId: 456,
        enrolledAt: '2026-01-01',
      },
    ]);
  });

  describe('Programme Header', () => {
    it('should display programme title and description', async () => {
      (getProgrammeWeeks as jest.Mock).mockResolvedValue(mockWeeks);

      render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        const titles = screen.getAllByText('WLIMP – Workforce Leadership & Impact Mentorship Programme');
        expect(titles.length).toBeGreaterThan(0);
        expect(screen.getByText('Access your weekly lessons and learning materials')).toBeInTheDocument();
      });
    });
  });

  describe('Week Grouping', () => {
    it('should display all weeks with correct week numbers', async () => {
      (getProgrammeWeeks as jest.Mock).mockResolvedValue(mockWeeks);

      render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        expect(screen.getByText('Week 1')).toBeInTheDocument();
        expect(screen.getByText('Week 2')).toBeInTheDocument();
      });
    });

    it('should display week titles', async () => {
      (getProgrammeWeeks as jest.Mock).mockResolvedValue(mockWeeks);

      render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        expect(screen.getByText('Introduction to Leadership')).toBeInTheDocument();
        expect(screen.getByText('Leadership Fundamentals')).toBeInTheDocument();
      });
    });

    it('should show current week indicator', async () => {
      (getProgrammeWeeks as jest.Mock).mockResolvedValue(mockWeeks);

      render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        expect(screen.getByText('Current Week')).toBeInTheDocument();
      });
    });
  });

  describe('Lesson Rendering', () => {
    it('should display lesson titles and descriptions', async () => {
      (getProgrammeWeeks as jest.Mock).mockResolvedValue(mockWeeks);

      render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        expect(screen.getByText('Welcome Video')).toBeInTheDocument();
        expect(screen.getByText('Introduction to the programme')).toBeInTheDocument();
        expect(screen.getByText('Course Materials')).toBeInTheDocument();
        expect(screen.getByText('Leadership Styles')).toBeInTheDocument();
      });
    });

    it('should display view lesson CTAs', async () => {
      (getProgrammeWeeks as jest.Mock).mockResolvedValue(mockWeeks);

      render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View lesson');
        expect(viewButtons.length).toBe(2); // 2 incomplete lessons
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching data', () => {
      (getProgrammeWeeks as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ProgrammePage params={{ id: '123' }} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      (getProgrammeWeeks as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch programme weeks')
      );

      render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch programme weeks')).toBeInTheDocument();
      });
    });

    it('should show back to dashboard button on error', async () => {
      (getProgrammeWeeks as jest.Mock).mockRejectedValue(
        new Error('Failed to load')
      );

      render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        const backButton = screen.getByText('Back to Dashboard');
        expect(backButton).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no weeks available', async () => {
      (getProgrammeWeeks as jest.Mock).mockResolvedValue([]);

      render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        expect(screen.getByText('No weeks available yet')).toBeInTheDocument();
      });
    });
  });

  describe('Completion Status Display', () => {
    it('should display overall progress percentage', async () => {
      (getProgrammeWeeks as jest.Mock).mockResolvedValue(mockWeeks);

      render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        // 1 out of 3 lessons completed = 33%
        expect(screen.getByText('33%')).toBeInTheDocument();
        expect(screen.getByText('1 of 3 lessons completed')).toBeInTheDocument();
      });
    });

    it('should display week progress indicators', async () => {
      (getProgrammeWeeks as jest.Mock).mockResolvedValue(mockWeeks);

      render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        // Week 1: 1/2 completed
        expect(screen.getByText('1/2 completed')).toBeInTheDocument();
        // Week 2: 0/1 completed
        expect(screen.getByText('0/1 completed')).toBeInTheDocument();
      });
    });

    it('should show completed lessons with checkmark', async () => {
      (getProgrammeWeeks as jest.Mock).mockResolvedValue(mockWeeks);

      render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        // Check for "Review lesson" text for completed lesson
        expect(screen.getByText('Review lesson')).toBeInTheDocument();
        // Check for "View lesson" text for incomplete lessons
        const viewButtons = screen.getAllByText('View lesson');
        expect(viewButtons.length).toBe(2); // 2 incomplete lessons
      });
    });

    it('should display completed lesson with green styling', async () => {
      (getProgrammeWeeks as jest.Mock).mockResolvedValue(mockWeeks);

      const { container } = render(<ProgrammePage params={{ id: '123' }} />);

      await waitFor(() => {
        // Find the completed lesson card by checking for green border
        const lessonCards = container.querySelectorAll('[class*="border-green"]');
        expect(lessonCards.length).toBeGreaterThan(0);
      });
    });
  });
});
