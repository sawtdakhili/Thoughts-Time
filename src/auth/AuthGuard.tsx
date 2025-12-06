/**
 * Authentication Guard Component
 *
 * Protects routes that require authentication.
 * Shows auth page if user is not authenticated.
 */

import { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { AuthPage } from './AuthPage';

interface AuthGuardProps {
  children: ReactNode;
  /** Show loading spinner while checking auth */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Allow access without auth (for public routes) */
  allowUnauthenticated?: boolean;
}

export function AuthGuard({
  children,
  showLoading = true,
  loadingComponent,
  allowUnauthenticated = false,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg font-serif">Loading...</div>
        </div>
      </div>
    );
  }

  // Allow unauthenticated access if specified
  if (allowUnauthenticated) {
    return <>{children}</>;
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Render protected content
  return <>{children}</>;
}

/**
 * Component to show content only when authenticated.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Component to show content only when NOT authenticated.
 */
export function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default AuthGuard;
