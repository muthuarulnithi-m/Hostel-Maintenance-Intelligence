import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button,
  Alert, Skeleton, Chip, TextField, InputAdornment,
  Divider,
} from '@mui/material';
import {
  SearchOutlined,
  HistoryOutlined,
  StarOutlined,
  Star,
} from '@mui/icons-material';
import PageHeader    from '../../components/common/PageHeader';
import StatusChip    from '../../components/common/StatusChip';
import PriorityChip  from '../../components/common/PriorityChip';
import EmptyState    from '../../components/common/EmptyState';
import complaintApi  from '../../api/complaintApi';
import ratingApi     from '../../api/ratingApi';
import {
  formatDate,
  getCategoryLabel,
  CATEGORY_CONFIG,
} from '../../utils/formatters';

// Mini star display
function MiniStars({ rating }) {
  if (!rating) return (
    <Typography variant="caption" sx={{ color: 'text.disabled' }}>Not rated</Typography>
  );
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      {[1,2,3,4,5].map(s => (
        <Star key={s} sx={{ fontSize: 14, color: s <= rating ? '#F59E0B' : '#E2E8F0' }} />
      ))}
    </Box>
  );
}

function StudentHistoryPage() {
  const navigate = useNavigate();

  const [complaints,  setComplaints]  = useState([]);
  const [ratingsMap,  setRatingsMap]  = useState({}); // { complaintId: ratingObj }
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all complaints
      const data = await complaintApi.getMyComplaints();

      // Show all terminal-state complaints (closed + cancelled)
      const history = data.filter(c =>
        ['CLOSED', 'CANCELLED'].includes(c.status)
      ).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      setComplaints(history);

      // Fetch my ratings and build a map by complaint_id
      try {
        const ratings = await ratingApi.getMyRatings();
        const map = {};
        ratings.forEach(r => { map[r.complaint_id] = r; });
        setRatingsMap(map);
      } catch {
        // Ratings not critical — continue without them
      }
    } catch {
      setError('Unable to load complaint history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const filtered = complaints.filter(c => {
    const q = search.toLowerCase();
    return !search || (
      c.title?.toLowerCase().includes(q) ||
      String(c.id).includes(q)
    );
  });

  const closedCount    = complaints.filter(c => c.status === 'CLOSED').length;
  const cancelledCount = complaints.filter(c => c.status === 'CANCELLED').length;
  const ratedCount     = Object.keys(ratingsMap).length;

  return (
    <Box>
      <PageHeader
        title="Complaint History"
        subtitle="All your closed and cancelled maintenance complaints."
      />

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <Chip label={`${closedCount} Closed`}     sx={{ bgcolor: '#DCFCE7', color: '#065F46', fontWeight: 600 }} />
        <Chip label={`${cancelledCount} Cancelled`} sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600 }} />
        <Chip
          icon={<StarOutlined sx={{ fontSize: '16px !important', color: '#F59E0B !important' }} />}
          label={`${ratedCount} Rated`}
          sx={{ bgcolor: '#FFFBEB', color: '#92400E', fontWeight: 600 }}
        />
      </Box>

      {/* Search */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: '14px !important' }}>
          <TextField
            size="small" placeholder="Search history by title or ID…"
            value={search} onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
            Showing {filtered.length} of {complaints.length} completed complaints
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
            title={search ? 'No history matches your search' : 'No complaint history yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Closed and cancelled complaints will appear here.'
            }
          />
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <Card>
          <CardContent sx={{ p: 0 }}>
            {filtered.map((c, i) => {
              const catCfg = CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.OTHER;
              const rating = ratingsMap[c.id];
              const isClosed = c.status === 'CLOSED';

              return (
                <Box key={c.id}>
                  {i > 0 && <Divider />}
                  <Box
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      px: 2.5, py: 2,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: '#EEF2FF' },
                    }}
                    onClick={() => navigate(`/student/complaints/${c.id}`)}
                  >
                    {/* Category emoji */}
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

                    {/* Main info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: { xs: 150, sm: 280 } }}
                        >
                          {c.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace', flexShrink: 0 }}>
                          #{c.id}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip label={getCategoryLabel(c.category)} size="small"
                          sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600, bgcolor: catCfg.bg, color: catCfg.color }} />
                        <PriorityChip priority={c.priority} size="small" />
                        <StatusChip status={c.status} />
                      </Box>
                    </Box>

                    {/* Right: date + rating */}
                    <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                        {formatDate(c.closed_at || c.cancelled_at || c.updated_at)}
                      </Typography>
                      {isClosed && (
                        <Box sx={{ mt: 0.5 }}>
                          {rating ? (
                            <MiniStars rating={rating.rating} />
                          ) : (
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<StarOutlined sx={{ fontSize: '14px !important' }} />}
                              onClick={e => {
                                e.stopPropagation();
                                navigate(`/student/complaints/${c.id}/verify`);
                              }}
                              sx={{ fontSize: '0.6875rem', py: 0, color: '#F59E0B' }}
                            >
                              Rate
                            </Button>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function getCategoryEmoji(category) {
  const map = { GENERAL:'📋', ELECTRICAL:'⚡', PLUMBING:'🔧', CARPENTRY:'🪚', CLEANING:'🧹', INTERNET:'🌐', OTHER:'📌' };
  return map[category] || '📋';
}

export default StudentHistoryPage;