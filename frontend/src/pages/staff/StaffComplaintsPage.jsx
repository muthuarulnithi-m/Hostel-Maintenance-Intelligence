import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button,
  TextField, InputAdornment, MenuItem, Grid,
  Alert, Skeleton, Chip, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  SearchOutlined,
  AssignmentOutlined,
} from '@mui/icons-material';
import PageHeader    from '../../components/common/PageHeader';
import StatusChip    from '../../components/common/StatusChip';
import PriorityChip  from '../../components/common/PriorityChip';
import EmptyState    from '../../components/common/EmptyState';
import complaintApi  from '../../api/complaintApi';
import {
  formatRelative,
  getCategoryLabel,
  CATEGORY_CONFIG,
  PRIORITY_CONFIG,
} from '../../utils/formatters';

// Staff-relevant status filters
const STATUS_FILTERS = [
  { value: 'ALL',         label: 'All' },
  { value: 'ASSIGNED',    label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD',     label: 'On Hold' },
  { value: 'RESOLVED',    label: 'Resolved' },
  { value: 'CLOSED',      label: 'Closed' },
];

const PRIORITY_WEIGHT = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

function StaffComplaintsPage() {
  const navigate = useNavigate();

  const [complaints,    setComplaints]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('ALL');
  const [priorityFilter,setPriorityFilter]= useState('ALL');
  const [sortBy,        setSortBy]        = useState('priority'); // 'priority' | 'date'

  // GET /complaints/assigned/me — returns only complaints assigned to this staff member
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

  // ── Local filter + sort ───────────────────────────────────────────────────
  const filtered = complaints
    .filter(c => {
      const matchStatus   = statusFilter   === 'ALL' || c.status   === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || c.priority === priorityFilter;
      const q = search.toLowerCase();
      const matchSearch   = !search || (
        c.title?.toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
      return matchStatus && matchPriority && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const countByStatus = (s) =>
    s === 'ALL' ? complaints.length : complaints.filter(c => c.status === s).length;

  return (
    <Box>
      <PageHeader
        title="Assigned Work"
        subtitle="All complaints assigned to you — sorted by priority."
      />

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: '14px !important' }}>
          <Grid container spacing={1.5} sx={{ mb: 1.5, alignItems: 'center' }}>
            <Grid xs={12} sm={5}>
              <TextField
                fullWidth size="small"
                placeholder="Search by title or ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid xs={6} sm={3}>
              <TextField
                fullWidth select size="small" label="Priority"
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Priorities</MenuItem>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={6} sm={2}>
              <TextField
                fullWidth select size="small" label="Sort By"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <MenuItem value="priority">Priority</MenuItem>
                <MenuItem value="date">Date</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={6} sm={2}>
              <Button
                fullWidth variant="outlined" size="small"
                onClick={() => { setSearch(''); setStatusFilter('ALL'); setPriorityFilter('ALL'); }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>

          {/* Status tabs */}
          <Box sx={{ overflowX: 'auto' }}>
            <ToggleButtonGroup
              value={statusFilter} exclusive
              onChange={(_, val) => { if (val) setStatusFilter(val); }}
              size="small"
            >
              {STATUS_FILTERS.map(f => (
                <ToggleButton
                  key={f.value} value={f.value}
                  sx={{
                    px: 1.5, py: 0.5,
                    fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main', color: '#fff',
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  }}
                >
                  {f.label}
                  {countByStatus(f.value) > 0 && (
                    <Box component="span" sx={{
                      ml: 0.75,
                      bgcolor: statusFilter === f.value ? 'rgba(255,255,255,0.25)' : 'action.selected',
                      borderRadius: 10, px: 0.75, py: 0.1,
                      fontSize: '0.6875rem', fontWeight: 700,
                    }}>
                      {countByStatus(f.value)}
                    </Box>
                  )}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchComplaints}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <Card><CardContent>
          {[1,2,3,4].map(i => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
              <Skeleton variant="rounded" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="50%" height={18} sx={{ mb: 0.5 }} />
                <Skeleton width="30%" height={14} />
              </Box>
              <Skeleton width={90} height={26} />
            </Box>
          ))}
        </CardContent></Card>
      )}

      {/* ── Empty ─────────────────────────────────────────────────────────── */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <EmptyState
            icon={<AssignmentOutlined sx={{ fontSize: 36 }} />}
            title={statusFilter !== 'ALL' || search ? 'No complaints match your filters' : 'No complaints assigned to you'}
            description={statusFilter !== 'ALL' || search ? 'Try clearing your filters.' : 'The warden will assign complaints to you shortly.'}
            action={
              (statusFilter !== 'ALL' || search) && (
                <Button variant="outlined" onClick={() => { setSearch(''); setStatusFilter('ALL'); setPriorityFilter('ALL'); }}>
                  Clear Filters
                </Button>
              )
            }
          />
        </Card>
      )}

      {/* ── Complaints table ──────────────────────────────────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Title', 'Category', 'Priority', 'Status', 'Submitted', 'Action'].map(col => (
                    <th key={col} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: '0.6875rem', fontWeight: 600,
                      color: '#475569', letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      borderBottom: '2px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      whiteSpace: 'nowrap',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const catCfg = CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.GENERAL;
                  const isUrgent = ['HIGH','URGENT'].includes(c.priority) &&
                    ['ASSIGNED','IN_PROGRESS'].includes(c.status);
                  return (
                    <tr
                      key={c.id}
                      style={{
                        backgroundColor: isUrgent ? '#FFF5F5' : (i % 2 === 0 ? '#fff' : '#FAFAFA'),
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EEF2FF'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = isUrgent ? '#FFF5F5' : (i % 2 === 0 ? '#fff' : '#FAFAFA')}
                    >
                      <td style={{ padding: '11px 16px', fontSize: '0.8125rem', fontWeight: 700, color: '#4F46E5', borderBottom: '1px solid #F1F5F9' }}
                        onClick={() => navigate(`/staff/complaints/${c.id}`)}>
                        #{c.id}
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9', maxWidth: 220 }}
                        onClick={() => navigate(`/staff/complaints/${c.id}`)}>
                        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {c.title}
                        </Typography>
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9' }}
                        onClick={() => navigate(`/staff/complaints/${c.id}`)}>
                        <Chip label={getCategoryLabel(c.category)} size="small"
                          sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600, bgcolor: catCfg.bg, color: catCfg.color }} />
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9' }}
                        onClick={() => navigate(`/staff/complaints/${c.id}`)}>
                        <PriorityChip priority={c.priority} />
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9' }}
                        onClick={() => navigate(`/staff/complaints/${c.id}`)}>
                        <StatusChip status={c.status} />
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '0.8125rem', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`/staff/complaints/${c.id}`)}>
                        {formatRelative(c.created_at)}
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9' }}>
                        <Button
                          size="small" variant="contained"
                          onClick={() => navigate(`/staff/complaints/${c.id}`)}
                          sx={{ fontSize: '0.75rem', py: 0.5 }}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        </Card>
      )}
    </Box>
  );
}

export default StaffComplaintsPage;
