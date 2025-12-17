/**
 * Hook for managing item notifications
 */

import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Event, Routine } from '../types';
import {
  isNotificationSupported,
  getNotificationPermission,
  scheduleNotification,
  cancelNotification,
} from '../utils/notifications';
import { subMinutes, isFuture, startOfDay } from 'date-fns';
import { logger } from '../utils/logger';

/**
 * Hook that schedules notifications for events and routines
 */
export function useNotifications() {
  const items = useStore((state) => state.items);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const eventReminderMinutes = useSettingsStore((state) => state.eventReminderMinutes);
  const routineReminderEnabled = useSettingsStore((state) => state.routineReminderEnabled);

  // Track scheduled notification timeouts
  const scheduledNotifications = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Clear all notifications and exit if notifications are disabled or not supported
    if (!notificationsEnabled || !isNotificationSupported() || getNotificationPermission() !== 'granted') {
      scheduledNotifications.current.forEach((timeoutId) => cancelNotification(timeoutId));
      scheduledNotifications.current.clear();
      return;
    }

    // Cancel all existing notifications
    scheduledNotifications.current.forEach((timeoutId) => cancelNotification(timeoutId));
    scheduledNotifications.current.clear();

    // Schedule notifications for events
    items.forEach((item) => {
      if (item.type === 'event') {
        const event = item as Event;
        if (event.hasTime && event.startTime && isFuture(event.startTime)) {
          const notificationTime = subMinutes(event.startTime, eventReminderMinutes);

          if (isFuture(notificationTime)) {
            const timeoutId = scheduleNotification(
              {
                title: 'Upcoming Event',
                body: `${event.content} starts in ${eventReminderMinutes} minutes`,
                tag: `event-${event.id}`,
                data: { itemId: event.id, type: 'event' },
              },
              notificationTime
            );

            if (timeoutId) {
              scheduledNotifications.current.set(`event-${event.id}`, timeoutId);
            }
          }
        }
      } else if (item.type === 'routine' && routineReminderEnabled) {
        const routine = item as Routine;
        if (routine.hasTime && routine.scheduledTime) {
          // For routines, schedule for today if time hasn't passed
          const today = startOfDay(new Date());
          const timeStr = routine.scheduledTime; // Already HH:mm format
          const [hours, minutes] = timeStr.split(':').map(Number);
          const routineDateTime = new Date(today);
          routineDateTime.setHours(hours, minutes, 0, 0);

          if (isFuture(routineDateTime)) {
            const timeoutId = scheduleNotification(
              {
                title: 'Routine Reminder',
                body: routine.content,
                tag: `routine-${routine.id}`,
                data: { itemId: routine.id, type: 'routine' },
              },
              routineDateTime
            );

            if (timeoutId) {
              scheduledNotifications.current.set(`routine-${routine.id}`, timeoutId);
            }
          }
        }
      }
    });

    logger.log(`Scheduled ${scheduledNotifications.current.size} notifications`);

    // Cleanup on unmount
    return () => {
      scheduledNotifications.current.forEach((timeoutId) => cancelNotification(timeoutId));
      scheduledNotifications.current.clear();
    };
  }, [items, notificationsEnabled, eventReminderMinutes, routineReminderEnabled]);
}
