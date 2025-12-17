import { useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { logger } from '../utils/logger';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    // Skip auth if Supabase isn't configured
    if (!isSupabaseConfigured) {
      logger.warn('Supabase not configured - running in guest mode only');
      return;
    }

    let ignore = false;
    let lastUserId: string | null = null;

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ignore) {
        const userId = session?.user?.id ?? null;
        logger.log('Session retrieved:', userId || 'guest');
        lastUserId = userId;
        setUser(session?.user ?? null, session);
      }
    }).catch((error) => {
      logger.error('Error getting session:', error);
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) {
        const userId = session?.user?.id ?? null;
        // Only update if user actually changed to prevent infinite loops
        if (userId !== lastUserId) {
          logger.log('Auth state changed:', _event, userId || 'guest');
          lastUserId = userId;
          setUser(session?.user ?? null, session);
        } else {
          logger.log('Auth state changed but user unchanged, skipping update');
        }
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - setUser is stable from Zustand

  return <>{children}</>;
}
