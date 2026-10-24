import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, MenuItem,
  Skeleton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { SearchOutlined } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import complaintApi from '../../api/complaintApi';
import staffApi from '../../api/staffApi';
import { formatDate } from '../../utils/formatters';

const AVAIL_CONFIG = {
  AVAILABLE: { label: 'Available', color: '#047857', bg: '#D1FAE5' },
  BUSY:      { label: 'Busy',      color: '#B45309', bg: '#FEF3C7' },
  ON_LEAVE:  { label: 'On leave',  color: '#475569', bg: '#F1F5F9' },
  INACTIVE:  { label: 'Inactive',  color: '#B91C1C', bg: '#FEE2E2' },
};

function WardenStaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [skillsByStaff, setSkillsByStaff] = useState({});
  const [assignedCounts, setAssignedCounts] = useState({});
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [staff, complaints] = await Promise.all([
        staffApi.getAllStaff(),
        complaintApi.getAllComplaints(),
      ]);
      const skillRows = await Promise.all(
        staff.map(async member => [member.id, await staffApi.getStaffSkills(member.id)])
      );
      const counts = complaints.reduce((acc, complaint) => {
        if (complaint.assigned_staff_id != null) {
          acc[complaint.assigned_staff_id] = (acc[complaint.assigned_staff_id] || 0) + 1;
        }
        return acc;
      }, {});
      setStaffList(staff);
      setSkillsByStaff(Object.fromEntries(skillRows));
      setAssignedCounts(counts);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load staff information. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staffList.filter(member => {
      const skills = (skillsByStaff[member.id] || []).map(item => item.skill);
      const matchesStatus = availability === 'ALL' || member.availability_status === availability;
      const haystack = [member.name, member.email, member.employee_code, ...skills]
        .filter(Boolean).join(' ').toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    }).sort((a, b) => (a.name || a.employee_code).localeCompare(b.name || b.employee_code));
  }, [availability, search, skillsByStaff, staffList]);

  return (
    <Box>
      <PageHeader
        title="Staff Management"
        subtitle="Review staff contact details, work skills, availability, and assigned workload."
        action={<Button variant="outlined" onClick={fetchData}>Refresh</Button>}
      />

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            label="Search staff"
            value={search}
            onChange={event => setSearch(event.target.value)}
            sx={{ flex: '1 1 260px' }}
            InputProps={{ startAdornment: <SearchOutlined sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <TextField
            select
            size="small"
            label="Availability"
            value={availability}
            onChange={event => setAvailability(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="ALL">All statuses</MenuItem>
            {Object.entries(AVAIL_CONFIG).map(([value, config]) => (
              <MenuItem key={value} value={value}>{config.label}</MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={fetchData}>Retry</Button>}>
          {error}
        </Alert>
      )}

      <Card>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader size="small" aria-label="Staff members">
            <TableHead>
              <TableRow>
                {['Staff ID', 'Name', 'Employee ID', 'Email', 'Phone', 'Specialization', 'Availability', 'Assigned work', 'Joined'].map(label => (
                  <TableCell key={label} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && Array.from({ length: 4 }, (_, index) => (
                <TableRow key={`loading-${index}`}>
                  {Array.from({ length: 9 }, (_, cell) => (
                    <TableCell key={cell}><Skeleton width={cell === 3 ? 150 : 72} /></TableCell>
                  ))}
                </TableRow>
              ))}
              {!loading && !error && filtered.map(member => {
                const status = AVAIL_CONFIG[member.availability_status] || AVAIL_CONFIG.INACTIVE;
                const skills = (skillsByStaff[member.id] || []).map(item => item.skill);
                return (
                  <TableRow hover key={member.id}>
                    <TableCell>#{member.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>{member.name || '—'}</TableCell>
                    <TableCell>{member.employee_code || '—'}</TableCell>
                    <TableCell>{member.email || '—'}</TableCell>
                    <TableCell>{member.phone || '—'}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      {skills.length ? skills.map(skill => (
                        <Chip key={skill} label={skill.replaceAll('_', ' ')} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      )) : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="center">{assignedCounts[member.id] || 0}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(member.joined_at)}</TableCell>
                  </TableRow>
                );
              })}
              {!loading && !error && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState
                      title={staffList.length ? 'No staff match these filters' : 'No staff records yet'}
                      description={staffList.length ? 'Try a different name, skill, or availability status.' : 'Staff records will appear here when they are added.'}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {loading ? '—' : filtered.length} of {staffList.length} staff members
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}

export default WardenStaffPage;
