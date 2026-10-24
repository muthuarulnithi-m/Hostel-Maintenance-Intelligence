import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography,
  Alert, Button, Divider, LinearProgress, Chip,
} from '@mui/material';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChartOutlined,
  TrendingUpOutlined,
  PeopleOutlined,
  AccessTimeOutlined,
} from '@mui/icons-material';
import PageHeader     from '../../components/common/PageHeader';
import StatCard       from '../../components/common/StatCard';
import LoadingState   from '../../components/common/LoadingState';
import complaintApi   from '../../api/complaintApi';
import {
  getSummaryMetrics,
  getStatusDistribution,
  getPriorityDistribution,
  getCategoryDistribution,
  getMonthlyTrend,
  getResolutionTimeStats,
  getStaffWorkload,
} from '../../utils/analytics';
import { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG } from '../../utils/formatters';

// ─── Chart color palettes ──────────────────────────────────────────────────────
const STATUS_COLORS = {
  SUBMITTED:   '#4F46E5',
  ASSIGNED:    '#0369A1',
  IN_PROGRESS: '#0D9488',
  ON_HOLD:     '#F59E0B',
  RESOLVED:    '#10B981',
  CLOSED:      '#065F46',
  CANCELLED:   '#94A3B8',
};

const PRIORITY_COLORS = {
  LOW:      '#94A3B8',
  MEDIUM:   '#F59E0B',
  HIGH:     '#F97316',
  URGENT: '#F43F5E',
};

const CATEGORY_COLORS = [
  '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B',
  '#F43F5E', '#8B5CF6', '#0D9488',
];

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: '#1E293B', color: '#fff',
        borderRadius: 2, p: 1.5,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        minWidth: 120,
      }}
    >
      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((entry, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {entry.name}: {entry.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

function WardenAnalyticsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complaintApi.getAllComplaints();
      setComplaints(data);
    } catch {
      setError('Unable to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingState message="Calculating analytics…" minHeight="60vh" />;

  if (error) {
    return (
      <Box>
        <PageHeader title="Complaint Analytics" />
        <Alert severity="error" sx={{ borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchData}>Retry</Button>}>
          {error}
        </Alert>
      </Box>
    );
  }

  // ── Derive all analytics ──────────────────────────────────────────────────
  const metrics      = getSummaryMetrics(complaints);
  const statusDist   = getStatusDistribution(complaints);
  const priorityDist = getPriorityDistribution(complaints);
  const categoryDist = getCategoryDistribution(complaints);
  const monthlyTrend = getMonthlyTrend(complaints, 6);
  const resoStats    = getResolutionTimeStats(complaints);
  const staffWork    = getStaffWorkload(complaints);

  // Format for charts
  const statusChartData = Object.entries(statusDist).map(([status, count]) => ({
    name:  STATUS_CONFIG[status]?.label || status,
    count,
    fill:  STATUS_COLORS[status] || '#94A3B8',
  }));

  const priorityChartData = Object.entries(priorityDist).map(([priority, count]) => ({
    name:  PRIORITY_CONFIG[priority]?.label || priority,
    count,
    fill:  PRIORITY_COLORS[priority] || '#94A3B8',
  }));

  const categoryChartData = categoryDist.map((item, i) => ({
    name:  CATEGORY_CONFIG[item.category]?.label || item.category,
    count: item.count,
    fill:  CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const trendChartData = monthlyTrend.map(m => ({
    month: m.month,
    Complaints: m.count,
  }));

  return (
    <Box>
      <PageHeader
        title="Complaint Analytics"
        subtitle={`Analysis based on ${complaints.length} total complaints in the system.`}
        action={
          <Button variant="outlined" size="small" onClick={fetchData}>
            Refresh Data
          </Button>
        }
      />

      {/* ── Summary KPIs ──────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid xs={6} md={3}>
          <StatCard
            title="Total Complaints"
            value={metrics.total}
            icon={<BarChartOutlined />}
            color="#4F46E5"
            subtitle="All time"
          />
        </Grid>
        <Grid xs={6} md={3}>
          <StatCard
            title="Resolution Rate"
            value={`${metrics.resolutionRate}%`}
            icon={<TrendingUpOutlined />}
            color="#10B981"
            subtitle="Resolved + Closed"
          />
        </Grid>
        <Grid xs={6} md={3}>
          <StatCard
            title="Avg Resolution Time"
            value={resoStats.count > 0 ? `${resoStats.average}h` : '—'}
            icon={<AccessTimeOutlined />}
            color="#0EA5E9"
            subtitle={resoStats.count > 0 ? `Based on ${resoStats.count} closed` : 'No closed complaints'}
          />
        </Grid>
        <Grid xs={6} md={3}>
          <StatCard
            title="Verification Rate"
            value={`${metrics.verificationRate}%`}
            icon={<PeopleOutlined />}
            color="#F59E0B"
            subtitle="Student confirmed fixed"
          />
        </Grid>
      </Grid>

      {/* ── Row 1: Monthly trend + Status distribution ────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>

        {/* Monthly Trend Line Chart */}
        <Grid xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Monthly Complaint Volume
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5 }}>
                Number of complaints submitted per month (last 6 months)
              </Typography>
              {trendChartData.every(d => d.Complaints === 0) ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                  <Typography variant="body2">No complaint data for the last 6 months.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="Complaints"
                      stroke="#4F46E5"
                      strokeWidth={2.5}
                      dot={{ fill: '#4F46E5', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Status Distribution Pie */}
        <Grid xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Status Distribution
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Current complaint breakdown by status
              </Typography>
              {statusChartData.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                  <Typography variant="body2">No data available.</Typography>
                </Box>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                      >
                        {statusChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                    {statusChartData.map(item => (
                      <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.fill, flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {item.name} ({item.count})
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Row 2: Category bar + Priority bar ───────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>

        {/* Category Bar Chart */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Complaints by Category
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5 }}>
                Which maintenance categories are most reported
              </Typography>
              {categoryChartData.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                  <Typography variant="body2">No data available.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Complaints" radius={[0, 4, 4, 0]}>
                      {categoryChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Bar Chart */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Complaints by Priority
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5 }}>
                Distribution of complaint urgency levels
              </Typography>
              {priorityChartData.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                  <Typography variant="body2">No data available.</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={priorityChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Complaints" radius={[4, 4, 0, 0]}>
                      {priorityChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Row 3: Resolution stats + Staff workload ──────────────────────── */}
      <Grid container spacing={2.5}>

        {/* Resolution time stats */}
        <Grid xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <AccessTimeOutlined sx={{ color: '#0EA5E9' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Resolution Time
                </Typography>
              </Box>

              {resoStats.count === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No closed complaints yet to calculate resolution time.
                </Typography>
              ) : (
                <>
                  {[
                    { label: 'Average',  value: `${resoStats.average} hrs`, color: '#4F46E5' },
                    { label: 'Fastest',  value: `${resoStats.min} hrs`,     color: '#10B981' },
                    { label: 'Slowest',  value: `${resoStats.max} hrs`,     color: '#F43F5E' },
                    { label: 'Based on', value: `${resoStats.count} closed`, color: '#64748B' },
                  ].map((item, i) => (
                    <Box key={item.label}>
                      {i > 0 && <Divider sx={{ my: 1.5 }} />}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: item.color }}>
                          {item.value}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1.5 }}>
                ACTIVE COMPLAINT COUNTS
              </Typography>
              {[
                { label: 'Unassigned',   value: metrics.unassigned, color: '#F43F5E' },
                { label: 'High Priority', value: metrics.highPri,   color: '#F97316' },
                { label: 'On Hold',       value: metrics.onHold,    color: '#F59E0B' },
                { label: 'In Progress',   value: metrics.inProgress, color: '#0D9488' },
              ].map((item) => (
                <Box key={item.label} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: item.color }}>
                      {item.value}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.total > 0 ? (item.value / metrics.total) * 100 : 0}
                    sx={{
                      height: 5, borderRadius: 3,
                      bgcolor: '#F1F5F9',
                      '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 3 },
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Staff workload table */}
        <Grid xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <PeopleOutlined sx={{ color: '#4F46E5' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Staff Workload
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Complaint distribution across maintenance staff
                  </Typography>
                </Box>
              </Box>

              {staffWork.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No complaints assigned to staff yet.
                </Typography>
              ) : (
                <Box>
                  {/* Column headers */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 80px 80px 80px 80px',
                      gap: 1, pb: 1, mb: 1,
                      borderBottom: '2px solid #E2E8F0',
                    }}
                  >
                    {['Staff', 'Workload', 'Active', 'Hold', 'Done', 'Total'].map(col => (
                      <Typography key={col} variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {col}
                      </Typography>
                    ))}
                  </Box>

                  {staffWork.map((s, i) => {
                    const doneCount   = s.resolved + s.closed;
                    const workloadPct = metrics.total > 0 ? (s.total / metrics.total) * 100 : 0;

                    return (
                      <Box key={s.staffId}>
                        {i > 0 && <Divider sx={{ my: 1.25 }} />}
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '80px 1fr 80px 80px 80px 80px',
                            gap: 1, alignItems: 'center',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#4F46E5' }}>
                            #{s.staffId}
                          </Typography>
                          <Box>
                            <LinearProgress
                              variant="determinate"
                              value={workloadPct}
                              sx={{
                                height: 6, borderRadius: 3,
                                bgcolor: '#EEF2FF',
                                '& .MuiLinearProgress-bar': { bgcolor: '#4F46E5', borderRadius: 3 },
                              }}
                            />
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              {Math.round(workloadPct)}% of total
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#0EA5E9', textAlign: 'center' }}>
                            {s.inProgress}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#F59E0B', textAlign: 'center' }}>
                            {s.onHold}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#10B981', textAlign: 'center' }}>
                            {doneCount}
                          </Typography>
                          <Chip
                            label={s.total}
                            size="small"
                            sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700, bgcolor: '#EEF2FF', color: '#4F46E5' }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default WardenAnalyticsPage;
