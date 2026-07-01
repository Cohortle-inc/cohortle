/**
 * Unit tests for Join Programme Page
 * Tests enrollment form validation, submission, and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import JoinPage from '@/app/join/page';
import { enrollInProgramme } from '@/lib/api/programmes';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api/programmes', () => ({
  enrollInProgramme: jest.fn(),
}));

describe('Join Programme Page', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Form Rendering', () => {
    it('should render the join form with all elements', () => {
      render(<JoinPage />);

      expect(screen.getByText('Join a Programme')).toBeInTheDocument();
      expect(screen.getByText('Enter your enrollment code to get started')).toBeInTheDocument();
      expect(screen.getByLabelText(/enrollment code/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /join programme/i })).toBeInTheDocument();
    });

    it('should show helper text for code format', () => {
      render(<JoinPage />);

      expect(screen.getByText('Format: PROGRAMME-YEAR')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty code on submit', async () => {
      render(<JoinPage />);

      const submitButton = screen.getByRole('button', { name: /join programme/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Enrollment code is required')).toBeInTheDocument();
      });

      expect(enrollInProgramme).not.toHaveBeenCalled();
    });

    it('should show error for invalid code format', async () => {
      render(<JoinPage />);

      const input = screen.getByLabelText(/enrollment code/i);
      const submitButton = screen.getByRole('button', { name: /join programme/i });

      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid code format/i)).toBeInTheDocument();
      });

      expect(enrollInProgramme).not.toHaveBeenCalled();
    });

    it('should accept valid code format WORD-YEAR', async () => {
      (enrollInProgramme as jest.Mock).mockResolvedValue({
        success: true,
        programme_id: 'prog-123',
        programme_name: 'WLIMP',
        cohort_id: 'cohort-456',
      });

      render(<JoinPage />);

      const input = screen.getByLabelText(/enrollment code/i);
      const submitButton = screen.getByRole('button', { name: /join programme/i });

      fireEvent.change(input, { target: { value: 'WLIMP-2026' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(enrollInProgramme).toHaveBeenCalledWith('WLIMP-2026');
      });
    });
  });

  describe('Enrollment Submission', () => {
    it('should call enrollInProgramme with uppercase code', async () => {
      (enrollInProgramme as jest.Mock).mockResolvedValue({
        success: true,
        programme_id: 'prog-123',
        programme_name: 'WLIMP',
        cohort_id: 'cohort-456',
      });

      render(<JoinPage />);

      const input = screen.getByLabelText(/enrollment code/i);
      const submitButton = screen.getByRole('button', { name: /join programme/i });

      fireEvent.change(input, { target: { value: 'wlimp-2026' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(enrollInProgramme).toHaveBeenCalledWith('WLIMP-2026');
      });
    });

    it('should show loading state during submission', async () => {
      (enrollInProgramme as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<JoinPage />);

      const input = screen.getByLabelText(/enrollment code/i);
      const submitButton = screen.getByRole('button', { name: /join programme/i });

      fireEvent.change(input, { target: { value: 'WLIMP-2026' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Joining...')).toBeInTheDocument();
      });
    });

    it('should disable form during submission', async () => {
      (enrollInProgramme as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<JoinPage />);

      const input = screen.getByLabelText(/enrollment code/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /join programme/i }) as HTMLButtonElement;

      fireEvent.change(input, { target: { value: 'WLIMP-2026' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(input.disabled).toBe(true);
        expect(submitButton.disabled).toBe(true);
      });
    });
  });

  describe('Success Handling', () => {
    it('should redirect to programme page on successful enrollment', async () => {
      (enrollInProgramme as jest.Mock).mockResolvedValue({
        success: true,
        programme_id: 'prog-123',
        programme_name: 'WLIMP',
        cohort_id: 'cohort-456',
      });

      render(<JoinPage />);

      const input = screen.getByLabelText(/enrollment code/i);
      const submitButton = screen.getByRole('button', { name: /join programme/i });

      fireEvent.change(input, { target: { value: 'WLIMP-2026' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/programmes/prog-123');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when enrollment fails', async () => {
      (enrollInProgramme as jest.Mock).mockRejectedValue(
        new Error('Enrollment code not found')
      );

      render(<JoinPage />);

      const input = screen.getByLabelText(/enrollment code/i);
      const submitButton = screen.getByRole('button', { name: /join programme/i });

      fireEvent.change(input, { target: { value: 'INVALID-2026' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Enrollment code not found')).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should display generic error for unknown errors', async () => {
      (enrollInProgramme as jest.Mock).mockRejectedValue('Unknown error');

      render(<JoinPage />);

      const input = screen.getByLabelText(/enrollment code/i);
      const submitButton = screen.getByRole('button', { name: /join programme/i });

      fireEvent.change(input, { target: { value: 'WLIMP-2026' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Enrollment failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('should re-enable form after error', async () => {
      (enrollInProgramme as jest.Mock).mockRejectedValue(
        new Error('Enrollment failed')
      );

      render(<JoinPage />);

      const input = screen.getByLabelText(/enrollment code/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /join programme/i }) as HTMLButtonElement;

      fireEvent.change(input, { target: { value: 'WLIMP-2026' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Enrollment failed')).toBeInTheDocument();
      });

      expect(input.disabled).toBe(false);
      expect(submitButton.disabled).toBe(false);
    });
  });
});
