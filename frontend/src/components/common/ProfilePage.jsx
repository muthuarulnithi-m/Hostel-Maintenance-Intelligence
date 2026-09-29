import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar,
  Grid, Divider, Chip, Button, Alert,
} from '@mui/material';
import {
  PersonOutlined,
  EmailOutlined,
  PhoneOutlined,
  CalendarTodayOutlined,
  BadgeOutlined,
  LogoutOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth }   from '../../context/AuthContext';
import PageHeader    from '../../components/common/PageHeader';
import { formatDate } from '../../utils/formatters';

// Role display config
const ROLE_CONFIG = {
  student: { label: 'Student',       color: '#4F46E5', bg: '#EEF2FF' },
  staff:   { label: 'Maintenance',   color: '#0D9488', bg: '#F0FDFA' },
  warden:  { label: 'Warden',        color: '#D97706', bg: '#FFFBEB' },
  admin:   { label: 'Administrator', color: '#DC2626', bg: '#FEF2F2' },
};

// Info row component
function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.5 }}>
      <Box
        sx={{
          width: 36, height: 36, borderRadius: 1.5,
          bgcolor: '#F1F5F9', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: 18, color: '#64748B' } })}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mt: 0.25 }}>
          {value || '—'}
        </Typography>
      </Box>
    </Box>
  );
}

function ProfilePage() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const roleCfg = ROLE_CONFIG[userRole] || ROLE_CONFIG.student;

  // Generate initials
  const initials = user?.name
    ? user.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <PageHeader
        title="My Profile"
        subtitle="Your account information and settings."
      />

      <Grid container spacing={2.5}>

        {/* ── Left: Avatar + role card ─────────────────────────────────── */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ p: 3 }}>
              {/* Avatar */}
              <Avatar
                sx={{
                  width: 80, height: 80,
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  fontSize: '1.75rem', fontWeight: 700,
                  mx: 'auto', mb: 2,
                }}
              >
                {initials}
              </Avatar>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {user?.name || '—'}
              </Typography>

              <Chip
                label={roleCfg.label}
                size="small"
                sx={{
                  bgcolor: roleCfg.bg, color: roleCfg.color,
                  fontWeight: 700, fontSize: '0.75rem',
                  mb: 2,
                }}
              />

              <Divider sx={{ mb: 2 }} />

              {/* Account status */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: user?.is_active ? '#10B981' : '#F43F5E' }} />
                <Typography variant="caption" sx={{ color: user?.is_active ? '#10B981' : '#F43F5E', fontWeight: 600 }}>
                  {user?.is_active ? 'Active Account' : 'Inactive Account'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right: Info + actions ─────────────────────────────────────── */}
        <Grid item xs={12} sm={8}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Account Information
              </Typography>
              <Divider sx={{ mb: 1 }} />

              <InfoRow
                icon={<PersonOutlined />}
                label="Full Name"
                value={user?.name}
              />
              <Divider />
              <InfoRow
                icon={<EmailOutlined />}
                label="Email Address"
                value={user?.email}
              />
              <Divider />
              <InfoRow
                icon={<PhoneOutlined />}
                label="Phone Number"
                value={user?.phone || 'Not provided'}
              />
              <Divider />
              <InfoRow
                icon={<BadgeOutlined />}
                label="Role"
                value={roleCfg.label}
              />
              <Divider />
              <InfoRow
                icon={<CalendarTodayOutlined />}
                label="Member Since"
                value={formatDate(user?.created_at)}
              />
            </CardContent>
          </Card>

          {/* Account actions */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Account Actions
              </Typography>

              {!showLogoutConfirm ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LogoutOutlined />}
                  onClick={() => setShowLogoutConfirm(true)}
                  fullWidth
                >
                  Sign Out
                </Button>
              ) : (
                <Alert
                  severity="warning"
                  sx={{ borderRadius: 2 }}
                  action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        color="inherit"
                        onClick={() => setShowLogoutConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="contained"
                        onClick={handleLogout}
                      >
                        Sign Out
                      </Button>
                    </Box>
                  }
                >
                  Are you sure you want to sign out?
                </Alert>
              )}

              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1.5, textAlign: 'center' }}>
                To update your profile information, please contact the hostel administrator.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProfilePage;