import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LearnerActivityTimeline from '@/components/convener/LearnerActivityTimeline';
import { LearnerActivity } from '@/lib/api/convener';

const mockActivities: LearnerActivity[] = [
  {
    id: '1',
    type: 'enrollment',
    title: 'Enrolled in Web Development',
    timestamp: '2024-01-01T10:00:00Z',
    programmeName: 'Web Development'
  },
  {
    id: '2',
    type: 'lesson_completion',
    title: 'Completed HTML Basics',
    description: 'Mastered the tags',
    timestamp: '2024-01-02T10:00:00Z',
    programmeName: 'Web Development'
  },
  {
    id: '3',
    type: 'community_post',
    title: 'Asked a question about CSS',
    timestamp: '2024-01-03T10:00:00Z',
    programmeName: 'Web Development'
  }
];

describe('LearnerActivityTimeline', () => {
  it('renders all activities by default', () => {
    render(<LearnerActivityTimeline activities={mockActivities} />);

    expect(screen.getByText('Enrolled in Web Development')).toBeInTheDocument();
    expect(screen.getByText('Completed HTML Basics')).toBeInTheDocument();
    expect(screen.getByText('Asked a question about CSS')).toBeInTheDocument();
  });

  it('filters by content type', () => {
    render(<LearnerActivityTimeline activities={mockActivities} />);

    fireEvent.click(screen.getByRole('button', { name: /Content/i }));

    expect(screen.queryByText('Enrolled in Web Development')).not.toBeInTheDocument();
    expect(screen.getByText('Completed HTML Basics')).toBeInTheDocument();
    expect(screen.queryByText('Asked a question about CSS')).not.toBeInTheDocument();
  });

  it('filters by community type', () => {
    render(<LearnerActivityTimeline activities={mockActivities} />);

    fireEvent.click(screen.getByRole('button', { name: /Community/i }));

    expect(screen.queryByText('Enrolled in Web Development')).not.toBeInTheDocument();
    expect(screen.queryByText('Completed HTML Basics')).not.toBeInTheDocument();
    expect(screen.getByText('Asked a question about CSS')).toBeInTheDocument();
  });

  it('displays empty state when no activities match filter', () => {
    render(<LearnerActivityTimeline activities={[mockActivities[0]]} />); // Only enrollment

    fireEvent.click(screen.getByRole('button', { name: /Content/i }));

    expect(screen.getByText('No activity found matching your criteria.')).toBeInTheDocument();
  });

  it('renders programme labels', () => {
    render(<LearnerActivityTimeline activities={mockActivities} />);

    const labels = screen.getAllByText('Web Development');
    expect(labels.length).toBe(3);
  });
});
