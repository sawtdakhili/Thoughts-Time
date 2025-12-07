/**
 * Authentication module exports.
 */

export type {
  User,
  UserProfile,
  AuthState,
  SignUpData,
  SignInData,
  ForgotPasswordData,
  ResetPasswordData,
  AuthView,
  AuthResult,
  GitHubAppConfig,
  GitHubUser,
  GitHubTokenResponse,
  GitHubApiError,
  GitHubCredentials,
  Session,
  PasswordResetToken,
} from './types';

export {
  hashPassword,
  verifyPassword,
  generateId,
  generateSessionToken,
  generateRandomString,
  generatePasswordResetToken,
  isTokenExpired,
} from './crypto';

export { AuthStorageProvider, getAuthStorage } from './AuthStorageProvider';

export { AuthProvider, useAuth } from './AuthContext';

export { AuthPage } from './AuthPage';

export { AuthGuard, RequireAuth, RequireGuest } from './AuthGuard';

export { GitHubService, getGitHubService } from './GitHubService';
