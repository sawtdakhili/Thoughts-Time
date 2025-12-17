/**
 * Notification utility for scheduling and managing browser notifications
 */

import { logger } from './logger';

export type NotificationPermission = 'granted' | 'denied' | 'default';

export interface NotificationOptions {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  data?: unknown;
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission as NotificationPermission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    logger.warn('Notifications not supported in this browser');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    logger.log('Notification permission:', permission);
    return permission as NotificationPermission;
  } catch (error) {
    logger.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Show a notification (requires permission)
 */
export async function showNotification(options: NotificationOptions): Promise<void> {
  if (!isNotificationSupported()) {
    logger.warn('Notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    logger.warn('Notification permission not granted');
    return;
  }

  try {
    // Try to use service worker notification (preferred)
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(options.title, {
      body: options.body,
      tag: options.tag,
      icon: options.icon || '/icon-192.png',
      badge: '/icon-192.png',
      data: options.data,
      requireInteraction: false, // Auto-dismiss after a few seconds
    });
  } catch (error) {
    // Fallback to regular notification
    logger.warn('Service worker notification failed, using fallback:', error);
    new Notification(options.title, {
      body: options.body,
      tag: options.tag,
      icon: options.icon || '/icon-192.png',
      data: options.data,
    });
  }
}

/**
 * Schedule a notification for a specific time
 * Returns the timeout ID for cancellation
 */
export function scheduleNotification(
  options: NotificationOptions,
  scheduledTime: Date
): number | null {
  if (!isNotificationSupported()) {
    return null;
  }

  const now = Date.now();
  const delay = scheduledTime.getTime() - now;

  // Don't schedule if time has passed or is too far in the future (24 hours)
  if (delay < 0 || delay > 24 * 60 * 60 * 1000) {
    logger.warn('Invalid notification schedule time:', scheduledTime);
    return null;
  }

  logger.log(`Scheduling notification in ${Math.round(delay / 1000 / 60)} minutes`);

  const timeoutId = window.setTimeout(() => {
    showNotification(options);
  }, delay);

  return timeoutId;
}

/**
 * Cancel a scheduled notification
 */
export function cancelNotification(timeoutId: number): void {
  window.clearTimeout(timeoutId);
}
