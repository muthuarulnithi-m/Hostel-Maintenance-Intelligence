import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, InputAdornment, IconButton, Alert,
  CircularProgress, Divider, LinearProgress,
} from '@mui/material';
import {
  HomeWorkOutlined,
  PersonOutlined,
  EmailOutlined,
  PhoneOutlined,
  LockOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';
import authApi from '../../api/authApi';

// ─── Password strength calculator ────────────────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (password.length >= 8)              score++;
  if (password.length >= 12)             score++;
  if (/[A-Z]/.test(password))           score++;
  if (/[0-9]/.test(password))           score++;
  if (/[^A-Za-z0-9]/.test(password))   score++;

  const levels = [
    { label: '',          color: 'transparent' },
    { label: 'Weak',      color: '#F43F5E' },
    { label: 'Fair',      color: '#F59E0B' },
    { label: 'Good',      color: '#0EA5E9' },
    { label: 'Strong',    color: '#10B981' },
    { label: 'Very Strong', color: '#059669' },
  ];
  return { score, ...levels[score] };
}

function RegisterPage() {
  const navigate = useNavigate();

  // ── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name:     '',
    email:    '',
    phone:    '',
    password: '',
    // confirm:  '',
  });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);

  // ── Field errors ─────────────────────────────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState({});

  const strength = getPasswordStrength(form.password);

  // ── Update single field ──────────────────────────────────────────────────
  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
    setError('');
  };

  // ── Validate ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = 'Full name is required.';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    if (!form.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number.';
    }

    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    // if (!form.confirm) {
    //   errors.confirm = 'Please confirm your password.';
    // } else if (form.password !== form.confirm) {
    //   errors.confirm = 'Passwords do not match.';
    // }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await authApi.register({
        name:     form.name.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim() || undefined,
        password: form.password,
      });

      setSuccess(true);
      // Redirect to login after 2.5 seconds
      setTimeout(() => navigate('/login'), 2500);

    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;

        if (status === 422) {
          // Validation error from backend
          if (Array.isArray(detail)) {
            const msg = detail.map(d => d.msg).join(', ');
            setError(`Validation error: ${msg}`);
          } else {
            setError('Please check the information you entered.');
          }
        } else if (status === 409 || (typeof detail === 'string' && detail.toLowerCase().includes('exist'))) {
          setFieldErrors(prev => ({ ...prev, email: 'This email is already registered.' }));
        } else if (status >= 500) {
          setError('Server error. Please try again in a moment.');
        } else {
          setError(typeof detail === 'string' ? detail : 'Registration failed. Please try again.');
        }
      } else if (!err.response) {
        setError('Cannot connect to server. Make sure the backend is running.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          bgcolor: '#0F172A', p: 2,
        }}
      >
        <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 3, textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: '50%',
                bgcolor: '#D1FAE5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}
            >
              <CheckCircleOutlined sx={{ color: '#10B981', fontSize: 36 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Account Created!
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Your student account has been created successfully.
              Redirecting you to the login page…
            </Typography>
            <LinearProgress sx={{ borderRadius: 2 }} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0F172A',
        backgroundImage: `
          radial-gradient(ellipse at 20% 50%, rgba(79,70,229,0.15) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.1)  0%, transparent 60%)
        `,
        p: 2,
        py: 4,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 460 }}>

        {/* ── Brand ────────────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 52, height: 52, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mb: 1.5, boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
            }}
          >
            <HomeWorkOutlined sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>HMIS</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8125rem', mt: 0.25 }}>
            Hostel Maintenance Intelligence System
          </Typography>
        </Box>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 25px 50px rgba(0,0,0,0.35)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Create Account
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Register as a student to submit maintenance complaints
            </Typography>

            {/* Error */}
            {error && (
              <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2.5, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>

              {/* Full Name */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
                  Full Name <span style={{ color: '#F43F5E' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  placeholder="e.g. Arjun Kumar"
                  value={form.name}
                  onChange={handleChange('name')}
                  error={!!fieldErrors.name}
                  helperText={fieldErrors.name}
                  disabled={loading}
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Email */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
                  Email Address <span style={{ color: '#F43F5E' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange('email')}
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Phone (optional) */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
                  Mobile Number{' '}
                  <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span>
                </Typography>
                <TextField
                  fullWidth
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  error={!!fieldErrors.phone}
                  helperText={fieldErrors.phone || 'Used for urgent complaint notifications only'}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Password */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
                  Password <span style={{ color: '#F43F5E' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  type={showPass ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange('password')}
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPass(p => !p)}
                          edge="end" size="small" tabIndex={-1}
                        >
                          {showPass
                            ? <VisibilityOffOutlined sx={{ fontSize: 18 }} />
                            : <VisibilityOutlined   sx={{ fontSize: 18 }} />
                          }
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {/* Password strength bar */}
                {form.password && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                      {[1,2,3,4,5].map(i => (
                        <Box
                          key={i}
                          sx={{
                            flex: 1, height: 3, borderRadius: 2,
                            bgcolor: i <= strength.score ? strength.color : '#E2E8F0',
                            transition: 'background-color 0.2s',
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="caption" sx={{ color: strength.color, fontWeight: 600 }}>
                      {strength.label}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Confirm password */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
                  Confirm Password <span style={{ color: '#F43F5E' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirm}
                  onChange={handleChange('confirm')}
                  error={!!fieldErrors.confirm}
                  helperText={fieldErrors.confirm}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirm(p => !p)}
                          edge="end" size="small" tabIndex={-1}
                        >
                          {showConfirm
                            ? <VisibilityOffOutlined sx={{ fontSize: 18 }} />
                            : <VisibilityOutlined   sx={{ fontSize: 18 }} />
                          }
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Submit */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.5, fontSize: '0.9375rem', borderRadius: 2, mb: 2.5 }}
              >
                {loading
                  ? <CircularProgress size={22} color="inherit" />
                  : 'Create Account'
                }
              </Button>

              <Divider sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', px: 1 }}>
                  Already have an account?
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                component={RouterLink}
                to="/login"
                disabled={loading}
                sx={{ py: 1.25, borderRadius: 2 }}
              >
                Sign In Instead
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', display: 'block', mt: 3 }}
        >
          Staff, Warden & Admin accounts are managed by the administrator.
        </Typography>
      </Box>
    </Box>
  );
}

export default RegisterPage;