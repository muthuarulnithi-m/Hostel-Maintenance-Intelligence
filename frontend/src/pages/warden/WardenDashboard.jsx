import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography,
  Alert, Button, Chip, Skeleton, Divider,
} from '@mui/material';
import {
  ReportProblemOutlined,
  PriorityHighRounded,
  AccessTimeOutlined,
  CheckCircleOutlined,
  NotificationsActiveOutlined,
  ArrowForwardOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { useAuth }       from '../../context/AuthContext';
import PageHeader        from '../../components/common/PageHeader';
import StatCard          from '../../components/common/StatCard';
import StatusChip        from '../../components/common/StatusChip';
import PriorityChip      from '../../components/common/PriorityChip';
import EmptyState        from '../../components/common/EmptyState';
import complaintApi      from '../../api/complaintApi';
import {
  formatRelative,
  getCategoryLabel,
  CATEGORY_CONFIG,
} from '../../utils/formatters';

function WardenDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'Warden';

  const [complaints, setComplaints] = useState([]);
  const [alerts,     setAlerts]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [complaintsData, alertsData] = await Promise.all([
        complaintApi.getAllComplaints(),
        complaintApi.getAlerts(),
      ]);
      setComplaints(complaintsData);
      setAlerts(alertsData.filter(a => !a.is_acknowledged));
    } catch (err) {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived metrics ──────────────────────────────────────────────────────
  const openCount      = complaints.filter(c => c.status === 'SUBMITTED').length;
  const assignedCount  = complaints.filter(c => c.status === 'ASSIGNED').length;
  const inProgressCount= complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const highPriCount   = complaints.filter(c => ['HIGH','CRITICAL'].includes(c.priority) && c.status !== 'CLOSED' && c.status !== 'CANCELLED').length;
  const resolvedCount  = complaints.filter(c => c.status === 'RESOLVED').length;
  const onHoldCount    = complaints.filter(c => c.status === 'ON_HOLD').length;
  const unassignedList = complaints.filter(c => c.status === 'SUBMITTED').slice(0, 5);
  const urgentList     = complaints
    .filter(c => ['HIGH','CRITICAL'].includes(c.priority) && !['CLOSED','CANCELLED','RESOLVED'].includes(c.status))
    .slice(0, 5);

  // ── Acknowledge alert ────────────────────────────────────────────────────
  const handleAcknowledge = async (alertId) => {
    try {
      await complaintApi.acknowledgeAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch {
      // silently fail
    }
  };

  return (
    <Box>
      <PageHeader
        title="Warden Dashboard"
        subtitle={`Good morning, ${firstName}. Here's what needs your attention today.`}
        action={
          <Button
            variant="contained"
            endIcon={<ArrowForwardOutlined />}
            onClick={() => navigate('/warden/complaints')}
          >
            All Complaints
          </Button>
        }
      />

      {/* ── Repeat complaint alerts ───────────────────────────────────────── */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {alerts.map(alert => (
            <Alert
              key={alert.id}
              severity="warning"
              icon={<NotificationsActiveOutlined />}
              sx={{ mb: 1.5, borderRadius: 2 }}
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    color="inherit"
                    variant="outlined"
                    onClick={() => navigate(`/warden/complaints/${alert.complaint_id}`)}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => handleAcknowledge(alert.id)}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Dismiss
                  </Button>
                </Box>
              }
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Repeat Issue Detected — {alert.category} ({alert.repeat_count}x)
              </Typography>
              <Typography variant="caption">
                {alert.message}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchData}>Retry</Button>}
        >
          {error}
        </Alert>
      )}

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={6} lg={2.4}>
          <StatCard
            title="Unassigned"
            value={loading ? null : openCount}
            icon={<ReportProblemOutlined />}
            color="#4F46E5"
            subtitle="Awaiting assignment"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} lg={2.4}>
          <StatCard
            title="Assigned"
            value={loading ? null : assignedCount}
            icon={<AccessTimeOutlined />}
            color="#0EA5E9"
            subtitle="Waiting to start"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} lg={2.4}>
          <StatCard
            title="In Progress"
            value={loading ? null : inProgressCount}
            icon={<AccessTimeOutlined />}
            color="#0D9488"
            subtitle="Currently active"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} lg={2.4}>
          <StatCard
            title="High Priority"
            value={loading ? null : highPriCount}
            icon={<PriorityHighRounded />}
            color="#F43F5E"
            subtitle="HIGH + CRITICAL"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} lg={2.4}>
          <StatCard
            title="On Hold"
            value={loading ? null : onHoldCount}
            icon={<WarningAmberOutlined />}
            color="#F59E0B"
            subtitle="Waiting for parts/access"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>

        {/* ── Unassigned complaints ─────────────────────────────────────── */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Needs Assignment
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Submitted but not yet assigned to staff
                  </Typography>
                </Box>
                {openCount > 5 && (
                  <Button size="small" variant="outlined" onClick={() => navigate('/warden/complaints?status=SUBMITTED')}>
                    View All ({openCount})
                  </Button>
                )}
              </Box>

              {loading ? (
                [1,2,3].map(i => <Skeleton key={i} height={48} sx={{ mb: 1, borderRadius: 1 }} />)
              ) : unassignedList.length === 0 ? (
                <EmptyState
                  icon={<CheckCircleOutlined sx={{ fontSize: 32 }} />}
                  title="All complaints are assigned"
                  description="No unassigned complaints right now."
                />
              ) : (
                unassignedList.map((c, i) => {
                  const catCfg = CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.OTHER;
                  return (
                    <Box key={c.id}>
                      {i > 0 && <Divider sx={{ my: 1 }} />}
                      <Box
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1.5,
                          cursor: 'pointer', p: 1, borderRadius: 2,
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/warden/complaints/${c.id}`)}
                      >
                        <Box
                          sx={{
                            width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
                            bgcolor: catCfg.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem',
                          }}
                        >
                          {getCategoryEmoji(c.category)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}
                          >
                            {c.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.75, mt: 0.25, flexWrap: 'wrap' }}>
                            <Chip label={getCategoryLabel(c.category)} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: catCfg.bg, color: catCfg.color }} />
                            <PriorityChip priority={c.priority} size="small" />
                          </Box>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0 }}>
                          {formatRelative(c.created_at)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── High priority active complaints ───────────────────────────── */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    High Priority
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Active HIGH and CRITICAL complaints
                  </Typography>
                </Box>
                {highPriCount > 5 && (
                  <Button size="small" variant="outlined" onClick={() => navigate('/warden/complaints')}>
                    View All
                  </Button>
                )}
              </Box>

              {loading ? (
                [1,2,3].map(i => <Skeleton key={i} height={48} sx={{ mb: 1, borderRadius: 1 }} />)
              ) : urgentList.length === 0 ? (
                <EmptyState
                  icon={<CheckCircleOutlined sx={{ fontSize: 32 }} />}
                  title="No high priority complaints"
                  description="All HIGH and CRITICAL complaints are resolved."
                />
              ) : (
                urgentList.map((c, i) => (
                  <Box key={c.id}>
                    {i > 0 && <Divider sx={{ my: 1 }} />}
                    <Box
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        cursor: 'pointer', p: 1, borderRadius: 2,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => navigate(`/warden/complaints/${c.id}`)}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          #{c.id} — {c.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.25 }}>
                          <PriorityChip priority={c.priority} />
                          <StatusChip   status={c.status} />
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0 }}>
                        {formatRelative(c.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Pending student verification ──────────────────────────────── */}
        {resolvedCount > 0 && (
          <Grid item xs={12}>
            <Alert
              severity="info"
              sx={{ borderRadius: 2 }}
              action={
                <Button
                  size="small" color="inherit"
                  onClick={() => navigate('/warden/complaints?status=RESOLVED')}
                >
                  View ({resolvedCount})
                </Button>
              }
            >
              <strong>{resolvedCount} complaint{resolvedCount > 1 ? 's' : ''}</strong>{' '}
              resolved by staff and awaiting student verification.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

function getCategoryEmoji(category) {
  const map = {
    GENERAL:'📋', ELECTRICAL:'⚡', PLUMBING:'🔧',
    CARPENTRY:'🪚', CLEANING:'🧹', INTERNET:'🌐', OTHER:'📌',
  };
  return map[category] || '📋';
}

export default WardenDashboard;