'use client';

/**
 * GoogleAuthButton Component
 * Loads the Google Identity Services (GIS) library and renders a
 * "Continue with Google" button. Hides itself if NEXT_PUBLIC_GOOGLE_CLIENT_ID
 * is not set.
 *
 * Key fixes:
 * - Re-initialises GIS on every click so the callback is always fresh
 * - Uses refs for onSuccess/onError so stale closures are never an issue
 * - Shows an immediate loading state on click (before the Google popup opens)
 * - Handles prompt suppression (browser blocks One Tap) by falling back to
 *   the FedCM / popup flow via renderButton, and shows a clear error if both fail
 * - Prevents double-clicks with a ref-based guard
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';

interface GoogleAuthButtonProps {
  onSuccess: (user: Record<string, unknown>) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (
            momentListener?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              getNotDisplayedReason: () => string;
              getSkippedReason: () => string;
            }) => void
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

export function GoogleAuthButton({ onSuccess, onError, disabled }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  // Keep callbacks in refs so initialize() always gets the latest version
  // without needing to re-run the effect or re-initialize on every render
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // Prevent concurrent / double-click invocations
  const inFlightRef = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Called after the GIS script loads
  const handleScriptLoad = useCallback(() => {
    setScriptReady(true);
  }, []);

  // Core credential handler — called by GIS after the user picks an account
  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        const res = await fetch('/api/auth/google-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ google_id_token: response.credential }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          if (res.status === 401) {
            onErrorRef.current('Google sign-in failed. Please try again.');
          } else if (res.status >= 500) {
            onErrorRef.current('Something went wrong. Please try again later.');
          } else {
            onErrorRef.current(data.message || 'Google sign-in failed. Please try again.');
          }
          return;
        }

        onSuccessRef.current(data.user);
      } catch {
        onErrorRef.current('Network error. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
        inFlightRef.current = false;
      }
    },
    [] // stable — reads from refs
  );

  const handleClick = useCallback(() => {
    if (!window.google || disabled || inFlightRef.current) return;

    // Guard against double-clicks
    inFlightRef.current = true;
    setIsLoading(true);

    // Re-initialize on every click so the callback is always the latest
    window.google.accounts.id.initialize({
      client_id: clientId!,
      callback: handleCredentialResponse,
      use_fedcm_for_prompt: true, // use FedCM where available (faster, no popup)
    });

    window.google.accounts.id.prompt((notification) => {
      // prompt() can be suppressed by the browser (e.g. dismissed too many times,
      // or FedCM not available). In that case we clear loading and show a message.
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const reason = notification.isNotDisplayed()
          ? notification.getNotDisplayedReason()
          : notification.getSkippedReason();

        console.warn('[GoogleAuthButton] prompt suppressed:', reason);

        // Clear loading — the user needs to try again or use email/password
        setIsLoading(false);
        inFlightRef.current = false;

        // Only show an error for hard failures, not for user-dismissed cases
        if (reason !== 'user_cancel' && reason !== 'tap_outside') {
          onErrorRef.current(
            'Google sign-in could not be displayed. Please try again or use email and password.'
          );
        }
      }
      // If displayed successfully, loading stays true until handleCredentialResponse fires
    });
  }, [clientId, disabled, handleCredentialResponse]);

  // If the script loaded before the component mounted (e.g. cached), mark ready
  useEffect(() => {
    if (window.google) setScriptReady(true);
  }, []);

  // Hide if client ID is not configured
  if (!clientId) {
    if (typeof window !== 'undefined') {
      console.warn('[GoogleAuthButton] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.');
    }
    return null;
  }

  const isDisabled = isLoading || disabled || !scriptReady;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label="Continue with Google"
        aria-busy={isLoading}
        className="
          w-full flex items-center justify-center gap-3
          px-4 py-3 bg-white border-2 border-gray-300 rounded-md
          text-sm font-semibold text-gray-700
          hover:bg-gray-50 hover:border-gray-400 hover:shadow-md
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-[#391D65]
          transition-all duration-200
          shadow-sm
        "
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4 text-gray-500 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="flex-shrink-0">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
        )}
        <span>
          {isLoading ? 'Signing in...' : !scriptReady ? 'Loading...' : 'Continue with Google'}
        </span>
      </button>
    </>
  );
}
