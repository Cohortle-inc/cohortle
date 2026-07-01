'use client';

import { useState, useEffect, useCallback } from 'react';

interface DriveConnectionState {
  isConnected: boolean;
  connectedEmail: string | null;
  isLoading: boolean;
  error: string | null;
}

const INITIAL_STATE: DriveConnectionState = {
  isConnected: false,
  connectedEmail: null,
  isLoading: true,
  error: null,
};

/**
 * Hook to manage Google Drive connection state for a convener.
 *
 * - Fetches connection status from GET /api/proxy/drive/status on mount
 * - connect() redirects to Google OAuth
 * - disconnect() calls POST /api/proxy/drive/disconnect and refreshes state
 *
 * Requirements: 1.1–1.8
 */
export function useDriveConnection() {
  const [state, setState] = useState<DriveConnectionState>(INITIAL_STATE);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/proxy/drive/status');
      const data = await res.json();
      if (!res.ok || data.error) {
        setState({
          isConnected: false,
          connectedEmail: null,
          isLoading: false,
          error: data.message || 'Failed to fetch Drive status.',
        });
        return;
      }
      setState({
        isConnected: !!data.isConnected,
        connectedEmail: data.email ?? null,
        isLoading: false,
        error: null,
      });
    } catch {
      setState({
        isConnected: false,
        connectedEmail: null,
        isLoading: false,
        error: 'Failed to fetch Drive status.',
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Redirects the browser to Google OAuth to connect Drive.
   * Requirements: 1.3
   */
  const connect = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUri = `${appUrl}/api/drive/callback`;

    const params = new URLSearchParams({
      client_id: clientId || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file',
        'email',
        'profile',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }, []);

  /**
   * Disconnects Drive by calling POST /api/proxy/drive/disconnect.
   * Requirements: 1.6
   */
  const disconnect = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/proxy/drive/disconnect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.error) {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: data.message || 'Failed to disconnect Google Drive.',
        }));
        return;
      }
      setState({
        isConnected: false,
        connectedEmail: null,
        isLoading: false,
        error: null,
      });
    } catch {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: 'Failed to disconnect Google Drive.',
      }));
    }
  }, []);

  return { state, connect, disconnect, refresh };
}
