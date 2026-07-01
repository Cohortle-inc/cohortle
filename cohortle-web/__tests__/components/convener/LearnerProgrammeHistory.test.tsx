import React from 'react';
import { render, screen } from '@testing-library/react';
import LearnerProgrammeHistory from '@/components/convener/LearnerProgrammeHistory';
import { LearnerHistoryEntry } from '@/lib/api/convener';

const mockHistory: LearnerHistoryEntry[] = [
  {
    programmeId: 1,
    programmeName: 'Web Development Bootcamp',
    cohortId: 101,
    cohortName: 'Cohort 1',
    enrolledAt: '2023-01-15T10:00:00Z',
    status: 'completed',
    completionPercentage: 100,
    completedLessons: 24,
    totalLessons: 24
  },
  {
    programmeId: 2,
    programmeName: 'Data Science Fundamentals',
    cohortId: 202,
    cohortName: 'Spring 2024',
    enrolledAt: '2024-03-01T10:00:00Z',
    status: 'active',
    completionPercentage: 45,
    completedLessons: 9,
    totalLessons: 20
  }
];

describe('LearnerProgrammeHistory', () => {
  it('renders history table with correct data', () => {
    render(<LearnerProgrammeHistory history={mockHistory} />);

    expect(screen.getByText('Web Development Bootcamp')).toBeInTheDocument();
    expect(screen.getByText('Cohort 1')).toBeInTheDocument();
    expect(screen.getByText('Data Science Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Spring 2024')).toBeInTheDocument();
  });

  it('displays correct status badges', () => {
    render(<LearnerProgrammeHistory history={mockHistory} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders progress bars and percentages', () => {
    render(<LearnerProgrammeHistory history={mockHistory} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('24 / 24 lessons')).toBeInTheDocument();
    expect(screen.getByText('9 / 20 lessons')).toBeInTheDocument();
  });

  it('displays empty state message when history is empty', () => {
    render(<LearnerProgrammeHistory history={[]} />);

    expect(screen.getByText('No programme history found.')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<LearnerProgrammeHistory history={mockHistory} />);

    // Use getAllByText for 2024 as it appears in cohort name and date
    expect(screen.getByText(/2023/)).toBeInTheDocument();
    expect(screen.getAllByText(/2024/).length).toBeGreaterThan(0);
  });
});
