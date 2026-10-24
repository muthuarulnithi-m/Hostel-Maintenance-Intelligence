import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


import AppLayout        from '../components/layout/AppLayout';
import ProtectedRoute   from './ProtectedRoute';
import LoginPage        from '../pages/auth/LoginPage';
import StudentDashboard from '../pages/student/StudentDashboard';
import WardenDashboard  from '../pages/warden/WardenDashboard';
import AdminDashboard   from '../pages/admin/AdminDashboard';
import MyComplaintsPage    from '../pages/student/MyComplaintsPage';
import NewComplaintPage    from '../pages/student/NewComplaintPage';
import ComplaintDetailPage from '../pages/student/ComplaintDetailPage';
import WardenComplaintsPage      from '../pages/warden/WardenComplaintsPage';
import WardenComplaintDetailPage from '../pages/warden/WardenComplaintDetailPage';
import WardenStaffPage           from '../pages/warden/WardenStaffPage';
import NotificationsPage         from '../pages/warden/NotificationsPage';
import VerificationPage     from '../pages/student/VerificationPage';
import WardenAnalyticsPage  from '../pages/warden/WardenAnalyticsPage';
import NotFoundPage              from '../components/common/NotFoundPage';
import ProfilePage               from '../components/common/ProfilePage';
import AdminUsersPage            from '../pages/admin/AdminUsersPage';
import AdminHostelPage           from '../pages/admin/AdminHostelPage';
import WardenRepeatComplaintsPage from '../pages/warden/WardenRepeatComplaintsPage';
import StudentHistoryPage   from '../pages/student/StudentHistoryPage';
import AdminStaffPage       from '../pages/admin/AdminStaffPage';
import AdminWardensPage     from '../pages/admin/AdminWardensPage';
import AdminReportsPage     from '../pages/admin/AdminReportsPage';
import AdminSettingsPage    from '../pages/admin/AdminSettingsPage';
import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffComplaintsPage from "../pages/staff/StaffComplaintsPage";
import StaffComplaintDetailPage from "../pages/staff/StaffComplaintDetailPage";
import StaffHistoryPage from "../pages/staff/StaffHistoryPage";
import StaffPerformancePage from "../pages/staff/StaffPerformancePage";
function RootRedirect() {
  const { isAuthenticated, userRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const roleHome = {
    student: '/student/dashboard',
    staff:   '/staff/dashboard',
    warden:  '/warden/dashboard',
    admin:   '/admin/dashboard',
  };
  return <Navigate to={roleHome[userRole] || '/login'} replace />;
}

function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ color: '#475569', fontWeight: 600 }}>{title}</h2>
      <p style={{ color: '#94a3b8' }}>This page will be built in an upcoming phase.</p>
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:12 }}>
      <h2 style={{ color: '#f43f5e', fontWeight: 700 }}>403 — Access Denied</h2>
      <p style={{ color: '#94a3b8' }}>You do not have permission to view this page.</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ──────────────────────────────────────────────────── */}
      <Route path="/login"        element={<LoginPage />} />
      <Route path="/register"     element={<Navigate to="/login" replace />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/"             element={<RootRedirect />} />

      {/* ── Student ─────────────────────────────────────────────────── */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index                 element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"      element={<StudentDashboard />} />
        <Route path="complaints"     element={<MyComplaintsPage />} />
        <Route path="complaints/new" element={<NewComplaintPage />} />   
        <Route path="complaints/:id" element={<ComplaintDetailPage />} />
        <Route path="complaints/:id/verify" element={<VerificationPage />} />
        <Route path="history" element={<StudentHistoryPage />} />
        <Route path="notifications"     element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ── Staff ───────────────────────────────────────────────────── */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index                  element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"       element={<StaffDashboard />} />
        <Route path="complaints"      element={<StaffComplaintsPage />} />
        <Route path="complaints/:id"  element={<StaffComplaintDetailPage />}/>
        <Route path="history"         element={<StaffHistoryPage />} />
        <Route path="performance"     element={<StaffPerformancePage />} />
        <Route path="notifications"   element={<NotificationsPage />} />
        <Route path="profile"         element={<ProfilePage />} />
      </Route>

      {/* ── Warden ──────────────────────────────────────────────────── */}
      <Route
        path="/warden"
        element={
          <ProtectedRoute allowedRoles={['warden']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index                    element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"         element={<WardenDashboard />} />
        <Route path="complaints"        element={<WardenComplaintsPage />} />
        <Route path="complaints/:id"    element={<WardenComplaintDetailPage />} />
        <Route path="staff"             element={<WardenStaffPage />} />
        <Route path="reports"           element={<WardenAnalyticsPage />} />
        <Route path="notifications"     element={<NotificationsPage />} />
        <Route path="profile"           element={<ProfilePage />} />
        <Route path="repeat-complaints" element={<WardenRepeatComplaintsPage />} />
      </Route>

      {/* ── Admin ───────────────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index                 element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"      element={<AdminDashboard />} />
        <Route path="complaints"     element={<WardenComplaintsPage />} />
        <Route path="complaints/:id" element={<WardenComplaintDetailPage />} />
        <Route path="analytics"      element={<WardenAnalyticsPage />} />
        <Route path="staff"    element={<AdminStaffPage />} />
        <Route path="wardens"  element={<AdminWardensPage />} />
        <Route path="reports"  element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="users"          element={<AdminUsersPage />} />
        <Route path="hostel"         element={<AdminHostelPage />} />
        <Route path="profile"        element={<ProfilePage />} />
      </Route>

      {/* ── Catch-all ───────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
