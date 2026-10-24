import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Badge, Avatar, Menu, MenuItem, Divider, Tooltip, Popover,
  Alert, Button, ButtonBase, Chip, Skeleton,
  ListItemIcon, useTheme,
} from '@mui/material';
import {
  MenuOutlined,
  NotificationsOutlined,
  CheckCircleOutlined,
  PersonOutlined,
  LogoutOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { SIDEBAR_WIDTH } from './Sidebar';
import useNotifications from '../../hooks/useNotifications';
import notificationApi from '../../api/notificationApi';
import { formatRelative } from '../../utils/formatters';


// ─── Page titles per route prefix ────────────────────────────────────────────
function usePageTitle() {
  const { pathname: path } = useLocation();
  const routes = {
    '/student/dashboard':        'Dashboard',
    '/student/complaints/new':   'New Complaint',
    '/student/complaints':       'My Complaints',
    '/student/history':          'Complaint History',
    '/student/notifications':    'Notifications',
    '/student/profile':          'My Profile',
    '/staff/dashboard':          'Dashboard',
    '/staff/complaints':         'Assigned Work',
    '/staff/history':            'Work History',
    '/staff/performance':        'My Performance',
    '/staff/notifications':      'Notifications',
    '/staff/profile':            'My Profile',
    '/warden/dashboard':         'Dashboard',
    '/warden/complaints':        'Complaints',
    '/warden/staff':             'Staff Management',
    '/warden/reports':           'Reports & Analytics',
    '/warden/notifications':     'Notifications',
    '/warden/profile':           'My Profile',
    '/admin/dashboard':          'Dashboard',
    '/admin/complaints':         'Complaint Management',
    '/admin/analytics':          'Complaint Analytics',
    '/admin/users':              'User Management',
    '/admin/hostel':             'Hostel Management',
    '/admin/staff':              'Staff Management',
    '/admin/wardens':            'Warden Management',
    '/admin/reports':            'Reports',
    '/admin/settings':           'System Settings',
    '/admin/profile':            'My Profile',
  };

  // Give detail and verification pages their own title before matching
  // broader parent routes such as /student/complaints.
  if (/^\/student\/complaints\/[^/]+\/verify\/?$/.test(path)) return 'Verify Resolution';
  if (/^\/(student|staff|warden|admin)\/complaints\/[^/]+\/?$/.test(path)) return 'Complaint Details';

  // Match the most specific route first, with a segment boundary so
  // similarly prefixed routes cannot accidentally win.
  const match = Object.keys(routes)
    .sort((a, b) => b.length - a.length)
    .find(route => path === route || path.startsWith(`${route}/`));
  return match ? routes[match] : 'Hostel Maintenance System';
}

// ─── Role display names ───────────────────────────────────────────────────────
const ROLE_LABELS = {
  student: 'Student Portal',
  staff:   'Staff Portal',
  warden:  'Warden Portal',
  admin:   'Admin Portal',
};

function Header({ onMenuToggle, desktopSidebarOpen = true, navigationOpen = true }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, userRole, logout } = useAuth();
  const pageTitle = usePageTitle();
  
  const { unreadCount, error: unreadError, markRead, refresh } = useNotifications();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [readingIds, setReadingIds] = useState([]);
  const menuOpen = Boolean(anchorEl);
  const notificationsOpen = Boolean(notificationAnchor);

  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose   = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate(`/${userRole}/profile`);
  };

  const loadRecentNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError('');
    void refresh();
    try {
      const data = await notificationApi.getAll();
      const sorted = [...(Array.isArray(data) ? data : [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentNotifications(sorted.slice(0, 6));
    } catch {
      setNotificationsError('Notifications could not be loaded. Try again.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationBell = (event) => {
    setNotificationAnchor(event.currentTarget);
    void loadRecentNotifications();
  };

  const handleReadNotification = async (notification) => {
    if (notification.is_read) return true;
    if (readingIds.includes(notification.id)) return false;
    setReadingIds((current) => [...current, notification.id]);
    try {
      const updated = await markRead(notification.id);
      if (!updated?.is_read) return false;
      setRecentNotifications((current) => current.map((item) => (
        item.id === updated.id ? { ...item, ...updated } : item
      )));
      setNotificationsError('');
      return true;
    } catch {
      setNotificationsError('This notification could not be marked as read. Try again.');
      return false;
    } finally {
      setReadingIds((current) => current.filter((id) => id !== notification.id));
    }
  };

  const handleOpenNotification = async (notification) => {
    const marked = await handleReadNotification(notification);
    if (!marked) return;
    setNotificationAnchor(null);
    if (notification.complaint_id) {
      if (notification.notification_type === 'RATING_REQUEST' && userRole === 'student') {
        navigate(`/student/complaints/${notification.complaint_id}/verify`);
        return;
      }
      navigate(`/${userRole}/complaints/${notification.complaint_id}`);
    }
  };

  const openNotificationHistory = () => {
    setNotificationAnchor(null);
    navigate(`/${userRole}/notifications`);
  };

  // User initials for avatar
  const initials = user?.name
  ? user.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  : '?';

  const fullName = user?.name || user?.email || '';
  return (
    <AppBar
      position="fixed"
      sx={{
        width:    { md: desktopSidebarOpen ? `calc(100% - ${SIDEBAR_WIDTH}px)` : '100%' },
        ml:       { md: desktopSidebarOpen ? `${SIDEBAR_WIDTH}px` : 0 },
        zIndex:   theme.zIndex.drawer - 1,
        bgcolor:  '#ffffff',
        color:    'text.primary',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: { xs: 60, sm: 64 } }}>

        {/* ── Navigation toggle ─────────────────────────────────────────── */}
        <IconButton
          edge="start"
          onClick={onMenuToggle}
          aria-label={navigationOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={navigationOpen}
          sx={{
            mr: 2,
            color: 'text.secondary',
          }}
        >
          <MenuOutlined />
        </IconButton>

        {/* ── Page title ────────────────────────────────────────────────── */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {pageTitle}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {ROLE_LABELS[userRole] || 'Hostel Maintenance Intelligence System'}
          </Typography>
        </Box>

        {/* ── Right-side actions ────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>

          {/* Notifications bell */}
          <Tooltip title="Notifications" arrow>
            <IconButton
              size="medium"
              id="notification-button"
              onClick={handleNotificationBell}
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen ? 'true' : undefined}
              aria-controls={notificationsOpen ? 'notification-popover' : undefined}
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsOutlined sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Popover
            id="notification-popover"
            open={notificationsOpen}
            anchorEl={notificationAnchor}
            onClose={() => setNotificationAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1,
                width: { xs: 'calc(100vw - 24px)', sm: 390 },
                maxWidth: 'calc(100vw - 24px)',
                maxHeight: 'min(600px, calc(100vh - 88px))',
                border: '1px solid #E6E7EC',
                borderRadius: 2.5,
                boxShadow: '0 14px 40px rgba(20, 24, 40, 0.16)',
              },
            }}
          >
            <Box sx={{ p: 2, pb: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography id="notification-panel-title" sx={{ fontWeight: 650, flex: 1 }}>
                Notifications
              </Typography>
              {unreadCount > 0 && <Chip label={`${unreadCount} unread`} size="small" color="primary" />}
              <Button size="small" onClick={openNotificationHistory} sx={{ textTransform: 'none' }}>
                View all
              </Button>
            </Box>
            <Divider />
            {(notificationsError || unreadError) && (
              <Alert
                severity="error"
                sx={{ m: 1.5, borderRadius: 1.5 }}
                action={<Button color="inherit" size="small" onClick={loadRecentNotifications}>Retry</Button>}
              >
                {notificationsError || unreadError}
              </Alert>
            )}
            {notificationsLoading ? (
              <Box aria-label="Loading notifications" sx={{ p: 2 }}>
                {[0, 1, 2].map((item) => (
                  <Box key={item} sx={{ display: 'flex', gap: 1.5, mb: 1.75 }}>
                    <Skeleton variant="circular" width={10} height={10} sx={{ mt: 0.8 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="65%" height={20} />
                      <Skeleton width="95%" height={18} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : recentNotifications.length === 0 ? (
              <Box role="status" sx={{ px: 2.5, py: 4, textAlign: 'center' }}>
                <NotificationsOutlined sx={{ color: '#A2A4AD', mb: 0.75 }} />
                <Typography sx={{ color: '#51535D', fontWeight: 600, fontSize: '0.9rem' }}>
                  No notifications yet
                </Typography>
                <Typography sx={{ color: '#81838D', fontSize: '0.8rem', mt: 0.25 }}>
                  Updates about your complaints will appear here.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 440, overflowY: 'auto' }}>
                {recentNotifications.map((notification) => (
                  <Box
                    key={notification.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 0.5,
                      px: 1.25,
                      py: 0.5,
                      borderLeft: notification.is_read ? '3px solid transparent' : '3px solid #5B4AE6',
                      bgcolor: notification.is_read ? '#fff' : '#F7F6FF',
                      borderBottom: '1px solid #F0F0F3',
                    }}
                  >
                    <ButtonBase
                      onClick={() => void handleOpenNotification(notification)}
                      aria-label={`${notification.is_read ? 'Read' : 'Unread'}: ${notification.title}. ${notification.message}${notification.complaint_id ? ', open related complaint' : ''}`}
                      sx={{
                        display: 'block',
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'left',
                        px: 0.75,
                        py: 1,
                        borderRadius: 1,
                        '&:focus-visible': { outline: '2px solid #5B4AE6', outlineOffset: 1 },
                      }}
                    >
                      <Typography sx={{ fontWeight: notification.is_read ? 500 : 650, fontSize: '0.85rem', color: '#30313A' }}>
                        {notification.title}
                      </Typography>
                      <Chip
                        label={notification.is_read ? 'Read' : 'Unread'}
                        size="small"
                        variant={notification.is_read ? 'outlined' : 'filled'}
                        sx={{ mt: 0.45, height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                      />
                      <Typography sx={{ color: '#656772', fontSize: '0.78rem', lineHeight: 1.45, mt: 0.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {notification.message}
                      </Typography>
                      <Typography sx={{ color: '#878994', fontSize: '0.72rem', mt: 0.5 }}>
                        {formatRelative(notification.created_at)}
                        {notification.complaint_id ? ` · Complaint #${notification.complaint_id}` : ''}
                      </Typography>
                    </ButtonBase>
                    {!notification.is_read && (
                      <Tooltip title="Mark as read" arrow>
                        <IconButton
                          size="small"
                          aria-label={`Mark notification ${notification.id} as read`}
                          disabled={readingIds.includes(notification.id)}
                          onClick={() => void handleReadNotification(notification)}
                          sx={{ mt: 0.75, flexShrink: 0 }}
                        >
                          <CheckCircleOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                ))}
              </Box>
            )}
            {recentNotifications.length > 0 && (
              <Box sx={{ p: 1.25, borderTop: '1px solid #ECECF1' }}>
                <Button fullWidth size="small" onClick={openNotificationHistory} sx={{ textTransform: 'none' }}>
                  Open notification history
                </Button>
              </Box>
            )}
          </Popover>

          {/* Divider */}
          <Box sx={{ width: 1, height: 28, bgcolor: 'divider', mx: 0.5 }} />

          {/* User avatar button */}
          <Tooltip title="Account" arrow>
            <IconButton
              onClick={handleAvatarClick}
              size="small"
              sx={{ ml: 0.5 }}
              aria-controls={menuOpen ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={menuOpen ? 'true' : undefined}
            >
              <Avatar
                sx={{
                  width: 34, height: 34,
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  fontSize: '0.8125rem', fontWeight: 700,
                }}
              >
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* ── Account dropdown menu ──────────────────────────────────────── */}
        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{  horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1,
              minWidth: 200,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'visible',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0, right: 16,
                width: 10, height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                border: '1px solid',
                borderColor: 'divider',
                borderBottom: 'none',
                borderRight: 'none',
              },
            },
          }}
        >
          {/* User info header */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {user?.email || ''}
            </Typography>
          </Box>

          <Divider />

          <MenuItem onClick={handleProfile} sx={{ py: 1.25 }}>
            <ListItemIcon><PersonOutlined fontSize="small" /></ListItemIcon>
            <Typography variant="body2">My Profile</Typography>
          </MenuItem>

          {userRole === 'admin' && (
            <MenuItem onClick={() => { handleMenuClose(); navigate('/admin/settings'); }} sx={{ py: 1.25 }}>
              <ListItemIcon><SettingsOutlined fontSize="small" /></ListItemIcon>
              <Typography variant="body2">Settings</Typography>
            </MenuItem>
          )}

          <Divider />

          <MenuItem
            onClick={handleLogout}
            sx={{ py: 1.25, color: 'error.main', '& .MuiListItemIcon-root': { color: 'error.main' } }}
          >
            <ListItemIcon><LogoutOutlined fontSize="small" /></ListItemIcon>
            <Typography variant="body2" fontWeight={500}>Logout</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
