import React from 'react';
import { render, screen } from '@testing-library/react';
import LearnerProfileOverview from '@/components/convener/LearnerProfileOverview';
import { GlobalLearnerProfile } from '@/lib/api/convener';

const mockProfile: GlobalLearnerProfile = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  profilePicture: 'https://example.com/avatar.jpg',
  enrolledAt: '2024-01-01T10:00:00Z',
  completedLessons: 10,
  totalLessons: 20,
  completionPercentage: 50,
  lastActivityAt: '2024-05-01T10:00:00Z',
  history: [],
  stats: {
    overallCompletionRate: 75,
    averageProgress: 80,
    programmesEnrolled: 2,
    programmesCompleted: 1,
    activeProgrammesCount: 1,
    totalLessonsCompleted: 50,
    assignmentsSubmitted: 5,
    communityContributions: 12,
    learningStreak: 5
  }
};

describe('LearnerProfileOverview', () => {
  it('renders learner basic information', () => {
    render(<LearnerProfileOverview profile={mockProfile} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Member since 2024/)).toBeInTheDocument();
  });

  it('renders aggregate stats correctly', () => {
    render(<LearnerProfileOverview profile={mockProfile} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders engagement snapshot', () => {
    render(<LearnerProfileOverview profile={mockProfile} />);

    expect(screen.getByText('50')).toBeInTheDocument(); // totalLessonsCompleted
    expect(screen.getByText('5')).toBeInTheDocument();  // assignmentsSubmitted
    expect(screen.getByText('12')).toBeInTheDocument(); // communityContributions
    expect(screen.getByText('5 days')).toBeInTheDocument(); // learningStreak
  });

  it('handles missing profile picture with initials', () => {
    const profileNoPic = { ...mockProfile, profilePicture: null };
    render(<LearnerProfileOverview profile={profileNoPic} />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
