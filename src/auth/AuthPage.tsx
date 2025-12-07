/**
 * Unified Authentication Page
 *
 * A modern, animated auth page with split-panel layout,
 * tab navigation, and smooth Framer Motion transitions.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useAuth } from './AuthContext';
import { AuthView, SignUpData, SignInData } from './types';

/** Custom parabolic easing for smooth deceleration */
const parabolicEasing = (t: number) => {
  return 1 - Math.pow(1 - t, 2);
};

/** Slide-in animation variants for form elements */
const slideInVariants = {
  hidden: {
    opacity: 0,
    x: -50,
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: parabolicEasing,
    },
  }),
};

/** Page transition variants */
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/** Success animation variants */
const successVariants = {
  initial: { opacity: 0, scale: 0.8, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: parabolicEasing,
    }
  },
  exit: { opacity: 0, scale: 0.8, y: -20 },
};

interface AuthPageProps {
  /** Initial view to show */
  initialView?: AuthView;
  /** Callback when auth is successful */
  onSuccess?: () => void;
}

type ExtendedAuthView = AuthView | 'terms' | 'privacy';

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

  const [currentView, setCurrentView] = useState<ExtendedAuthView>(initialView);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [signInForm, setSignInForm] = useState<SignInData>({
    emailOrUsername: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [signUpForm, setSignUpForm] = useState<SignUpData & { fullName: string; agreeTerms: boolean }>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    surname: '',
    fullName: '',
    agreeTerms: false,
  });

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Clear error when switching views
  useEffect(() => {
    clearError();
  }, [currentView, clearError]);

  // Initial load animation delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Handle full name changes and split into first/surname
  const handleFullNameChange = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    const firstName = parts[0] || '';
    const surname = parts.slice(1).join(' ') || '';
    setSignUpForm({ ...signUpForm, fullName, firstName, surname });
  };

  const switchView = useCallback((newView: ExtendedAuthView) => {
    if (newView === currentView) return;
    clearError();
    setCurrentView(newView);
  }, [currentView, clearError]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn(signInForm);
    if (result.success) {
      setSuccessMessage('Signed in successfully!');
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure we have first name and surname
    if (!signUpForm.firstName) {
      return;
    }

    // Generate username from email if not provided
    const username = signUpForm.username || signUpForm.email.split('@')[0];

    const result = await signUp({
      ...signUpForm,
      username,
    });
    if (result.success) {
      setSuccessMessage('Account created successfully!');
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await forgotPassword(forgotPasswordEmail);
    if (result.success) {
      setResetEmailSent(true);
      setResendCountdown(60);
    }
  };

  const handleResendVerification = async () => {
    if (resendCountdown > 0) return;
    await forgotPassword(forgotPasswordEmail);
    setResendCountdown(60);
  };

  const handleGitHubSignIn = () => {
    signInWithGitHub();
  };

  // Determine if Sign Up button should be disabled
  const isSignUpDisabled = isLoading || !signUpForm.agreeTerms || !signUpForm.email || !signUpForm.password || !signUpForm.confirmPassword || !signUpForm.fullName;

  // Get the appropriate heading based on view
  const getHeading = () => {
    if (currentView === 'forgot-password') return 'Reset your password';
    if (currentView === 'signup' || currentView === 'terms' || currentView === 'privacy') return 'Create your account';
    return 'Sign in to your account';
  };

  // Determine if we're in a sign-up related view
  const isSignUpView = currentView === 'signup' || currentView === 'terms' || currentView === 'privacy';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel - Gradient Illustration */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.75, ease: parabolicEasing }}
        className="hidden lg:flex lg:w-1/2 auth-gradient relative items-center justify-center"
      >
        {/* Decorative illustration */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-center"
          >
            {/* Abstract illustration using CSS */}
            <div className="w-64 h-64 mx-auto mb-8 relative">
              <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-white/5" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl opacity-80">
                  <ClockIcon />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-serif text-white/90 mb-2">Thoughts & Time</h2>
            <p className="text-white/60 text-sm">Capture your thoughts, plan your time</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                variants={successVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="text-center py-16"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <CheckIcon className="w-8 h-8 text-green-500" />
                </motion.div>
                <h2 className="text-xl font-serif text-text-primary">{successMessage}</h2>
                <p className="text-sm text-text-secondary mt-2">Redirecting...</p>
              </motion.div>
            ) : isInitialLoad ? (
              <motion.div
                key="loading"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-16"
              >
                <LoadingSpinner size={48} />
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <LayoutGroup>
                  {/* Heading */}
                  <motion.h1
                    layout
                    custom={0}
                    variants={slideInVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-3xl font-serif font-bold text-text-primary text-center mb-6"
                  >
                    {getHeading()}
                  </motion.h1>

                  {/* Tab Navigation */}
                  {currentView !== 'forgot-password' && (
                    <motion.div
                      layout
                      custom={1}
                      variants={slideInVariants}
                      initial="hidden"
                      animate="visible"
                      className="flex justify-center space-x-6 mb-8"
                    >
                      <TabButton
                        active={currentView === 'signin'}
                        onClick={() => switchView('signin')}
                        icon={<SignInIcon />}
                      >
                        Sign In
                      </TabButton>
                      <TabButton
                        active={isSignUpView}
                        onClick={() => switchView('signup')}
                        icon={<SignUpIcon />}
                      >
                        Sign Up
                      </TabButton>
                    </motion.div>
                  )}

                  {/* Form Content */}
                  <AnimatePresence mode="wait">
                    {currentView === 'signin' && (
                      <motion.form
                        key="signin"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        onSubmit={handleSignIn}
                        className="space-y-6"
                      >
                        <FormField
                          label="Email address"
                          icon={<EmailIcon />}
                          index={2}
                        >
                          <div className="relative">
                            <input
                              type="text"
                              value={signInForm.emailOrUsername}
                              onChange={(e) => setSignInForm({ ...signInForm, emailOrUsername: e.target.value })}
                              className="auth-input"
                              placeholder="you@example.com"
                              required
                              autoComplete="username"
                            />
                            {signInForm.emailOrUsername && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                {isValidEmail(signInForm.emailOrUsername) ? (
                                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                ) : (
                                  <ErrorCircleIcon className="w-5 h-5 text-red-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </FormField>

                        <FormField
                          label="Password"
                          icon={<LockIcon />}
                          index={3}
                        >
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={signInForm.password}
                              onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                              className="auth-input pr-10"
                              placeholder="Enter your password"
                              required
                              autoComplete="current-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                            >
                              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                          </div>
                        </FormField>

                        <motion.div
                          custom={4}
                          variants={slideInVariants}
                          initial="hidden"
                          animate="visible"
                          className="flex items-center justify-between"
                        >
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="auth-checkbox"
                            />
                            <span className="text-sm text-text-secondary">Remember me</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => switchView('forgot-password')}
                            className="text-sm auth-link"
                          >
                            Forgot your password?
                          </button>
                        </motion.div>

                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-400 text-center"
                          >
                            {error}
                          </motion.p>
                        )}

                        <motion.div
                          custom={5}
                          variants={slideInVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="auth-button-primary w-full"
                          >
                            {isLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner size={20} />
                                Signing in...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <SignInIcon />
                                Sign In
                              </span>
                            )}
                          </button>
                        </motion.div>

                        <motion.div
                          custom={6}
                          variants={slideInVariants}
                          initial="hidden"
                          animate="visible"
                          className="relative"
                        >
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border-subtle" />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="px-4 bg-background text-text-secondary">or continue with</span>
                          </div>
                        </motion.div>

                        <motion.div
                          custom={7}
                          variants={slideInVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <button
                            type="button"
                            onClick={handleGitHubSignIn}
                            disabled={isLoading}
                            className="auth-button-secondary w-full"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <GitHubIcon className="w-5 h-5" />
                              GitHub
                            </span>
                          </button>
                        </motion.div>

                        <motion.div
                          custom={8}
                          variants={slideInVariants}
                          initial="hidden"
                          animate="visible"
                          className="flex justify-center gap-6 pt-4"
                        >
                          <FooterLink href="https://github.com" icon={<GitHubIcon className="w-4 h-4" />}>
                            Repository
                          </FooterLink>
                          <FooterLink href="#" icon={<DocumentIcon />}>
                            Documentation
                          </FooterLink>
                        </motion.div>
                      </motion.form>
                    )}

                    {currentView === 'signup' && (
                      <motion.form
                        key="signup"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        onSubmit={handleSignUp}
                        className="space-y-5"
                      >
                        <FormField
                          label="Full Name"
                          icon={<UserIcon />}
                          index={2}
                        >
                          <input
                            type="text"
                            value={signUpForm.fullName}
                            onChange={(e) => handleFullNameChange(e.target.value)}
                            className="auth-input"
                            placeholder="John Doe"
                            required
                          />
                        </FormField>

                        <FormField
                          label="Email address"
                          icon={<EmailIcon />}
                          index={3}
                        >
                          <div className="relative">
                            <input
                              type="email"
                              value={signUpForm.email}
                              onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                              className="auth-input"
                              placeholder="you@example.com"
                              required
                              autoComplete="email"
                            />
                            {signUpForm.email && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                {isValidEmail(signUpForm.email) ? (
                                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                ) : (
                                  <ErrorCircleIcon className="w-5 h-5 text-red-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </FormField>

                        <FormField
                          label="Password"
                          icon={<LockIcon />}
                          index={4}
                        >
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={signUpForm.password}
                              onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                              className="auth-input pr-10"
                              placeholder="At least 8 characters"
                              required
                              autoComplete="new-password"
                              minLength={8}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                            >
                              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                          </div>
                        </FormField>

                        <FormField
                          label="Confirm Password"
                          icon={<LockIcon />}
                          index={5}
                        >
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={signUpForm.confirmPassword}
                              onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                              className="auth-input pr-10"
                              placeholder="Confirm your password"
                              required
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                            >
                              {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                          </div>
                        </FormField>

                        <motion.div
                          custom={6}
                          variants={slideInVariants}
                          initial="hidden"
                          animate="visible"
                          className="flex items-start gap-2"
                        >
                          <input
                            type="checkbox"
                            id="agreeTerms"
                            checked={signUpForm.agreeTerms}
                            onChange={(e) => setSignUpForm({ ...signUpForm, agreeTerms: e.target.checked })}
                            className="auth-checkbox mt-0.5"
                          />
                          <label htmlFor="agreeTerms" className="text-sm text-text-secondary">
                            I agree to the{' '}
                            <button
                              type="button"
                              onClick={() => switchView('terms')}
                              className="auth-link"
                            >
                              Terms
                            </button>
                            {' '}and{' '}
                            <button
                              type="button"
                              onClick={() => switchView('privacy')}
                              className="auth-link"
                            >
                              Privacy Policy
                            </button>
                          </label>
                        </motion.div>

                        {error && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-400 text-center"
                          >
                            {error}
                          </motion.p>
                        )}

                        <motion.div
                          custom={7}
                          variants={slideInVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <button
                            type="submit"
                            disabled={isSignUpDisabled}
                            className="auth-button-primary w-full"
                          >
                            {isLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <LoadingSpinner size={20} />
                                Creating account...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <SignUpIcon />
                                Sign Up
                              </span>
                            )}
                          </button>
                        </motion.div>

                        <motion.div
                          custom={8}
                          variants={slideInVariants}
                          initial="hidden"
                          animate="visible"
                          className="flex justify-center gap-6 pt-4"
                        >
                          <FooterLink href="https://github.com" icon={<GitHubIcon className="w-4 h-4" />}>
                            Repository
                          </FooterLink>
                          <FooterLink href="#" icon={<DocumentIcon />}>
                            Documentation
                          </FooterLink>
                        </motion.div>
                      </motion.form>
                    )}

                    {currentView === 'forgot-password' && (
                      <motion.div
                        key="forgot"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                      >
                        {!resetEmailSent ? (
                          <form onSubmit={handleForgotPassword} className="space-y-6">
                            <FormField
                              label="Email address"
                              icon={<EmailIcon />}
                              index={2}
                            >
                              <input
                                type="email"
                                value={forgotPasswordEmail}
                                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                className="auth-input"
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                              />
                            </FormField>

                            {error && (
                              <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-red-400 text-center"
                              >
                                {error}
                              </motion.p>
                            )}

                            <motion.div
                              custom={3}
                              variants={slideInVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              <button
                                type="submit"
                                disabled={isLoading}
                                className="auth-button-primary w-full"
                              >
                                {isLoading ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <LoadingSpinner size={20} />
                                    Sending...
                                  </span>
                                ) : (
                                  'Reset Password'
                                )}
                              </button>
                            </motion.div>

                            <motion.div
                              custom={4}
                              variants={slideInVariants}
                              initial="hidden"
                              animate="visible"
                              className="text-center"
                            >
                              <button
                                type="button"
                                onClick={() => switchView('signin')}
                                className="auth-link"
                              >
                                Back to Sign In
                              </button>
                            </motion.div>

                            <motion.div
                              custom={5}
                              variants={slideInVariants}
                              initial="hidden"
                              animate="visible"
                              className="flex justify-center gap-6 pt-4"
                            >
                              <FooterLink href="https://github.com" icon={<GitHubIcon className="w-4 h-4" />}>
                                Repository
                              </FooterLink>
                              <FooterLink href="#" icon={<DocumentIcon />}>
                                Documentation
                              </FooterLink>
                            </motion.div>
                          </form>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-6"
                          >
                            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                              <CheckIcon className="w-8 h-8 text-green-500" />
                            </div>
                            <div>
                              <h3 className="text-lg font-serif text-text-primary mb-2">Check your email</h3>
                              <p className="text-sm text-text-secondary">
                                If an account exists for {forgotPasswordEmail}, you'll receive a password reset link.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleResendVerification}
                              disabled={resendCountdown > 0}
                              className="auth-button-secondary w-full"
                            >
                              {resendCountdown > 0
                                ? `Resend available in ${resendCountdown}s`
                                : 'Resend Verification Email'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetEmailSent(false);
                                switchView('signin');
                              }}
                              className="auth-link"
                            >
                              Back to Sign In
                            </button>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {currentView === 'terms' && (
                      <motion.div
                        key="terms"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <h2 className="text-lg font-serif font-semibold text-text-primary">Terms of Service</h2>
                        <div className="auth-content-box">
                          <p>
                            Welcome to Thoughts & Time. By using our service, you agree to these terms.
                            Please read them carefully.
                          </p>
                          <p className="mt-4">
                            <strong>1. Acceptance of Terms</strong><br />
                            By accessing and using Thoughts & Time, you accept and agree to be bound by the terms
                            and provision of this agreement.
                          </p>
                          <p className="mt-4">
                            <strong>2. Use License</strong><br />
                            Permission is granted to temporarily use Thoughts & Time for personal,
                            non-commercial transitory viewing only.
                          </p>
                          <p className="mt-4">
                            <strong>3. User Data</strong><br />
                            Your data is stored locally on your device. We do not collect or store
                            your personal information on our servers.
                          </p>
                          <p className="mt-4">
                            <strong>4. Disclaimer</strong><br />
                            Thoughts & Time is provided "as is" without any warranties, expressed or implied.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isSignUpDisabled && !signUpForm.agreeTerms}
                          className="auth-button-primary w-full opacity-50 cursor-not-allowed"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <SignUpIcon />
                            Sign Up
                          </span>
                        </button>
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => switchView('signup')}
                            className="auth-link"
                          >
                            Back to Sign Up
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {currentView === 'privacy' && (
                      <motion.div
                        key="privacy"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <h2 className="text-lg font-serif font-semibold text-text-primary">Privacy Policy</h2>
                        <div className="auth-content-box">
                          <p>
                            Your privacy is important to us. This policy explains how we handle your information.
                          </p>
                          <p className="mt-4">
                            <strong>1. Information Collection</strong><br />
                            Thoughts & Time stores all your data locally on your device.
                            We do not collect, transmit, or store your personal data on external servers.
                          </p>
                          <p className="mt-4">
                            <strong>2. Data Storage</strong><br />
                            All your thoughts, tasks, and settings are stored in your browser's
                            local storage and remain on your device.
                          </p>
                          <p className="mt-4">
                            <strong>3. Third-Party Services</strong><br />
                            If you choose to sign in with GitHub, we only access your basic profile
                            information necessary for authentication.
                          </p>
                          <p className="mt-4">
                            <strong>4. Data Security</strong><br />
                            Since your data is stored locally, you have full control over it.
                            We recommend regular backups of important information.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isSignUpDisabled && !signUpForm.agreeTerms}
                          className="auth-button-primary w-full opacity-50 cursor-not-allowed"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <SignUpIcon />
                            Sign Up
                          </span>
                        </button>
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => switchView('signup')}
                            className="auth-link"
                          >
                            Back to Sign Up
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </LayoutGroup>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/** Tab Button Component */
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function TabButton({ active, onClick, icon, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-2 pb-2 text-sm font-medium transition-all
        ${active
          ? 'auth-tab-active'
          : 'text-text-secondary hover:text-text-primary'
        }
      `}
    >
      {icon}
      {children}
    </button>
  );
}

/** Form Field Component */
interface FormFieldProps {
  label: string;
  icon: React.ReactNode;
  index: number;
  children: React.ReactNode;
}

function FormField({ label, icon, index, children }: FormFieldProps) {
  return (
    <motion.div
      custom={index}
      variants={slideInVariants}
      initial="hidden"
      animate="visible"
    >
      <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
        <span className="text-text-secondary">{icon}</span>
        {label}
      </label>
      {children}
    </motion.div>
  );
}

/** Footer Link Component */
interface FooterLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FooterLink({ href, icon, children }: FooterLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
    >
      {icon}
      {children}
    </a>
  );
}

/** Loading Spinner Component */
function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Icon Components
function ClockIcon() {
  return (
    <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function SignInIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}

function SignUpIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ErrorCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export default AuthPage;
