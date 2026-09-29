import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import {
  SearchOffOutlined,
  HomeOutlined,
  ArrowBackOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();

  const homeRoute = isAuthenticated && userRole
    ? `/${userRole}/dashboard`
    : '/login';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F8FAFC',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 480, width: '100%',
          p: { xs: 3, sm: 5 },
          textAlign: 'center',
          border: '1px solid #E2E8F0',
          borderRadius: 3,
        }}
      >
        {/* 404 number */}
        <Typography
          sx={{
            fontSize: '6rem',
            fontWeight: 800,
            lineHeight: 1,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          404
        </Typography>

        <Box
          sx={{
            width: 56, height: 56, borderRadius: '50%',
            bgcolor: '#EEF2FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
          }}
        >
          <SearchOffOutlined sx={{ color: '#4F46E5', fontSize: 28 }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Page Not Found
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3.5 }}>
          The page you're looking for doesn't exist or may have been moved.
          Check the URL or go back to the dashboard.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackOutlined />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            startIcon={<HomeOutlined />}
            onClick={() => navigate(homeRoute)}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default NotFoundPage;