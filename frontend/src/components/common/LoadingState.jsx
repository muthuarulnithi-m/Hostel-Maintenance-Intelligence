import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * LoadingState
 * Centered loading spinner for pages/sections.
 *
 * Props:
 *   message (string) — Optional loading message
 *   size    (number) — Spinner size (default 40)
 *   minHeight (string) — Container min-height (default '300px')
 */
function LoadingState({ message, size = 40, minHeight = '300px' }) {
  return (
    <Box
      sx={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        minHeight,
        gap: 2,
      }}
    >
      <CircularProgress size={size} thickness={4} />
      {message && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}

export default LoadingState;