import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, CircularProgress, Box,
} from '@mui/material';
import { WarningAmberOutlined } from '@mui/icons-material';

/**
 * ConfirmDialog
 * Reusable confirmation dialog.
 *
 * Props:
 *   open        (bool)
 *   onClose     (fn)
 *   onConfirm   (fn)
 *   title       (string)
 *   message     (string|node)
 *   confirmText (string)  default: 'Confirm'
 *   cancelText  (string)  default: 'Cancel'
 *   severity    ('warning'|'error'|'info')
 *   loading     (bool)
 */
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  severity    = 'warning',
  loading     = false,
}) {
  const colors = {
    warning: '#F59E0B',
    error:   '#F43F5E',
    info:    '#4F46E5',
  };
  const color = colors[severity] || colors.warning;

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: '50%',
              bgcolor: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <WarningAmberOutlined sx={{ color, fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {typeof message === 'string' ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {message}
          </Typography>
        ) : message}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">
          {cancelText}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{
            bgcolor: color,
            '&:hover': { bgcolor: color, filter: 'brightness(0.9)' },
          }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Please wait…' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;