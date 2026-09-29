import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { BugReportOutlined, RefreshOutlined } from '@mui/icons-material';

/**
 * ErrorBoundary
 * React class component — required because error boundaries must be class components.
 * Wrap the entire app in this to catch unexpected render errors gracefully.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, you would send this to an error tracking service
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

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
            maxWidth: 480,
            width: '100%',
            p: 4,
            textAlign: 'center',
            border: '1px solid #E2E8F0',
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              width: 64, height: 64, borderRadius: '50%',
              bgcolor: '#FFF1F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2.5,
            }}
          >
            <BugReportOutlined sx={{ color: '#F43F5E', fontSize: 32 }} />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            An unexpected error occurred in the application.
            Please refresh the page or go back to the dashboard.
          </Typography>

          {/* Show error in development only */}
          {import.meta.env.DEV && this.state.error && (
            <Box
              sx={{
                bgcolor: '#FFF1F2',
                border: '1px solid #FCA5A5',
                borderRadius: 2,
                p: 2, mb: 3,
                textAlign: 'left',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  color: '#9F1239',
                  display: 'block',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            startIcon={<RefreshOutlined />}
            onClick={this.handleReset}
            size="large"
            fullWidth
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }
}

export default ErrorBoundary;