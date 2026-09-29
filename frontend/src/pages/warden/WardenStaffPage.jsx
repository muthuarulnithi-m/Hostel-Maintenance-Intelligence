import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid,
  Chip, Alert, Skeleton, TextField, MenuItem,
  Divider, Button,
} from '@mui/material';
import {
  PersonOutlined,
  BuildOutlined,
  SearchOutlined,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import staffApi   from '../../api/staffApi';

const AVAIL_CONFIG = {
  AVAILABLE: { label: 'Available', color: '#10B981', bg: '#D1FAE5' },
  BUSY:      { label: 'Busy',      color: '#F59E0B', bg: '#FEF3C7' },
  ON_LEAVE:  { label: 'On Leave',  color: '#94A3B8', bg: '#F1F5F9' },
  INACTIVE:  { label: 'Inactive',  color: '#EF4444', bg: '#FEE2E2' },
};

function WardenStaffPage() {
  const [staffList,    setStaffList]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [search,       setSearch]       = useState('');
  const [availFilter,  setAvailFilter]  = useState('ALL');

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await staffApi.getAllStaff();
      setStaffList(data);
    } catch {
      setError('Unable to load staff list. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const filtered = staffList.filter(s => {
    const matchAvail = availFilter === 'ALL' || s.availability_status === availFilter;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      s.employee_code?.toLowerCase().includes(q) ||
      String(s.id).includes(q);
    return matchAvail && matchSearch;
  });

  // Count by availability
  const countByAvail = (key) =>
    key === 'ALL' ? staffList.length : staffList.filter(s => s.availability_status === key).length;

  return (
    <Box>
      <PageHeader
        title="Staff Management"
        subtitle="View maintenance staff availability and skills."
      />

      {/* Filter bar */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: '16px !important' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by employee code or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: 'flex', color: 'text.disabled' }}>
                    <SearchOutlined sx={{ fontSize: 18 }} />
                  </Box>
                ),
              }}
            />
            <TextField
              select size="small"
              label="Availability"
              value={availFilter}
              onChange={e => setAvailFilter(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="ALL">All ({countByAvail('ALL')})</MenuItem>
              {Object.entries(AVAIL_CONFIG).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v.label} ({countByAvail(k)})</MenuItem>
              ))}
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchStaff}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {loading && (
        <Grid container spacing={2}>
          {[1,2,3,4,5,6].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card><CardContent><Skeleton variant="rectangular" height={120} /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card>
          <EmptyState
            icon={<BuildOutlined sx={{ fontSize: 36 }} />}
            title="No staff found"
            description="Try adjusting your search or availability filter."
          />
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <Grid container spacing={2}>
          {filtered.map(staff => {
            const avail = AVAIL_CONFIG[staff.availability_status] || AVAIL_CONFIG.INACTIVE;
            return (
              <Grid item xs={12} sm={6} md={4} key={staff.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Box
                        sx={{
                          width: 44, height: 44, borderRadius: '50%',
                          bgcolor: '#EEF2FF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <PersonOutlined sx={{ color: '#4F46E5', fontSize: 22 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Staff #{staff.id}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {staff.employee_code}
                        </Typography>
                      </Box>
                      <Chip
                        label={avail.label}
                        size="small"
                        sx={{ bgcolor: avail.bg, color: avail.color, fontWeight: 600, fontSize: '0.6875rem' }}
                      />
                    </Box>

                    <Divider sx={{ mb: 1.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Staff ID
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        #{staff.id}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Joined
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {staff.joined_at ? new Date(staff.joined_at).getFullYear() : '—'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

export default WardenStaffPage;