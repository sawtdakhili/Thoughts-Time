/**
 * Authentication types for Thoughts & Time
 */

/** User profile stored in the database */
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  surname: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  /** GitHub user ID if linked */
  githubId: string | null;
  /** GitHub username if linked */
  githubUsername: string | null;
  /** GitHub access token for API calls */
  githubAccessToken: string | null;
}

/** User data without sensitive fields (for UI) */
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  surname: string;
  createdAt: string;
  lastLoginAt: string | null;
  githubUsername: string | null;
  isGithubLinked: boolean;
}

/** Authentication state */
export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/** Sign up form data */
export interface SignUpData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  surname: string;
}

/** Sign in form data */
export interface SignInData {
  emailOrUsername: string;
  password: string;
}

/** Forgot password form data */
export interface ForgotPasswordData {
  email: string;
}

/** Reset password form data */
export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/** Auth view type for animated transitions */
export type AuthView = 'signin' | 'signup' | 'forgot-password';

/** Auth operation result */
export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

/** GitHub OAuth state */
export interface GitHubOAuthState {
  clientId: string;
  redirectUri: string;
  scope: string;
}

/** GitHub user info from API */
export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
}

/** Session data stored in localStorage */
export interface Session {
  userId: string;
  token: string;
  expiresAt: string;
}

/** Password reset token */
export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
}
