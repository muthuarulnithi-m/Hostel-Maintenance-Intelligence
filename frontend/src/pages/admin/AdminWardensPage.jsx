import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  TextField, InputAdornment, Alert, Skeleton, IconButton,
  Chip, Divider, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Snackbar,
} from '@mui/material';
import {
  SearchOutlined, SupervisorAccountOutlined, AddOutlined,
  VisibilityOutlined, VisibilityOffOutlined, LockOutlined,
} from '@mui/icons-material';
import PageHeader    from '../../components/common/PageHeader';
import EmptyState    from '../../components/common/EmptyState';
import axiosInstance from '../../api/axios';
import { formatDate } from '../../utils/formatters';

// ─── Create Warden Dialog ─────────────────────────────────────────────────────
function CreateWardenDialog({ open, onClose, onSuccess }) {
  const [form,     setForm]     = useState({ name:'', email:'', phone:'', password:'' });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPass, setShowPass] = useState(false); // ← was missing

  const reset = () => {
    setForm({ name:'', email:'', phone:'', password:'' });
    setErrors({});
    setError('');
    setShowPass(false); // ← reset on close
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name     = 'Name is required.';
    if (!form.email.trim()) e.email    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email.';
    if (!form.password)     e.password = 'Password is required.';
    else if (form.password.length < 8)
      e.password = 'Minimum 8 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/users', {
        name:     form.name.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim() || undefined,
        password: form.password,
        role:     'WARDEN',
      });
      onSuccess(response.data);
      reset();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to create warden account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => { if (!loading) { reset(); onClose(); } }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Create Warden Account</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{error}</Alert>
        )}
        <Box sx={{ display:'flex', flexDirection:'column', gap:2, pt:1 }}>

          {/* Name */}
          <TextField
            fullWidth
            label="Full Name *"
            size="small"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
          />

          {/* Email */}
          <TextField
            fullWidth
            label="Email *"
            size="small"
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            error={!!errors.email}
            helperText={errors.email}
            disabled={loading}
          />

          {/* Phone */}
          <TextField
            fullWidth
            label="Phone"
            size="small"
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            helperText="Optional"
            disabled={loading}
          />

          {/* Password with show/hide ← was broken */}
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight:600, color:'text.primary', mb:0.5, display:'block' }}
            >
              Password *
            </Typography>
            <TextField
              fullWidth
              size="small"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              error={!!errors.password}
              helperText={errors.password || 'Minimum 8 characters'}
              placeholder="Enter a secure password"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ fontSize:16, color:'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPass(p => !p)}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass
                        ? <VisibilityOffOutlined sx={{ fontSize:18 }} />
                        : <VisibilityOutlined   sx={{ fontSize:18 }} />
                      }
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => { reset(); onClose(); }}
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={
            loading
              ? <CircularProgress size={16} color="inherit" />
              : <AddOutlined />
          }
        >
          {loading ? 'Creating…' : 'Create Warden'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function AdminWardensPage() {
  const [wardens,      setWardens]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [search,       setSearch]       = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [snackbar,     setSnackbar]     = useState({ open:false, message:'' });

  const showSnack = (msg) => setSnackbar({ open:true, message:msg });

  const fetchWardens = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/users');
      setWardens(response.data.filter(u => u.role === 'WARDEN'));
    } catch {
      setError('Unable to load warden list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWardens(); }, [fetchWardens]);

  const filtered = wardens.filter(w => {
    const q = search.toLowerCase();
    return !search ||
      w.name?.toLowerCase().includes(q) ||
      w.email?.toLowerCase().includes(q);
  });

  return (
    <Box>
      <PageHeader
        title="Warden Management"
        subtitle="Create and manage warden accounts."
        action={
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => setCreateDialog(true)}
          >
            Add Warden
          </Button>
        }
      />

      {/* Search bar */}
      <Card sx={{ mb:2.5 }}>
        <CardContent sx={{ py:'14px !important' }}>
          <TextField
            size="small"
            placeholder="Search wardens…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth:260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize:18, color:'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="caption" sx={{ color:'text.disabled', display:'block', mt:1 }}>
            {filtered.length} warden{filtered.length !== 1 ? 's' : ''}
          </Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb:2, borderRadius:2 }}
          action={
            <Button size="small" color="inherit" onClick={fetchWardens}>Retry</Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Loading skeletons */}
      {loading && (
        <Card>
          <CardContent>
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{ display:'flex', gap:2, mb:1.5, alignItems:'center' }}>
                <Skeleton variant="circular" width={44} height={44} />
                <Box sx={{ flex:1 }}>
                  <Skeleton width="40%" height={18} sx={{ mb:0.5 }} />
                  <Skeleton width="60%" height={14} />
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <Card>
          <EmptyState
            icon={<SupervisorAccountOutlined sx={{ fontSize:36 }} />}
            title="No wardens yet"
            description='Click "Add Warden" to create the first warden account.'
          />
        </Card>
      )}

      {/* Warden list */}
      {!loading && filtered.length > 0 && (
        <Card>
          <CardContent sx={{ p:0 }}>
            {filtered.map((w, i) => {
              const initials = w.name
                ?.trim().split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)
                || '?';
              return (
                <Box key={w.id}>
                  {i > 0 && <Divider />}
                  <Box sx={{ display:'flex', alignItems:'center', gap:2, px:2.5, py:2 }}>
                    <Avatar
                      sx={{
                        width:44, height:44,
                        bgcolor:'#D97706',
                        fontSize:'0.9rem', fontWeight:700,
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Box sx={{ flex:1 }}>
                      <Typography variant="body2" sx={{ fontWeight:600 }}>
                        {w.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color:'text.secondary' }}>
                        {w.email}{w.phone ? ` · ${w.phone}` : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.5, flexShrink:0 }}>
                      <Box
                        sx={{
                          width:8, height:8, borderRadius:'50%',
                          bgcolor: w.is_active ? '#10B981' : '#EF4444',
                        }}
                      />
                      <Chip
                        label={w.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          bgcolor: w.is_active ? '#FFFBEB' : '#F1F5F9',
                          color:   w.is_active ? '#D97706' : '#64748B',
                          fontWeight:600, fontSize:'0.6875rem',
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color:'text.disabled', display:{ xs:'none', sm:'block' } }}
                      >
                        {formatDate(w.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <CreateWardenDialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        onSuccess={(w) => {
          setWardens(p => [...p, w]);
          showSnack('Warden account created successfully.');
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open:false }))}
        anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
      >
        <Alert
          onClose={() => setSnackbar(p => ({ ...p, open:false }))}
          severity="success"
          sx={{ borderRadius:2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminWardensPage;