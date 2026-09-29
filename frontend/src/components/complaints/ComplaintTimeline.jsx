import React from 'react';
import {
  Box, Typography, Stepper, Step,
  StepLabel, StepContent, Paper,
} from '@mui/material';
import {
  SendOutlined,
  AssignmentIndOutlined,
  BuildOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  VerifiedOutlined,
  CancelOutlined,
} from '@mui/icons-material';
import { formatDateTime } from '../../utils/formatters';
import { STATUS_CONFIG } from '../../utils/formatters';

// ─── Icon per timeline event key ─────────────────────────────────────────────
const EVENT_ICONS = {
  created:   <SendOutlined sx={{ fontSize: 16 }} />,
  assigned:  <AssignmentIndOutlined sx={{ fontSize: 16 }} />,
  started:   <BuildOutlined sx={{ fontSize: 16 }} />,
  held:      <PauseCircleOutlined sx={{ fontSize: 16 }} />,
  resolved:  <CheckCircleOutlined sx={{ fontSize: 16 }} />,
  closed:    <VerifiedOutlined sx={{ fontSize: 16 }} />,
  cancelled: <CancelOutlined sx={{ fontSize: 16 }} />,
};

/**
 * ComplaintTimeline
 * Renders the complaint lifecycle as a vertical stepper.
 *
 * Props:
 *   events (array) — from buildTimeline() in formatters.js
 *   currentStatus (string) — the complaint's current status
 */
function ComplaintTimeline({ events = [], currentStatus }) {
  if (events.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
        No timeline events available.
      </Typography>
    );
  }

  // The active step is the last event index
  const activeStep = events.length - 1;

  return (
    <Stepper orientation="vertical" activeStep={activeStep} nonLinear>
      {events.map((event, index) => {
        const statusConfig = STATUS_CONFIG[event.status] || {};
        const isLast       = index === events.length - 1;
        const isCancelled  = event.status === 'CANCELLED';

        return (
          <Step key={event.key} completed={!isLast}>
            <StepLabel
              StepIconComponent={() => (
                <Box
                  sx={{
                    width:   32,
                    height:  32,
                    borderRadius: '50%',
                    bgcolor: isLast
                      ? (isCancelled ? '#F1F5F9' : statusConfig.bg || '#EEF2FF')
                      : '#F0FDF4',
                    border:  `2px solid ${isLast
                      ? (isCancelled ? '#94A3B8' : statusConfig.color || '#4F46E5')
                      : '#10B981'
                    }`,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    color: isLast
                      ? (isCancelled ? '#64748B' : statusConfig.color || '#4F46E5')
                      : '#10B981',
                    flexShrink: 0,
                  }}
                >
                  {EVENT_ICONS[event.key] || <BuildOutlined sx={{ fontSize: 16 }} />}
                </Box>
              )}
            >
              <Box sx={{ ml: 0.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: isLast ? 700 : 600,
                    color: isLast
                      ? (isCancelled ? 'text.secondary' : statusConfig.color || 'text.primary')
                      : 'text.primary',
                  }}
                >
                  {event.label}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {formatDateTime(event.timestamp)}
                </Typography>
              </Box>
            </StepLabel>

            <StepContent>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 2,
                  bgcolor: isLast ? (statusConfig.bg || '#F8FAFC') : '#F8FAFC',
                  borderColor: isLast ? (statusConfig.color + '33' || '#E2E8F0') : '#E2E8F0',
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {event.description}
                </Typography>
              </Paper>
            </StepContent>
          </Step>
        );
      })}
    </Stepper>
  );
}

export default ComplaintTimeline;