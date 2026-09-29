import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, InputAdornment, IconButton, Alert,
  Divider, CircularProgress,
} from '@mui/material';
import {
  HomeWorkOutlined,
  EmailOutlined,
  LockOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// ─── Role → home route map ────────────────────────────────────────────────────
const ROLE_HOME = {
  student: '/student/dashboard',
  staff:   '/staff/dashboard',
  warden:  '/warden/dashboard',
  admin:   '/admin/dashboard',
};

function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, isAuthenticated, userRole } = useAuth();

  // ── Redirect if already logged in ───────────────────────────────────────
  React.useEffect(() => {
    if (isAuthenticated && userRole) {
      navigate(ROLE_HOME[userRole] || '/', { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  // ── Form state ───────────────────────────────────────────────────────────
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  // ── Field-level validation errors ────────────────────────────────────────
  const [emailError,  setEmailError]  = useState('');
  const [passError,   setPassError]   = useState('');

  // ── Validate form before submit ──────────────────────────────────────────
  const validate = () => {
    let valid = true;
    setEmailError('');
    setPassError('');

    if (!email.trim()) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPassError('Password is required.');
      valid = false;
    } else if (password.length < 8) {
      setPassError('Password must be at least 8 characters.');
      valid = false;
    }

    return valid;
  };

  // ── Submit handler ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const userData = await login(email.trim(), password);

      // Redirect to the page they were trying to access, or role home
      const role     = userData.role.toLowerCase();
      const intended = location.state?.from?.pathname;
      const home     = ROLE_HOME[role] || '/';

      // Only use intended path if it belongs to this role
      const destination =
        intended && intended.startsWith(`/${role}`) ? intended : home;

      navigate(destination, { replace: true });

    } catch (err) {
      // Handle specific backend errors gracefully
      if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          setError('Incorrect email or password. Please try again.');
        } else if (status === 422) {
          setError('Please check your email and password format.');
        } else if (status >= 500) {
          setError('Server error. Please try again in a moment.');
        } else {
          setError('Login failed. Please try again.');
        }
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to server. Make sure the backend is running.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        bgcolor:        '#0F172A',
        backgroundImage: `
          radial-gradient(ellipse at 20% 50%, rgba(79,70,229,0.15) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.1)  0%, transparent 60%)
        `,
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>

        {/* ── Brand header above card ──────────────────────────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 52, height: 52, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mb: 1.5,
              boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
            }}
          >
            <HomeWorkOutlined sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>
            HMIS
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8125rem', mt: 0.25 }}>
            Hostel Maintenance Intelligence System
          </Typography>
        </Box>

        {/* ── Login card ───────────────────────────────────────────────── */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 25px 50px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Sign in to your account to continue
            </Typography>

            {/* ── Error alert ─────────────────────────────────────────── */}
            {error && (
              <Alert
                severity="error"
                onClose={() => setError('')}
                sx={{ mb: 2.5, borderRadius: 2 }}
              >
                {error}
              </Alert>
            )}

            {/* ── Login form ──────────────────────────────────────────── */}
            <Box component="form" onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}
                >
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  error={!!emailError}
                  helperText={emailError}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Password */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}
                >
                  Password
                </Typography>
                <TextField
                  fullWidth
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPassError(''); }}
                  error={!!passError}
                  helperText={passError}
                  disabled={loading}
                  autoComplete="current-password"
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
                          edge="end"
                          size="small"
                          tabIndex={-1}
                          aria-label={showPass ? 'Hide password' : 'Show password'}
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
              </Box>

              {/* Submit button */}
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
                  : 'Sign In'
                }
              </Button>

              <Divider sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', px: 1 }}>
                  New to HMIS?
                </Typography>
              </Divider>

              {/* Register link */}
              <Button
                fullWidth
                variant="outlined"
                component={RouterLink}
                to="/register"
                disabled={loading}
                sx={{ py: 1.25, borderRadius: 2 }}
              >
                Create Student Account
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* ── Footer note ──────────────────────────────────────────────── */}
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

export default LoginPage;