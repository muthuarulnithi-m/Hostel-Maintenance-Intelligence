import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['student']}>
 *     <StudentDashboard />
 *   </ProtectedRoute>
 *
 * - If still loading session  → show spinner
 * - If not authenticated      → redirect to /login
 * - If wrong role             → redirect to /unauthorized
 * - If all OK                 → render children
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, userRole, loading } = useAuth();
  const location = useLocation();

  // ── Still restoring session from localStorage ──────────────────────────
  if (loading) {
    return (
      <Box
        sx={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          minHeight:      '100vh',
          bgcolor:        'background.default',
        }}
      >
        <CircularProgress size={40} thickness={4} />
      </Box>
    );
  }

  // ── Not logged in — go to login, remember where they were ───────────────
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Wrong role — go to unauthorized page ────────────────────────────────
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ── All checks passed — render the actual page ──────────────────────────
  return children;
}

export default ProtectedRoute;