import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import AuthModal from './AuthModal';

export default function AuthBanner() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const mode = useAuthStore((state) => state.mode);
  const isGuest = mode === 'guest';

  if (!isGuest) return null;

  return (
    <>
      <div className="border-b border-border-subtle bg-background">
        <div className="max-w-full px-16 sm:px-24 md:px-32 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 sm:gap-16">
          <span className="text-sm text-text-secondary">
            Guest Mode — your data is stored locally on this device only
          </span>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-12 py-6 border border-border-subtle hover:bg-hover-bg transition-colors text-sm whitespace-nowrap"
          >
            Sign up to sync
          </button>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
