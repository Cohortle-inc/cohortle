import React from 'react';
import { render, screen } from '@testing-library/react';
import LearnerProfileOverview from '@/components/convener/LearnerProfileOverview';
import { GlobalLearnerProfile } from '@/lib/api/convener';

describe('LearnerProfileOverview Resilience', () => {
  const minimalProfile: any = {
    id: 1,
    firstName: 'Resilient',
    lastName: 'Learner',
    email: 'resilient@example.com'
  };

  it('renders correctly when stats object is missing', () => {
    // This previously crashed with: TypeError: Cannot read properties of undefined (reading 'overallCompletionRate')
    render(<LearnerProfileOverview profile={minimalProfile as GlobalLearnerProfile} />);

    expect(screen.getByText('Resilient Learner')).toBeInTheDocument();
    // Default values should be shown
    // Using getAllByText for '0%' because there might be multiples (completion, progress)
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
    // Secondary stats usually show '0'
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('renders correctly when profile is null', () => {
    render(<LearnerProfileOverview profile={null as any} />);
    expect(screen.getByText(/profile information is unavailable/i)).toBeInTheDocument();
  });

  it('handles partial stats safely', () => {
    const partialProfile = {
      ...minimalProfile,
      stats: {
        overallCompletionRate: 45
        // other stats missing
      }
    };
    render(<LearnerProfileOverview profile={partialProfile as GlobalLearnerProfile} />);
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('0 / 0')).toBeInTheDocument(); // programmes enrolled/completed
  });
});
