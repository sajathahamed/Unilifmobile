import { useCallback, useEffect, useState } from 'react';
import { getNotificationsForUser, markNotificationRead } from '@lib/index';
import { useAuth } from '@context/AuthContext';
import { Notification } from '@app-types/database';

export interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    const { data, error: err } = await getNotificationsForUser(userProfile.id);
    if (err) setError(err.message);
    if (data) setNotifications((data as Notification[]) || []);
    setLoading(false);
  }, [userProfile?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (id: number) => {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!userProfile?.id) return;
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => markNotificationRead(n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [notifications, userProfile?.id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
