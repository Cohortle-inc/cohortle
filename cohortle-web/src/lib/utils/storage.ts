/**
 * Token storage utilities
 * Tokens are now stored in httpOnly cookies for security
 * This file provides helper functions for server-side token access
 */

import { cookies } from 'next/headers';

/**
 * Get authentication token from httpOnly cookie (server-side only)
 * @returns JWT token if exists, null otherwise
 */
export function getServerToken(): string | null {
  try {
    const token = cookies().get('auth_token')?.value;
    return token || null;
  } catch (error) {
    console.error('Failed to retrieve auth token:', error);
    return null;
  }
}

/**
 * Check if authentication token exists (client-side)
 * Makes a request to the API to check token existence without exposing it
 * @returns Promise that resolves to true if token exists
 */
export async function hasAuthToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/token');
    const data = await response.json();
    return data.hasToken;
  } catch (error) {
    console.error('Failed to check auth token:', error);
    return false;
  }
}
