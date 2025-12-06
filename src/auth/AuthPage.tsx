/**
 * Unified Authentication Page
 *
 * Animated auth page with sliding/fading card transitions between
 * sign in, sign up, and forgot password views.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { AuthView, SignUpData, SignInData } from './types';

/** Animation duration in ms */
const ANIMATION_DURATION = 400;

/** Card animation directions */
type AnimationDirection = 'left' | 'right' | 'none';

interface AuthPageProps {
  /** Initial view to show */
  initialView?: AuthView;
  /** Callback when auth is successful */
  onSuccess?: () => void;
}

export function AuthPage({ initialView = 'signin', onSuccess }: AuthPageProps) {
  const {
    signIn,
    signUp,
    forgotPassword,
    signInWithGitHub,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const [currentView, setCurrentView] = useState<AuthView>(initialView);
  const [animatingOut, setAnimatingOut] = useState<AuthView | null>(null);
  const [animationDirection, setAnimationDirection] = useState<AnimationDirection>('none');

  // Form states
  const [signInForm, setSignInForm] = useState<SignInData>({
    emailOrUsername: '',
    password: '',
  });

  const [signUpForm, setSignUpForm] = useState<SignUpData>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    surname: '',
  });

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Clear error when switching views
  useEffect(() => {
    clearError();
  }, [currentView, clearError]);

  const switchView = useCallback((newView: AuthView) => {
    if (newView === currentView || animatingOut) return;

    // Determine animation direction based on view order
    const viewOrder: AuthView[] = ['signin', 'signup', 'forgot-password'];
    const currentIndex = viewOrder.indexOf(currentView);
    const newIndex = viewOrder.indexOf(newView);
    const direction: AnimationDirection = newIndex > currentIndex ? 'left' : 'right';

    setAnimationDirection(direction);
    setAnimatingOut(currentView);

    // After animation completes, switch views
    setTimeout(() => {
      setCurrentView(newView);
      setAnimatingOut(null);
      setAnimationDirection('none');
    }, ANIMATION_DURATION);
  }, [currentView, animatingOut]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn(signInForm);
    if (result.success) {
      onSuccess?.();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signUp(signUpForm);
    if (result.success) {
      onSuccess?.();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await forgotPassword(forgotPasswordEmail);
    if (result.success) {
      setResetEmailSent(true);
    }
  };

  const handleGitHubSignIn = () => {
    signInWithGitHub();
  };

  // Animation classes
  const getCardClasses = (view: AuthView): string => {
    const baseClasses = 'absolute inset-0 w-full transition-all duration-400 ease-out';

    if (view === currentView && !animatingOut) {
      return `${baseClasses} opacity-100 translate-x-0`;
    }

    if (view === animatingOut) {
      const translateClass = animationDirection === 'left' ? '-translate-x-full' : 'translate-x-full';
      return `${baseClasses} opacity-0 ${translateClass}`;
    }

    if (view === currentView && animatingOut) {
      const translateClass = animationDirection === 'left' ? 'translate-x-full' : '-translate-x-full';
      return `${baseClasses} opacity-0 ${translateClass}`;
    }

    return `${baseClasses} opacity-0 pointer-events-none hidden`;
  };

  // Common input styles
  const inputClasses =
    'w-full px-16 py-12 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm focus:outline-none focus:border-text-secondary placeholder:text-text-secondary/50';

  const buttonClasses =
    'w-full px-16 py-12 text-sm font-mono border rounded-sm transition-all duration-200';

  const primaryButtonClasses = `${buttonClasses} bg-text-primary text-background border-text-primary hover:opacity-90 disabled:opacity-50`;

  const secondaryButtonClasses = `${buttonClasses} bg-transparent text-text-secondary border-border-subtle hover:border-text-secondary disabled:opacity-50`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-16">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-32">
          <h1 className="text-2xl font-serif mb-8">Thoughts & Time</h1>
          <p className="text-sm text-text-secondary">
            {currentView === 'signin' && 'Welcome back'}
            {currentView === 'signup' && 'Create your account'}
            {currentView === 'forgot-password' && 'Reset your password'}
          </p>
        </div>

        {/* Card Container */}
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{ minHeight: currentView === 'signup' ? '520px' : '340px' }}
        >
          {/* Sign In Card */}
          <div className={getCardClasses('signin')}>
            <div className="bg-background border border-border-subtle rounded-sm p-24">
              <form onSubmit={handleSignIn} className="space-y-16">
                <div>
                  <label className="block text-sm font-serif mb-8">Email or Username</label>
                  <input
                    type="text"
                    value={signInForm.emailOrUsername}
                    onChange={(e) => setSignInForm({ ...signInForm, emailOrUsername: e.target.value })}
                    className={inputClasses}
                    placeholder="you@example.com"
                    required
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-serif mb-8">Password</label>
                  <input
                    type="password"
                    value={signInForm.password}
                    onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                    className={inputClasses}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={primaryButtonClasses}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-subtle" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-8 bg-background text-text-secondary">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGitHubSignIn}
                  disabled={isLoading}
                  className={secondaryButtonClasses}
                >
                  <span className="flex items-center justify-center gap-8">
                    <GitHubIcon />
                    Continue with GitHub
                  </span>
                </button>
              </form>

              <div className="mt-24 text-center text-sm">
                <button
                  type="button"
                  onClick={() => switchView('forgot-password')}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Forgot password?
                </button>
                <span className="text-text-secondary mx-8">|</span>
                <button
                  type="button"
                  onClick={() => switchView('signup')}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Create account
                </button>
              </div>
            </div>
          </div>

          {/* Sign Up Card */}
          <div className={getCardClasses('signup')}>
            <div className="bg-background border border-border-subtle rounded-sm p-24">
              <form onSubmit={handleSignUp} className="space-y-12">
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <label className="block text-sm font-serif mb-8">First Name</label>
                    <input
                      type="text"
                      value={signUpForm.firstName}
                      onChange={(e) => setSignUpForm({ ...signUpForm, firstName: e.target.value })}
                      className={inputClasses}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-serif mb-8">Surname</label>
                    <input
                      type="text"
                      value={signUpForm.surname}
                      onChange={(e) => setSignUpForm({ ...signUpForm, surname: e.target.value })}
                      className={inputClasses}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-serif mb-8">Email</label>
                  <input
                    type="email"
                    value={signUpForm.email}
                    onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                    className={inputClasses}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-serif mb-8">Username</label>
                  <input
                    type="text"
                    value={signUpForm.username}
                    onChange={(e) => setSignUpForm({ ...signUpForm, username: e.target.value })}
                    className={inputClasses}
                    placeholder="johndoe"
                    required
                    autoComplete="username"
                    pattern="[a-zA-Z0-9_-]+"
                    title="Letters, numbers, underscores, and hyphens only"
                  />
                </div>

                <div>
                  <label className="block text-sm font-serif mb-8">Password</label>
                  <input
                    type="password"
                    value={signUpForm.password}
                    onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                    className={inputClasses}
                    placeholder="At least 8 characters"
                    required
                    autoComplete="new-password"
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-serif mb-8">Confirm Password</label>
                  <input
                    type="password"
                    value={signUpForm.confirmPassword}
                    onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                    className={inputClasses}
                    placeholder="Confirm your password"
                    required
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={primaryButtonClasses}
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-subtle" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-8 bg-background text-text-secondary">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGitHubSignIn}
                  disabled={isLoading}
                  className={secondaryButtonClasses}
                >
                  <span className="flex items-center justify-center gap-8">
                    <GitHubIcon />
                    Sign up with GitHub
                  </span>
                </button>
              </form>

              <div className="mt-16 text-center text-sm">
                <span className="text-text-secondary">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => switchView('signin')}
                  className="text-text-secondary hover:text-text-primary transition-colors underline"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>

          {/* Forgot Password Card */}
          <div className={getCardClasses('forgot-password')}>
            <div className="bg-background border border-border-subtle rounded-sm p-24">
              {!resetEmailSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-16">
                  <p className="text-sm text-text-secondary mb-16">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  <div>
                    <label className="block text-sm font-serif mb-8">Email</label>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className={inputClasses}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={primaryButtonClasses}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-16">
                  <div className="text-4xl mb-16">✓</div>
                  <h3 className="text-lg font-serif mb-8">Check your email</h3>
                  <p className="text-sm text-text-secondary mb-16">
                    If an account exists for {forgotPasswordEmail}, you'll receive a password reset link.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmailSent(false);
                      setForgotPasswordEmail('');
                    }}
                    className={secondaryButtonClasses}
                  >
                    Send another link
                  </button>
                </div>
              )}

              <div className="mt-24 text-center text-sm">
                <button
                  type="button"
                  onClick={() => switchView('signin')}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** GitHub Icon Component */
function GitHubIcon() {
  return (
    <svg
      className="w-16 h-16"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default AuthPage;
