import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography,
  Alert, Button, Divider, Chip, Skeleton,
} from '@mui/material';
import {
  PeopleOutlined,
  BuildOutlined,
  HomeWorkOutlined,
  BarChartOutlined,
  ReportProblemOutlined,
  CheckCircleOutlined,
} from '@mui/icons-material';
import { useAuth }       from '../../context/AuthContext';
import PageHeader        from '../../components/common/PageHeader';
import StatCard          from '../../components/common/StatCard';
import complaintApi      from '../../api/complaintApi';
import staffApi          from '../../api/staffApi';
import hostelApi         from '../../api/hostelApi';
import axiosInstance     from '../../api/axios';
import { formatRelative, getCategoryLabel, CATEGORY_CONFIG } from '../../utils/formatters';
import StatusChip        from '../../components/common/StatusChip';
import PriorityChip      from '../../components/common/PriorityChip';

function AdminDashboard() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const firstName   = user?.name?.split(' ')[0] || 'Admin';

  const [stats,      setStats]      = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, staffRes, hostelRes, complaintsRes] = await Promise.all([
        axiosInstance.get('/users'),
        staffApi.getAllStaff(),
        hostelApi.getAll(),
        complaintApi.getAllComplaints(),
      ]);
      setStats({
        users:      usersRes.data.length,
        staff:      staffRes.length,
        hostels:    hostelRes.length,
        complaints: complaintsRes.length,
      });
      setComplaints(complaintsRes);
    } catch {
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const openCount    = complaints.filter(c => !['CLOSED','CANCELLED'].includes(c.status)).length;
  const closedCount  = complaints.filter(c => c.status === 'CLOSED').length;

  return (
    <Box>
      <PageHeader
        title="System Administration"
        subtitle={`Welcome back, ${firstName}. Here's an overview of the entire system.`}
        action={
          <Button variant="outlined" size="small" onClick={fetchData}>
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchData}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* KPI cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={6} md={3}>
          <StatCard title="Total Users"       value={loading ? null : stats?.users}      icon={<PeopleOutlined />}     color="#4F46E5" loading={loading} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Staff Members"     value={loading ? null : stats?.staff}      icon={<BuildOutlined />}      color="#0D9488" loading={loading} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Hostels"           value={loading ? null : stats?.hostels}    icon={<HomeWorkOutlined />}   color="#D97706" loading={loading} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Total Complaints"  value={loading ? null : stats?.complaints} icon={<BarChartOutlined />}   color="#DC2626" loading={loading} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>

        {/* Recent complaints */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Complaints</Typography>
                <Button size="small" variant="outlined" onClick={() => navigate('/warden/complaints')}>
                  View All
                </Button>
              </Box>

              {loading ? (
                [1,2,3].map(i => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                    <Skeleton variant="rounded" width={36} height={36} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="50%" height={16} sx={{ mb: 0.5 }} />
                      <Skeleton width="30%" height={14} />
                    </Box>
                  </Box>
                ))
              ) : recentComplaints.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
                  No complaints yet.
                </Typography>
              ) : (
                recentComplaints.map((c, i) => {
                  const catCfg = CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.GENERAL;
                  return (
                    <Box key={c.id}>
                      {i > 0 && <Divider sx={{ my: 1.25 }} />}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', p: 0.75, borderRadius: 1.5, '&:hover': { bgcolor: 'action.hover' } }}
                        onClick={() => navigate(`/warden/complaints/${c.id}`)}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: catCfg.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                          {getCategoryEmoji(c.category)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            #{c.id} — {c.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.75, mt: 0.25 }}>
                            <PriorityChip priority={c.priority} size="small" />
                            <StatusChip   status={c.status} />
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

        {/* System health */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                System Health
              </Typography>
              {[
                { label: 'Open Complaints',   value: openCount,   color: '#4F46E5', icon: <ReportProblemOutlined sx={{ fontSize: 16 }} /> },
                { label: 'Closed Complaints', value: closedCount, color: '#10B981', icon: <CheckCircleOutlined   sx={{ fontSize: 16 }} /> },
              ].map((item, i) => (
                <Box key={item.label}>
                  {i > 0 && <Divider sx={{ my: 1.5 }} />}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ color: item.color }}>{item.icon}</Box>
                    <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
                      {item.label}
                    </Typography>
                    <Chip
                      label={loading ? '…' : item.value}
                      size="small"
                      sx={{ bgcolor: `${item.color}18`, color: item.color, fontWeight: 700, fontSize: '0.75rem' }}
                    />
                  </Box>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Quick Links
              </Typography>
              {[
                { label: 'Manage Users',   path: '/admin/users' },
                { label: 'Hostel Setup',   path: '/admin/hostel' },
                { label: 'Staff List',     path: '/admin/staff' },
                { label: 'View Reports',   path: '/warden/reports' },
              ].map(link => (
                <Button
                  key={link.path}
                  fullWidth
                  variant="text"
                  size="small"
                  onClick={() => navigate(link.path)}
                  sx={{
                    justifyContent: 'flex-start',
                    color: 'primary.main',
                    fontWeight: 500,
                    py: 0.5,
                    mb: 0.25,
                  }}
                >
                  → {link.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function getCategoryEmoji(category) {
  const map = { GENERAL:'📋', ELECTRICAL:'⚡', PLUMBING:'🔧', CARPENTRY:'🪚', CLEANING:'🧹', INTERNET:'🌐', OTHER:'📌' };
  return map[category] || '📋';
}

export default AdminDashboard;