/**
 * Authentication API functions
 * Handles user registration, login, logout, and password reset
 * Tokens are managed via httpOnly cookies through Next.js API routes
 */

import apiClient from './client';

/**
 * User registration data
 */
export interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'student' | 'convener';
  invitationCode?: string;
}

/**
 * User login data
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Authentication response from API
 */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    name: string;
    role?: 'student' | 'convener' | 'instructor' | 'administrator';
    profilePicture?: string;
    emailVerified: boolean;
  };
}

/**
 * Register a new user account
 * @param data - Registration data (email, firstName, lastName, password, role)
 * @returns Authentication response with user data
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      role: data.role,
      invitationCode: data.invitationCode,
    }),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(result.message);
  }

  // Defensive check: ensure user object exists
  if (!result.user) {
    console.error('Invalid signup response:', result);
    throw new Error('Invalid response from server. Please try again.');
  }

  return {
    token: '', // Token is in httpOnly cookie, not returned
    user: {
      ...result.user,
      emailVerified: result.user.email_verified || false, // Include email verification status
    },
  };
}

/**
 * Login with email and password
 * @param data - Login credentials (email, password)
 * @returns Authentication response with user data
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(result.message);
  }

  // Defensive check: ensure user object and email exist
  if (!result.user || !result.user.email) {
    console.error('Invalid login response:', result);
    throw new Error('Invalid response from server. Please try again.');
  }

  return {
    token: '', // Token is in httpOnly cookie, not returned
    user: {
      id: result.user.id.toString(),
      email: result.user.email,
      username: result.user.email.split('@')[0],
      name: result.user.email.split('@')[0],
      role: result.user.role, // Include role from backend
      emailVerified: result.user.email_verified || false, // Include email verification status
    },
  };
}

/**
 * Logout current user
 * Clears the httpOnly cookie via API route
 */
export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
  });
}

/**
 * Request password reset email
 * @param email - Email address to send reset link to
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const response = await apiClient.post('/v1/api/auth/forgot-password', { email });
  if (response.data.error) {
    throw new Error(response.data.message);
  }
}

/**
 * Reset password with token from email
 * @param token - Reset token from email link
 * @param newPassword - New password to set
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  // TEMPORARY FIX: Call API directly to bypass proxy header forwarding issue
  // Use lowercase 'authorization' header to match backend expectations
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.cohortle.com'}/v1/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${token}`, // Use lowercase to match backend JwtService.getToken()
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: newPassword }),
  });

  const data = await response.json();
  
  if (!response.ok || data.error) {
    throw new Error(data.message || 'Failed to reset password');
  }
}
