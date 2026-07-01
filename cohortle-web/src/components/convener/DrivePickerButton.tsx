'use client';

import { useState, useCallback } from 'react';
import { useDrivePicker, DriveFile } from '@/lib/hooks/useDrivePicker';

interface DrivePickerButtonProps {
  /** Called with the selected file after sharing is confirmed */
  onFileSelected: (file: DriveFile) => void;
  disabled?: boolean;
}

/**
 * DrivePickerButton
 *
 * Renders a "Browse Drive" button that:
 * 1. Opens the Google Picker via useDrivePicker
 * 2. Calls POST /api/proxy/drive/ensure-shared with the selected file ID
 * 3. Invokes onFileSelected with the file metadata
 *
 * Error states:
 * - Drive not connected (403 from picker-token): shows a settings prompt (Req 4.7)
 * - Picker library fails to load: shows error + allows manual entry (Req 4.8)
 * - ensure-shared fails: shows descriptive error
 *
 * Requirements: 4.1–4.8, 10.4
 */
export default function DrivePickerButton({
  onFileSelected,
  disabled = false,
}: DrivePickerButtonProps) {
  const { openPicker, isLoading: isPickerLoading, error: pickerError, notConnected } = useDrivePicker();
  const [isSharingLoading, setIsSharingLoading] = useState(false);
  const [sharingError, setSharingError] = useState<string | null>(null);

  const isLoading = isPickerLoading || isSharingLoading;

  const handleClick = useCallback(async () => {
    setSharingError(null);

    const file = await openPicker();
    if (!file) return; // cancelled or not connected

    // Step 2: Ensure the file is publicly shared — Req 5.6
    setIsSharingLoading(true);
    try {
      const res = await fetch('/api/proxy/drive/ensure-shared', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: file.id }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        setSharingError(
          data.message ||
            'Failed to verify file sharing. Please check the file permissions or enter a URL manually.'
        );
        setIsSharingLoading(false);
        return;
      }

      // Step 3: Invoke callback with file metadata — Req 4.4
      onFileSelected(file);
    } catch {
      setSharingError(
        'Failed to verify file sharing. Please check your connection or enter a URL manually.'
      );
    } finally {
      setIsSharingLoading(false);
    }
  }, [openPicker, onFileSelected]);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#391D65] border border-[#391D65] rounded-md hover:bg-[#391D65]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Browse Google Drive to select a file"
      >
        {isLoading ? (
          <>
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#391D65] border-t-transparent"
              aria-hidden="true"
            />
            {isSharingLoading ? 'Verifying sharing…' : 'Opening Drive…'}
          </>
        ) : (
          <>
            {/* Google Drive icon */}
            <svg
              viewBox="0 0 87.3 78"
              className="h-4 w-4"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z"
                fill="#0066DA"
              />
              <path
                d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5C.4 49.9 0 51.45 0 53h27.5z"
                fill="#00AC47"
              />
              <path
                d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H60l5.85 11.5z"
                fill="#EA4335"
              />
              <path
                d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z"
                fill="#00832D"
              />
              <path
                d="M60 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.5c1.6 0 3.15-.45 4.5-1.2z"
                fill="#2684FC"
              />
              <path
                d="M73.4 26.5l-12.65-21.9c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 60 53h27.45c0-1.55-.4-3.1-1.2-4.5z"
                fill="#FFBA00"
              />
            </svg>
            Browse Drive
          </>
        )}
      </button>

      {/* Drive not connected — Req 4.7 */}
      {notConnected && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Google Drive is not connected.{' '}
          <a
            href="/convener/settings"
            className="font-medium underline hover:no-underline"
          >
            Connect Drive in settings
          </a>{' '}
          to browse your files.
        </p>
      )}

      {/* Picker library error or sharing error — Req 4.8 */}
      {(pickerError || sharingError) && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {pickerError || sharingError}
        </p>
      )}
    </div>
  );
}
