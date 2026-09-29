import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Badge, Avatar, Menu, MenuItem, Divider, Tooltip,
  ListItemIcon, useTheme,
} from '@mui/material';
import {
  MenuOutlined,
  NotificationsOutlined,
  PersonOutlined,
  LogoutOutlined,
  SettingsOutlined,
  HomeWorkOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { SIDEBAR_WIDTH } from './Sidebar';
import useNotifications from '../../hooks/useNotifications';


// ─── Page titles per route prefix ────────────────────────────────────────────
function usePageTitle() {
  const path = window.location.pathname;
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
    '/admin/users':              'User Management',
    '/admin/hostel':             'Hostel Management',
    '/admin/staff':              'Staff Management',
    '/admin/wardens':            'Warden Management',
    '/admin/reports':            'Reports',
    '/admin/settings':           'System Settings',
  };
  // Find matching route (supports dynamic segments)
  const match = Object.keys(routes).find(r => path.startsWith(r));
  return match ? routes[match] : 'Hostel Maintenance System';
}

// ─── Role display names ───────────────────────────────────────────────────────
const ROLE_LABELS = {
  student: 'Student Portal',
  staff:   'Staff Portal',
  warden:  'Warden Portal',
  admin:   'Admin Portal',
};

function Header({ onMenuToggle }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, userRole, logout } = useAuth();
  const pageTitle = usePageTitle();
  
  const { unreadCount } = useNotifications();

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

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

  // User initials for avatar
  const initials = user?.name
  ? user.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  : '?';

  const fullName = user?.name || user?.email || '';
  return (
    <AppBar
      position="fixed"
      sx={{
        width:    { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml:       { md: `${SIDEBAR_WIDTH}px` },
        zIndex:   theme.zIndex.drawer - 1,
        bgcolor:  '#ffffff',
        color:    'text.primary',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: { xs: 60, sm: 64 } }}>

        {/* ── Mobile hamburger ──────────────────────────────────────────── */}
        <IconButton
          edge="start"
          onClick={onMenuToggle}
          sx={{
            mr: 2,
            display: { md: 'none' },
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
              onClick={() => navigate(`/${userRole}/notifications`)}
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Badge badgeContent={unreadCount || 0} color="error">
                <NotificationsOutlined sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>
          </Tooltip>

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