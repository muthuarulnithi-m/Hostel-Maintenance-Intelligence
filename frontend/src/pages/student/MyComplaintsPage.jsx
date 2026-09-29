import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, InputAdornment,
  ToggleButtonGroup, ToggleButton, Typography,
  Alert, Skeleton, Card, CardContent,
} from '@mui/material';
import {
  SearchOutlined,
  AddCircleOutlineOutlined,
  ReportProblemOutlined,
} from '@mui/icons-material';
import PageHeader     from '../../components/common/PageHeader';
import ComplaintCard  from '../../components/complaints/ComplaintCard';
import EmptyState     from '../../components/common/EmptyState';
import complaintApi   from '../../api/complaintApi';
import { getStatusLabel } from '../../utils/formatters';

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: 'ALL',         label: 'All' },
  { value: 'SUBMITTED',   label: 'Submitted' },
  { value: 'ASSIGNED',    label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD',     label: 'On Hold' },
  { value: 'RESOLVED',    label: 'Resolved' },
  { value: 'CLOSED',      label: 'Closed' },
  { value: 'CANCELLED',   label: 'Cancelled' },
];

function MyComplaintsPage() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // ── Fetch complaints ─────────────────────────────────────────────────────
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complaintApi.getMyComplaints();
      setComplaints(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setComplaints([]);
      } else {
        setError('Unable to load complaints. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // ── Filter locally ────────────────────────────────────────────────────────
  const filtered = complaints.filter(c => {
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchSearch = !search || (
      c.title?.toLowerCase().includes(searchLower) ||
      c.description?.toLowerCase().includes(searchLower) ||
      String(c.id).includes(searchLower)
    );
    return matchStatus && matchSearch;
  });

  // ── Count badge per status ────────────────────────────────────────────────
  const countByStatus = (status) =>
    status === 'ALL'
      ? complaints.length
      : complaints.filter(c => c.status === status).length;

  return (
    <Box>
      <PageHeader
        title="My Complaints"
        subtitle="Track the status of all your maintenance requests."
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

      {/* ── Search + filter bar ───────────────────────────────────────────── */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search complaints…"
              size="small"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 220, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Status filter tabs */}
          <Box sx={{ mt: 1.5, overflowX: 'auto' }}>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={(_, val) => { if (val) setStatusFilter(val); }}
              size="small"
              sx={{ flexWrap: 'nowrap' }}
            >
              {STATUS_FILTERS.map(f => (
                <ToggleButton
                  key={f.value}
                  value={f.value}
                  sx={{
                    px: 1.5, py: 0.5,
                    fontSize: '0.75rem', fontWeight: 500,
                    whiteSpace: 'nowrap',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color:   '#fff',
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  }}
                >
                  {f.label}
                  {countByStatus(f.value) > 0 && (
                    <Box
                      component="span"
                      sx={{
                        ml: 0.75,
                        bgcolor: statusFilter === f.value ? 'rgba(255,255,255,0.25)' : 'action.selected',
                        borderRadius: 10,
                        px: 0.75, py: 0.1,
                        fontSize: '0.6875rem', fontWeight: 700,
                      }}
                    >
                      {countByStatus(f.value)}
                    </Box>
                  )}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </CardContent>
      </Card>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button size="small" color="inherit" onClick={fetchComplaints}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ── Loading skeletons ─────────────────────────────────────────────── */}
      {loading && (
        <Box>
          {[1, 2, 3].map(i => (
            <Card key={i} sx={{ mb: 1.5 }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Skeleton variant="rounded" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="60%" height={20} sx={{ mb: 1 }} />
                    <Skeleton width="90%" height={16} />
                    <Skeleton width="40%" height={16} sx={{ mt: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <EmptyState
            icon={<ReportProblemOutlined sx={{ fontSize: 36 }} />}
            title={
              search || statusFilter !== 'ALL'
                ? 'No complaints match your filters'
                : "You haven't submitted any complaints yet"
            }
            description={
              search || statusFilter !== 'ALL'
                ? 'Try clearing your search or changing the status filter.'
                : 'Use the "New Complaint" button to report a maintenance issue.'
            }
            action={
              !search && statusFilter === 'ALL' ? (
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutlineOutlined />}
                  onClick={() => navigate('/student/complaints/new')}
                >
                  Submit First Complaint
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
                >
                  Clear Filters
                </Button>
              )
            }
          />
        </Card>
      )}

      {/* ── Complaint list ────────────────────────────────────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <Box>
          <Typography variant="caption" sx={{ color: 'text.disabled', mb: 1.5, display: 'block' }}>
            Showing {filtered.length} of {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
          </Typography>
          {filtered.map(complaint => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              basePath="/student"
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default MyComplaintsPage;