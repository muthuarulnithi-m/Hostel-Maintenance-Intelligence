import { useState, useEffect, useCallback } from 'react';
import notificationApi from '../api/notificationApi';
import { useAuth } from '../context/AuthContext';

/**
 * useNotifications
 * Custom hook that polls for unread notifications every 60 seconds.
 * Used by the Header to show the unread count badge.
 *
 * Returns:
 *   unreadCount  (number)
 *   notifications (array)
 *   refresh      (function) — call to manually refresh
 */
function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationApi.getUnread();
      setNotifications(data);
      setUnreadCount(data.length);
    } catch {
      // Silently fail — notification failure should never break the app
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnread();

    // Poll every 60 seconds
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  return { unreadCount, notifications, refresh: fetchUnread };
}

export default useNotifications;