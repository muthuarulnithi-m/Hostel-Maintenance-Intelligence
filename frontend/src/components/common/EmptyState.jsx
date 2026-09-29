import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

/**
 * EmptyState
 * Shown when a list/table has no data.
 *
 * Props:
 *   icon       (node)   — Optional custom icon
 *   title      (string) — Main message
 *   description(string) — Optional helper text
 *   action     (node)   — Optional button
 */
function EmptyState({
  icon,
  title = 'Nothing here yet',
  description,
  action,
}) {
  return (
    <Box
      sx={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 72, height: 72, borderRadius: '50%',
          bgcolor: 'action.hover',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mb: 2,
          color: 'text.disabled',
        }}
      >
        {icon || <InboxOutlined sx={{ fontSize: 36 }} />}
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360, mb: 2.5 }}>
          {description}
        </Typography>
      )}

      {action && action}
    </Box>
  );
}

export default EmptyState;