import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LearnerDetailPage from '@/app/convener/programmes/[id]/cohorts/[cohortId]/learners/[learnerId]/page';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

// Mock dependencies
jest.mock('@tanstack/react-query');
jest.mock('next/navigation');
jest.mock('@/lib/api/convener');

const mockUseQuery = useQuery as jest.Mock;
const mockUseParams = useParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseSearchParams = useSearchParams as jest.Mock;

describe('LearnerDetailPage Dashboard', () => {
  const mockParams = {
    id: '1',
    cohortId: '101',
    learnerId: '500'
  };

  const mockCohortLearner = {
    id: 500,
    firstName: 'John',
    lastName: 'Doe',
    completedLessons: 5,
    totalLessons: 10,
    completionPercentage: 50,
    lessonProgress: []
  };

  const mockGlobalProfile = {
    id: 500,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    enrolledAt: '2024-01-01',
    history: [],
    stats: {
      overallCompletionRate: 60,
      averageProgress: 65,
      programmesEnrolled: 2,
      programmesCompleted: 0,
      activeProgrammesCount: 2,
      totalLessonsCompleted: 30,
      assignmentsSubmitted: 2,
      communityContributions: 5
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue(mockParams);
    mockUseRouter.mockReturnValue({ push: jest.fn() });
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'learner-detail') {
        return { data: mockCohortLearner, isLoading: false };
      }
      if (queryKey[0] === 'global-learner-profile') {
        return { data: mockGlobalProfile, isLoading: false };
      }
      if (queryKey[0] === 'learner-activity') {
        return { data: [], isLoading: false };
      }
      return { data: null, isLoading: false };
    });
  });

  it('renders the overview tab by default', () => {
    render(<LearnerDetailPage />);

    expect(screen.getByText('Engagement Snapshot')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('switches tabs correctly', () => {
    render(<LearnerDetailPage />);

    // Timeline
    fireEvent.click(screen.getByText('Timeline'));
    expect(screen.getByText('Activity Timeline')).toBeInTheDocument();

    // History
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByText('Programme History')).toBeInTheDocument();

    // Current Progress
    fireEvent.click(screen.getByText('Current Progress'));
    expect(screen.getByText('Cohort Progress')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({ isLoading: true });

    render(<LearnerDetailPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'global-learner-profile') {
        return { error: new Error('Failed to load'), isLoading: false };
      }
      return { data: {}, isLoading: false };
    });

    render(<LearnerDetailPage />);
    expect(screen.getByText('Failed to load learner details')).toBeInTheDocument();
  });
});
