import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button,
  Alert, Skeleton, Chip, TextField, InputAdornment,
} from '@mui/material';
import { SearchOutlined, HistoryOutlined } from '@mui/icons-material';
import PageHeader   from '../../components/common/PageHeader';
import StatusChip   from '../../components/common/StatusChip';
import PriorityChip from '../../components/common/PriorityChip';
import EmptyState   from '../../components/common/EmptyState';
import complaintApi from '../../api/complaintApi';
import {
  formatDate,
  getCategoryLabel,
  CATEGORY_CONFIG,
} from '../../utils/formatters';

function StaffHistoryPage() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // GET /complaints/assigned/me — returns only complaints assigned to this staff member
      const data = await complaintApi.getAssignedComplaints();
      // Show only completed work — RESOLVED and CLOSED
      const done = data.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status));
      setComplaints(done.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
    } catch {
      setError('Unable to load work history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const filtered = complaints.filter(c => {
    const q = search.toLowerCase();
    return !search || c.title?.toLowerCase().includes(q) || String(c.id).includes(q);
  });

  return (
    <Box>
      <PageHeader
        title="Work History"
        subtitle="Complaints you have resolved or that are closed."
      />

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: '14px !important' }}>
          <TextField
            size="small" placeholder="Search history…" value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
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
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
            {filtered.length} completed complaint{filtered.length !== 1 ? 's' : ''}
          </Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchHistory}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {loading && (
        <Card><CardContent>
          {[1,2,3].map(i => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              <Skeleton variant="rounded" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="50%" height={18} sx={{ mb: 0.5 }} />
                <Skeleton width="30%" height={14} />
              </Box>
            </Box>
          ))}
        </CardContent></Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card>
          <EmptyState
            icon={<HistoryOutlined sx={{ fontSize: 36 }} />}
            title={search ? 'No history matches your search' : 'No completed work yet'}
            description={search ? 'Try a different search term.' : 'Resolved and closed complaints will appear here.'}
          />
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <Card>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Title', 'Category', 'Priority', 'Status', 'Resolved'].map(col => (
                    <th key={col} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: '0.6875rem', fontWeight: 600,
                      color: '#475569', letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      borderBottom: '2px solid #E2E8F0',
                      backgroundColor: '#F8FAFC', whiteSpace: 'nowrap',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const catCfg = CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.OTHER;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/staff/complaints/${c.id}`)}
                      style={{
                        backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EEF2FF'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#FAFAFA'}
                    >
                      <td style={{ padding: '11px 16px', fontSize: '0.8125rem', fontWeight: 700, color: '#4F46E5', borderBottom: '1px solid #F1F5F9' }}>#{c.id}</td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9', maxWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {c.title}
                        </Typography>
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9' }}>
                        <Chip label={getCategoryLabel(c.category)} size="small"
                          sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600, bgcolor: catCfg.bg, color: catCfg.color }} />
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9' }}>
                        <PriorityChip priority={c.priority} />
                      </td>
                      <td style={{ padding: '11px 16px', borderBottom: '1px solid #F1F5F9' }}>
                        <StatusChip status={c.status} />
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '0.8125rem', color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>
                        {formatDate(c.resolved_at || c.closed_at)}
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

export default StaffHistoryPage;
