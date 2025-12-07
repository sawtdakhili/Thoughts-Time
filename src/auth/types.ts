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
  /** GitHub user access token for API calls (from GitHub App OAuth) */
  githubAccessToken: string | null;
  /** GitHub token expiration time */
  githubTokenExpiresAt: string | null;
  /** GitHub refresh token for renewing access */
  githubRefreshToken: string | null;
  /** GitHub refresh token expiration time */
  githubRefreshTokenExpiresAt: string | null;
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
  /** Whether GitHub token is valid and not expired */
  hasValidGithubToken: boolean;
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

/**
 * GitHub App configuration.
 * GitHub Apps use a different auth flow than OAuth Apps:
 * - Client ID from GitHub App settings
 * - User authorization generates user access tokens
 * - Tokens can be refreshed without user interaction
 * - Scopes are defined at app level, not per-request
 */
export interface GitHubAppConfig {
  /** GitHub App's Client ID */
  clientId: string;
  /** OAuth callback URL */
  redirectUri: string;
  /** Requested permissions (defined in GitHub App settings, but can be reduced) */
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

/**
 * GitHub App OAuth token response.
 * GitHub Apps return expiring tokens that can be refreshed.
 */
export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  /** Token expiration in seconds (GitHub Apps: 8 hours) */
  expires_in?: number;
  /** Refresh token for getting new access tokens */
  refresh_token?: string;
  /** Refresh token expiration in seconds (GitHub Apps: 6 months) */
  refresh_token_expires_in?: number;
}

/**
 * GitHub API error response.
 */
export interface GitHubApiError {
  message: string;
  documentation_url?: string;
}

/**
 * Stored GitHub credentials for a user.
 * Used internally by AuthStorageProvider.
 */
export interface GitHubCredentials {
  accessToken: string;
  tokenExpiresAt: string;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
  githubId: string;
  githubUsername: string;
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
