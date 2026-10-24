import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Divider, Typography, Avatar,
  IconButton, Collapse,
} from '@mui/material';
import {
  DashboardOutlined,
  ReportProblemOutlined,
  AddCircleOutlineOutlined,
  HistoryOutlined,
  NotificationsOutlined,
  PersonOutlined,
  BuildOutlined,
  PeopleOutlined,
  BarChartOutlined,
  HomeWorkOutlined,
  SettingsOutlined,
  LogoutOutlined,
  ChevronLeft,
  ExpandLess,
  ExpandMore,
  AssignmentOutlined,
  SupervisorAccountOutlined,
  RepeatOutlined,        // ← added for Repeat Issues
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// ─── Sidebar width ────────────────────────────────────────────────────────────
export const SIDEBAR_WIDTH = 260;

// ─── Navigation config per role ──────────────────────────────────────────────
const NAV_CONFIG = {
  student: [
    { label: 'Dashboard',     icon: <DashboardOutlined />,          path: '/student/dashboard' },
    { label: 'My Complaints', icon: <ReportProblemOutlined />,      path: '/student/complaints' },
    { label: 'New Complaint', icon: <AddCircleOutlineOutlined />,   path: '/student/complaints/new' },
    { label: 'History',       icon: <HistoryOutlined />,            path: '/student/history' },
    { label: 'Notifications', icon: <NotificationsOutlined />,      path: '/student/notifications' },
    { label: 'Profile',       icon: <PersonOutlined />,             path: '/student/profile' },
  ],

  staff: [
    { label: 'Dashboard',      icon: <DashboardOutlined />,         path: '/staff/dashboard' },
    { label: 'Assigned Work',  icon: <AssignmentOutlined />,        path: '/staff/complaints' },
    { label: 'History',        icon: <HistoryOutlined />,           path: '/staff/history' },
    { label: 'Notifications',  icon: <NotificationsOutlined />,     path: '/staff/notifications' },
    { label: 'My Performance', icon: <BarChartOutlined />,          path: '/staff/performance' },
    { label: 'Profile',        icon: <PersonOutlined />,            path: '/staff/profile' },
  ],

  warden: [
    { label: 'Dashboard',      icon: <DashboardOutlined />,         path: '/warden/dashboard' },
    { label: 'Complaints',     icon: <ReportProblemOutlined />,     path: '/warden/complaints' },
    { label: 'Repeat Issues',  icon: <RepeatOutlined />,            path: '/warden/repeat-complaints' }, // ← added
    { label: 'Staff',          icon: <PeopleOutlined />,            path: '/warden/staff' },
    { label: 'Reports',        icon: <BarChartOutlined />,          path: '/warden/reports' },
    { label: 'Notifications',  icon: <NotificationsOutlined />,     path: '/warden/notifications' },
    { label: 'Profile',        icon: <PersonOutlined />,            path: '/warden/profile' },
  ],

  admin: [
    { label: 'Dashboard',  icon: <DashboardOutlined />,             path: '/admin/dashboard' },
    { label: 'Complaints', icon: <ReportProblemOutlined />,          path: '/admin/complaints' },
    { label: 'Users',      icon: <PeopleOutlined />,                path: '/admin/users' },
    { label: 'Hostel',     icon: <HomeWorkOutlined />,              path: '/admin/hostel' },
    { label: 'Staff',      icon: <BuildOutlined />,                 path: '/admin/staff' },
    { label: 'Wardens',    icon: <SupervisorAccountOutlined />,     path: '/admin/wardens' },
    { label: 'Reports',    icon: <BarChartOutlined />,              path: '/admin/reports' },
    { label: 'Settings',   icon: <SettingsOutlined />,              path: '/admin/settings' },
    { label: 'Profile',    icon: <PersonOutlined />,                path: '/admin/profile' }, // ← added
  ],
};

// ─── Role display labels and colors ──────────────────────────────────────────
const ROLE_META = {
  student: { label: 'Student',       color: '#818cf8' },
  staff:   { label: 'Maintenance',   color: '#34d399' },
  warden:  { label: 'Warden',        color: '#fbbf24' },
  admin:   { label: 'Administrator', color: '#f87171' },
};

// ─── A single navigation item ─────────────────────────────────────────────────
function NavItem({ item, depth = 0, onNavigate }) {
  const navigate       = useNavigate();
  const { pathname }   = useLocation();
  const [open, setOpen] = useState(false);

  const hasChildren    = item.children && item.children.length > 0;
  const isActive       = !hasChildren && pathname === item.path;
  const isParentActive = hasChildren && item.children.some(c => pathname === c.path);

  const handleClick = () => {
    if (hasChildren) {
      setOpen(prev => !prev);
    } else {
      navigate(item.path);
      onNavigate?.();
    }
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        aria-current={isActive ? 'page' : undefined}
        aria-expanded={hasChildren ? open : undefined}
        sx={{
          ml:  depth * 1.5,
          mr:  1,
          borderRadius: '8px',
          mb: '2px',
          py: '8px',
          px: '12px',
          backgroundColor: isActive
            ? 'rgba(99,102,241,0.18)'
            : isParentActive
            ? 'rgba(99,102,241,0.08)'
            : 'transparent',
          color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.65)',
          '&:hover': {
            backgroundColor: isActive
              ? 'rgba(99,102,241,0.22)'
              : 'rgba(255,255,255,0.06)',
            color: '#ffffff',
          },
          '&::before': isActive ? {
            content: '""',
            position: 'absolute',
            left: depth === 0 ? 0 : -8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: '60%',
            borderRadius: '0 3px 3px 0',
            backgroundColor: '#818cf8',
          } : {},
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 36,
            color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
            '& svg': { fontSize: 20 },
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          slotProps={{
            primary: {
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              letterSpacing: '0.01em',
            },
          }}
        />
        {hasChildren && (
          open
            ? <ExpandLess sx={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }} />
            : <ExpandMore  sx={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }} />
        )}
      </ListItemButton>

      {/* Nested children */}
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {item.children.map(child => (
              <NavItem key={child.path} item={child} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────
function SidebarContent({ onClose }) {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = NAV_CONFIG[userRole] || [];
  const roleMeta = ROLE_META[userRole]  || { label: 'User', color: '#94a3b8' };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <Box
      sx={{
        display:       'flex',
        flexDirection: 'column',
        height:        '100%',
        bgcolor:       '#0F172A',
      }}
    >
      {/* ── Logo / Brand ─────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2.5, py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <HomeWorkOutlined sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>
              HMIS
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6875rem' }}>
              Maintenance System
            </Typography>
          </Box>
        </Box>

        {/* Mobile close button */}
        {onClose && (
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close navigation menu"
            sx={{ color: 'rgba(255,255,255,0.4)', display: { md: 'none' } }}
          >
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

      {/* ── User info card ───────────────────────────────────────────── */}
      <Box
        sx={{
          mx: 2, my: 1.5, p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            fontSize: '0.875rem', fontWeight: 700,
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography
            sx={{
              color: '#fff', fontSize: '0.875rem', fontWeight: 600,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {user?.name || user?.email || 'Guest'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: roleMeta.color }} />
            <Typography sx={{ color: roleMeta.color, fontSize: '0.6875rem', fontWeight: 500 }}>
              {roleMeta.label}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2, mb: 1 }} />

      {/* ── Navigation items ─────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', pb: 2, px: 1 }}>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.25)',
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            px: 1.5, mb: 0.5, mt: 1,
          }}
        >
          Navigation
        </Typography>
        <List disablePadding>
          {navItems.map(item => (
            <NavItem key={item.path} item={item} onNavigate={onClose} />
          ))}
        </List>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />

      {/* ── Logout button ────────────────────────────────────────────── */}
      <Box sx={{ p: 1.5 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            py: '8px', px: '12px',
            color: 'rgba(255,255,255,0.45)',
            '&:hover': {
              bgcolor: 'rgba(244,63,94,0.12)',
              color: '#f87171',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'inherit', '& svg': { fontSize: 20 } }}>
            <LogoutOutlined />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            slotProps={{ primary: { fontSize: '0.875rem', fontWeight: 500 } }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}

// ─── Main Sidebar component ───────────────────────────────────────────────────
function Sidebar({ desktopOpen, mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Desktop — collapsible permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: desktopOpen ? 'block' : 'none' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          },
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Mobile — temporary overlay */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        <SidebarContent onClose={onMobileClose} />
      </Drawer>
    </>
  );
}

export default Sidebar;
