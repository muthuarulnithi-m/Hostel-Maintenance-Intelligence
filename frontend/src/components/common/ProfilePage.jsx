import React, { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutlined,
  EditOutlined,
  LockOutlined,
  LogoutOutlined,
  PersonOutlined,
  SaveOutlined,
  SecurityOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import { formatDate } from '../../utils/formatters';
import axiosInstance from '../../api/axios';

const ROLE_CONFIG = {
  student: { label: 'Student', color: '#5B4AE6', bg: '#F1EFFF' },
  staff: { label: 'Maintenance Staff', color: '#0F766E', bg: '#E9F8F5' },
  warden: { label: 'Warden', color: '#A16207', bg: '#FFF7E5' },
  admin: { label: 'Administrator', color: '#B42318', bg: '#FFF0EE' },
};

const panelSx = {
  border: '1px solid #E7E7EE',
  borderRadius: 3,
  boxShadow: '0 2px 10px rgba(24, 24, 40, 0.025)',
  bgcolor: '#fff',
};

function SettingsNavItem({ selected, icon, children, onClick }) {
  return (
    <Button
      fullWidth
      color="inherit"
      onClick={onClick}
      aria-current={selected ? 'page' : undefined}
      startIcon={icon}
      sx={{
        justifyContent: 'flex-start',
        minHeight: 40,
        px: 1.25,
        borderRadius: 1.5,
        color: selected ? '#5747D9' : '#5E606A',
        bgcolor: selected ? '#F2F0FF' : 'transparent',
        fontWeight: selected ? 600 : 400,
        fontSize: '0.875rem',
        '&:hover': { bgcolor: selected ? '#ECE9FF' : '#F7F7FA' },
        '& .MuiButton-startIcon': { color: 'inherit', mr: 1 },
      }}
    >
      {children}
    </Button>
  );
}

function DetailField({ label, value, editable = false, children }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="div"
        sx={{ color: '#737581', fontSize: '0.78rem', mb: 0.65, fontWeight: 500 }}
      >
        {label}
      </Typography>
      {editable ? children : (
        <Box
          sx={{
            minHeight: 42,
            px: 1.4,
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #E6E6EC',
            borderRadius: 1.5,
            color: value ? '#292A31' : '#999BA4',
            fontSize: '0.875rem',
            overflowWrap: 'anywhere',
            bgcolor: '#fff',
          }}
        >
          {value || 'Not provided'}
        </Box>
      )}
    </Box>
  );
}

function PasswordField({ label, value, onChange, error, show, onToggle }) {
  return (
    <TextField
      fullWidth
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      error={Boolean(error)}
      helperText={error || ' '}
      autoComplete={label === 'Current Password' ? 'current-password' : 'new-password'}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlined sx={{ color: '#888A94', fontSize: 19 }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                onClick={onToggle}
                edge="end"
              >
                {show ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

function ProfilePage() {
  const { user, userRole, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const roleCfg = ROLE_CONFIG[userRole] || ROLE_CONFIG.student;
  const initials = user?.name
    ?.trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
  const nameParts = (user?.name || '').trim().split(/\s+/).filter(Boolean);

  const [section, setSection] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [confirmLogout, setConfirmLogout] = useState(false);

  const startEdit = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '' });
    setFieldErrors({});
    setError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError('');
    setFieldErrors({});
  };

  const saveProfile = async () => {
    const nextErrors = {};
    const cleanName = form.name.trim();
    if (cleanName.length < 2 || cleanName.length > 100) {
      nextErrors.name = 'Enter a name between 2 and 100 characters.';
    }
    const cleanPhone = form.phone.trim();
    if (cleanPhone.length > 20) nextErrors.phone = 'Phone number must be 20 characters or fewer.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setError('');
    try {
      const { data } = await axiosInstance.patch('/users/me', {
        name: cleanName,
        phone: cleanPhone || null,
      });
      updateUser(data);
      setEditing(false);
      setSnackbar({ open: true, message: 'Profile information saved.' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Unable to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    const nextErrors = {};
    if (!passwords.current) nextErrors.current = 'Enter your current password.';
    if (passwords.next.length < 8 || passwords.next.length > 72) {
      nextErrors.next = 'Use a password between 8 and 72 characters.';
    }
    if (passwords.next !== passwords.confirm) nextErrors.confirm = 'Passwords do not match.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setError('');
    try {
      const { data } = await axiosInstance.patch('/users/me', {
        current_password: passwords.current,
        new_password: passwords.next,
      });
      updateUser(data);
      setPasswords({ current: '', next: '', confirm: '' });
      setFieldErrors({});
      setSnackbar({ open: true, message: 'Password changed successfully.' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Unable to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your account information and security preferences."
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '176px minmax(0, 1fr)' },
          gap: { xs: 2, md: 2.5 },
          alignItems: 'start',
        }}
      >
        <Card sx={panelSx}>
          <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
            <Box component="nav" aria-label="Profile settings">
              <SettingsNavItem
                selected={section === 'profile'}
                icon={<PersonOutlined fontSize="small" />}
                onClick={() => { setSection('profile'); setError(''); setEditing(false); }}
              >
                Profile
              </SettingsNavItem>
              <SettingsNavItem
                selected={section === 'security'}
                icon={<SecurityOutlined fontSize="small" />}
                onClick={() => { setSection('security'); setError(''); setEditing(false); }}
              >
                Security
              </SettingsNavItem>
            </Box>
            <Divider sx={{ my: 1.25, borderColor: '#EEEEF2' }} />
            {!confirmLogout ? (
              <Button
                fullWidth
                color="error"
                startIcon={<LogoutOutlined />}
                onClick={() => setConfirmLogout(true)}
                sx={{ justifyContent: 'flex-start', px: 1.25, minHeight: 40, borderRadius: 1.5 }}
              >
                Sign Out
              </Button>
            ) : (
              <Box sx={{ p: 1.25 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#4B4D57', mb: 1.25 }}>
                  Sign out of this device?
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={() => setConfirmLogout(false)}>Cancel</Button>
                  <Button size="small" color="error" onClick={handleLogout}>Sign Out</Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={panelSx}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
            {section === 'profile' ? (
              <>
                <Typography variant="h6" sx={{ fontWeight: 650, color: '#252630', mb: 2.25 }}>
                  My Profile
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.75,
                    p: { xs: 1.5, sm: 1.75 },
                    border: '1px solid #E8E8ED',
                    borderRadius: 2.5,
                    mb: 1.75,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 68,
                      height: 68,
                      bgcolor: roleCfg.bg,
                      color: roleCfg.color,
                      fontWeight: 700,
                      fontSize: '1.3rem',
                    }}
                  >
                    {initials}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, color: '#292A31' }}>
                      {user?.name || 'Account holder'}
                    </Typography>
                    <Typography sx={{ color: '#767883', fontSize: '0.82rem', overflowWrap: 'anywhere' }}>
                      {user?.email || 'Email unavailable'}
                    </Typography>
                    <Chip
                      label={roleCfg.label}
                      size="small"
                      sx={{ mt: 0.75, bgcolor: roleCfg.bg, color: roleCfg.color, fontWeight: 600, height: 24 }}
                    />
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditOutlined />}
                    onClick={editing ? cancelEdit : startEdit}
                    sx={{ borderColor: '#E6E6EC', color: '#555762', borderRadius: 1.5, flexShrink: 0 }}
                  >
                    {editing ? 'Cancel' : 'Edit'}
                  </Button>
                </Box>

                <Card variant="outlined" sx={{ borderColor: '#E8E8ED', borderRadius: 2.5, mb: 1.75, boxShadow: 'none' }}>
                  <CardContent sx={{ p: { xs: 1.75, sm: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography sx={{ fontWeight: 600, color: '#30313A' }}>Personal Information</Typography>
                      {!editing && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditOutlined />}
                          onClick={startEdit}
                          sx={{ borderColor: '#E6E6EC', color: '#555762', borderRadius: 1.5 }}
                        >
                          Edit
                        </Button>
                      )}
                    </Box>
                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{error}</Alert>}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                      {editing ? (
                        <>
                          <TextField
                            fullWidth
                            label="Full Name"
                            value={form.name}
                            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                            error={Boolean(fieldErrors.name)}
                            helperText={fieldErrors.name || ' '}
                            autoComplete="name"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                          />
                          <TextField
                            fullWidth
                            label="Phone Number"
                            value={form.phone}
                            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                            error={Boolean(fieldErrors.phone)}
                            helperText={fieldErrors.phone || ' '}
                            autoComplete="tel"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                          />
                          <DetailField label="Email Address" value={user?.email} />
                          <DetailField label="Account Role" value={roleCfg.label} />
                        </>
                      ) : (
                        <>
                          <DetailField label="First Name" value={nameParts[0]} />
                          <DetailField label="Last Name" value={nameParts.slice(1).join(' ')} />
                          <DetailField label="Email Address" value={user?.email} />
                          <DetailField label="Phone Number" value={user?.phone} />
                        </>
                      )}
                    </Box>
                    {editing && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                        <Button onClick={cancelEdit} disabled={saving} sx={{ color: '#62636D' }}>Cancel</Button>
                        <Button
                          variant="contained"
                          onClick={saveProfile}
                          disabled={saving}
                          startIcon={<SaveOutlined />}
                          sx={{ bgcolor: '#5948DD', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#4939C5' } }}
                        >
                          {saving ? 'Saving…' : 'Save Changes'}
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderColor: '#E8E8ED', borderRadius: 2.5, boxShadow: 'none' }}>
                  <CardContent sx={{ p: { xs: 1.75, sm: 2 } }}>
                    <Typography sx={{ fontWeight: 600, color: '#30313A', mb: 2 }}>Account Details</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                      <DetailField label="Account Role" value={roleCfg.label} />
                      <DetailField label="Account Status" value={user?.is_active ? 'Active' : 'Inactive'} />
                      <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                        <DetailField label="Member Since" value={formatDate(user?.created_at)} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Typography variant="h6" sx={{ fontWeight: 650, color: '#252630', mb: 0.5 }}>
                  Security
                </Typography>
                <Typography sx={{ color: '#777984', fontSize: '0.875rem', mb: 2.25 }}>
                  Change your password to keep your account secure.
                </Typography>
                <Card variant="outlined" sx={{ borderColor: '#E8E8ED', borderRadius: 2.5, boxShadow: 'none' }}>
                  <CardContent sx={{ p: { xs: 1.75, sm: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LockOutlined sx={{ fontSize: 19, color: '#6454DE' }} />
                      <Typography sx={{ fontWeight: 600, color: '#30313A' }}>Change Password</Typography>
                    </Box>
                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{error}</Alert>}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                      <PasswordField
                        label="Current Password"
                        value={passwords.current}
                        onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))}
                        error={fieldErrors.current}
                        show={showPassword.current}
                        onToggle={() => setShowPassword((current) => ({ ...current, current: !current.current }))}
                      />
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
                      <PasswordField
                        label="New Password"
                        value={passwords.next}
                        onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))}
                        error={fieldErrors.next}
                        show={showPassword.next}
                        onToggle={() => setShowPassword((current) => ({ ...current, next: !current.next }))}
                      />
                      <PasswordField
                        label="Confirm New Password"
                        value={passwords.confirm}
                        onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))}
                        error={fieldErrors.confirm}
                        show={showPassword.confirm}
                        onToggle={() => setShowPassword((current) => ({ ...current, confirm: !current.confirm }))}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        variant="contained"
                        onClick={savePassword}
                        disabled={saving}
                        startIcon={<SaveOutlined />}
                        sx={{ bgcolor: '#5948DD', borderRadius: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#4939C5' } }}
                      >
                        {saving ? 'Saving…' : 'Update Password'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
          severity="success"
          icon={<CheckCircleOutlined fontSize="inherit" />}
          sx={{ borderRadius: 1.5 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ProfilePage;
