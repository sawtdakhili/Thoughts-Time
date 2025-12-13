import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Select state values directly instead of calling helper functions
  const mode = useAuthStore((state) => state.mode);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Early return AFTER all hooks (Rules of Hooks)
  if (mode !== 'authenticated') return null;

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-8 px-12 py-6 rounded-sm hover:bg-hover-bg transition-colors"
        aria-label="User menu"
      >
        <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
          {user?.email?.[0].toUpperCase()}
        </div>
        <span className="text-sm text-text-secondary hidden sm:block">
          {user?.email}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-[200px] bg-background border border-border-subtle rounded-sm shadow-lg overflow-hidden z-50">
          <div className="px-12 py-8 border-b border-border-subtle">
            <div className="text-xs text-text-secondary">Signed in as</div>
            <div className="text-sm font-medium truncate">{user?.email}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full px-12 py-8 text-left text-sm hover:bg-hover-bg transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
