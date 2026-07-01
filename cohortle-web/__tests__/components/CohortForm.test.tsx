/**
 * Unit tests for CohortForm component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CohortForm } from '@/components/convener/CohortForm';
import * as convenerApi from '@/lib/api/convener';

// Mock the API module
jest.mock('@/lib/api/convener', () => ({
  ...jest.requireActual('@/lib/api/convener'),
  checkEnrollmentCodeAvailability: jest.fn(),
}));

describe('CohortForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const programmeId = '123';

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: enrollment codes are available
    (convenerApi.checkEnrollmentCodeAvailability as jest.Mock).mockResolvedValue(true);
  });

  describe('Validation', () => {
    it('should display validation error for short cohort name', async () => {
      const user = userEvent.setup();
      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Cohort Name');
      const submitButton = screen.getByText('Create Cohort');

      // Enter short name (less than 3 characters)
      await user.type(nameInput, 'AB');
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(
          screen.getByText(/must be between 3 and 200 characters/i)
        ).toBeInTheDocument();
      });

      // Verify onSubmit not called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display validation error for long cohort name', async () => {
      const user = userEvent.setup();
      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Cohort Name');
      const submitButton = screen.getByText('Create Cohort');

      // Enter name longer than 200 characters
      const longName = 'A'.repeat(201);
      await user.type(nameInput, longName);
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(
          screen.getByText(/must be between 3 and 200 characters/i)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display validation error for missing cohort name', async () => {
      const user = userEvent.setup();
      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByText('Create Cohort');
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/cohort name is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display validation error for missing enrollment code', async () => {
      const user = userEvent.setup();
      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Cohort Name');
      const submitButton = screen.getByText('Create Cohort');

      await user.type(nameInput, 'Test Cohort');
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/enrolment code is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display validation error for invalid enrollment code format', async () => {
      const user = userEvent.setup();
      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code');
      const submitButton = screen.getByText('Create Cohort');

      // Enter code with invalid characters
      await user.type(enrollmentCodeInput, 'TEST@CODE!');
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(
          screen.getByText(/enrolment code must contain only letters, numbers, and hyphens/i)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display validation error for missing start date', async () => {
      const user = userEvent.setup();
      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Cohort Name');
      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code');
      const submitButton = screen.getByText('Create Cohort');

      await user.type(nameInput, 'Test Cohort');
      await user.type(enrollmentCodeInput, 'TEST-CODE');
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display validation error for past start date', async () => {
      const user = userEvent.setup();
      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Cohort Name');
      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code');
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const submitButton = screen.getByText('Create Cohort');

      await user.type(nameInput, 'Test Cohort');
      await user.type(enrollmentCodeInput, 'TEST-CODE');
      
      // Note: The browser's native date input with min attribute prevents
      // entering past dates in many test environments. We'll test the validation
      // logic by directly setting an invalid value and triggering validation.
      // In a real browser, the min attribute would prevent this.
      
      // Clear the min attribute temporarily to test validation
      startDateInput.removeAttribute('min');
      await user.type(startDateInput, '2020-01-01');
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(
          screen.getByText(/start date cannot be in the past/i)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Enrollment Code Generation', () => {
    it('should generate enrollment code when Generate button clicked', async () => {
      const user = userEvent.setup();
      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code') as HTMLInputElement;
      const generateButton = screen.getByRole('button', { name: /generate/i });

      // Initially empty
      expect(enrollmentCodeInput.value).toBe('');

      // Click generate
      await user.click(generateButton);

      // Verify code is generated in format PROG-YYYY-XXXXXX
      await waitFor(() => {
        expect(enrollmentCodeInput.value).toMatch(/^PROG-\d{4}-[A-Z0-9]{6}$/);
      });
    });

    it('should generate different codes on multiple clicks', async () => {
      const user = userEvent.setup();
      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code') as HTMLInputElement;
      const generateButton = screen.getByRole('button', { name: /generate/i });

      // Generate first code
      await user.click(generateButton);
      const firstCode = enrollmentCodeInput.value;

      // Generate second code
      await user.click(generateButton);
      const secondCode = enrollmentCodeInput.value;

      // Codes should be different
      expect(firstCode).not.toBe(secondCode);
    });
  });

  describe('Enrollment Code Availability Check', () => {
    it('should check enrollment code availability in real-time', async () => {
      const user = userEvent.setup();
      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code');

      // Type enrollment code
      await user.type(enrollmentCodeInput, 'TEST-CODE');

      // Wait for debounce and API call
      await waitFor(
        () => {
          expect(convenerApi.checkEnrollmentCodeAvailability).toHaveBeenCalledWith(
            'TEST-CODE'
          );
        },
        { timeout: 1000 }
      );

      // Verify availability message displayed
      await waitFor(() => {
        expect(screen.getByText(/this code is available/i)).toBeInTheDocument();
      });
    });

    it('should display error when enrollment code is not available', async () => {
      const user = userEvent.setup();
      (convenerApi.checkEnrollmentCodeAvailability as jest.Mock).mockResolvedValue(false);

      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code');

      // Type enrollment code
      await user.type(enrollmentCodeInput, 'TAKEN-CODE');

      // Wait for availability check
      await waitFor(
        () => {
          expect(screen.getByText(/this code is already in use/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should disable submit button when code is not available', async () => {
      const user = userEvent.setup();
      (convenerApi.checkEnrollmentCodeAvailability as jest.Mock).mockResolvedValue(false);

      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code');
      const submitButton = screen.getByText('Create Cohort');

      // Type enrollment code
      await user.type(enrollmentCodeInput, 'TAKEN-CODE');

      // Wait for availability check
      await waitFor(
        () => {
          expect(submitButton).toBeDisabled();
        },
        { timeout: 1000 }
      );
    });

    it('should show checking status while validating code', async () => {
      const user = userEvent.setup();
      // Delay the API response
      (convenerApi.checkEnrollmentCodeAvailability as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
      );

      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code');

      // Type enrollment code
      await user.type(enrollmentCodeInput, 'TEST-CODE');

      // Should show checking status
      await waitFor(() => {
        expect(screen.getByText(/checking availability/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit valid form data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Cohort Name');
      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code');
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const submitButton = screen.getByText('Create Cohort');

      // Fill in valid data
      await user.type(nameInput, 'Test Cohort');
      await user.type(enrollmentCodeInput, 'TEST-CODE');
      
      // Wait for availability check
      await waitFor(
        () => {
          expect(screen.getByText(/this code is available/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      await user.type(startDateInput, '2026-12-31');
      await user.click(submitButton);

      // Verify onSubmit called with correct data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Test Cohort',
          enrollmentCode: 'TEST-CODE',
          startDate: '2026-12-31',
        });
      });
    });

    it('should not submit when enrollment code is unavailable', async () => {
      const user = userEvent.setup();
      (convenerApi.checkEnrollmentCodeAvailability as jest.Mock).mockResolvedValue(false);
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Cohort Name');
      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code');
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const submitButton = screen.getByText('Create Cohort');

      // Fill in data with unavailable code
      await user.type(nameInput, 'Test Cohort');
      await user.type(enrollmentCodeInput, 'TAKEN-CODE');
      
      // Wait for availability check
      await waitFor(
        () => {
          expect(screen.getByText(/this code is already in use/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      await user.type(startDateInput, '2026-12-31');

      // Submit button should be disabled
      expect(submitButton).toBeDisabled();

      // Verify onSubmit not called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display API error message', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to create cohort';
      mockOnSubmit.mockRejectedValue(new Error(errorMessage));

      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Cohort Name');
      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code');
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const submitButton = screen.getByText('Create Cohort');

      // Fill in valid data
      await user.type(nameInput, 'Test Cohort');
      await user.type(enrollmentCodeInput, 'TEST-CODE');
      
      // Wait for availability check
      await waitFor(
        () => {
          expect(screen.getByText(/this code is available/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      await user.type(startDateInput, '2026-12-31');
      await user.click(submitButton);

      // Verify error message displayed
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error for unknown errors', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue('Unknown error');

      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Cohort Name');
      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code');
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const submitButton = screen.getByText('Create Cohort');

      // Fill in valid data
      await user.type(nameInput, 'Test Cohort');
      await user.type(enrollmentCodeInput, 'TEST-CODE');
      
      // Wait for availability check
      await waitFor(
        () => {
          expect(screen.getByText(/this code is available/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      await user.type(startDateInput, '2026-12-31');
      await user.click(submitButton);

      // Verify generic error message displayed
      await waitFor(() => {
        expect(
          screen.getByText(/failed to create cohort/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Button', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should disable form inputs during submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <CohortForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Cohort Name');
      const enrollmentCodeInput = screen.getByLabelText('Enrolment Code');
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const submitButton = screen.getByText('Create Cohort');

      // Fill in valid data
      await user.type(nameInput, 'Test Cohort');
      await user.type(enrollmentCodeInput, 'TEST-CODE');
      
      // Wait for availability check
      await waitFor(
        () => {
          expect(screen.getByText(/this code is available/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      await user.type(startDateInput, '2026-12-31');
      await user.click(submitButton);

      // Verify inputs are disabled during submission
      await waitFor(() => {
        expect(nameInput).toBeDisabled();
        expect(enrollmentCodeInput).toBeDisabled();
        expect(startDateInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });
  });
});
