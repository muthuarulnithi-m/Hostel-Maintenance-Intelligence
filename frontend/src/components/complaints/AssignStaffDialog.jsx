import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Radio, RadioGroup,
  FormControlLabel, Alert, CircularProgress,
  Chip, Divider, TextField, InputAdornment,
  Skeleton,
} from '@mui/material';
import {
  PersonOutlined,
  SearchOutlined,
  AssignmentIndOutlined,
} from '@mui/icons-material';
import staffApi from '../../api/staffApi';

// ── Availability badge config ─────────────────────────────────────────────────
const AVAIL_CONFIG = {
  AVAILABLE: { label: 'Available', color: '#10B981', bg: '#D1FAE5' },
  BUSY:      { label: 'Busy',      color: '#F59E0B', bg: '#FEF3C7' },
  ON_LEAVE:  { label: 'On Leave',  color: '#94A3B8', bg: '#F1F5F9' },
  INACTIVE:  { label: 'Inactive',  color: '#EF4444', bg: '#FEE2E2' },
};

/**
 * AssignStaffDialog
 * Shown when warden clicks "Assign Staff" on a complaint.
 *
 * Props:
 *   open            (bool)
 *   onClose         (fn)
 *   onAssign        (fn)  — called with staffId (number)
 *   currentStaffId  (number|null) — already assigned staff id
 *   loading         (bool)
 *   error           (string)
 */
function AssignStaffDialog({
  open,
  onClose,
  onAssign,
  currentStaffId = null,
  loading = false,
  error   = '',
}) {
  const [staffList,     setStaffList]     = useState([]);
  const [fetchingStaff, setFetchingStaff] = useState(false);
  const [selectedId,    setSelectedId]    = useState('');
  const [search,        setSearch]        = useState('');

  // Fetch staff list when dialog opens
  useEffect(() => {
    if (!open) return;
    setSelectedId(currentStaffId ? String(currentStaffId) : '');
    setSearch('');

    const fetchStaff = async () => {
      setFetchingStaff(true);
      try {
        const data = await staffApi.getAllStaff();
        setStaffList(data);
      } catch {
        setStaffList([]);
      } finally {
        setFetchingStaff(false);
      }
    };
    fetchStaff();
  }, [open, currentStaffId]);

  // Filter by search
  const filtered = staffList.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.employee_code?.toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  });

  const handleConfirm = () => {
    if (!selectedId) return;
    onAssign(Number(selectedId));
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssignmentIndOutlined sx={{ color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {currentStaffId ? 'Reassign Staff' : 'Assign Staff'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Select a maintenance staff member for this complaint
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important' }}>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search by employee code or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2 }}
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

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Staff list */}
        {fetchingStaff ? (
          <Box>
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="50%" height={18} />
                  <Skeleton width="30%" height={14} sx={{ mt: 0.5 }} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : filtered.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
            {search ? 'No staff match your search.' : 'No staff members found.'}
          </Typography>
        ) : (
          <RadioGroup
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
          >
            {filtered.map((staff, i) => {
              const avail  = AVAIL_CONFIG[staff.availability_status] || AVAIL_CONFIG.INACTIVE;
              const isCurrent = staff.id === currentStaffId;

              return (
                <Box key={staff.id}>
                  {i > 0 && <Divider />}
                  <FormControlLabel
                    value={String(staff.id)}
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                        <Box
                          sx={{
                            width: 36, height: 36, borderRadius: '50%',
                            bgcolor: '#EEF2FF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <PersonOutlined sx={{ fontSize: 18, color: '#4F46E5' }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Staff #{staff.id}
                            </Typography>
                            {isCurrent && (
                              <Chip
                                label="Currently Assigned"
                                size="small"
                                sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#EEF2FF', color: '#4F46E5' }}
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {staff.employee_code}
                            </Typography>
                            <Chip
                              label={avail.label}
                              size="small"
                              sx={{
                                height: 18, fontSize: '0.6rem',
                                bgcolor: avail.bg, color: avail.color,
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    }
                    sx={{
                      mx: 0,
                      borderRadius: 2,
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: 'action.hover' },
                      ...(selectedId === String(staff.id) && { bgcolor: '#EEF2FF' }),
                    }}
                  />
                </Box>
              );
            })}
          </RadioGroup>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading || !selectedId || fetchingStaff}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AssignmentIndOutlined />}
        >
          {loading ? 'Assigning…' : currentStaffId ? 'Reassign' : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AssignStaffDialog;