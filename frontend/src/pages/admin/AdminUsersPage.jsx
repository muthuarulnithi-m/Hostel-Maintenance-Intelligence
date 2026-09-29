import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  TextField, InputAdornment, MenuItem, Alert,
  Skeleton, Chip, Divider, Avatar,
} from '@mui/material';
import { SearchOutlined, PeopleOutlined } from '@mui/icons-material';
import PageHeader  from '../../components/common/PageHeader';
import EmptyState  from '../../components/common/EmptyState';
import axiosInstance from '../../api/axios';
import { formatDate } from '../../utils/formatters';

const ROLE_CONFIG = {
  STUDENT: { label: 'Student',     color: '#4F46E5', bg: '#EEF2FF' },
  STAFF:   { label: 'Staff',       color: '#0D9488', bg: '#F0FDFA' },
  WARDEN:  { label: 'Warden',      color: '#D97706', bg: '#FFFBEB' },
  ADMIN:   { label: 'Admin',       color: '#DC2626', bg: '#FEF2F2' },
};

function AdminUsersPage() {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('ALL');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data);
    } catch {
      setError('Unable to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !search || (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
    return matchRole && matchSearch;
  });

  const countByRole = (role) =>
    role === 'ALL' ? users.length : users.filter(u => u.role === role).length;

  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle="View and manage all registered users in the system."
      />

      {/* Filter bar */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: '14px !important' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 240, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select size="small" label="Role"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="ALL">All Roles ({countByRole('ALL')})</MenuItem>
              {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v.label} ({countByRole(k)})</MenuItem>
              ))}
            </TextField>
          </Box>
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1, display: 'block' }}>
            Showing {filtered.length} of {users.length} users
          </Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchUsers}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {loading && (
        <Card><CardContent>
          {[1,2,3,4,5].map(i => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="40%" height={18} sx={{ mb: 0.5 }} />
                <Skeleton width="60%" height={14} />
              </Box>
              <Skeleton width={80} height={24} />
            </Box>
          ))}
        </CardContent></Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card>
          <EmptyState
            icon={<PeopleOutlined sx={{ fontSize: 36 }} />}
            title="No users found"
            description="Try adjusting your search or role filter."
          />
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <Card>
          <CardContent sx={{ p: 0 }}>
            {filtered.map((u, i) => {
              const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.STUDENT;
              const initials = u.name
                ? u.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                : '?';
              return (
                <Box key={u.id}>
                  {i > 0 && <Divider />}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.75 }}>
                    <Avatar
                      sx={{
                        width: 40, height: 40, flexShrink: 0,
                        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                        fontSize: '0.875rem', fontWeight: 700,
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {u.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {u.email}
                        {u.phone ? ` · ${u.phone}` : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                      <Chip
                        label={roleCfg.label}
                        size="small"
                        sx={{ bgcolor: roleCfg.bg, color: roleCfg.color, fontWeight: 600, fontSize: '0.6875rem' }}
                      />
                      <Box
                        sx={{
                          width: 8, height: 8, borderRadius: '50%',
                          bgcolor: u.is_active ? '#10B981' : '#EF4444',
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.disabled', display: { xs: 'none', sm: 'block' } }}>
                        {formatDate(u.created_at)}
                      </Typography>
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

export default AdminUsersPage;