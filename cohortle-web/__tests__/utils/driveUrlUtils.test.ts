import {
  isDriveUrl,
  getDriveEmbedUrl,
  mimeTypeToLessonType,
  extractDriveFileId,
} from '@/lib/utils/driveUrlUtils';

// ─── isDriveUrl ───────────────────────────────────────────────────────────────

describe('isDriveUrl', () => {
  describe('returns true for recognised Drive URL patterns', () => {
    it('drive.google.com/file/d/{id}/view', () => {
      expect(isDriveUrl('https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/view')).toBe(true);
    });

    it('docs.google.com/document/d/{id}/edit', () => {
      expect(isDriveUrl('https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit')).toBe(true);
    });

    it('docs.google.com/presentation/d/{id}/edit', () => {
      expect(isDriveUrl('https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit')).toBe(true);
    });

    it('docs.google.com/spreadsheets/d/{id}/edit', () => {
      expect(isDriveUrl('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit')).toBe(true);
    });

    it('slides.google.com/presentation/d/{id}', () => {
      expect(isDriveUrl('https://slides.google.com/presentation/d/abc123/edit')).toBe(true);
    });

    it('sheets.google.com/spreadsheets/d/{id}', () => {
      expect(isDriveUrl('https://sheets.google.com/spreadsheets/d/abc123/edit')).toBe(true);
    });

    it('URL without trailing path segment', () => {
      expect(isDriveUrl('https://drive.google.com/file/d/someFileId')).toBe(true);
    });
  });

  describe('returns false for non-Drive URLs', () => {
    it('arbitrary https URL', () => {
      expect(isDriveUrl('https://example.com/file.pdf')).toBe(false);
    });

    it('YouTube URL', () => {
      expect(isDriveUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    });

    it('empty string', () => {
      expect(isDriveUrl('')).toBe(false);
    });

    it('non-string input', () => {
      // @ts-expect-error testing runtime safety
      expect(isDriveUrl(null)).toBe(false);
      // @ts-expect-error testing runtime safety
      expect(isDriveUrl(undefined)).toBe(false);
    });

    it('google.com but not a Drive path', () => {
      expect(isDriveUrl('https://google.com/search?q=test')).toBe(false);
    });

    it('partial match — drive.google.com without /file/d/', () => {
      expect(isDriveUrl('https://drive.google.com/drive/folders/abc')).toBe(false);
    });
  });
});

// ─── extractDriveFileId ───────────────────────────────────────────────────────

describe('extractDriveFileId', () => {
  it('extracts ID from drive.google.com/file/d/{id}/view', () => {
    expect(extractDriveFileId('https://drive.google.com/file/d/FILE_ID_123/view')).toBe('FILE_ID_123');
  });

  it('extracts ID from docs.google.com/document/d/{id}/edit', () => {
    expect(extractDriveFileId('https://docs.google.com/document/d/DOC_ID_456/edit')).toBe('DOC_ID_456');
  });

  it('extracts ID from docs.google.com/presentation/d/{id}/edit', () => {
    expect(extractDriveFileId('https://docs.google.com/presentation/d/PRES_ID_789/edit')).toBe('PRES_ID_789');
  });

  it('extracts ID from docs.google.com/spreadsheets/d/{id}/edit', () => {
    expect(extractDriveFileId('https://docs.google.com/spreadsheets/d/SHEET_ID_000/edit')).toBe('SHEET_ID_000');
  });

  it('extracts ID from slides.google.com URL', () => {
    expect(extractDriveFileId('https://slides.google.com/presentation/d/SLIDES_ID/edit')).toBe('SLIDES_ID');
  });

  it('extracts ID from sheets.google.com URL', () => {
    expect(extractDriveFileId('https://sheets.google.com/spreadsheets/d/SHEETS_ID/edit')).toBe('SHEETS_ID');
  });

  it('stops at query string boundary', () => {
    expect(extractDriveFileId('https://drive.google.com/file/d/MY_ID?usp=sharing')).toBe('MY_ID');
  });

  it('stops at hash boundary', () => {
    expect(extractDriveFileId('https://drive.google.com/file/d/MY_ID#heading')).toBe('MY_ID');
  });

  it('returns null for non-Drive URL', () => {
    expect(extractDriveFileId('https://example.com/file.pdf')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractDriveFileId('')).toBeNull();
  });

  it('returns null for non-string input', () => {
    // @ts-expect-error testing runtime safety
    expect(extractDriveFileId(null)).toBeNull();
  });
});

// ─── getDriveEmbedUrl ─────────────────────────────────────────────────────────

describe('getDriveEmbedUrl', () => {
  it('converts drive.google.com/file URL to /preview', () => {
    const url = 'https://drive.google.com/file/d/FILE_ID/view';
    expect(getDriveEmbedUrl(url)).toBe('https://drive.google.com/file/d/FILE_ID/preview');
  });

  it('converts Google Slides URL to /embed', () => {
    const url = 'https://docs.google.com/presentation/d/PRES_ID/edit';
    expect(getDriveEmbedUrl(url)).toBe('https://docs.google.com/presentation/d/PRES_ID/embed');
  });

  it('converts slides.google.com URL to /embed', () => {
    const url = 'https://slides.google.com/presentation/d/PRES_ID/edit';
    expect(getDriveEmbedUrl(url)).toBe('https://docs.google.com/presentation/d/PRES_ID/embed');
  });

  it('converts Google Docs URL to /preview', () => {
    const url = 'https://docs.google.com/document/d/DOC_ID/edit';
    expect(getDriveEmbedUrl(url)).toBe('https://docs.google.com/document/d/DOC_ID/preview');
  });

  it('converts Google Sheets URL to /preview', () => {
    const url = 'https://docs.google.com/spreadsheets/d/SHEET_ID/edit';
    expect(getDriveEmbedUrl(url)).toBe('https://docs.google.com/spreadsheets/d/SHEET_ID/preview');
  });

  it('converts sheets.google.com URL to /preview', () => {
    const url = 'https://sheets.google.com/spreadsheets/d/SHEET_ID/edit';
    expect(getDriveEmbedUrl(url)).toBe('https://docs.google.com/spreadsheets/d/SHEET_ID/preview');
  });

  it('preserves the file ID in the embed URL', () => {
    const fileId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms';
    const url = `https://drive.google.com/file/d/${fileId}/view`;
    const embedUrl = getDriveEmbedUrl(url);
    expect(embedUrl).toContain(fileId);
  });

  it('returns null for non-Drive URL', () => {
    expect(getDriveEmbedUrl('https://example.com/file.pdf')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getDriveEmbedUrl('')).toBeNull();
  });

  it('returns null for non-string input', () => {
    // @ts-expect-error testing runtime safety
    expect(getDriveEmbedUrl(null)).toBeNull();
  });
});

// ─── mimeTypeToLessonType ─────────────────────────────────────────────────────

describe('mimeTypeToLessonType', () => {
  it('maps application/pdf → pdf', () => {
    expect(mimeTypeToLessonType('application/pdf')).toBe('pdf');
  });

  it('maps application/vnd.google-apps.presentation → pdf', () => {
    expect(mimeTypeToLessonType('application/vnd.google-apps.presentation')).toBe('pdf');
  });

  it('maps application/vnd.google-apps.document → link', () => {
    expect(mimeTypeToLessonType('application/vnd.google-apps.document')).toBe('link');
  });

  it('maps application/vnd.google-apps.spreadsheet → link', () => {
    expect(mimeTypeToLessonType('application/vnd.google-apps.spreadsheet')).toBe('link');
  });

  it('maps video/mp4 → link', () => {
    expect(mimeTypeToLessonType('video/mp4')).toBe('link');
  });

  it('maps video/webm → link', () => {
    expect(mimeTypeToLessonType('video/webm')).toBe('link');
  });

  it('maps video/quicktime → link', () => {
    expect(mimeTypeToLessonType('video/quicktime')).toBe('link');
  });

  it('maps any video/* MIME type → link', () => {
    expect(mimeTypeToLessonType('video/x-custom-format')).toBe('link');
  });

  it('maps unknown MIME type → link (safe default)', () => {
    expect(mimeTypeToLessonType('application/octet-stream')).toBe('link');
  });

  it('maps empty string → link', () => {
    expect(mimeTypeToLessonType('')).toBe('link');
  });

  it('maps non-string input → link', () => {
    // @ts-expect-error testing runtime safety
    expect(mimeTypeToLessonType(null)).toBe('link');
  });

  it('is case-insensitive', () => {
    expect(mimeTypeToLessonType('APPLICATION/PDF')).toBe('pdf');
    expect(mimeTypeToLessonType('Video/MP4')).toBe('link');
  });

  it('is deterministic — same input always returns same output', () => {
    const mimeType = 'application/pdf';
    const results = Array.from({ length: 5 }, () => mimeTypeToLessonType(mimeType));
    expect(new Set(results).size).toBe(1);
  });
});
