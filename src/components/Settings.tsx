import { useSettingsStore } from '../store/useSettingsStore';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

function Settings({ isOpen, onClose }: SettingsProps) {
  const theme = useSettingsStore((state) => state.theme);
  const viewMode = useSettingsStore((state) => state.viewMode);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setViewMode = useSettingsStore((state) => state.setViewMode);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border border-border-subtle rounded-sm shadow-lg z-50 w-[400px]">
        {/* Header */}
        <div className="border-b border-border-subtle px-24 py-16">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-serif">Settings</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary text-lg"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-24 py-24 space-y-24">
          {/* Theme Setting */}
          <div>
            <label className="block text-sm font-serif mb-8">Theme</label>
            <div className="flex gap-8">
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 px-16 py-8 text-sm font-mono border rounded-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-text-primary text-background border-text-primary'
                    : 'bg-transparent text-text-secondary border-border-subtle hover:border-text-secondary'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 px-16 py-8 text-sm font-mono border rounded-sm transition-colors ${
                  theme === 'light'
                    ? 'bg-text-primary text-background border-text-primary'
                    : 'bg-transparent text-text-secondary border-border-subtle hover:border-text-secondary'
                }`}
              >
                Light
              </button>
            </div>
          </div>

          {/* View Mode Setting */}
          <div>
            <label className="block text-sm font-serif mb-8">View Mode</label>
            <div className="flex gap-8">
              <button
                onClick={() => setViewMode('infinite')}
                className={`flex-1 px-16 py-8 text-sm font-mono border rounded-sm transition-colors ${
                  viewMode === 'infinite'
                    ? 'bg-text-primary text-background border-text-primary'
                    : 'bg-transparent text-text-secondary border-border-subtle hover:border-text-secondary'
                }`}
              >
                Infinite Scroll
              </button>
              <button
                onClick={() => setViewMode('book')}
                className={`flex-1 px-16 py-8 text-sm font-mono border rounded-sm transition-colors ${
                  viewMode === 'book'
                    ? 'bg-text-primary text-background border-text-primary'
                    : 'bg-transparent text-text-secondary border-border-subtle hover:border-text-secondary'
                }`}
              >
                Book Style
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Settings;
