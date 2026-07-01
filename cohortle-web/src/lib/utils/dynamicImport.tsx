/**
 * Dynamic Import Utilities
 * Helpers for lazy loading components and libraries
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Loading component shown while dynamic component loads
 */
export const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

/**
 * Error component shown if dynamic component fails to load
 */
export const ErrorFallback = ({ error }: { error?: Error }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
    <p className="text-red-800 font-medium">Failed to load component</p>
    {error && process.env.NODE_ENV === 'development' && (
      <p className="text-sm text-red-600 mt-2">{error.message}</p>
    )}
  </div>
);

/**
 * Create a dynamically imported component with loading and error states
 * 
 * @example
 * const HeavyComponent = createDynamicComponent(
 *   () => import('./HeavyComponent'),
 *   { ssr: false }
 * );
 */
export function createDynamicComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    ssr?: boolean;
    loading?: () => React.ReactElement | null;
  }
) {
  return dynamic(importFn, {
    ssr: options?.ssr ?? true,
    loading: options?.loading ?? LoadingFallback,
  });
}

/**
 * Lazy load a library only when needed
 * Useful for large libraries like DOMPurify, date-fns, etc.
 * 
 * @example
 * const sanitize = await lazyLoadLibrary(() => import('dompurify'));
 * const clean = sanitize.default.sanitize(dirty);
 */
export async function lazyLoadLibrary<T>(
  importFn: () => Promise<T>
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    console.error('Failed to lazy load library:', error);
    throw error;
  }
}

/**
 * Preload a component or library
 * Useful for prefetching on hover or when user is likely to need it
 * 
 * @example
 * <button onMouseEnter={() => preloadComponent(() => import('./Modal'))}>
 *   Open Modal
 * </button>
 */
export function preloadComponent(importFn: () => Promise<any>) {
  // Next.js dynamic imports are automatically prefetched
  // This function provides a consistent API
  importFn().catch(err => {
    console.warn('Failed to preload component:', err);
  });
}

/**
 * Create a lazy-loaded modal component
 * Modals are perfect candidates for code splitting since they're not always visible
 */
export function createLazyModal<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>
) {
  return createDynamicComponent(importFn, {
    ssr: false, // Modals don't need SSR
  });
}

/**
 * Create a lazy-loaded chart/visualization component
 * Charts are often heavy and benefit from lazy loading
 */
export function createLazyChart<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>
) {
  return createDynamicComponent(importFn, {
    ssr: false, // Charts don't need SSR
  });
}
