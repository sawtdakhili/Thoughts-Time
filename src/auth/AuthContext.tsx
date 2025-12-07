/**
 * Authentication Context and Provider.
 *
 * Provides authentication state and methods throughout the application.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  AuthState,
  SignUpData,
  SignInData,
  AuthResult,
} from './types';
import { getAuthStorage } from './AuthStorageProvider';
import { getGitHubService } from './GitHubService';

interface AuthContextValue extends AuthState {
  /** Sign up a new user */
  signUp: (data: SignUpData) => Promise<AuthResult>;
  /** Sign in with email/username and password */
  signIn: (data: SignInData) => Promise<AuthResult>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Sign in with GitHub OAuth */
  signInWithGitHub: () => void;
  /** Handle GitHub OAuth callback */
  handleGitHubCallback: (code: string) => Promise<AuthResult>;
  /** Request password reset email */
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  /** Reset password with token */
  resetPassword: (token: string, newPassword: string) => Promise<AuthResult>;
  /** Update user profile */
  updateProfile: (updates: { firstName?: string; surname?: string; username?: string }) => Promise<AuthResult>;
  /** Clear any error */
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storage = getAuthStorage();
        await storage.initialize();

        const user = await storage.getCurrentUser();
        setState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initAuth();
  }, []);

  const signUp = useCallback(async (data: SignUpData): Promise<AuthResult> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        const error = 'Passwords do not match';
        setState((prev) => ({ ...prev, isLoading: false, error }));
        return { success: false, error };
      }

      // Validate password strength
      if (data.password.length < 8) {
        const error = 'Password must be at least 8 characters';
        setState((prev) => ({ ...prev, isLoading: false, error }));
        return { success: false, error };
      }

      const storage = getAuthStorage();
      const result = await storage.createUser(
        data.email,
        data.username,
        data.password,
        data.firstName,
        data.surname
      );

      if (result.success && result.user) {
        // Auto sign in after registration
        const signInResult = await storage.signIn(data.email, data.password);
        if (signInResult.success && signInResult.user) {
          setState({
            user: signInResult.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return signInResult;
        }
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.error || null,
      }));

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Sign up failed';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  }, []);

  const signIn = useCallback(async (data: SignInData): Promise<AuthResult> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const storage = getAuthStorage();
      const result = await storage.signIn(data.emailOrUsername, data.password);

      if (result.success && result.user) {
        setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Sign in failed',
        }));
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Sign in failed';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const storage = getAuthStorage();
      await storage.signOut();

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, []);

  const signInWithGitHub = useCallback(() => {
    const github = getGitHubService();

    if (!github.isConfigured()) {
      setState((prev) => ({
        ...prev,
        error: 'GitHub App not configured. Set VITE_GITHUB_CLIENT_ID.',
      }));
      return;
    }

    // GitHubService handles state generation and redirect
    github.initiateOAuth();
  }, []);

  const handleGitHubCallback = useCallback(async (code: string): Promise<AuthResult> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const github = getGitHubService();

      // Exchange code for tokens (via backend in production, mock in dev)
      const tokenResponse = await github.exchangeCodeForToken(code);

      // Fetch user info from GitHub
      const user = await github.getUser(tokenResponse.access_token);
      const email = await github.getUserEmail(tokenResponse.access_token);

      // Create credentials object with token expiration info
      const credentials = github.createCredentials(tokenResponse, user);

      // Store user in our database
      const storage = getAuthStorage();
      const result = await storage.signInWithGitHub(
        credentials,
        email || user.email,
        user.name
      );

      if (result.success && result.user) {
        setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || 'GitHub sign in failed',
        }));
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'GitHub sign in failed';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const storage = getAuthStorage();
      const result = await storage.createPasswordResetToken(email);

      setState((prev) => ({ ...prev, isLoading: false }));

      // In a real app, you'd send an email with the reset link
      // For this demo, we'll log the token to console
      if (result.token) {
        console.log('Password reset token (demo):', result.token);
        console.log('Reset URL:', `${window.location.origin}/auth/reset-password?token=${result.token}`);
      }

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send reset email';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<AuthResult> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      if (newPassword.length < 8) {
        const error = 'Password must be at least 8 characters';
        setState((prev) => ({ ...prev, isLoading: false, error }));
        return { success: false, error };
      }

      const storage = getAuthStorage();
      const result = await storage.resetPassword(token, newPassword);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.error || null,
      }));

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to reset password';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  }, []);

  const updateProfile = useCallback(async (
    updates: { firstName?: string; surname?: string; username?: string }
  ): Promise<AuthResult> => {
    if (!state.user) {
      return { success: false, error: 'Not authenticated' };
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const storage = getAuthStorage();
      const result = await storage.updateProfile(state.user.id, updates);

      if (result.success && result.user) {
        setState((prev) => ({
          ...prev,
          user: result.user!,
          isLoading: false,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || null,
        }));
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update profile';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  }, [state.user]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    signUp,
    signIn,
    signOut,
    signInWithGitHub,
    handleGitHubCallback,
    forgotPassword,
    resetPassword,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
