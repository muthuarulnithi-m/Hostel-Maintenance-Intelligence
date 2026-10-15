import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar,
  Grid, Divider, Chip, Button, Alert,
  TextField, CircularProgress, Snackbar,
  IconButton, InputAdornment,
} from '@mui/material';
import {
  PersonOutlined, EmailOutlined, PhoneOutlined,
  CalendarTodayOutlined, BadgeOutlined,
  LogoutOutlined, EditOutlined, SaveOutlined, CloseOutlined,
  VisibilityOutlined, VisibilityOffOutlined,
  CheckCircleOutlined, LockOutlined,
} from '@mui/icons-material';
import { useNavigate }    from 'react-router-dom';
import { useAuth }        from '../../context/AuthContext';
import PageHeader         from '../../components/common/PageHeader';
import { formatDate }     from '../../utils/formatters';
import axiosInstance      from '../../api/axios';

const ROLE_CONFIG = {
  student: { label: 'Student',       color: '#4F46E5', bg: '#EEF2FF',  gradient: 'linear-gradient(135deg,#4F46E5,#7C3AED)' },
  staff:   { label: 'Maintenance',   color: '#0D9488', bg: '#F0FDFA',  gradient: 'linear-gradient(135deg,#0D9488,#059669)' },
  warden:  { label: 'Warden',        color: '#D97706', bg: '#FFFBEB',  gradient: 'linear-gradient(135deg,#D97706,#B45309)' },
  admin:   { label: 'Administrator', color: '#DC2626', bg: '#FEF2F2',  gradient: 'linear-gradient(135deg,#DC2626,#9B1C1C)' },
};

// ── Reusable info row ────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, last }) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.75 }}>
        <Box
          sx={{
            width: 38, height: 38, borderRadius: 2,
            bgcolor: '#F8FAFC', border: '1px solid #E2E8F0',
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 17, color: '#64748B' } })}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.15 }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value || '—'}
          </Typography>
        </Box>
      </Box>
      {!last && <Divider sx={{ borderColor: '#F1F5F9' }} />}
    </>
  );
}

// ── Password field helper ────────────────────────────────────────────────────
function PasswordField({ label, value, onChange, error, helperText, show, onToggle }) {
  return (
    <TextField
      fullWidth size="small" label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      error={!!error}
      helperText={error || helperText}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 1.5,
          '&:hover fieldset': { borderColor: '#818cf8' },
          '&.Mui-focused fieldset': { borderColor: '#4F46E5', borderWidth: 2 },
        },
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlined sx={{ fontSize: 16, color: '#94A3B8' }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={onToggle} edge="end" size="small" tabIndex={-1}
                sx={{ color: '#94A3B8', '&:hover': { color: '#4F46E5' } }}>
                {show
                  ? <VisibilityOffOutlined sx={{ fontSize: 16 }} />
                  : <VisibilityOutlined   sx={{ fontSize: 16 }} />
                }
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

function ProfilePage() {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const roleCfg = ROLE_CONFIG[userRole] || ROLE_CONFIG.student;
  const initials = user?.name
    ? user.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const [editing,  setEditing]  = useState(false);
  const [form,     setForm]     = useState({ name: '', phone: '' });
  const [pwForm,   setPwForm]   = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [fieldErr, setFieldErr] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass,     setShowNewPass]     = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const showSnack = (msg) => setSnackbar({ open: true, message: msg });

  const startEdit = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '' });
    setPwForm({ current_password: '', new_password: '', confirm: '' });
    setError('');
    setFieldErr({});
    setEditing(true);
  };

  const validateEdit = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (pwForm.new_password) {
      if (!pwForm.current_password) e.current_password = 'Current password required to set a new one.';
      if (pwForm.new_password.length < 8) e.new_password = 'Must be at least 8 characters.';
      if (pwForm.new_password !== pwForm.confirm) e.confirm = 'Passwords do not match.';
    }
    setFieldErr(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateEdit()) return;
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name.trim(), phone: form.phone.trim() || undefined };
      if (pwForm.new_password) {
        payload.current_password = pwForm.current_password;
        payload.new_password     = pwForm.new_password;
      }
      const response = await axiosInstance.patch('/users/me', payload);
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showSnack('Profile updated successfully!');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 400) {
        setError(typeof detail === 'string' ? detail : 'Current password is incorrect.');
      } else {
        setError(typeof detail === 'string' ? detail : 'Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <PageHeader
        title="My Profile"
        subtitle="Manage your account information and security settings."
        action={
          !editing ? (
            <Button
              variant="contained" startIcon={<EditOutlined />}
              onClick={startEdit} size="small"
              sx={{
                borderRadius: 1.5,
                background: 'linear-gradient(135deg,#4F46E5,#6D28D9)',
                boxShadow: '0 2px 8px rgba(79,70,229,0.35)',
                '&:hover': { background: 'linear-gradient(135deg,#4338CA,#5B21B6)' },
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <Button variant="outlined" startIcon={<CloseOutlined />}
              onClick={() => setEditing(false)} size="small" color="inherit"
              sx={{ borderRadius: 1.5 }}>
              Cancel
            </Button>
          )
        }
      />

      <Grid container spacing={2.5}>

        {/* ── Left: avatar card ──────────────────────────────────────────── */}
        <Grid xs={12} sm={4}>
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Gradient banner */}
            <Box
              sx={{
                height: 72,
                background: roleCfg.gradient,
                opacity: 0.9,
              }}
            />

            <CardContent sx={{ pt: 0, pb: 3, px: 3, textAlign: 'center' }}>
              {/* Avatar overlapping banner */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: '-36px', mb: 1.5 }}>
                <Avatar
                  sx={{
                    width: 72, height: 72,
                    background: roleCfg.gradient,
                    fontSize: '1.5rem', fontWeight: 800,
                    border: '3px solid #fff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  }}
                >
                  {initials}
                </Avatar>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#0F172A' }}>
                {user?.name || '—'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                {user?.email}
              </Typography>

              <Chip
                label={roleCfg.label}
                size="small"
                sx={{
                  bgcolor: roleCfg.bg,
                  color: roleCfg.color,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.02em',
                  border: `1px solid ${roleCfg.color}30`,
                  mb: 2,
                }}
              />

              <Divider sx={{ mb: 2, borderColor: '#F1F5F9' }} />

              {/* Status badge */}
              <Box
                sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 0.75,
                  px: 1.5, py: 0.5, borderRadius: 10,
                  bgcolor: user?.is_active ? '#DCFCE7' : '#FEE2E2',
                  border: `1px solid ${user?.is_active ? '#BBF7D0' : '#FECACA'}`,
                }}
              >
                <Box
                  sx={{
                    width: 7, height: 7, borderRadius: '50%',
                    bgcolor: user?.is_active ? '#16A34A' : '#DC2626',
                    boxShadow: user?.is_active
                      ? '0 0 6px rgba(22,163,74,0.6)'
                      : '0 0 6px rgba(220,38,38,0.6)',
                    animation: user?.is_active ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%,100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700, fontSize: '0.7rem',
                    color: user?.is_active ? '#16A34A' : '#DC2626',
                  }}
                >
                  {user?.is_active ? 'Active' : 'Inactive'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right: info + edit ─────────────────────────────────────────── */}
        <Grid xs={12} sm={8}>

          {/* ── View mode ─────────────────────────────────────────────────── */}
          {!editing && (
            <Card
              sx={{
                mb: 2.5, borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                border: '1px solid #E2E8F0',
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', letterSpacing: '0.01em' }}>
                    Account Information
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: '#F1F5F9' }} />
                <Box sx={{ px: 2.5 }}>
                  <InfoRow icon={<PersonOutlined />}        label="Full Name"     value={user?.name} />
                  <InfoRow icon={<EmailOutlined />}         label="Email Address" value={user?.email} />
                  <InfoRow icon={<PhoneOutlined />}         label="Phone Number"  value={user?.phone || 'Not provided'} />
                  <InfoRow icon={<BadgeOutlined />}         label="Role"          value={roleCfg.label} />
                  <InfoRow icon={<CalendarTodayOutlined />} label="Member Since"  value={formatDate(user?.created_at)} last />
                </Box>
              </CardContent>
            </Card>
          )}

          {/* ── Edit mode ─────────────────────────────────────────────────── */}
          {editing && (
            <Card
              sx={{
                mb: 2.5, borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                border: '1px solid #E2E8F0',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                  Edit Profile
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8125rem' }}>
                    {error}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Basic info */}
                  <TextField
                    fullWidth size="small" label="Full Name *"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    error={!!fieldErr.name} helperText={fieldErr.name}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': { borderColor: '#818cf8' },
                        '&.Mui-focused fieldset': { borderColor: '#4F46E5', borderWidth: 2 },
                      },
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlined sx={{ fontSize: 16, color: '#94A3B8' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    fullWidth size="small" label="Phone Number"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    helperText="Optional"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': { borderColor: '#818cf8' },
                        '&.Mui-focused fieldset': { borderColor: '#4F46E5', borderWidth: 2 },
                      },
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneOutlined sx={{ fontSize: 16, color: '#94A3B8' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  {/* Password section */}
                  <Box
                    sx={{
                      p: 2, borderRadius: 2,
                      bgcolor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700, color: '#64748B',
                        fontSize: '0.7rem', letterSpacing: '0.06em',
                        textTransform: 'uppercase', display: 'block', mb: 1.5,
                      }}
                    >
                      🔐 Change Password — optional
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <PasswordField
                        label="Current Password"
                        value={pwForm.current_password}
                        onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))}
                        error={fieldErr.current_password}
                        show={showCurrentPass}
                        onToggle={() => setShowCurrentPass(p => !p)}
                      />
                      <PasswordField
                        label="New Password"
                        value={pwForm.new_password}
                        onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                        error={fieldErr.new_password}
                        helperText="Minimum 8 characters"
                        show={showNewPass}
                        onToggle={() => setShowNewPass(p => !p)}
                      />
                      <PasswordField
                        label="Confirm New Password"
                        value={pwForm.confirm}
                        onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                        error={fieldErr.confirm}
                        show={showConfirmPass}
                        onToggle={() => setShowConfirmPass(p => !p)}
                      />
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={
                      saving
                        ? <CircularProgress size={15} color="inherit" />
                        : <SaveOutlined />
                    }
                    sx={{
                      borderRadius: 1.75, py: 1.125,
                      background: 'linear-gradient(135deg,#4F46E5,#6D28D9)',
                      boxShadow: '0 3px 12px rgba(79,70,229,0.35)',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg,#4338CA,#5B21B6)',
                        boxShadow: '0 5px 16px rgba(79,70,229,0.45)',
                        transform: 'translateY(-1px)',
                      },
                      '&:active': { transform: 'translateY(0)' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* ── Account actions ───────────────────────────────────────────── */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
              border: '1px solid #E2E8F0',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Account Actions
              </Typography>

              {!showLogout ? (
                <Button
                  variant="outlined" color="error"
                  startIcon={<LogoutOutlined />}
                  onClick={() => setShowLogout(true)}
                  fullWidth
                  sx={{
                    borderRadius: 1.5, py: 1,
                    fontWeight: 600,
                    borderColor: '#FECACA',
                    color: '#DC2626',
                    bgcolor: '#FEF2F2',
                    '&:hover': {
                      bgcolor: '#FEE2E2',
                      borderColor: '#FCA5A5',
                    },
                  }}
                >
                  Sign Out
                </Button>
              ) : (
                <Box
                  sx={{
                    p: 2, borderRadius: 2,
                    bgcolor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400E', mb: 1.5 }}>
                    Are you sure you want to sign out?
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small" variant="outlined"
                      onClick={() => setShowLogout(false)}
                      sx={{ borderRadius: 1.5, flex: 1, borderColor: '#D97706', color: '#D97706', '&:hover': { bgcolor: '#FEF3C7' } }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small" variant="contained" color="error"
                      onClick={handleLogout}
                      startIcon={<LogoutOutlined />}
                      sx={{ borderRadius: 1.5, flex: 1, fontWeight: 600 }}
                    >
                      Sign Out
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

        </Grid>
      </Grid>

      {/* ── Success snackbar ─────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(p => ({ ...p, open: false }))}
          severity="success"
          icon={<CheckCircleOutlined fontSize="inherit" />}
          sx={{ borderRadius: 2, fontWeight: 500 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ProfilePage;
