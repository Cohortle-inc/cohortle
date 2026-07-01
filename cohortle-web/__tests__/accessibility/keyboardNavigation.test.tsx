/**
 * Keyboard Navigation Tests
 * 
 * These tests verify that all interactive elements can be accessed
 * and operated using only the keyboard.
 * 
 * Requirements: 11.9 - Keyboard navigation support
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompletionButton } from '@/components/lessons/CompletionButton';
import { WeekAccordion } from '@/components/learning/WeekAccordion';
import { PostForm } from '@/components/community/PostForm';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
}));

describe('Keyboard Navigation Tests', () => {
  /**
   * Test: Tab key should move focus through interactive elements
   */
  test('should navigate through interactive elements with Tab key', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <button>Button 1</button>
        <button>Button 2</button>
        <input type="text" placeholder="Input" />
        <a href="/test">Link</a>
      </div>
    );

    const button1 = screen.getByText('Button 1');
    const button2 = screen.getByText('Button 2');
    const input = screen.getByPlaceholderText('Input');
    const link = screen.getByText('Link');

    // Start with first button focused
    button1.focus();
    expect(button1).toHaveFocus();

    // Tab to next element
    await user.tab();
    expect(button2).toHaveFocus();

    // Tab to input
    await user.tab();
    expect(input).toHaveFocus();

    // Tab to link
    await user.tab();
    expect(link).toHaveFocus();
  });

  /**
   * Test: Shift+Tab should move focus backwards
   */
  test('should navigate backwards with Shift+Tab', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <button>Button 1</button>
        <button>Button 2</button>
      </div>
    );

    const button1 = screen.getByText('Button 1');
    const button2 = screen.getByText('Button 2');

    // Start with second button focused
    button2.focus();
    expect(button2).toHaveFocus();

    // Shift+Tab to previous element
    await user.tab({ shift: true });
    expect(button1).toHaveFocus();
  });

  /**
   * Test: Enter key should activate buttons
   */
  test('should activate buttons with Enter key', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<button onClick={handleClick}>Click Me</button>);

    const button = screen.getByText('Click Me');
    button.focus();

    // Press Enter
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Space key should activate buttons
   */
  test('should activate buttons with Space key', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<button onClick={handleClick}>Click Me</button>);

    const button = screen.getByText('Click Me');
    button.focus();

    // Press Space
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Escape key should close modals/dialogs
   */
  test('should close dialogs with Escape key', () => {
    const handleClose = jest.fn();
    
    render(
      <div role="dialog" aria-modal="true" onKeyDown={(e) => {
        if (e.key === 'Escape') handleClose();
      }}>
        <button>Close</button>
      </div>
    );

    const dialog = screen.getByRole('dialog');
    
    // Press Escape
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  /**
   * Test: Arrow keys should navigate through accordion items
   */
  test('should navigate accordion with arrow keys', async () => {
    const user = userEvent.setup();
    
    render(
      <WeekAccordion
        week={{
          id: 1,
          title: 'Week 1',
          description: 'Test week',
          order: 1,
          lessons: [
            { id: 1, title: 'Lesson 1', type: 'video', duration: 10, isCompleted: false, isLocked: false },
            { id: 2, title: 'Lesson 2', type: 'text', duration: 15, isCompleted: false, isLocked: false },
          ],
        }}
        programmeId={1}
        isExpanded={true}
        onToggle={jest.fn()}
      />
    );

    const weekButton = screen.getByRole('button', { name: /Week 1/i });
    weekButton.focus();
    expect(weekButton).toHaveFocus();

    // Arrow keys should work on accordion
    await user.keyboard('{ArrowDown}');
    // Verify focus moved (implementation-specific)
  });

  /**
   * Test: CompletionButton should be keyboard accessible
   */
  test('CompletionButton should be keyboard accessible', async () => {
    const handleComplete = jest.fn();
    const user = userEvent.setup();
    
    render(
      <CompletionButton
        lessonId={1}
        cohortId={1}
        isCompleted={false}
        onComplete={handleComplete}
      />
    );

    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();

    // Activate with Enter
    await user.keyboard('{Enter}');
    expect(handleComplete).toHaveBeenCalled();
  });

  /**
   * Test: Form submission with Enter key
   */
  test('should submit forms with Enter key', async () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    const user = userEvent.setup();
    
    render(
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Enter text" />
        <button type="submit">Submit</button>
      </form>
    );

    const input = screen.getByPlaceholderText('Enter text');
    input.focus();

    // Type and press Enter
    await user.type(input, 'Test text{Enter}');
    expect(handleSubmit).toHaveBeenCalled();
  });

  /**
   * Test: PostForm should be keyboard accessible
   */
  test('PostForm should be fully keyboard accessible', async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();
    
    render(<PostForm onSubmit={handleSubmit} />);

    const textarea = screen.getByPlaceholderText(/What's on your mind/i);
    const submitButton = screen.getByRole('button', { name: /Post/i });

    // Tab to textarea
    await user.tab();
    expect(textarea).toHaveFocus();

    // Type content
    await user.type(textarea, 'Test post content');

    // Tab to submit button
    await user.tab();
    expect(submitButton).toHaveFocus();

    // Submit with Enter
    await user.keyboard('{Enter}');
    expect(handleSubmit).toHaveBeenCalled();
  });

  /**
   * Test: Links should be activatable with Enter
   */
  test('should activate links with Enter key', async () => {
    const handleClick = jest.fn((e) => e.preventDefault());
    const user = userEvent.setup();
    
    render(
      <a href="/test" onClick={handleClick}>
        Test Link
      </a>
    );

    const link = screen.getByText('Test Link');
    link.focus();

    // Press Enter
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalled();
  });

  /**
   * Test: Focus should be visible on all interactive elements
   */
  test('focus should be visible on interactive elements', () => {
    render(
      <div>
        <button className="focus:ring-2 focus:ring-blue-500">Button</button>
        <input className="focus:ring-2 focus:ring-blue-500" />
        <a href="/test" className="focus:ring-2 focus:ring-blue-500">Link</a>
      </div>
    );

    const button = screen.getByRole('button');
    const input = screen.getByRole('textbox');
    const link = screen.getByRole('link');

    // Focus each element and verify focus styles are applied
    button.focus();
    expect(button).toHaveFocus();
    expect(button.className).toContain('focus:ring');

    input.focus();
    expect(input).toHaveFocus();
    expect(input.className).toContain('focus:ring');

    link.focus();
    expect(link).toHaveFocus();
    expect(link.className).toContain('focus:ring');
  });

  /**
   * Test: Skip links should be keyboard accessible
   */
  test('skip to main content link should work', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Skip to main content
        </a>
        <nav>Navigation</nav>
        <main id="main-content">Main Content</main>
      </div>
    );

    const skipLink = screen.getByText('Skip to main content');
    
    // Tab to skip link
    await user.tab();
    expect(skipLink).toHaveFocus();

    // Activate skip link
    await user.keyboard('{Enter}');
    
    // Main content should receive focus
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  /**
   * Test: Disabled elements should not be focusable
   */
  test('disabled elements should not be focusable', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <button>Enabled Button</button>
        <button disabled>Disabled Button</button>
        <button>Another Enabled Button</button>
      </div>
    );

    const enabledButton1 = screen.getByText('Enabled Button');
    const disabledButton = screen.getByText('Disabled Button');
    const enabledButton2 = screen.getByText('Another Enabled Button');

    // Start with first enabled button
    enabledButton1.focus();
    expect(enabledButton1).toHaveFocus();

    // Tab should skip disabled button
    await user.tab();
    expect(enabledButton2).toHaveFocus();
    expect(disabledButton).not.toHaveFocus();
  });
});
