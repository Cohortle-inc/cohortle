/**
 * Unit tests for GoogleAuthButton component
 * Feature: google-auth-integration, Task 6.2
 * Validates: Requirements 1.1, 1.4, 8.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

jest.mock('next/script', () => {
  return function MockScript({ onLoad }: { onLoad?: () => void }) {
    React.useEffect(() => { if (onLoad) onLoad(); });
    return null;
  };
});

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

type GoogleMock = { accounts: { id: { initialize: jest.Mock; prompt: jest.Mock } } };

function setupGoogleMock(): GoogleMock {
  const mock: GoogleMock = { accounts: { id: { initialize: jest.fn(), prompt: jest.fn() } } };
  (window as unknown as { google: GoogleMock }).google = mock;
  return mock;
}

function clearGoogleMock() {
  delete (window as unknown as { google?: unknown }).google;
}

describe('GoogleAuthButton', () => {
  const onSuccess = jest.fn();
  const onError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    clearGoogleMock();
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  });

  describe('visibility', () => {
    it('renders when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set', () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      setupGoogleMock();
      render(<GoogleAuthButton onSuccess={onSuccess} onError={onError} />);
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    });

    it('does not render when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      render(<GoogleAuthButton onSuccess={onSuccess} onError={onError} />);
      expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows "Signing in..." and disables button while fetch is in flight', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      const googleMock = setupGoogleMock();

      let resolveCallback!: (value: Response) => void;
      mockFetch.mockReturnValue(new Promise<Response>((res) => { resolveCallback = res; }));

      render(<GoogleAuthButton onSuccess={onSuccess} onError={onError} />);

      const credentialCallback = googleMock.accounts.id.initialize.mock.calls[0]?.[0]?.callback;
      await act(async () => { if (credentialCallback) credentialCallback({ credential: 'fake-token' }); });

      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();

      resolveCallback(new Response(JSON.stringify({ user: { id: 1 } }), { status: 200 }));
    });
  });

  describe('error handling', () => {
    it('calls onError when backend returns 401', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      const googleMock = setupGoogleMock();
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ error: true }), { status: 401 }));

      render(<GoogleAuthButton onSuccess={onSuccess} onError={onError} />);
      const credentialCallback = googleMock.accounts.id.initialize.mock.calls[0]?.[0]?.callback;
      await act(async () => { if (credentialCallback) credentialCallback({ credential: 'bad-token' }); });

      await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/google sign-in failed/i)));
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('calls onError with generic message when backend returns 500', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      const googleMock = setupGoogleMock();
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ error: true }), { status: 500 }));

      render(<GoogleAuthButton onSuccess={onSuccess} onError={onError} />);
      const credentialCallback = googleMock.accounts.id.initialize.mock.calls[0]?.[0]?.callback;
      await act(async () => { if (credentialCallback) credentialCallback({ credential: 'bad-token' }); });

      await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/something went wrong/i)));
    });

    it('calls onSuccess with user data on successful response', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      const googleMock = setupGoogleMock();
      const mockUser = { id: 1, email: 'test@example.com', role: 'student' };
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ error: false, user: mockUser }), { status: 200 }));

      render(<GoogleAuthButton onSuccess={onSuccess} onError={onError} />);
      const credentialCallback = googleMock.accounts.id.initialize.mock.calls[0]?.[0]?.callback;
      await act(async () => { if (credentialCallback) credentialCallback({ credential: 'valid-token' }); });

      await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(mockUser));
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('button click', () => {
    it('calls google.accounts.id.prompt() when clicked', () => {
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
      const googleMock = setupGoogleMock();
      render(<GoogleAuthButton onSuccess={onSuccess} onError={onError} />);
      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
      expect(googleMock.accounts.id.prompt).toHaveBeenCalledTimes(1);
    });
  });
});
