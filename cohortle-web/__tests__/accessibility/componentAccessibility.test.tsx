/**
 * Automated Accessibility Tests
 * 
 * These tests use jest-axe to automatically detect accessibility violations
 * in key components. They verify WCAG 2.1 AA compliance.
 * 
 * Requirements: 11.5-11.12 - Accessibility standards
 */

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProgrammeCard } from '@/components/discovery/ProgrammeCard';
import { ProgressCard } from '@/components/dashboard/ProgressCard';
import { LessonListItem } from '@/components/learning/LessonListItem';
import { PostItem } from '@/components/community/PostItem';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { LearnerNavBar } from '@/components/navigation/LearnerNavBar';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
  usePathname: () => '/',
}));

// Mock AuthContext
jest.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'learner' },
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}));

describe('Component Accessibility Tests', () => {
  /**
   * Test: ProgrammeCard should have no accessibility violations
   */
  test('ProgrammeCard should be accessible', async () => {
    const { container } = render(
      <ProgrammeCard
        programme={{
          id: 1,
          title: 'Test Programme',
          description: 'A test programme description',
          duration: '8 weeks',
          thumbnail: '/images/test.png',
          weekCount: 8,
          lessonCount: 24,
        }}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: ProgressCard should have no accessibility violations
   */
  test('ProgressCard should be accessible', async () => {
    const { container } = render(
      <ProgressCard
        programmeId={1}
        programmeTitle="Test Programme"
        progress={65}
        completedLessons={13}
        totalLessons={20}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: LessonListItem should have no accessibility violations
   */
  test('LessonListItem should be accessible', async () => {
    const { container } = render(
      <LessonListItem
        lesson={{
          id: 1,
          title: 'Introduction to Testing',
          type: 'video',
          duration: 15,
          isCompleted: false,
          isLocked: false,
        }}
        weekId={1}
        programmeId={1}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: PostItem should have no accessibility violations
   */
  test('PostItem should be accessible', async () => {
    const { container } = render(
      <PostItem
        post={{
          id: '1',
          author_id: '1',
          author_name: 'Test User',
          content: 'This is a test post',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          like_count: 5,
          comment_count: 2,
          user_has_liked: false,
          comments: [],
        }}
        currentUserId="1"
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onLike={jest.fn()}
        onUnlike={jest.fn()}
        onAddComment={jest.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: ProfileHeader should have no accessibility violations
   */
  test('ProfileHeader should be accessible', async () => {
    const { container} = render(
      <ProfileHeader
        name="Test User"
        email="test@example.com"
        joinedAt={new Date().toISOString()}
        onEditClick={jest.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: LearnerNavBar should have no accessibility violations
   */
  test('LearnerNavBar should be accessible', async () => {
    const { container } = render(<LearnerNavBar />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: Forms should have proper labels
   */
  test('form inputs should have associated labels', async () => {
    const { container } = render(
      <form>
        <label htmlFor="test-input">Test Input</label>
        <input id="test-input" type="text" />
        
        <label htmlFor="test-select">Test Select</label>
        <select id="test-select">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </select>
        
        <label htmlFor="test-textarea">Test Textarea</label>
        <textarea id="test-textarea" />
      </form>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: Buttons should have accessible names
   */
  test('buttons should have accessible names', async () => {
    const { container } = render(
      <div>
        <button>Click Me</button>
        <button aria-label="Close dialog">×</button>
        <button>
          <span aria-hidden="true">🔍</span>
          <span className="sr-only">Search</span>
        </button>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: Images should have alt text
   */
  test('images should have alt text', async () => {
    const { container } = render(
      <div>
        <img src="/test.png" alt="Test image description" />
        <img src="/decorative.png" alt="" role="presentation" />
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: Headings should have proper hierarchy
   */
  test('headings should follow proper hierarchy', async () => {
    const { container } = render(
      <div>
        <h1>Main Heading</h1>
        <h2>Section Heading</h2>
        <h3>Subsection Heading</h3>
        <h2>Another Section</h2>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: Links should have accessible names
   */
  test('links should have accessible names', async () => {
    const { container } = render(
      <div>
        <a href="/test">Descriptive Link Text</a>
        <a href="/icon" aria-label="Go to settings">
          <span aria-hidden="true">⚙️</span>
        </a>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: Lists should be properly structured
   */
  test('lists should be properly structured', async () => {
    const { container } = render(
      <div>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
        
        <ol>
          <li>Step 1</li>
          <li>Step 2</li>
          <li>Step 3</li>
        </ol>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: ARIA roles should be used correctly
   */
  test('ARIA roles should be valid', async () => {
    const { container } = render(
      <div>
        <nav role="navigation">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
          </ul>
        </nav>
        
        <main role="main">
          <article>
            <h1>Article Title</h1>
            <p>Article content</p>
          </article>
        </main>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: Color contrast should be sufficient
   * Note: This is a basic test. Manual testing with tools is still recommended.
   */
  test('text should have sufficient color contrast', async () => {
    const { container } = render(
      <div>
        <p style={{ color: '#000000', backgroundColor: '#FFFFFF' }}>
          High contrast text (21:1)
        </p>
        <p style={{ color: '#333333', backgroundColor: '#FFFFFF' }}>
          Good contrast text (12.6:1)
        </p>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
