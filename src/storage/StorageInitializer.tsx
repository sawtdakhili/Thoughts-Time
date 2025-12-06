/**
 * Storage Initializer Component
 *
 * This component ensures the storage system is properly initialized on app startup.
 * When SQLite is the active storage, it loads data from SQLite and populates
 * the Zustand stores (which use localStorage for reactivity).
 */

import { useEffect, useState, ReactNode } from 'react';
import { getStorageManager } from './StorageManager';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { STORAGE_KEYS } from './types';

interface StorageInitializerProps {
  children: ReactNode;
}

export function StorageInitializer({ children }: StorageInitializerProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeStorage() {
      try {
        const manager = getStorageManager();
        await manager.initialize();

        const activeType = manager.getActiveStorageType();

        // If using SQLite, load data from SQLite and sync to localStorage
        // This ensures Zustand stores have the correct data
        if (activeType === 'sqlite') {
          const provider = manager.getProvider();

          // Load items from SQLite
          const itemsResult = await provider.getItems();
          if (itemsResult.success && itemsResult.data) {
            // Update localStorage with SQLite data for Zustand to read
            const zustandFormat = {
              state: {
                items: itemsResult.data.items,
                skipHistory: false,
              },
              version: 0,
            };
            localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(zustandFormat));

            // Trigger Zustand to reload from localStorage
            // This is a bit of a hack, but necessary for synchronization
            useStore.persist.rehydrate();
          }

          // Load settings from SQLite
          const settingsResult = await provider.getSettings();
          if (settingsResult.success && settingsResult.data) {
            const settingsFormat = {
              state: settingsResult.data,
              version: 0,
            };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsFormat));
            useSettingsStore.persist.rehydrate();
          }
        }

        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize storage:', err);
        setError(err instanceof Error ? err.message : 'Storage initialization failed');
        // Continue anyway - fallback to localStorage
        setIsReady(true);
      }
    }

    initializeStorage();
  }, []);

  // Subscribe to store changes and sync to SQLite if active
  useEffect(() => {
    if (!isReady) return;

    const unsubscribeItems = useStore.subscribe(async (state) => {
      try {
        const manager = getStorageManager();
        if (manager.getActiveStorageType() === 'sqlite') {
          const provider = manager.getProvider();
          await provider.setItems({
            items: state.items,
            skipHistory: state.skipHistory,
          });
        }
      } catch (err) {
        console.error('Failed to sync items to SQLite:', err);
      }
    });

    const unsubscribeSettings = useSettingsStore.subscribe(async (state) => {
      try {
        const manager = getStorageManager();
        if (manager.getActiveStorageType() === 'sqlite') {
          const provider = manager.getProvider();
          await provider.setSettings({
            theme: state.theme,
            viewMode: state.viewMode,
            timeFormat: state.timeFormat,
            activeMobilePane: state.activeMobilePane,
          });
        }
      } catch (err) {
        console.error('Failed to sync settings to SQLite:', err);
      }
    });

    return () => {
      unsubscribeItems();
      unsubscribeSettings();
    };
  }, [isReady]);

  // Show loading state
  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-text-primary">
        <div className="text-center">
          <div className="animate-pulse text-lg font-serif">Loading...</div>
        </div>
      </div>
    );
  }

  // Show error but still render children (fallback to localStorage)
  if (error) {
    console.warn('Storage warning:', error);
  }

  return <>{children}</>;
}

export default StorageInitializer;
