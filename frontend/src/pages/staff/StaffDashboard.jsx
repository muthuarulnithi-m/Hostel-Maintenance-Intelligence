import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography,
  Alert, Button, Chip, Skeleton, Divider,
  Snackbar,
} from '@mui/material';
import {
  AssignmentOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  ArrowForwardOutlined,
  PersonOutlined,
} from '@mui/icons-material';
import { useAuth }        from '../../context/AuthContext';
import PageHeader         from '../../components/common/PageHeader';
import StatCard           from '../../components/common/StatCard';
import StatusChip         from '../../components/common/StatusChip';
import PriorityChip       from '../../components/common/PriorityChip';
import EmptyState         from '../../components/common/EmptyState';
import complaintApi       from '../../api/complaintApi';
import staffApi           from '../../api/staffApi';
import useStaffProfile    from '../../hooks/useStaffProfile';
import {
  formatRelative,
  getCategoryLabel,
  CATEGORY_CONFIG,
} from '../../utils/formatters';

// Availability config
const AVAIL_CONFIG = {
  AVAILABLE: { label: 'Available', color: '#10B981', bg: '#D1FAE5' },
  BUSY:      { label: 'Busy',      color: '#F59E0B', bg: '#FEF3C7' },
  ON_LEAVE:  { label: 'On Leave',  color: '#94A3B8', bg: '#F1F5F9' },
  INACTIVE:  { label: 'Inactive',  color: '#EF4444', bg: '#FEE2E2' },
};

function StaffDashboard() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const firstName   = user?.name?.split(' ')[0] || 'Staff';

  const { staffProfile, staffId, loading: profileLoading } = useStaffProfile();

  const [complaints,  setComplaints]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [snackbar,    setSnackbar]    = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ── Fetch complaints assigned to this staff member ────────────────────────
  // GET /complaints (list all) — allowed for STAFF role; backend filters by assignment
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complaintApi.getAssignedComplaints();
      setComplaints(data);
    } catch {
      setError('Unable to load your assigned complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // ── Derived counts ────────────────────────────────────────────────────────
  const assigned    = complaints.filter(c => c.status === 'ASSIGNED').length;
  const inProgress  = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const onHold      = complaints.filter(c => c.status === 'ON_HOLD').length;
  const completed   = complaints.filter(c => ['RESOLVED','CLOSED'].includes(c.status)).length;

  // Most urgent = ASSIGNED or IN_PROGRESS, sorted by priority weight
  const priorityWeight = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const urgentWork = complaints
    .filter(c => ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(c.status))
    .sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0))
    .slice(0, 5);

  // ── Update own availability ───────────────────────────────────────────────
  const handleAvailabilityChange = async (newStatus) => {
    if (!staffId) return;
    try {
      await staffApi.updateAvailability(staffId, newStatus);
      showSnack(`Availability updated to ${AVAIL_CONFIG[newStatus]?.label}.`);
    } catch {
      showSnack('Failed to update availability.', 'error');
    }
  };

  const avail = AVAIL_CONFIG[staffProfile?.availability_status] || AVAIL_CONFIG.AVAILABLE;

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${firstName}`}
        subtitle="Here is your current workload and assigned maintenance complaints."
        action={
          <Button
            variant="contained"
            endIcon={<ArrowForwardOutlined />}
            onClick={() => navigate('/staff/complaints')}
          >
            All Assigned Work
          </Button>
        }
      />

      {/* ── Availability card ─────────────────────────────────────────────── */}
      {!profileLoading && staffProfile && (
        <Card sx={{ mb: 3, border: `1px solid ${avail.color}33` }}>
          <CardContent sx={{ py: '14px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: '50%',
                  bgcolor: avail.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <PersonOutlined sx={{ color: avail.color, fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  My Status — {staffProfile.employee_code}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={avail.label}
                    size="small"
                    sx={{ bgcolor: avail.bg, color: avail.color, fontWeight: 700, fontSize: '0.6875rem' }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Update your availability so wardens can assign work correctly
                  </Typography>
                </Box>
              </Box>
              {/* Quick availability toggle buttons */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(AVAIL_CONFIG).map(([key, cfg]) => (
                  <Button
                    key={key}
                    size="small"
                    variant={staffProfile.availability_status === key ? 'contained' : 'outlined'}
                    onClick={() => handleAvailabilityChange(key)}
                    sx={{
                      fontSize: '0.75rem', py: 0.5,
                      borderColor: cfg.color,
                      color: staffProfile.availability_status === key ? '#fff' : cfg.color,
                      bgcolor: staffProfile.availability_status === key ? cfg.color : 'transparent',
                      '&:hover': { bgcolor: cfg.bg, borderColor: cfg.color, color: cfg.color },
                    }}
                  >
                    {cfg.label}
                  </Button>
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <Alert
          severity="error" sx={{ mb: 2.5, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchComplaints}>Retry</Button>}
        >
          {error}
        </Alert>
      )}

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid xs={6} md={3}>
          <StatCard
            title="Assigned"
            value={loading ? null : assigned}
            icon={<AssignmentOutlined />}
            color="#4F46E5"
            subtitle="Waiting to start"
            loading={loading}
          />
        </Grid>
        <Grid xs={6} md={3}>
          <StatCard
            title="In Progress"
            value={loading ? null : inProgress}
            icon={<BuildOutlined />}
            color="#0EA5E9"
            subtitle="Currently working"
            loading={loading}
          />
        </Grid>
        <Grid xs={6} md={3}>
          <StatCard
            title="On Hold"
            value={loading ? null : onHold}
            icon={<PauseCircleOutlined />}
            color="#F59E0B"
            subtitle="Waiting / paused"
            loading={loading}
          />
        </Grid>
        <Grid xs={6} md={3}>
          <StatCard
            title="Completed"
            value={loading ? null : completed}
            icon={<CheckCircleOutlined />}
            color="#10B981"
            subtitle="Resolved + closed"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Active work list ──────────────────────────────────────────────── */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Active Work
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Your assigned, in-progress, and on-hold complaints — sorted by priority
              </Typography>
            </Box>
            <Button
              size="small" variant="outlined"
              onClick={() => navigate('/staff/complaints')}
            >
              View All
            </Button>
          </Box>

          {loading && (
            [1,2,3].map(i => (
              <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <Skeleton variant="rounded" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="55%" height={18} sx={{ mb: 0.5 }} />
                  <Skeleton width="35%" height={14} />
                </Box>
                <Skeleton width={80} height={24} />
              </Box>
            ))
          )}

          {!loading && urgentWork.length === 0 && (
            <EmptyState
              icon={<CheckCircleOutlined sx={{ fontSize: 32 }} />}
              title="No active work"
              description="You have no assigned or in-progress complaints right now."
            />
          )}

          {!loading && urgentWork.map((c, i) => {
            const catCfg = CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.GENERAL;
            const isHighUrgency = ['HIGH','URGENT'].includes(c.priority);

            return (
              <Box key={c.id}>
                {i > 0 && <Divider sx={{ my: 1.5 }} />}
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    p: 1.5, borderRadius: 2, cursor: 'pointer',
                    border: isHighUrgency ? '1px solid #FEE2E2' : '1px solid transparent',
                    bgcolor: isHighUrgency ? '#FFF5F5' : 'transparent',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: '#EEF2FF', border: '1px solid #C7D2FE' },
                  }}
                  onClick={() => navigate(`/staff/complaints/${c.id}`)}
                >
                  {/* Category icon */}
                  <Box
                    sx={{
                      width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                      bgcolor: catCfg.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem',
                    }}
                  >
                    {getCategoryEmoji(c.category)}
                  </Box>

                  {/* Details */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: { xs: 160, sm: 280 },
                        }}
                      >
                        {c.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace' }}>
                        #{c.id}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      <PriorityChip priority={c.priority} />
                      <StatusChip   status={c.status} />
                      <Chip
                        label={getCategoryLabel(c.category)}
                        size="small"
                        sx={{ height: 20, fontSize: '0.6875rem', bgcolor: catCfg.bg, color: catCfg.color, fontWeight: 600 }}
                      />
                    </Box>
                  </Box>

                  {/* Time + arrow */}
                  <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                      {formatRelative(c.created_at)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      Tap to manage →
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(p => ({ ...p, open: false }))}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
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

export default StaffDashboard;
