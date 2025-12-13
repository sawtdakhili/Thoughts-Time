import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AuthMode = 'guest' | 'authenticated';

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  mode: AuthMode;
  isLoading: boolean;
  error: AuthError | null;

  // Actions
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  setUser: (user: User | null, session: Session | null) => void;
  setMode: (mode: AuthMode) => void;
  clearError: () => void;

  // Helper getters
  isGuest: () => boolean;
  isAuthenticated: () => boolean;
  getUserId: () => string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      mode: 'guest',
      isLoading: false,
      error: null,

      // Sign up with email/password
      signUp: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });

          console.log('Sign up response:', { data, error });

          if (error) {
            console.error('Sign up error:', error);
            set({ isLoading: false, error });
            return { error };
          }

          // Check if we got a session (auto-confirmed) or need email confirmation
          if (data.user && data.session) {
            console.log('User signed up with session');
            set({
              user: data.user,
              session: data.session,
              mode: 'authenticated',
              isLoading: false,
            });

            // Clear localStorage on first signup (fresh start)
            localStorage.removeItem('thoughts-time-storage');
          } else if (data.user && !data.session) {
            // User created but needs email confirmation
            console.log('User needs email confirmation');
            const confirmationError = {
              message: 'Please check your email to confirm your account',
              name: 'EmailConfirmationRequired',
              status: 200,
            } as AuthError;
            set({ isLoading: false, error: confirmationError });
            return { error: confirmationError };
          } else {
            console.log('Unexpected signup response');
            set({ isLoading: false });
          }

          return { error: null };
        } catch (err) {
          console.error('Sign up exception:', err);
          const error = {
            message: err instanceof Error ? err.message : 'Sign up failed',
            name: 'SignUpException',
            status: 500,
          } as AuthError;
          set({ isLoading: false, error });
          return { error };
        }
      },

      // Sign in with email/password
      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          set({ isLoading: false, error });
          return { error };
        }

        if (data.user && data.session) {
          set({
            user: data.user,
            session: data.session,
            mode: 'authenticated',
            isLoading: false,
          });
        }

        return { error: null };
      },

      // Sign out
      signOut: async () => {
        set({ isLoading: true });

        await supabase.auth.signOut();

        set({
          user: null,
          session: null,
          mode: 'guest',
          isLoading: false,
          error: null,
        });
      },

      // Set user and session (called by auth listener)
      setUser: (user: User | null, session: Session | null) => {
        set({
          user,
          session,
          mode: user ? 'authenticated' : 'guest',
        });
      },

      // Manually set mode (for guest mode)
      setMode: (mode: AuthMode) => {
        set({ mode });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Helper: Check if guest
      isGuest: () => get().mode === 'guest',

      // Helper: Check if authenticated
      isAuthenticated: () => get().mode === 'authenticated' && get().user !== null,

      // Helper: Get user ID (for items)
      getUserId: () => {
        const { user, mode } = get();
        if (mode === 'authenticated' && user) {
          return user.id;
        }
        return 'guest';
      },
    }),
    {
      name: 'thoughts-time-auth-mode',
      partialize: (state) => ({
        mode: state.mode,
      }),
    }
  )
);
