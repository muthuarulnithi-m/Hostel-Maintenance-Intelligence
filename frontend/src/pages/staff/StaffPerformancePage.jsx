import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography,
  Alert, Button, Chip, Divider, LinearProgress,
} from '@mui/material';
import {
  EmojiEventsOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  AssignmentOutlined,
  PersonOutlined,
} from '@mui/icons-material';
import PageHeader      from '../../components/common/PageHeader';
import StatCard        from '../../components/common/StatCard';
import LoadingState    from '../../components/common/LoadingState';
import complaintApi    from '../../api/complaintApi';
import useStaffProfile from '../../hooks/useStaffProfile';
import { CATEGORY_CONFIG, getCategoryLabel } from '../../utils/formatters';

const AVAIL_CONFIG = {
  AVAILABLE: { label: 'Available', color: '#10B981', bg: '#D1FAE5' },
  BUSY:      { label: 'Busy',      color: '#F59E0B', bg: '#FEF3C7' },
  ON_LEAVE:  { label: 'On Leave',  color: '#94A3B8', bg: '#F1F5F9' },
  INACTIVE:  { label: 'Inactive',  color: '#EF4444', bg: '#FEE2E2' },
};

function StaffPerformancePage() {
  const { staffProfile, loading: profileLoading, error: profileError } = useStaffProfile();

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await complaintApi.getAssignedComplaints();
      setComplaints(data);
    } catch {
      setError('Unable to load performance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || profileLoading) return <LoadingState message="Loading performance data…" />;

  // ── Metrics ──────────────────────────────────────────────────────────────
  const total       = complaints.length;
  const resolved    = complaints.filter(c => ['RESOLVED','CLOSED'].includes(c.status)).length;
  const closed      = complaints.filter(c => c.status === 'CLOSED').length;
  const inProgress  = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const onHold      = complaints.filter(c => c.status === 'ON_HOLD').length;
  const assigned    = complaints.filter(c => c.status === 'ASSIGNED').length;

  const completionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const verifiedRate   = total > 0 ? Math.round((closed   / total) * 100) : 0;

  // Category breakdown
  const categoryBreakdown = Object.entries(CATEGORY_CONFIG).map(([cat]) => ({
    category: cat,
    count:    complaints.filter(c => c.category === cat).length,
  })).filter(x => x.count > 0);

  const avail = AVAIL_CONFIG[staffProfile?.availability_status] || AVAIL_CONFIG.AVAILABLE;

  return (
    <Box>
      <PageHeader
        title="My Performance"
        subtitle="Your work statistics and complaint handling metrics."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchData}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* ── Profile card ──────────────────────────────────────────────────── */}
      {staffProfile && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56, height: 56, borderRadius: '50%',
                  bgcolor: '#EEF2FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <PersonOutlined sx={{ color: '#4F46E5', fontSize: 28 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Staff #{staffProfile.id}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Employee Code: <strong>{staffProfile.employee_code}</strong>
                </Typography>
              </Box>
              <Chip
                label={avail.label}
                sx={{ bgcolor: avail.bg, color: avail.color, fontWeight: 700 }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid xs={6} md={3}>
          <StatCard title="Total Assigned" value={total}      icon={<AssignmentOutlined />}    color="#4F46E5" />
        </Grid>
        <Grid xs={6} md={3}>
          <StatCard title="Resolved"       value={resolved}   icon={<CheckCircleOutlined />}   color="#10B981" />
        </Grid>
        <Grid xs={6} md={3}>
          <StatCard title="In Progress"    value={inProgress} icon={<BuildOutlined />}          color="#0EA5E9" />
        </Grid>
        <Grid xs={6} md={3}>
          <StatCard title="On Hold"        value={onHold}     icon={<PauseCircleOutlined />}    color="#F59E0B" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>

        {/* ── Completion rates ──────────────────────────────────────────── */}
        <Grid xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <EmojiEventsOutlined sx={{ color: '#F59E0B' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Completion Rates
                </Typography>
              </Box>

              {[
                {
                  label: 'Resolution Rate',
                  value: completionRate,
                  color: '#10B981',
                  desc: `${resolved} of ${total} complaints resolved`,
                },
                {
                  label: 'Verification Rate',
                  value: verifiedRate,
                  color: '#4F46E5',
                  desc: `${closed} of ${total} complaints verified by students`,
                },
              ].map((metric, i) => (
                <Box key={metric.label}>
                  {i > 0 && <Divider sx={{ my: 2 }} />}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {metric.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: metric.color }}>
                      {metric.value}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metric.value}
                    sx={{
                      height: 8, borderRadius: 4,
                      bgcolor: '#F1F5F9',
                      '& .MuiLinearProgress-bar': { bgcolor: metric.color, borderRadius: 4 },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                    {metric.desc}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Category breakdown ────────────────────────────────────────── */}
        <Grid xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
                Work by Category
              </Typography>

              {categoryBreakdown.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No category data yet.
                </Typography>
              ) : (
                categoryBreakdown.map((item, i) => {
                  const catCfg  = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.OTHER;
                  const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  return (
                    <Box key={item.category}>
                      {i > 0 && <Divider sx={{ my: 1.5 }} />}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 32, height: 32, borderRadius: 1.5,
                            bgcolor: catCfg.bg, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.9rem',
                          }}
                        >
                          {getCategoryEmoji(item.category)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {getCategoryLabel(item.category)}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: catCfg.color }}>
                              {item.count} ({percent}%)
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percent}
                            sx={{
                              height: 6, borderRadius: 3,
                              bgcolor: '#F1F5F9',
                              '& .MuiLinearProgress-bar': { bgcolor: catCfg.color, borderRadius: 3 },
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Status breakdown ──────────────────────────────────────────── */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Current Workload Breakdown
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Assigned (not started)', value: assigned,   color: '#4F46E5', bg: '#EEF2FF' },
                  { label: 'In Progress',            value: inProgress,  color: '#0EA5E9', bg: '#E0F2FE' },
                  { label: 'On Hold',                value: onHold,      color: '#F59E0B', bg: '#FFFBEB' },
                  { label: 'Resolved (pending verify)', value: resolved - closed, color: '#10B981', bg: '#F0FDF4' },
                  { label: 'Closed (verified)',      value: closed,      color: '#065F46', bg: '#DCFCE7' },
                ].map(item => (
                  <Grid xs={6} sm={4} md={2.4} key={item.label}>
                    <Box
                      sx={{
                        textAlign: 'center', p: 2, borderRadius: 2,
                        bgcolor: item.bg, border: `1px solid ${item.color}22`,
                      }}
                    >
                      <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: item.color, lineHeight: 1.1 }}>
                        {item.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: item.color, fontWeight: 500, display: 'block', mt: 0.5 }}>
                        {item.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
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

export default StaffPerformancePage;
