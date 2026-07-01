'use client';

import { useState, useCallback } from 'react';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  embedLink: string;
}

// Allowed MIME types for the Picker
const PICKER_MIME_TYPES = [
  'application/pdf',
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.spreadsheet',
  'video/*',
].join(',');

// Extend Window to include the Google API loader
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gapi: any;
  }
}

// Typed accessor for the Google Picker API (avoids conflict with existing google.accounts declaration)
interface GooglePickerNamespace {
  PickerBuilder: new () => GooglePickerBuilder;
  ViewId: { DOCS: string };
  Action: { PICKED: string; CANCEL: string };
  DocsView: new (viewId?: string) => GoogleDocsView;
  DocsUploadView: new () => unknown;
  Feature: { MULTISELECT_ENABLED: string };
}

function getGooglePicker(): GooglePickerNamespace {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).google?.picker as GooglePickerNamespace;
}

interface GooglePickerBuilder {
  addView(view: unknown): GooglePickerBuilder;
  setOAuthToken(token: string): GooglePickerBuilder;
  setDeveloperKey(key: string): GooglePickerBuilder;
  setAppId(appId: string): GooglePickerBuilder;
  setCallback(cb: (data: GooglePickerResponse) => void): GooglePickerBuilder;
  setTitle(title: string): GooglePickerBuilder;
  build(): { setVisible(v: boolean): void };
}

interface GoogleDocsView {
  setMimeTypes(types: string): GoogleDocsView;
  setIncludeFolders(v: boolean): GoogleDocsView;
}

interface GooglePickerResponse {
  action: string;
  docs?: Array<{
    id: string;
    name: string;
    mimeType: string;
    url: string;
    embedUrl: string;
  }>;
}

/**
 * Loads the Google Picker JS library once and resolves when ready.
 */
function loadPickerLibrary(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Not in browser environment'));
      return;
    }

    // Already loaded
    if (getGooglePicker()) {
      resolve();
      return;
    }

    // gapi already present — just load the picker module
    if (window.gapi) {
      window.gapi.load('picker', () => resolve());
      return;
    }

    // Inject the script tag
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('picker', () => resolve());
    };
    script.onerror = () => reject(new Error('Failed to load Google Picker library'));
    document.head.appendChild(script);
  });
}

/**
 * useDrivePicker
 *
 * Hook that:
 * 1. Fetches a short-lived picker token from GET /api/proxy/drive/picker-token
 * 2. Loads the Google Picker JS library
 * 3. Opens the Picker with MIME type filters
 * 4. Returns the selected DriveFile or null on cancel
 *
 * Requirements: 4.1–4.8, 10.4
 */
export function useDrivePicker() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 'not_connected' is a special state to show the settings prompt (Req 4.7)
  const [notConnected, setNotConnected] = useState(false);

  const openPicker = useCallback((): Promise<DriveFile | null> => {
    return new Promise(async (resolve) => {
      setIsLoading(true);
      setError(null);
      setNotConnected(false);

      try {
        // Step 1: Fetch picker token from backend
        const tokenRes = await fetch('/api/proxy/drive/picker-token');

        if (tokenRes.status === 403) {
          // Drive not connected — Req 4.7
          setNotConnected(true);
          setIsLoading(false);
          resolve(null);
          return;
        }

        if (!tokenRes.ok) {
          const body = await tokenRes.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to get picker token');
        }

        const { accessToken, appId } = await tokenRes.json();

        // Step 2: Load the Picker library — Req 4.2
        try {
          await loadPickerLibrary();
        } catch {
          // Req 4.8: library failed to load
          throw new Error(
            'Failed to load Google Picker. Please check your connection or enter a URL manually.'
          );
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
        const googlePicker = getGooglePicker();

        // Step 3: Build and open the Picker — Req 4.3
        const docsView = new googlePicker.DocsView()
          .setMimeTypes(PICKER_MIME_TYPES)
          .setIncludeFolders(false);

        const picker = new googlePicker.PickerBuilder()
          .addView(docsView)
          .setOAuthToken(accessToken)
          .setDeveloperKey(apiKey)
          .setAppId(appId)
          .setTitle('Select a file from Google Drive')
          .setCallback((data: GooglePickerResponse) => {
            if (data.action === googlePicker.Action.PICKED && data.docs?.length) {
              const doc = data.docs[0];
              // Req 4.4: return file id, name, mimeType, webViewLink, embedLink
              const file: DriveFile = {
                id: doc.id,
                name: doc.name,
                mimeType: doc.mimeType,
                webViewLink: doc.url,
                embedLink: doc.embedUrl,
              };
              setIsLoading(false);
              resolve(file);
            } else if (data.action === googlePicker.Action.CANCEL) {
              setIsLoading(false);
              resolve(null);
            }
          })
          .build();

        picker.setVisible(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        setIsLoading(false);
        resolve(null);
      }
    });
  }, []);

  return { openPicker, isLoading, error, notConnected };
}
