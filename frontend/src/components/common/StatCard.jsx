import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

/**
 * StatCard
 * KPI metric card for dashboards.
 *
 * Props:
 *   title    (string)  — Metric name
 *   value    (string|number) — Metric value
 *   icon     (node)   — MUI icon component
 *   color    (string) — Hex or theme color (e.g. '#4F46E5')
 *   trend    (number) — Optional: positive/negative % change
 *   subtitle (string) — Optional: small text below the value
 *   loading  (bool)   — Show skeleton if true
 */
function StatCard({ title, value, icon, color = '#4F46E5', trend, subtitle, loading }) {
  const isPositiveTrend = trend > 0;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="rectangular" height={80} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        },
      }}
    >
      {/* Subtle color accent in top-right corner */}
      <Box
        sx={{
          position: 'absolute',
          top: -20, right: -20,
          width: 100, height: 100,
          borderRadius: '50%',
          bgcolor: alpha(color, 0.08),
        }}
      />

      <CardContent sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Value and title */}
          <Box>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', letterSpacing: '0.08em', fontSize: '0.6875rem' }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5, lineHeight: 1.1 }}
            >
              {value ?? '—'}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && trend !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
                {isPositiveTrend
                  ? <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} />
                  : <TrendingDown sx={{ fontSize: 14, color: 'error.main' }} />
                }
                <Typography
                  variant="caption"
                  sx={{ color: isPositiveTrend ? 'success.main' : 'error.main', fontWeight: 600 }}
                >
                  {Math.abs(trend)}% from last month
                </Typography>
              </Box>
            )}
          </Box>

          {/* Icon */}
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2.5,
              bgcolor: alpha(color, 0.12),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Box sx={{ color, '& svg': { fontSize: 24 } }}>
              {icon}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default StatCard;