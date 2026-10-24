import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button,
  Alert, Skeleton, Divider, Chip, IconButton, Tooltip, ButtonBase,
} from '@mui/material';
import {
  NotificationsOutlined,
  DoneAllOutlined,
  OpenInNewOutlined,
  CircleOutlined,
} from '@mui/icons-material';
import PageHeader         from '../../components/common/PageHeader';
import EmptyState         from '../../components/common/EmptyState';
import notificationApi    from '../../api/notificationApi';
import { formatRelative } from '../../utils/formatters';
import { useAuth }        from '../../context/AuthContext';

// Notification type → color
const TYPE_COLORS = {
  COMPLAINT_SUBMITTED:  '#4F46E5',
  COMPLAINT_ASSIGNED:   '#0369A1',
  COMPLAINT_REASSIGNED: '#7C3AED',
  COMPLAINT_REQUIRES_ASSIGNMENT: '#D97706',
  COMPLAINT_STARTED:    '#0D9488',
  COMPLAINT_RESUMED:    '#0F766E',
  COMPLAINT_ON_HOLD:    '#D97706',
  COMPLAINT_RESOLVED:   '#10B981',
  COMPLAINT_CLOSED:     '#065F46',
  RATING_REQUEST:       '#7C3AED',
  COMPLAINT_REOPENED:   '#F43F5E',
  COMPLAINT_CANCELLED:  '#94A3B8',
  REPEAT_ALERT:         '#F59E0B',
  REPEAT_COMPLAINT:     '#F59E0B',
  GENERAL:              '#64748B',
};

function NotificationsPage() {
  const { userRole } = useAuth();
  const navigate     = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [actionError,   setActionError]   = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationApi.getAll();
      // Most recent first
      setNotifications([...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch {
      setError('Unable to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Mark single notification as read
  const handleMarkRead = async (notif) => {
    if (notif.is_read) return;
    setActionError('');
    try {
      const updated = await notificationApi.markRead(notif.id);
      if (!updated?.is_read) throw new Error('The server did not confirm the read state.');
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, ...updated } : n)
      );
      refreshSharedUnreadCount();
    } catch {
      setActionError('This notification could not be marked as read. Your list has not been changed.');
    }
  };

  const handleOpenNotification = async (notif) => {
    if (!notif.is_read) {
      try {
        const updated = await notificationApi.markRead(notif.id);
        if (!updated?.is_read) throw new Error('The server did not confirm the read state.');
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, ...updated } : n));
        refreshSharedUnreadCount();
      } catch {
        setActionError('This notification could not be marked as read. The complaint was not opened.');
        return;
      }
    }
    if (notif.complaint_id) {
      if (notif.notification_type === 'RATING_REQUEST' && userRole === 'student') {
        navigate(`/student/complaints/${notif.complaint_id}/verify`);
      } else {
        navigate(`/${userRole}/complaints/${notif.complaint_id}`);
      }
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (!unread.length) return;
    setActionError('');
    const results = await Promise.allSettled(
      unread.map(async (notification) => ({
        id: notification.id,
        updated: await notificationApi.markRead(notification.id),
      }))
    );
    const confirmed = new Map();
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.updated?.is_read) {
        confirmed.set(result.value.id, result.value.updated);
      }
    });
    if (confirmed.size) {
      setNotifications(prev => prev.map(n => (
        confirmed.has(n.id) ? { ...n, ...confirmed.get(n.id) } : n
      )));
      refreshSharedUnreadCount();
    }
    if (confirmed.size !== unread.length) {
      setActionError('Some notifications could not be marked as read. Only confirmed updates are shown.');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const refreshSharedUnreadCount = () => {
    window.dispatchEvent(new Event('hmis-notifications-changed'));
  };

  return (
    <Box>
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`
            : 'You are all caught up.'
        }
        action={
          unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DoneAllOutlined />}
              onClick={handleMarkAllRead}
            >
              Mark All Read
            </Button>
          )
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchNotifications}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {actionError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading && (
            <Box sx={{ p: 2 }}>
              {[1,2,3,4].map(i => (
                <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="50%" height={18} sx={{ mb: 0.5 }} />
                    <Skeleton width="80%" height={14} />
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {!loading && notifications.length === 0 && (
            <EmptyState
              icon={<NotificationsOutlined sx={{ fontSize: 36 }} />}
              title="No notifications yet"
              description="You will receive notifications when complaints are updated."
            />
          )}

          {!loading && notifications.map((notif, i) => {
            const color = TYPE_COLORS[notif.notification_type] || TYPE_COLORS.GENERAL;

            return (
              <Box key={notif.id}>
                {i > 0 && <Divider />}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 2.5, py: 1.5, bgcolor: notif.is_read ? 'transparent' : '#F8FAFF' }}>
                  <ButtonBase
                    component="button"
                    onClick={() => void handleOpenNotification(notif)}
                    aria-label={`${notif.is_read ? 'Read' : 'Unread'} notification: ${notif.title}${notif.complaint_id ? ', open related complaint' : ''}`}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      p: 0.5,
                      borderRadius: 1,
                      textAlign: 'left',
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:focus-visible': { outline: '2px solid #4F46E5', outlineOffset: 1 },
                    }}
                  >
                    <Box aria-hidden="true" sx={{ pt: 0.5, flexShrink: 0 }}>
                      <CircleOutlined sx={{ fontSize: 10, color: notif.is_read ? 'transparent' : color }} />
                    </Box>
                    <Box
                      aria-hidden="true"
                      sx={{
                        width: 36, height: 36, borderRadius: '50%',
                        bgcolor: `${color}18`, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <NotificationsOutlined sx={{ fontSize: 18, color }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: notif.is_read ? 400 : 600, color: 'text.primary' }}
                      >
                        {notif.title}
                      </Typography>
                      {!notif.is_read && (
                        <Chip
                          label="New"
                          size="small"
                          sx={{ height: 16, fontSize: '0.6rem', bgcolor: `${color}18`, color, fontWeight: 700 }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                      {notif.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.25 }}>
                      {formatRelative(notif.created_at)}
                    </Typography>
                    {notif.complaint_id && (
                      <Chip
                        label={`Complaint #${notif.complaint_id}`}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.75, height: 22, fontSize: '0.68rem', borderColor: '#D9DBE3' }}
                      />
                    )}
                    </Box>
                  </ButtonBase>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    {notif.complaint_id && (
                      <Tooltip title="View complaint" arrow>
                        <IconButton size="small" aria-label={`Open complaint ${notif.complaint_id}`} sx={{ color: 'text.disabled' }} onClick={() => void handleOpenNotification(notif)}>
                          <OpenInNewOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {!notif.is_read && (
                      <Tooltip title="Mark as read" arrow>
                        <IconButton
                          size="small"
                          sx={{ color: 'text.disabled' }}
                          onClick={e => { e.stopPropagation(); handleMarkRead(notif); }}
                        >
                          <DoneAllOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </CardContent>
      </Card>
    </Box>
  );
}

export default NotificationsPage;
