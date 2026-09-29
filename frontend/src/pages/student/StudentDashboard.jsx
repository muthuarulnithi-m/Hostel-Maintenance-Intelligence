import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Box, Typography, Card, CardContent,
  Button, Chip, Alert, Skeleton,
} from '@mui/material';
import {
  ReportProblemOutlined,
  HourglassEmptyOutlined,
  CheckCircleOutlined,
  AssignmentOutlined,
  AddCircleOutlineOutlined,
  VerifiedOutlined,
} from '@mui/icons-material';
import { useAuth }       from '../../context/AuthContext';
import PageHeader        from '../../components/common/PageHeader';
import StatCard          from '../../components/common/StatCard';
import StatusChip        from '../../components/common/StatusChip';
import PriorityChip      from '../../components/common/PriorityChip';
import EmptyState        from '../../components/common/EmptyState';
import complaintApi      from '../../api/complaintApi';
import {
  getCategoryLabel,
  CATEGORY_CONFIG,
  formatRelative,
} from '../../utils/formatters';

function StudentDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'Student';

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complaintApi.getMyComplaints();
      setComplaints(data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Unable to load your complaints.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // ── Derived counts ───────────────────────────────────────────────────────
  const activeCount      = complaints.filter(c => ['SUBMITTED','ASSIGNED','IN_PROGRESS','ON_HOLD'].includes(c.status)).length;
  const pendingVerify    = complaints.filter(c => c.status === 'RESOLVED').length;
  const resolvedCount    = complaints.filter(c => c.status === 'CLOSED').length;
  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <Box>
      <PageHeader
        title={`Good morning, ${firstName} 👋`}
        subtitle="Here's the current status of your maintenance complaints."
        action={
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineOutlined />}
            onClick={() => navigate('/student/complaints/new')}
          >
            New Complaint
          </Button>
        }
      />

      {/* ── Verification prompt ───────────────────────────────────────────── */}
      {pendingVerify > 0 && (
  <Alert
    severity="info"
    icon={<VerifiedOutlined />}
    sx={{ mb: 2.5, borderRadius: 2 }}
    action={
      <Box sx={{ display: 'flex', gap: 1 }}>
        {pendingVerify === 1 ? (
          <Button
            size="small" color="inherit" variant="outlined"
            onClick={() => {
              const c = complaints.find(x => x.status === 'RESOLVED');
              if (c) navigate(`/student/complaints/${c.id}/verify`);
            }}
          >
            Verify Now
          </Button>
        ) : (
          <Button size="small" color="inherit" onClick={() => navigate('/student/complaints')}>
            View All ({pendingVerify})
          </Button>
        )}
      </Box>
    }
  >
    <strong>{pendingVerify} complaint{pendingVerify > 1 ? 's' : ''}</strong> resolved by staff —
    please confirm if {pendingVerify > 1 ? 'they are' : 'it is'} fixed.
  </Alert>
)}

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Active"
            value={loading ? null : activeCount}
            icon={<ReportProblemOutlined />}
            color="#4F46E5"
            subtitle="Open + In Progress"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Pending Verification"
            value={loading ? null : pendingVerify}
            icon={<HourglassEmptyOutlined />}
            color="#F59E0B"
            subtitle="Awaiting your confirmation"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Closed"
            value={loading ? null : resolvedCount}
            icon={<CheckCircleOutlined />}
            color="#10B981"
            subtitle="Successfully verified"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Total"
            value={loading ? null : complaints.length}
            icon={<AssignmentOutlined />}
            color="#0EA5E9"
            subtitle="All complaints"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Recent complaints ─────────────────────────────────────────────── */}
      <Card>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Complaints
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Your 5 most recent maintenance requests
              </Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={() => navigate('/student/complaints')}>
              View All
            </Button>
          </Box>

          {/* Loading skeletons */}
          {loading && (
            <Box>
              {[1,2,3].map(i => (
                <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                  <Skeleton variant="rounded" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="50%" height={18} sx={{ mb: 0.5 }} />
                    <Skeleton width="80%" height={15} />
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Empty state */}
          {!loading && recentComplaints.length === 0 && (
            <EmptyState
              title="No complaints yet"
              description="Submit your first maintenance complaint using the button above."
            />
          )}

          {/* Table */}
          {!loading && recentComplaints.length > 0 && (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'Title', 'Category', 'Priority', 'Status', 'Submitted'].map(col => (
                      <th
                        key={col}
                        style={{
                          padding: '8px 14px', textAlign: 'left',
                          fontSize: '0.6875rem', fontWeight: 600,
                          color: '#475569', letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          borderBottom: '2px solid #E2E8F0',
                          backgroundColor: '#F8FAFC',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map((c, i) => {
                    const catCfg = CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.OTHER;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/student/complaints/${c.id}`)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EEF2FF'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#FAFAFA'}
                      >
                        <td style={{ padding: '11px 14px', fontSize: '0.8125rem', fontWeight: 700, color: '#4F46E5', borderBottom: '1px solid #F1F5F9' }}>
                          {c.id}
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: '0.875rem', color: '#1E293B', borderBottom: '1px solid #F1F5F9', maxWidth: 220 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                            {c.title}
                          </Typography>
                        </td>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #F1F5F9' }}>
                          <Chip
                            label={getCategoryLabel(c.category)}
                            size="small"
                            sx={{ bgcolor: catCfg.bg, color: catCfg.color, fontWeight: 600, fontSize: '0.6875rem', height: 22 }}
                          />
                        </td>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #F1F5F9' }}>
                          <PriorityChip priority={c.priority} />
                        </td>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #F1F5F9' }}>
                          <StatusChip status={c.status} />
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: '0.8125rem', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>
                          {formatRelative(c.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default StudentDashboard;