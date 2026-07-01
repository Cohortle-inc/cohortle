import React from 'react';
import { render, screen } from '@testing-library/react';
import LearnerTable from '@/components/convener/LearnerTable';

const mockLearners = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    profilePicture: 'https://example.com/john.jpg',
    enrolledAt: '2023-01-01T00:00:00Z',
    status: 'active' as const,
    overallProgress: 0.5,
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    // Missing profilePicture
    enrolledAt: '2023-02-01T00:00:00Z',
    status: 'completed' as const,
    overallProgress: 1.0,
  }
];

describe('LearnerTable', () => {
  it('renders learner data correctly', () => {
    render(<LearnerTable learners={mockLearners} programmeId="p1" cohortId="c1" />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles empty learner list', () => {
    render(<LearnerTable learners={[]} programmeId="p1" cohortId="c1" />);
    expect(screen.getByText(/no learners found/i)).toBeInTheDocument();
  });

  it('handles missing or partial learner data gracefully', () => {
    const incompleteLearners = [
      {
        id: '3',
        firstName: 'OnlyName',
        // missing lastName, email, etc.
      } as any
    ];

    render(<LearnerTable learners={incompleteLearners} programmeId="p1" cohortId="c1" />);

    expect(screen.getByText('OnlyName')).toBeInTheDocument();
    // Should display placeholder for progress or N/A
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('displays correct status badges', () => {
    render(<LearnerTable learners={mockLearners} programmeId="p1" cohortId="c1" />);

    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });
});
