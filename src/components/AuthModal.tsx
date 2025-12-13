import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthView = 'signin' | 'signup';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    // Validation
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (view === 'signup' && password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    // Call auth action
    const { error: authError } = view === 'signup'
      ? await signUp(email, password)
      : await signIn(email, password);

    if (!authError) {
      // Success - close modal and reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      onClose();
    }
  };

  const toggleView = () => {
    setView(view === 'signin' ? 'signup' : 'signin');
    clearError();
    setLocalError('');
  };

  const displayError = localError || error?.message;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border-subtle rounded-lg p-32 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-24">
          <h2 className="text-xl font-serif">
            {view === 'signin' ? 'Sign In' : 'Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-16">
          <div>
            <label htmlFor="email" className="block text-sm mb-4 text-text-secondary">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-12 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm focus:outline-none focus:border-text-secondary"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-4 text-text-secondary">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-12 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm focus:outline-none focus:border-text-secondary"
              placeholder="••••••••"
              autoComplete={view === 'signin' ? 'current-password' : 'new-password'}
              disabled={isLoading}
            />
          </div>

          {view === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm mb-4 text-text-secondary">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-12 py-8 bg-hover-bg border border-border-subtle rounded-sm font-mono text-sm focus:outline-none focus:border-text-secondary"
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          )}

          {displayError && (
            <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded px-12 py-8">
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-16 py-8 bg-text-primary text-background rounded-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : view === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {/* Toggle view */}
        <div className="mt-16 text-center text-sm text-text-secondary">
          {view === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={toggleView}
            className="ml-4 text-text-primary hover:underline"
            disabled={isLoading}
          >
            {view === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
