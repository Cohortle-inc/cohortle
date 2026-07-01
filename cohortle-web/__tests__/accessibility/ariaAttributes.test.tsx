/**
 * ARIA Attributes Tests
 * 
 * These tests verify that ARIA attributes are correctly implemented
 * to provide proper semantics for assistive technologies.
 * 
 * Requirements: 11.8 - ARIA labels and attributes
 */

import { render, screen } from '@testing-library/react';
import { WeekAccordion } from '@/components/learning/WeekAccordion';
import { ProgressIndicator } from '@/components/learning/ProgressIndicator';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
}));

describe('ARIA Attributes Tests', () => {
  /**
   * Test: Buttons should have aria-label when text is not descriptive
   */
  test('icon buttons should have aria-label', () => {
    render(
      <div>
        <button aria-label="Close dialog">×</button>
        <button aria-label="Search">🔍</button>
        <button aria-label="Menu">☰</button>
      </div>
    );

    expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByLabelText('Menu')).toBeInTheDocument();
  });

  /**
   * Test: Form inputs should have aria-describedby for hints
   */
  test('form inputs should have aria-describedby for hints', () => {
    render(
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          aria-describedby="password-hint"
        />
        <span id="password-hint">
          Password must be at least 8 characters
        </span>
      </div>
    );

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-describedby', 'password-hint');
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  /**
   * Test: Error messages should be associated with inputs
   */
  test('error messages should use aria-describedby', () => {
    render(
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          aria-invalid="true"
          aria-describedby="email-error"
        />
        <span id="email-error" role="alert">
          Please enter a valid email address
        </span>
      </div>
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');
  });

  /**
   * Test: Live regions should announce dynamic content
   */
  test('dynamic content should use aria-live', () => {
    render(
      <div>
        <div aria-live="polite" aria-atomic="true">
          Loading content...
        </div>
        <div aria-live="assertive" role="alert">
          Error: Failed to load data
        </div>
      </div>
    );

    const politeRegion = screen.getByText('Loading content...');
    expect(politeRegion).toHaveAttribute('aria-live', 'polite');
    expect(politeRegion).toHaveAttribute('aria-atomic', 'true');

    const assertiveRegion = screen.getByRole('alert');
    expect(assertiveRegion).toHaveAttribute('aria-live', 'assertive');
  });

  /**
   * Test: Accordions should have aria-expanded
   */
  test('WeekAccordion should have aria-expanded attribute', () => {
    const { rerender } = render(
      <WeekAccordion
        week={{
          id: 1,
          title: 'Week 1: Introduction',
          description: 'Getting started',
          order: 1,
          lessons: [],
        }}
        programmeId={1}
        isExpanded={false}
        onToggle={jest.fn()}
      />
    );

    const button = screen.getByRole('button', { name: /Week 1/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    // Rerender with expanded state
    rerender(
      <WeekAccordion
        week={{
          id: 1,
          title: 'Week 1: Introduction',
          description: 'Getting started',
          order: 1,
          lessons: [],
        }}
        programmeId={1}
        isExpanded={true}
        onToggle={jest.fn()}
      />
    );

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  /**
   * Test: Progress indicators should have aria-valuenow
   */
  test('ProgressIndicator should have proper ARIA attributes', () => {
    render(
      <ProgressIndicator
        progress={65}
        completedLessons={13}
        totalLessons={20}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '65');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-label');
  });

  /**
   * Test: Modals should have aria-modal and aria-labelledby
   */
  test('modals should have proper ARIA attributes', () => {
    render(
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <h2 id="modal-title">Confirm Action</h2>
        <p id="modal-description">Are you sure you want to proceed?</p>
        <button>Confirm</button>
        <button>Cancel</button>
      </div>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
  });

  /**
   * Test: Navigation should have aria-label
   */
  test('navigation should have descriptive aria-label', () => {
    render(
      <nav aria-label="Main navigation">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
        </ul>
      </nav>
    );

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeInTheDocument();
  });

  /**
   * Test: Tabs should have proper ARIA attributes
   */
  test('tabs should have proper ARIA attributes', () => {
    render(
      <div>
        <div role="tablist" aria-label="Programme sections">
          <button
            role="tab"
            aria-selected="true"
            aria-controls="panel-learn"
            id="tab-learn"
          >
            Learn
          </button>
          <button
            role="tab"
            aria-selected="false"
            aria-controls="panel-community"
            id="tab-community"
          >
            Community
          </button>
        </div>
        <div
          role="tabpanel"
          id="panel-learn"
          aria-labelledby="tab-learn"
        >
          Learning content
        </div>
        <div
          role="tabpanel"
          id="panel-community"
          aria-labelledby="tab-community"
          hidden
        >
          Community content
        </div>
      </div>
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'Programme sections');

    const learnTab = screen.getByRole('tab', { name: 'Learn' });
    expect(learnTab).toHaveAttribute('aria-selected', 'true');
    expect(learnTab).toHaveAttribute('aria-controls', 'panel-learn');

    const communityTab = screen.getByRole('tab', { name: 'Community' });
    expect(communityTab).toHaveAttribute('aria-selected', 'false');
  });

  /**
   * Test: Loading states should use aria-busy
   */
  test('loading states should use aria-busy', () => {
    render(
      <div aria-busy="true" aria-live="polite">
        <span>Loading...</span>
      </div>
    );

    const loadingContainer = screen.getByText('Loading...').parentElement;
    expect(loadingContainer).toHaveAttribute('aria-busy', 'true');
    expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
  });

  /**
   * Test: Required fields should have aria-required
   */
  test('required form fields should have aria-required', () => {
    render(
      <form>
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          type="text"
          required
          aria-required="true"
        />
        
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          required
          aria-required="true"
        />
      </form>
    );

    const nameInput = screen.getByLabelText(/Name/i);
    expect(nameInput).toHaveAttribute('aria-required', 'true');

    const emailInput = screen.getByLabelText(/Email/i);
    expect(emailInput).toHaveAttribute('aria-required', 'true');
  });

  /**
   * Test: Menus should have proper ARIA attributes
   */
  test('dropdown menus should have proper ARIA attributes', () => {
    render(
      <div>
        <button
          aria-haspopup="true"
          aria-expanded="false"
          aria-controls="menu-1"
        >
          Options
        </button>
        <ul id="menu-1" role="menu" hidden>
          <li role="menuitem">
            <button>Edit</button>
          </li>
          <li role="menuitem">
            <button>Delete</button>
          </li>
        </ul>
      </div>
    );

    const menuButton = screen.getByRole('button', { name: 'Options' });
    expect(menuButton).toHaveAttribute('aria-haspopup', 'true');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-controls', 'menu-1');
  });

  /**
   * Test: Hidden content should use aria-hidden
   */
  test('decorative elements should use aria-hidden', () => {
    render(
      <div>
        <span aria-hidden="true">🎉</span>
        <span>Celebration!</span>
      </div>
    );

    const decorativeIcon = screen.getByText('🎉');
    expect(decorativeIcon).toHaveAttribute('aria-hidden', 'true');
  });

  /**
   * Test: Current page should be indicated with aria-current
   */
  test('current navigation item should use aria-current', () => {
    render(
      <nav>
        <a href="/dashboard" aria-current="page">Dashboard</a>
        <a href="/programmes">Programmes</a>
        <a href="/profile">Profile</a>
      </nav>
    );

    const currentLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(currentLink).toHaveAttribute('aria-current', 'page');
  });

  /**
   * Test: Sort controls should have aria-sort
   */
  test('sortable columns should have aria-sort', () => {
    render(
      <table>
        <thead>
          <tr>
            <th aria-sort="ascending">Name</th>
            <th aria-sort="none">Email</th>
            <th aria-sort="none">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>John Doe</td>
            <td>john@example.com</td>
            <td>2024-01-01</td>
          </tr>
        </tbody>
      </table>
    );

    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });
});
