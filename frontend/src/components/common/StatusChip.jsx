import React from 'react';
import { Chip } from '@mui/material';
import {
  RadioButtonUnchecked,
  BuildOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  VerifiedOutlined,
  ReplayOutlined,
  CancelOutlined,
} from '@mui/icons-material';

// ─── Status configuration ─────────────────────────────────────────────────────
// Maps each status string → { label, color scheme, icon }
const STATUS_CONFIG = {
  OPEN: {
    label: 'Open',
    bgcolor: '#EFF6FF',
    color:   '#1D4ED8',
    icon:    <RadioButtonUnchecked sx={{ fontSize: '12px !important' }} />,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bgcolor: '#F0F9FF',
    color:   '#0369A1',
    icon:    <BuildOutlined sx={{ fontSize: '12px !important' }} />,
  },
  ON_HOLD: {
    label: 'On Hold',
    bgcolor: '#FFFBEB',
    color:   '#92400E',
    icon:    <PauseCircleOutlined sx={{ fontSize: '12px !important' }} />,
  },
  RESOLVED: {
    label: 'Resolved',
    bgcolor: '#F0FDF4',
    color:   '#166534',
    icon:    <CheckCircleOutlined sx={{ fontSize: '12px !important' }} />,
  },
  VERIFIED: {
    label: 'Verified',
    bgcolor: '#F0FDF4',
    color:   '#065F46',
    icon:    <VerifiedOutlined sx={{ fontSize: '12px !important' }} />,
  },
  CLOSED: {
    label: 'Closed',
    bgcolor: '#F8FAFC',
    color:   '#475569',
    icon:    <VerifiedOutlined sx={{ fontSize: '12px !important' }} />,
  },
  REOPENED: {
    label: 'Reopened',
    bgcolor: '#FFF1F2',
    color:   '#9F1239',
    icon:    <ReplayOutlined sx={{ fontSize: '12px !important' }} />,
  },
  CANCELLED: {
    label: 'Cancelled',
    bgcolor: '#F8FAFC',
    color:   '#64748B',
    icon:    <CancelOutlined sx={{ fontSize: '12px !important' }} />,
  },
};

/**
 * StatusChip
 * Consistently styled complaint status badge.
 *
 * Props:
 *   status (string) — One of the STATUS_CONFIG keys above
 *   size   ('small'|'medium') — Chip size
 */
function StatusChip({ status, size = 'small' }) {
  const config = STATUS_CONFIG[status] || {
    label:   status || 'Unknown',
    bgcolor: '#F1F5F9',
    color:   '#475569',
    icon:    null,
  };

  return (
    <Chip
      size={size}
      label={config.label}
      icon={config.icon}
      sx={{
        bgcolor:    config.bgcolor,
        color:      config.color,
        fontWeight: 600,
        fontSize:   size === 'small' ? '0.6875rem' : '0.75rem',
        border:     `1px solid ${config.color}22`,
        '& .MuiChip-icon': { color: config.color, ml: '6px' },
        '& .MuiChip-label': { pl: config.icon ? '4px' : undefined },
      }}
    />
  );
}

export default StatusChip;