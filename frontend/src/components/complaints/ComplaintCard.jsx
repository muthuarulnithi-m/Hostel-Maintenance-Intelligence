import React from 'react';
import {
  Box, Card, CardActionArea, CardContent,
  Typography, Chip, Divider,
} from '@mui/material';
import {
  AccessTimeOutlined,
  RoomOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StatusChip   from '../common/StatusChip';
import PriorityChip from '../common/PriorityChip';
import {
  formatRelative,
  getCategoryLabel,
  CATEGORY_CONFIG,
} from '../../utils/formatters';

/**
 * ComplaintCard
 * Used in complaint lists — clicking navigates to the detail page.
 *
 * Props:
 *   complaint (object) — complaint from the API
 *   basePath  (string) — e.g. '/student' — used to build the detail URL
 */
function ComplaintCard({ complaint, basePath = '/student' }) {
  const navigate = useNavigate();
  const catConfig = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.GENERAL;

  return (
    <Card
      sx={{
        mb: 1.5,
        transition: 'all 0.2s ease',
        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)', transform: 'translateY(-1px)' },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`${basePath}/complaints/${complaint.id}`)}
        sx={{ borderRadius: 'inherit' }}
      >
        <CardContent sx={{ p: '16px 20px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>

            {/* Category badge */}
            <Box
              sx={{
                width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                bgcolor: catConfig.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Typography sx={{ fontSize: '1.1rem' }}>
                {getCategoryEmoji(complaint.category)}
              </Typography>
            </Box>

            {/* Main content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600, color: 'text.primary',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: { xs: 160, sm: 300 },
                  }}
                >
                  {complaint.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', fontFamily: 'monospace', flexShrink: 0 }}
                >
                  #{complaint.id}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary', mb: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {complaint.description}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={getCategoryLabel(complaint.category)}
                  size="small"
                  sx={{
                    bgcolor: catConfig.bg, color: catConfig.color,
                    fontWeight: 600, fontSize: '0.6875rem', height: 22,
                    border: `1px solid ${catConfig.color}33`,
                  }}
                />
                <PriorityChip priority={complaint.priority} />
                <StatusChip   status={complaint.status} />
              </Box>
            </Box>

            {/* Right side: time */}
            <Box sx={{ flexShrink: 0, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                <AccessTimeOutlined sx={{ fontSize: 13 }} />
                <Typography variant="caption">
                  {formatRelative(complaint.created_at)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// Category emoji helper
function getCategoryEmoji(category) {
  const map = {
    GENERAL:    '📋',
    ELECTRICAL: '⚡',
    PLUMBING:   '🔧',
    CIVIL:  '🪚',
    CLEANING:   '🧹',
    NETWORK:   '🌐',
    OTHER:      '📌',
  };
  return map[category] || '📋';
}

export default ComplaintCard;