import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';
type ViewMode = 'infinite' | 'book';
type TimeFormat = '12h' | '24h';
type MobilePane = 'thoughts' | 'time';

interface SettingsState {
  theme: Theme;
  viewMode: ViewMode;
  timeFormat: TimeFormat;
  activeMobilePane: MobilePane;

  // Notifications
  notificationsEnabled: boolean;
  eventReminderMinutes: number; // Minutes before event to show notification
  routineReminderEnabled: boolean; // Show notification at routine time

  // Actions
  setTheme: (theme: Theme) => void;
  setViewMode: (mode: ViewMode) => void;
  setTimeFormat: (format: TimeFormat) => void;
  setActiveMobilePane: (pane: MobilePane) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setEventReminderMinutes: (minutes: number) => void;
  setRoutineReminderEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      viewMode: 'infinite',
      timeFormat: '12h',
      activeMobilePane: 'thoughts',
      notificationsEnabled: false,
      eventReminderMinutes: 10,
      routineReminderEnabled: true,

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document root
        document.documentElement.setAttribute('data-theme', theme);
      },

      setViewMode: (mode) => set({ viewMode: mode }),
      setTimeFormat: (format) => set({ timeFormat: format }),
      setActiveMobilePane: (pane) => set({ activeMobilePane: pane }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setEventReminderMinutes: (minutes) => set({ eventReminderMinutes: minutes }),
      setRoutineReminderEnabled: (enabled) => set({ routineReminderEnabled: enabled }),
    }),
    {
      name: 'thoughts-time-settings',
      onRehydrateStorage: () => (state) => {
        // Apply theme on page load
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);
