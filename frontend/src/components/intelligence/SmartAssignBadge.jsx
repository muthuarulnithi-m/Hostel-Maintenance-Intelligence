import React from 'react';
import {
  Box, Paper, Typography, Chip, Divider,
} from '@mui/material';
import {
  AutoAwesomeOutlined,
  PersonOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';
import { CATEGORY_CONFIG } from '../../utils/formatters';

const AVAIL_CONFIG = {
  AVAILABLE: { label: 'Available', color: '#10B981', bg: '#D1FAE5' },
  BUSY:      { label: 'Busy',      color: '#F59E0B', bg: '#FEF3C7' },
  ON_LEAVE:  { label: 'On Leave',  color: '#94A3B8', bg: '#F1F5F9' },
  INACTIVE:  { label: 'Inactive',  color: '#EF4444', bg: '#FEE2E2' },
};

/**
 * SmartAssignBadge
 * Shown on the warden complaint detail page.
 * Suggests which staff to assign based on category-skill match.
 *
 * Props:
 *   category       (string)  — complaint category
 *   suggestedStaff (array)   — from getSuggestedStaff()
 *   onSelectStaff  (fn)      — called with staffId when warden clicks a suggestion
 */
function SmartAssignBadge({ category, suggestedStaff = [], onSelectStaff }) {
  if (!category || suggestedStaff.length === 0) return null;

  const catConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.GENERAL;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2, borderRadius: 2, mb: 2,
        borderColor: '#C7D2FE',
        bgcolor:     '#EEF2FF',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <AutoAwesomeOutlined sx={{ fontSize: 16, color: '#4F46E5' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#3730A3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Smart Assignment
        </Typography>
        <Chip
          label={catConfig.label}
          size="small"
          sx={{ height: 18, fontSize: '0.6rem', bgcolor: catConfig.bg, color: catConfig.color, fontWeight: 600, ml: 'auto' }}
        />
      </Box>

      <Typography variant="caption" sx={{ color: '#3730A3', display: 'block', mb: 1.5 }}>
        Staff with matching skills for <strong>{catConfig.label}</strong> complaints:
      </Typography>

      {suggestedStaff.slice(0, 3).map((staff, i) => {
        const avail = AVAIL_CONFIG[staff.availability_status] || AVAIL_CONFIG.INACTIVE;
        return (
          <Box key={staff.id}>
            {i > 0 && <Divider sx={{ my: 1, borderColor: '#C7D2FE' }} />}
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                cursor: 'pointer', p: 1, borderRadius: 1.5,
                '&:hover': { bgcolor: 'rgba(79,70,229,0.08)' },
                transition: 'background 0.15s',
              }}
              onClick={() => onSelectStaff(staff.id)}
            >
              <Box
                sx={{
                  width: 32, height: 32, borderRadius: '50%',
                  bgcolor: '#fff', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #C7D2FE',
                }}
              >
                <PersonOutlined sx={{ fontSize: 16, color: '#4F46E5' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#1E293B' }}>
                    Staff #{staff.id}
                  </Typography>
                  {staff.skillMatch && (
                    <CheckCircleOutlined sx={{ fontSize: 12, color: '#10B981' }} />
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: '#475569' }}>
                  {staff.employee_code}
                </Typography>
              </Box>
              <Chip
                label={avail.label}
                size="small"
                sx={{ height: 18, fontSize: '0.6rem', bgcolor: avail.bg, color: avail.color, fontWeight: 600 }}
              />
            </Box>
          </Box>
        );
      })}

      <Typography variant="caption" sx={{ color: '#6366F1', display: 'block', mt: 1.5 }}>
        Click a staff member to pre-select them in the assignment dialog.
      </Typography>
    </Paper>
  );
}

export default SmartAssignBadge;