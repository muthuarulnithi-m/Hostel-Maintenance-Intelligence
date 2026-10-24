import { useState, useEffect, useCallback, useRef } from 'react';
import notificationApi from '../api/notificationApi';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL_MS = 60_000;

function useNotifications() {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestInFlight = useRef(false);
  const readsInFlight = useRef(new Set());
  const hasLoaded = useRef(false);

  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setError('');
      hasLoaded.current = false;
      return [];
    }
    if (requestInFlight.current) return null;

    requestInFlight.current = true;
    if (!hasLoaded.current) setLoading(true);
    setError('');
    try {
      const data = await notificationApi.getUnread();
      const unread = Array.isArray(data) ? data : [];
      setNotifications(unread);
      setUnreadCount(unread.length);
      hasLoaded.current = true;
      return unread;
    } catch {
      setError('Unread notifications could not be refreshed.');
      return null;
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const markRead = useCallback(async (notificationId) => {
    if (readsInFlight.current.has(notificationId)) return null;
    readsInFlight.current.add(notificationId);
    const wasUnread = notifications.some((item) => item.id === notificationId);
    try {
      const updated = await notificationApi.markRead(notificationId);
      if (updated?.is_read && wasUnread) {
        setNotifications((current) => current.filter((item) => item.id !== notificationId));
        setUnreadCount((current) => Math.max(0, current - 1));
      }
      setError('');
      return updated;
    } catch (requestError) {
      setError('Unread notifications could not be updated.');
      throw requestError;
    } finally {
      readsInFlight.current.delete(notificationId);
    }
  }, [notifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      hasLoaded.current = false;
      return undefined;
    }

    void fetchUnread();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void fetchUnread();
    }, POLL_INTERVAL_MS);
    const refreshOnFocus = () => { void fetchUnread(); };
    const refreshAfterAction = () => { void fetchUnread(); };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void fetchUnread();
    };
    window.addEventListener('focus', refreshOnFocus);
    window.addEventListener('hmis-notifications-changed', refreshAfterAction);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
      window.removeEventListener('hmis-notifications-changed', refreshAfterAction);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [fetchUnread, isAuthenticated]);

  return { unreadCount, notifications, loading, error, refresh: fetchUnread, markRead };
}

export default useNotifications;
