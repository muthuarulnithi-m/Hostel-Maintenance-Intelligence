import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button,
  TextField, InputAdornment, MenuItem, Grid,
  Alert, Skeleton, Chip,
} from '@mui/material';
import {
  SearchOutlined,
  FilterListOutlined,
  ReportProblemOutlined,
} from '@mui/icons-material';
import PageHeader    from '../../components/common/PageHeader';
import StatusChip    from '../../components/common/StatusChip';
import PriorityChip  from '../../components/common/PriorityChip';
import EmptyState    from '../../components/common/EmptyState';
import complaintApi  from '../../api/complaintApi';
import { useAuth } from '../../context/AuthContext';
import {
  formatRelative,
  getCategoryLabel,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from '../../utils/formatters';

function WardenComplaintsPage() {
  const navigate         = useNavigate();
  const [searchParams]   = useSearchParams();
  const { userRole }     = useAuth();
  const basePath         = userRole === 'admin' ? '/admin' : '/warden';

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // ── Filter state ─────────────────────────────────────────────────────────
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState(searchParams.get('status') || 'ALL');
  const [priority, setPriority] = useState('ALL');
  const [category, setCategory] = useState('ALL');

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Pass status filter to API if not ALL
      const data = await complaintApi.getAllComplaints(
        status !== 'ALL' ? status : null
      );
      setComplaints(data);
    } catch {
      setError('Unable to load complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // ── Local filters (priority, category, search) ────────────────────────────
  const filtered = complaints.filter(c => {
    const matchPriority = priority === 'ALL' || c.priority === priority;
    const matchCategory = category === 'ALL' || c.category === category;
    const q = search.toLowerCase();
    const matchSearch = !search || (
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      String(c.id).includes(q)
    );
    return matchPriority && matchCategory && matchSearch;
  });

  return (
    <Box>
      <PageHeader
        title="Complaint Management"
        subtitle="View, filter, assign, and manage all hostel maintenance complaints."
      />

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: '16px !important' }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search complaints…"
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
            <Grid xs={6} sm={2.5}>
              <TextField
                fullWidth select size="small"
                label="Status"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={6} sm={2.5}>
              <TextField
                fullWidth select size="small"
                label="Priority"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <MenuItem value="ALL">All Priorities</MenuItem>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={6} sm={2.5}>
              <TextField
                fullWidth select size="small"
                label="Category"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={6} sm={0.5}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<FilterListOutlined />}
                onClick={() => { setSearch(''); setStatus('ALL'); setPriority('ALL'); setCategory('ALL'); }}
                sx={{ whiteSpace: 'nowrap', minWidth: 80 }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>

          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1.5, display: 'block' }}>
            Showing {filtered.length} of {complaints.length} complaints
          </Typography>
        </CardContent>
      </Card>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <Alert
          severity="error" sx={{ mb: 2, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchComplaints}>Retry</Button>}
        >
          {error}
        </Alert>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <Card>
          <CardContent>
            {[1,2,3,4,5].map(i => (
              <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
                <Skeleton variant="rounded" width={36} height={36} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="45%" height={18} sx={{ mb: 0.5 }} />
                  <Skeleton width="70%" height={14} />
                </Box>
                <Skeleton width={80} height={24} />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Empty ─────────────────────────────────────────────────────────── */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <EmptyState
            icon={<ReportProblemOutlined sx={{ fontSize: 36 }} />}
            title="No complaints match your filters"
            description="Try adjusting the status, priority, or category filters."
            action={
              <Button
                variant="outlined"
                onClick={() => { setSearch(''); setStatus('ALL'); setPriority('ALL'); setCategory('ALL'); }}
              >
                Clear All Filters
              </Button>
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
                  {['#', 'Title', 'Category', 'Priority', 'Status', 'Room', 'Submitted', 'Action'].map(col => (
                    <th
                      key={col}
                      style={{
                        padding: '10px 16px', textAlign: 'left',
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
                {filtered.map((c, i) => {
                  const catCfg = CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.GENERAL;
                  return (
                    <tr
                      key={c.id}
                      style={{
                        backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EEF2FF'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#FAFAFA'}
                    >
                      <td style={{ padding: '11px 16px', fontSize: '0.8125rem', fontWeight: 700, color: '#4F46E5', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`${basePath}/complaints/${c.id}`)}>
                        #{c.id}
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9', maxWidth: 220 }}
                        onClick={() => navigate(`${basePath}/complaints/${c.id}`)}>
                        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {c.title}
                        </Typography>
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9' }}
                        onClick={() => navigate(`${basePath}/complaints/${c.id}`)}>
                        <Chip label={getCategoryLabel(c.category)} size="small"
                          sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600, bgcolor: catCfg.bg, color: catCfg.color }} />
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9' }}
                        onClick={() => navigate(`${basePath}/complaints/${c.id}`)}>
                        <PriorityChip priority={c.priority} />
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9' }}
                        onClick={() => navigate(`${basePath}/complaints/${c.id}`)}>
                        <StatusChip status={c.status} />
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '0.8125rem', color: '#475569', borderBottom: '1px solid #F1F5F9', fontFamily: 'monospace' }}
                        onClick={() => navigate(`${basePath}/complaints/${c.id}`)}>
                        {c.room_id ? `#${c.room_id}` : '—'}
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '0.8125rem', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`${basePath}/complaints/${c.id}`)}>
                        {formatRelative(c.created_at)}
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9' }}>
                        <Button
                          size="small"
                          variant={c.assigned_staff_id ? 'outlined' : 'contained'}
                          onClick={() => navigate(`${basePath}/complaints/${c.id}`)}
                          sx={{ fontSize: '0.75rem', py: 0.5, whiteSpace: 'nowrap' }}
                        >
                          {c.assigned_staff_id ? 'Manage' : 'Assign'}
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

export default WardenComplaintsPage;
