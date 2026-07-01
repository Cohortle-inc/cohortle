'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cohortle_discover_bookmarks';

export interface BookmarkedProgramme {
  id: number;
  name: string;
  organisation_name: string;
  apply_url: string | null;
  organisation_url: string | null;
  savedAt: string;
}

function readFromStorage(): BookmarkedProgramme[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeToStorage(bookmarks: BookmarkedProgramme[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function useDiscoverBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedProgramme[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setBookmarks(readFromStorage());
    setHydrated(true);
  }, []);

  const isBookmarked = useCallback(
    (id: number) => bookmarks.some((b) => b.id === id),
    [bookmarks]
  );

  const addBookmark = useCallback((programme: Omit<BookmarkedProgramme, 'savedAt'>) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === programme.id)) return prev;
      const next = [{ ...programme, savedAt: new Date().toISOString() }, ...prev];
      writeToStorage(next);
      return next;
    });
  }, []);

  const removeBookmark = useCallback((id: number) => {
    setBookmarks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      writeToStorage(next);
      return next;
    });
  }, []);

  const toggleBookmark = useCallback(
    (programme: Omit<BookmarkedProgramme, 'savedAt'>) => {
      if (isBookmarked(programme.id)) {
        removeBookmark(programme.id);
      } else {
        addBookmark(programme);
      }
    },
    [isBookmarked, addBookmark, removeBookmark]
  );

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
    writeToStorage([]);
  }, []);

  return {
    bookmarks,
    hydrated,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    clearBookmarks,
    count: bookmarks.length,
  };
}
