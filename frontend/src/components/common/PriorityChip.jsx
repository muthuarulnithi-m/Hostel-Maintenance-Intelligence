import React from 'react';
import { Chip } from '@mui/material';
import {
  KeyboardArrowDown,
  Remove,
  KeyboardArrowUp,
  PriorityHighRounded,
} from '@mui/icons-material';

// ─── Priority configuration ───────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  LOW: {
    label:   'Low',
    bgcolor: '#F8FAFC',
    color:   '#64748B',
    icon:    <KeyboardArrowDown sx={{ fontSize: '14px !important' }} />,
  },
  MEDIUM: {
    label:   'Medium',
    bgcolor: '#FFFBEB',
    color:   '#92400E',
    icon:    <Remove sx={{ fontSize: '14px !important' }} />,
  },
  HIGH: {
    label:   'High',
    bgcolor: '#FFF7ED',
    color:   '#C2410C',
    icon:    <KeyboardArrowUp sx={{ fontSize: '14px !important' }} />,
  },
  URGENT: {
    label:   'Urgent',
    bgcolor: '#FFF1F2',
    color:   '#9F1239',
    icon:    <PriorityHighRounded sx={{ fontSize: '14px !important' }} />,
  },
};

/**
 * PriorityChip
 * Consistently styled complaint priority badge.
 *
 * Props:
 *   priority (string) — LOW | MEDIUM | HIGH | URGENT
 *   size     ('small'|'medium')
 */
function PriorityChip({ priority, size = 'small' }) {
  const config = PRIORITY_CONFIG[priority] || {
    label:   priority || 'Unknown',
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

export default PriorityChip;
