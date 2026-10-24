import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, InputAdornment, IconButton, Alert,
  CircularProgress, Divider,
} from '@mui/material';
import {
  HomeWorkOutlined,
  EmailOutlined,
  LockOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  ArrowForwardOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const ROLE_HOME = {
  student: '/student/dashboard',
  staff:   '/staff/dashboard',
  warden:  '/warden/dashboard',
  admin:   '/admin/dashboard',
};

// ── Role hint pills shown below the form ─────────────────────────────────────
const ROLE_PILLS = [
  { label: 'Student',  color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  { label: 'Staff',    color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  { label: 'Warden',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  { label: 'Admin',    color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
];

function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, isAuthenticated, userRole } = useAuth();

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated && userRole) {
      navigate(ROLE_HOME[userRole] || '/', { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [emailError, setEmailError] = useState('');
  const [passError,  setPassError]  = useState('');

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
    }
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const userData = await login(email.trim(), password);
      const role     = userData.role.toLowerCase();
      const intended = location.state?.from?.pathname;
      const home     = ROLE_HOME[role] || '/';
      const dest     = intended && intended.startsWith(`/${role}`) ? intended : home;
      navigate(dest, { replace: true });
    } catch (err) {
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0F172A',
        backgroundImage: `
          radial-gradient(ellipse at 20% 50%, rgba(79,70,229,0.18) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.13) 0%, transparent 55%),
          radial-gradient(ellipse at 60% 80%, rgba(16,185,129,0.06) 0%, transparent 50%)
        `,
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>

        {/* ── Brand ───────────────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
          {/* Logo with glow ring */}
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Box
              sx={{
                position: 'absolute', inset: -6,
                borderRadius: 3.5,
                background: 'linear-gradient(135deg, rgba(79,70,229,0.4), rgba(124,58,237,0.3))',
                filter: 'blur(10px)',
              }}
            />
            <Box
              sx={{
                position: 'relative',
                width: 56, height: 56, borderRadius: 3,
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(79,70,229,0.45)',
              }}
            >
              <HomeWorkOutlined sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
          </Box>

          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.375rem', letterSpacing: '-0.01em' }}>
            HMIS
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', mt: 0.25 }}>
            Hostel Maintenance Intelligence System
          </Typography>
        </Box>

        {/* ── Login card ──────────────────────────────────────────────────── */}
        <Card
          sx={{
            borderRadius: 3,
            background: 'rgba(255,255,255,0.97)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
            overflow: 'visible',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 3.5 } }}>

            {/* Header */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.4, color: '#0F172A' }}>
                Welcome back
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Sign in to manage hostel maintenance
              </Typography>
            </Box>

            {/* Error */}
            {error && (
              <Alert
                severity="error"
                onClose={() => setError('')}
                sx={{ mb: 2.5, borderRadius: 1.5, fontSize: '0.8125rem' }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  component="label"
                  htmlFor="login-email"
                  variant="caption"
                  sx={{ fontWeight: 600, color: '#374151', mb: 0.75, display: 'block', fontSize: '0.8125rem' }}
                >
                  Email Address
                </Typography>
                <TextField
                  id="login-email"
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
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      bgcolor: '#F8FAFC',
                      '&:hover fieldset': { borderColor: '#818cf8' },
                      '&.Mui-focused fieldset': { borderColor: '#4F46E5', borderWidth: 2 },
                    },
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined sx={{ fontSize: 17, color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              {/* Password */}
              <Box sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                  <Typography
                    component="label"
                    htmlFor="login-password"
                    variant="caption"
                    sx={{ fontWeight: 600, color: '#374151', fontSize: '0.8125rem' }}
                  >
                    Password
                  </Typography>
                </Box>
                <TextField
                  id="login-password"
                  fullWidth
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPassError(''); }}
                  error={!!passError}
                  helperText={passError}
                  disabled={loading}
                  autoComplete="current-password"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      bgcolor: '#F8FAFC',
                      '&:hover fieldset': { borderColor: '#818cf8' },
                      '&.Mui-focused fieldset': { borderColor: '#4F46E5', borderWidth: 2 },
                    },
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined sx={{ fontSize: 17, color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPass(p => !p)}
                            edge="end"
                            size="small"
                            aria-label={showPass ? 'Hide password' : 'Show password'}
                            aria-pressed={showPass}
                            sx={{ color: '#94A3B8', '&:hover': { color: '#4F46E5' } }}
                          >
                            {showPass
                              ? <VisibilityOffOutlined sx={{ fontSize: 17 }} />
                              : <VisibilityOutlined   sx={{ fontSize: 17 }} />
                            }
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
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
                endIcon={!loading && <ArrowForwardOutlined sx={{ fontSize: 18 }} />}
                sx={{
                  py: 1.375,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  borderRadius: 1.75,
                  background: 'linear-gradient(135deg, #4F46E5, #6D28D9)',
                  boxShadow: '0 4px 14px rgba(79,70,229,0.4)',
                  letterSpacing: '0.01em',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4338CA, #5B21B6)',
                    boxShadow: '0 6px 20px rgba(79,70,229,0.5)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': { transform: 'translateY(0)' },
                  transition: 'all 0.2s ease',
                  '&.Mui-disabled': {
                    background: 'linear-gradient(135deg, #4F46E5, #6D28D9)',
                    opacity: 0.7,
                  },
                }}
              >
                {loading
                  ? <CircularProgress size={20} sx={{ color: 'rgba(255,255,255,0.8)' }} />
                  : 'Sign In'
                }
              </Button>
            </Box>

            {/* Divider + role pills */}
            <Divider sx={{ my: 2.5, borderColor: '#E2E8F0' }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', px: 1, fontSize: '0.75rem' }}>
                Available for
              </Typography>
            </Divider>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              {ROLE_PILLS.map(r => (
                <Box
                  key={r.label}
                  sx={{
                    px: 1.25, py: 0.4,
                    borderRadius: 10,
                    bgcolor: r.bg,
                    border: `1px solid ${r.color}30`,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: r.color,
                    letterSpacing: '0.02em',
                  }}
                >
                  {r.label}
                </Box>
              ))}
            </Box>

          </CardContent>
        </Card>

        {/* Footer */}
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.18)', textAlign: 'center', display: 'block', mt: 3, lineHeight: 1.6 }}
        >
          Account access is managed by the administrator.
          <br />Contact your hostel admin if you need access.
        </Typography>
      </Box>
    </Box>
  );
}

export default LoginPage;
