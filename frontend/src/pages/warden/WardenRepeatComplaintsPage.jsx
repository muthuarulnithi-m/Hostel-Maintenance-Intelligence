import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button,
  Alert, Skeleton, Divider, Chip,
} from '@mui/material';
import {
  RepeatOutlined,
  WarningAmberOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';
import PageHeader        from '../../components/common/PageHeader';
import EmptyState        from '../../components/common/EmptyState';
import RepeatAlertBadge from '../../components/intelligence/RepeatAlertBadge';
import complaintApi      from '../../api/complaintApi';
import { formatRelative, CATEGORY_CONFIG, getCategoryLabel } from '../../utils/formatters';

function WardenRepeatComplaintsPage() {
  const navigate = useNavigate();

  const [alerts,   setAlerts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complaintApi.getAlerts();
      // Sort: unacknowledged first, then by repeat_count descending
      const sorted = [...data].sort((a, b) => {
        if (a.is_acknowledged !== b.is_acknowledged) return a.is_acknowledged ? 1 : -1;
        return b.repeat_count - a.repeat_count;
      });
      setAlerts(sorted);
    } catch {
      setError('Unable to load repeat complaint alerts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleAcknowledge = async (alertId) => {
    try {
      await complaintApi.acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, is_acknowledged: true } : a
      ));
    } catch {
      // silently fail
    }
  };

  const unacknowledged = alerts.filter(a => !a.is_acknowledged);
  const acknowledged   = alerts.filter(a => a.is_acknowledged);

  return (
    <Box>
      <PageHeader
        title="Repeat Complaints"
        subtitle="Rooms and categories with recurring maintenance issues detected by the intelligence system."
        action={
          <Button variant="outlined" size="small" onClick={fetchAlerts}>
            Refresh
          </Button>
        }
      />

      {/* Intelligence explanation */}
      <Alert
        severity="info"
        sx={{ mb: 3, borderRadius: 2 }}
        icon={<RepeatOutlined />}
      >
        <Typography variant="body2">
          <strong>How this works:</strong> The system automatically detects when the same room
          reports similar maintenance issues multiple times. Repeat patterns may indicate
          a deeper structural problem that needs permanent repair rather than quick fixes.
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchAlerts}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box>
          {[1,2,3].map(i => (
            <Card key={i} sx={{ mb: 2 }}>
              <CardContent>
                <Skeleton variant="rectangular" height={100} />
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ── Active alerts ─────────────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          {unacknowledged.length === 0 && acknowledged.length === 0 && (
            <Card>
              <EmptyState
                icon={<CheckCircleOutlined sx={{ fontSize: 36 }} />}
                title="No repeat complaint alerts"
                description="No recurring issues detected. The system will alert you when patterns emerge."
              />
            </Card>
          )}

          {unacknowledged.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningAmberOutlined sx={{ fontSize: 16, color: '#F59E0B' }} />
                Active Alerts ({unacknowledged.length})
              </Typography>

              {unacknowledged.map(alert => {
                const catConfig = CATEGORY_CONFIG[alert.category] || CATEGORY_CONFIG.GENERAL;
                return (
                  <Card key={alert.id} sx={{ mb: 2, border: `1px solid ${alert.repeat_count >= 3 ? '#FCA5A5' : '#FDE68A'}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 44, height: 44, borderRadius: 2, flexShrink: 0,
                            bgcolor: catConfig.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem',
                          }}
                        >
                          {getCategoryEmoji(alert.category)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                            <Chip
                              label={getCategoryLabel(alert.category)}
                              size="small"
                              sx={{ bgcolor: catConfig.bg, color: catConfig.color, fontWeight: 600, fontSize: '0.6875rem' }}
                            />
                            <Chip
                              label={`Room #${alert.room_id}`}
                              size="small"
                              sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, fontSize: '0.6875rem', fontFamily: 'monospace' }}
                            />
                            <RepeatAlertBadge alert={alert} compact />
                          </Box>
                          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
                            {formatRelative(alert.created_at)}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ mb: 2 }} />

                      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/warden/complaints/${alert.complaint_id}`)}
                        >
                          View Complaint
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {/* ── Acknowledged alerts ──────────────────────────────────────── */}
          {acknowledged.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.disabled', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlined sx={{ fontSize: 16 }} />
                Acknowledged ({acknowledged.length})
              </Typography>
              {acknowledged.map(alert => (
                <Card key={alert.id} sx={{ mb: 1.5, opacity: 0.7 }}>
                  <CardContent sx={{ py: '12px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
                        {getCategoryLabel(alert.category)} — Room #{alert.room_id} — {alert.repeat_count}x repeat
                      </Typography>
                      <Chip label="Acknowledged" size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: '#F0FDF4', color: '#065F46' }} />
                      <Button size="small" variant="text" onClick={() => navigate(`/warden/complaints/${alert.complaint_id}`)}>
                        View
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

function getCategoryEmoji(category) {
  const map = {
    GENERAL:'📋', ELECTRICAL:'⚡', PLUMBING:'🔧',
    CIVIL:'🪚', CLEANING:'🧹', NETWORK:'🌐', OTHER:'📌',
  };
  return map[category] || '📋';
}

export default WardenRepeatComplaintsPage;