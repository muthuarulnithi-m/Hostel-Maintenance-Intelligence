import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar,
  Grid, Divider, Chip, Button, Alert,
  TextField, CircularProgress, Snackbar,
} from '@mui/material';
import {
  PersonOutlined, EmailOutlined, PhoneOutlined,
  CalendarTodayOutlined, BadgeOutlined,
  LogoutOutlined, EditOutlined, SaveOutlined, CloseOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth }       from '../../context/AuthContext';
import PageHeader        from '../../components/common/PageHeader';
import { formatDate }    from '../../utils/formatters';
import axiosInstance     from '../../api/axios';
// ADD to @mui/icons-material imports:
import {
  // ... existing ...
  VisibilityOutlined,
  VisibilityOffOutlined,
} from '@mui/icons-material';

// ADD to @mui/material imports:
import {
  // ... existing ...
  IconButton,
  InputAdornment,
} from '@mui/material';
const ROLE_CONFIG = {
  student: { label:'Student',       color:'#4F46E5', bg:'#EEF2FF' },
  staff:   { label:'Maintenance',   color:'#0D9488', bg:'#F0FDFA' },
  warden:  { label:'Warden',        color:'#D97706', bg:'#FFFBEB' },
  admin:   { label:'Administrator', color:'#DC2626', bg:'#FEF2F2' },
};

function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display:'flex', alignItems:'flex-start', gap:2, py:1.5 }}>
      <Box sx={{ width:36, height:36, borderRadius:1.5, bgcolor:'#F1F5F9', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {React.cloneElement(icon, { sx:{ fontSize:18, color:'#64748B' } })}
      </Box>
      <Box sx={{ flex:1 }}>
        <Typography variant="caption" sx={{ color:'text.disabled', display:'block' }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight:500, color:'text.primary', mt:0.25 }}>{value || '—'}</Typography>
      </Box>
    </Box>
  );
}

function ProfilePage() {
  const { user, userRole, logout, login } = useAuth();
  const navigate = useNavigate();

  const roleCfg = ROLE_CONFIG[userRole] || ROLE_CONFIG.student;
  const initials = user?.name
    ? user.name.trim().split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
    : '?';

  // Edit profile state
  const [editing,  setEditing]  = useState(false);
  const [form,     setForm]     = useState({ name:'', phone:'' });
  const [pwForm,   setPwForm]   = useState({ current_password:'', new_password:'', confirm:'' });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [fieldErr, setFieldErr] = useState({});
  const [snackbar, setSnackbar] = useState({ open:false, message:'' });
  const showSnack = (msg) => setSnackbar({ open:true, message:msg });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass,     setShowNewPass]     = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const startEdit = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '' });
    setPwForm({ current_password:'', new_password:'', confirm:'' });
    setError('');
    setFieldErr({});
    setEditing(true);
  };

  const validateEdit = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (pwForm.new_password) {
      if (!pwForm.current_password) e.current_password = 'Current password required to set a new one.';
      if (pwForm.new_password.length < 8) e.new_password = 'New password must be at least 8 characters.';
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
      // Update stored user data
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Refresh AuthContext by re-storing
      window.location.reload(); // simplest way to refresh user in context
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
    <Box sx={{ maxWidth:720, mx:'auto' }}>
      <PageHeader
        title="My Profile"
        subtitle="Your account information."
        action={
          !editing ? (
            <Button variant="outlined" startIcon={<EditOutlined />} onClick={startEdit} size="small">
              Edit Profile
            </Button>
          ) : (
            <Button variant="outlined" startIcon={<CloseOutlined />} onClick={() => setEditing(false)} size="small" color="inherit">
              Cancel
            </Button>
          )
        }
      />

      <Grid container spacing={2.5}>

        {/* ── Left: avatar card ──────────────────────────────────────── */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign:'center' }}>
            <CardContent sx={{ p:3 }}>
              <Avatar sx={{ width:80, height:80, background:'linear-gradient(135deg,#4F46E5,#7C3AED)', fontSize:'1.75rem', fontWeight:700, mx:'auto', mb:2 }}>
                {initials}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight:700, mb:0.5 }}>{user?.name || '—'}</Typography>
              <Chip label={roleCfg.label} size="small"
                sx={{ bgcolor:roleCfg.bg, color:roleCfg.color, fontWeight:700, fontSize:'0.75rem', mb:2 }} />
              <Divider sx={{ mb:2 }} />
              <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:1 }}>
                <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:user?.is_active?'#10B981':'#F43F5E' }} />
                <Typography variant="caption" sx={{ color:user?.is_active?'#10B981':'#F43F5E', fontWeight:600 }}>
                  {user?.is_active ? 'Active Account' : 'Inactive Account'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right: info + edit + actions ───────────────────────────── */}
        <Grid item xs={12} sm={8}>

          {/* View mode */}
          {!editing && (
            <Card sx={{ mb:2.5 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight:600, mb:1 }}>Account Information</Typography>
                <Divider sx={{ mb:1 }} />
                <InfoRow icon={<PersonOutlined />}       label="Full Name"     value={user?.name} />
                <Divider />
                <InfoRow icon={<EmailOutlined />}        label="Email Address" value={user?.email} />
                <Divider />
                <InfoRow icon={<PhoneOutlined />}        label="Phone Number"  value={user?.phone || 'Not provided'} />
                <Divider />
                <InfoRow icon={<BadgeOutlined />}        label="Role"          value={roleCfg.label} />
                <Divider />
                <InfoRow icon={<CalendarTodayOutlined />} label="Member Since" value={formatDate(user?.created_at)} />
              </CardContent>
            </Card>
          )}

          {/* Edit mode */}
          {editing && (
            <Card sx={{ mb:2.5 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight:600, mb:2 }}>Edit Profile</Typography>
                {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{error}</Alert>}
                <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
                  <TextField fullWidth size="small" label="Full Name *"
                    value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                    error={!!fieldErr.name} helperText={fieldErr.name} />
                  <TextField fullWidth size="small" label="Phone"
                    value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}
                    helperText="Optional" />
                  <Divider />
                  <Typography variant="caption" sx={{ fontWeight:600, color:'text.secondary' }}>
                    CHANGE PASSWORD (optional — leave blank to keep current)
                  </Typography>
                   <TextField
  fullWidth size="small" label="Current Password"
  type={showCurrentPass ? 'text' : 'password'}
  value={pwForm.current_password}
  onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))}
  error={!!fieldErr.current_password}
  helperText={fieldErr.current_password}
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={() => setShowCurrentPass(p => !p)} edge="end" size="small" tabIndex={-1}>
          {showCurrentPass ? <VisibilityOffOutlined sx={{ fontSize:18 }} /> : <VisibilityOutlined sx={{ fontSize:18 }} />}
        </IconButton>
      </InputAdornment>
    ),
  }}
/>
<TextField
  fullWidth size="small" label="New Password"
  type={showNewPass ? 'text' : 'password'}
  value={pwForm.new_password}
  onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
  error={!!fieldErr.new_password}
  helperText={fieldErr.new_password || 'Minimum 8 characters'}
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={() => setShowNewPass(p => !p)} edge="end" size="small" tabIndex={-1}>
          {showNewPass ? <VisibilityOffOutlined sx={{ fontSize:18 }} /> : <VisibilityOutlined sx={{ fontSize:18 }} />}
        </IconButton>
      </InputAdornment>
    ),
  }}
/>
<TextField
  fullWidth size="small" label="Confirm New Password"
  type={showConfirmPass ? 'text' : 'password'}
  value={pwForm.confirm}
  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
  error={!!fieldErr.confirm}
  helperText={fieldErr.confirm}
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={() => setShowConfirmPass(p => !p)} edge="end" size="small" tabIndex={-1}>
          {showConfirmPass ? <VisibilityOffOutlined sx={{ fontSize:18 }} /> : <VisibilityOutlined sx={{ fontSize:18 }} />}
        </IconButton>
      </InputAdornment>
    ),
  }}
/>
                  <Button variant="contained" onClick={handleSave} disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Sign out */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight:600, mb:2 }}>Account Actions</Typography>
              {!showLogout ? (
                <Button variant="outlined" color="error" startIcon={<LogoutOutlined />}
                  onClick={() => setShowLogout(true)} fullWidth>
                  Sign Out
                </Button>
              ) : (
                <Alert severity="warning" sx={{ borderRadius:2 }}
                  action={
                    <Box sx={{ display:'flex', gap:1 }}>
                      <Button size="small" color="inherit" onClick={() => setShowLogout(false)}>Cancel</Button>
                      <Button size="small" color="error" variant="contained" onClick={handleLogout}>Sign Out</Button>
                    </Box>
                  }>
                  Are you sure you want to sign out?
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(p=>({...p,open:false}))}
        anchorOrigin={{ vertical:'bottom', horizontal:'right' }}>
        <Alert onClose={() => setSnackbar(p=>({...p,open:false}))} severity="success" sx={{ borderRadius:2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ProfilePage;