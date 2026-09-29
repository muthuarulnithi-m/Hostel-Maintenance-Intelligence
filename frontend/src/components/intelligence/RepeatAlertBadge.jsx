import React from 'react';
import { Box, Paper, Typography, Chip, LinearProgress } from '@mui/material';
import { RepeatOutlined, WarningAmberOutlined } from '@mui/icons-material';

/**
 * RepeatAlertBadge
 * Shown when a complaint's room+category has repeated alerts.
 *
 * Props:
 *   alert  — ComplaintAlert object { repeat_count, message, category, room_id }
 *   compact (bool) — smaller version for lists
 */
function RepeatAlertBadge({ alert, compact = false }) {
  if (!alert) return null;

  const isHighRepeat = alert.repeat_count >= 3;
  const color        = isHighRepeat ? '#F43F5E' : '#F59E0B';
  const bg           = isHighRepeat ? '#FFF1F2' : '#FFFBEB';
  const borderColor  = isHighRepeat ? '#FCA5A5' : '#FDE68A';

  if (compact) {
    return (
      <Chip
        icon={<RepeatOutlined sx={{ fontSize: '14px !important' }} />}
        label={`Repeated ${alert.repeat_count}x`}
        size="small"
        sx={{
          bgcolor: bg, color, fontWeight: 700,
          fontSize: '0.6875rem', height: 22,
          border: `1px solid ${borderColor}`,
          '& .MuiChip-icon': { color },
        }}
      />
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2, borderRadius: 2, mb: 2,
        borderColor, bgcolor: bg,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <WarningAmberOutlined sx={{ fontSize: 16, color }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Repeat Complaint Detected
        </Typography>
        <Chip
          label={`${alert.repeat_count}x`}
          size="small"
          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: color, color: '#fff', ml: 'auto' }}
        />
      </Box>

      <Typography variant="caption" sx={{ color, display: 'block', mb: 1.5, lineHeight: 1.5 }}>
        {alert.message || `This ${alert.category} issue in Room #${alert.room_id} has been reported ${alert.repeat_count} times.`}
      </Typography>

      {/* Severity bar */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color, fontWeight: 500 }}>
            Recurrence severity
          </Typography>
          <Typography variant="caption" sx={{ color, fontWeight: 700 }}>
            {alert.repeat_count >= 5 ? 'Critical' : alert.repeat_count >= 3 ? 'High' : 'Medium'}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min((alert.repeat_count / 5) * 100, 100)}
          sx={{
            height: 5, borderRadius: 3,
            bgcolor: `${color}22`,
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
          }}
        />
        <Typography variant="caption" sx={{ color: `${color}99`, display: 'block', mt: 0.5 }}>
          {isHighRepeat
            ? 'This is a recurring problem. Escalation may be required.'
            : 'This issue has been reported multiple times recently.'
          }
        </Typography>
      </Box>
    </Paper>
  );
}

export default RepeatAlertBadge;