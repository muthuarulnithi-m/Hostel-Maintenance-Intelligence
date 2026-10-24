import React, { useState } from 'react';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { SIDEBAR_WIDTH } from './Sidebar';
import Header from './Header';

/**
 * AppLayout
 * The main shell used by all authenticated pages.
 *
 * Structure:
 *   ┌──────────────────────────────────────────────────┐
 *   │ Header (fixed top)                               │
 *   ├─────────────┬────────────────────────────────────┤
 *   │ Sidebar     │ Main content area (scrollable)     │
 *   │ (fixed)     │ <Outlet /> renders here            │
 *   └─────────────┴────────────────────────────────────┘
 */
function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuToggle = () => {
    if (isDesktop) setDesktopOpen(prev => !prev);
    else setMobileOpen(prev => !prev);
  };
  const handleMobileClose  = () => setMobileOpen(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <Sidebar
        desktopOpen={desktopOpen}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      {/* ── Main panel (Header + Content) ────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${desktopOpen ? SIDEBAR_WIDTH : 0}px)` },
          minWidth: 0,
          minHeight: '100vh',
          display:  'flex',
          flexDirection: 'column',
        }}
      >
        {/* Fixed header */}
        <Header
          onMenuToggle={handleMenuToggle}
          desktopSidebarOpen={desktopOpen}
          navigationOpen={isDesktop ? desktopOpen : mobileOpen}
        />

        {/* Toolbar spacer — pushes content below the fixed AppBar */}
        <Toolbar sx={{ minHeight: { xs: 60, sm: 64 } }} />

        {/* Page content */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            overflow: 'auto',
          }}
        >
          {/* React Router renders the active page here */}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default AppLayout;
