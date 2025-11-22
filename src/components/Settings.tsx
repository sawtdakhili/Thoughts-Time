import { useRef } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useStore } from '../store/useStore';
import { useToast } from '../hooks/useToast';
import { Item, ItemTypes } from '../types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportData {
  version: number;
  exportedAt: string;
  items: unknown[];
  settings: {
    theme: string;
    viewMode: string;
    timeFormat: string;
  };
}

// Validate imported items for data integrity
function validateImportedItems(items: unknown[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;

    // Check required fields
    if (!item.id || typeof item.id !== 'string') {
      errors.push(`Item ${i}: missing or invalid id`);
      continue;
    }

    // Check for duplicate IDs
    if (seenIds.has(item.id)) {
      errors.push(`Item ${i}: duplicate id "${item.id}"`);
    }
    seenIds.add(item.id);

    // Validate item type
    if (!item.type || !ItemTypes.includes(item.type as (typeof ItemTypes)[number])) {
      errors.push(`Item ${i}: invalid type "${item.type}"`);
    }

    // Validate required string fields
    if (typeof item.content !== 'string') {
      errors.push(`Item ${i}: missing or invalid content`);
    }

    if (typeof item.createdDate !== 'string') {
      errors.push(`Item ${i}: missing or invalid createdDate`);
    }

    // Validate parent references exist
    if (item.parentId && typeof item.parentId === 'string') {
      const parentExists = items.some((p) => (p as Record<string, unknown>).id === item.parentId);
      if (!parentExists) {
        errors.push(`Item ${i}: parentId "${item.parentId}" references non-existent item`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function Settings({ isOpen, onClose }: SettingsProps) {
  const theme = useSettingsStore((state) => state.theme);
  const viewMode = useSettingsStore((state) => state.viewMode);
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setViewMode = useSettingsStore((state) => state.setViewMode);
  const setTimeFormat = useSettingsStore((state) => state.setTimeFormat);

  const items = useStore((state) => state.items);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addToast = useToast((state) => state.addToast);

  const handleExport = () => {
    const exportData: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items,
      settings: {
        theme,
        viewMode,
        timeFormat,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thoughts-time-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Data exported successfully', 'success');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ExportData;

        // Validate structure
        if (!data.version || !data.items || !Array.isArray(data.items)) {
          throw new Error('Invalid backup file format');
        }

        // Validate imported items
        const validation = validateImportedItems(data.items);
        if (!validation.valid) {
          const errorMsg = validation.errors.slice(0, 3).join('; ');
          throw new Error(`Invalid data: ${errorMsg}${validation.errors.length > 3 ? '...' : ''}`);
        }

        // Import items - replace current items with localStorage error handling
        try {
          useStore.setState({ items: data.items as Item[] });
        } catch (storageError) {
          if (storageError instanceof Error && storageError.name === 'QuotaExceededError') {
            throw new Error('Storage quota exceeded. Try clearing some data first.');
          }
          throw storageError;
        }

        // Import settings if present
        if (data.settings) {
          if (data.settings.theme === 'dark' || data.settings.theme === 'light') {
            setTheme(data.settings.theme);
          }
          if (data.settings.viewMode === 'infinite' || data.settings.viewMode === 'book') {
            setViewMode(data.settings.viewMode);
          }
          if (data.settings.timeFormat === '12h' || data.settings.timeFormat === '24h') {
            setTimeFormat(data.settings.timeFormat);
          }
        }

        addToast(`Imported ${data.items.length} items`, 'success');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid file';
        addToast(`Failed to import: ${message}`, 'error');
      }
    };

    reader.readAsText(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

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

          {/* Time Format Setting */}
          <div>
            <label className="block text-sm font-serif mb-8">Time Format</label>
            <div className="flex gap-8">
              <button
                onClick={() => setTimeFormat('12h')}
                className={`flex-1 px-16 py-8 text-sm font-mono border rounded-sm transition-colors ${
                  timeFormat === '12h'
                    ? 'bg-text-primary text-background border-text-primary'
                    : 'bg-transparent text-text-secondary border-border-subtle hover:border-text-secondary'
                }`}
              >
                12-hour
              </button>
              <button
                onClick={() => setTimeFormat('24h')}
                className={`flex-1 px-16 py-8 text-sm font-mono border rounded-sm transition-colors ${
                  timeFormat === '24h'
                    ? 'bg-text-primary text-background border-text-primary'
                    : 'bg-transparent text-text-secondary border-border-subtle hover:border-text-secondary'
                }`}
              >
                24-hour
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div>
            <label className="block text-sm font-serif mb-8">Data Management</label>
            <div className="flex gap-8">
              <button
                onClick={handleExport}
                className="flex-1 px-16 py-8 text-sm font-mono border rounded-sm transition-colors bg-transparent text-text-secondary border-border-subtle hover:border-text-secondary"
              >
                Export Data
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-16 py-8 text-sm font-mono border rounded-sm transition-colors bg-transparent text-text-secondary border-border-subtle hover:border-text-secondary"
              >
                Import Data
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
            <p className="text-xs text-text-secondary mt-8">
              Export creates a JSON backup. Import replaces all current data.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Settings;
