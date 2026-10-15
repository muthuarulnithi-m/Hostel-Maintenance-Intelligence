import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  TextField, InputAdornment, MenuItem, Alert,
  Skeleton, Chip, Divider, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Snackbar, IconButton,
} from '@mui/material';
import {
  SearchOutlined, PeopleOutlined,
  MeetingRoomOutlined, PersonAddOutlined,
  AddOutlined, VisibilityOutlined, VisibilityOffOutlined,
  LockOutlined,
} from '@mui/icons-material';
import PageHeader    from '../../components/common/PageHeader';
import EmptyState    from '../../components/common/EmptyState';
import axiosInstance from '../../api/axios';
import hostelApi     from '../../api/hostelApi';
import { formatDate } from '../../utils/formatters';

const ROLE_CONFIG = {
  STUDENT: { label:'Student',   color:'#4F46E5', bg:'#EEF2FF' },
  STAFF:   { label:'Staff',     color:'#0D9488', bg:'#F0FDFA' },
  WARDEN:  { label:'Warden',    color:'#D97706', bg:'#FFFBEB' },
  ADMIN:   { label:'Admin',     color:'#DC2626', bg:'#FEF2F2' },
};

// ─── Create Student Dialog ────────────────────────────────────────────────────
function CreateStudentDialog({ open, onClose, onSuccess }) {
  const [form,     setForm]     = useState({ name:'', email:'', phone:'', password:'' });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPass, setShowPass] = useState(false);

  const reset = () => {
    setForm({ name:'', email:'', phone:'', password:'' });
    setErrors({});
    setError('');
    setShowPass(false);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name     = 'Full name is required.';
    if (!form.email.trim()) e.email    = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password)     e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/users', {
        name:     form.name.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim() || undefined,
        password: form.password,
        role:     'STUDENT',
      });
      onSuccess(response.data);
      reset();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to create student account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => { if (!loading) { reset(); onClose(); } }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
          <PersonAddOutlined sx={{ color:'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight:600 }}>Create Student Account</Typography>
            <Typography variant="caption" sx={{ color:'text.secondary' }}>
              Admin-created accounts only — public registration is disabled
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{error}</Alert>
        )}
        <Box sx={{ display:'flex', flexDirection:'column', gap:2, pt:1 }}>

          {/* Name */}
          <TextField
            fullWidth label="Full Name *" size="small"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            error={!!errors.name} helperText={errors.name}
            placeholder="e.g. Arjun Kumar"
            disabled={loading}
          />

          {/* Email */}
          <TextField
            fullWidth label="Email Address *" size="small" type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            error={!!errors.email} helperText={errors.email}
            placeholder="student@example.com"
            disabled={loading}
          />

          {/* Phone */}
          <TextField
            fullWidth label="Phone Number" size="small"
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            helperText="Optional — for urgent notifications"
            placeholder="10-digit mobile number"
            disabled={loading}
          />

          {/* Password with show/hide */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight:600, color:'text.primary', mb:0.5, display:'block' }}>
              Password *
            </Typography>
            <TextField
              fullWidth size="small"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              error={!!errors.password}
              helperText={errors.password || 'Minimum 8 characters — share this with the student'}
              placeholder="Enter a secure password"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ fontSize:16, color:'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPass(p => !p)}
                      edge="end" size="small" tabIndex={-1}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass
                        ? <VisibilityOffOutlined sx={{ fontSize:18 }} />
                        : <VisibilityOutlined   sx={{ fontSize:18 }} />
                      }
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Info note */}
          <Alert severity="info" sx={{ borderRadius:2 }}>
            <Typography variant="caption">
              After creating the account, go to the <strong>Users</strong> list
              and use <strong>"Assign Room"</strong> to assign this student to a room.
              Students cannot submit complaints without a room assignment.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { reset(); onClose(); }} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PersonAddOutlined />}
        >
          {loading ? 'Creating…' : 'Create Student'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Assign Room Dialog ───────────────────────────────────────────────────────
function AssignRoomDialog({ open, onClose, onSuccess, student }) {
  const [rooms,        setRooms]        = useState([]);
  const [blocks,       setBlocks]       = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [startDate,    setStartDate]    = useState(new Date().toISOString().split('T')[0]);
  const [loading,      setLoading]      = useState(false);
  const [fetching,     setFetching]     = useState(false);
  const [error,        setError]        = useState('');
  const [fieldErrors,  setFieldErrors]  = useState({});

  useEffect(() => {
    if (!open) return;
    setSelectedRoom('');
    setError('');
    setFieldErrors({});

    const fetchRooms = async () => {
      setFetching(true);
      try {
        const [b, r] = await Promise.all([
          hostelApi.getBlocks(),
          hostelApi.getRooms(),
        ]);
        setBlocks(b);
        setRooms(r.filter(room => room.is_active));
      } catch {
        setError('Unable to load rooms.');
      } finally {
        setFetching(false);
      }
    };
    fetchRooms();
  }, [open]);

  const getBlockName = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    return block ? `Block ${block.name}` : '';
  };

  const validate = () => {
    const e = {};
    if (!selectedRoom) e.room = 'Please select a room.';
    if (!startDate)    e.date = 'Start date is required.';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const result = await hostelApi.assignStudent({
        student_id: student.id,
        room_id:    Number(selectedRoom),
        start_date: startDate,
      });
      onSuccess(result);
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Assignment failed. Student may already be assigned to a room.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
          <MeetingRoomOutlined sx={{ color:'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight:600 }}>Assign Room</Typography>
            <Typography variant="caption" sx={{ color:'text.secondary' }}>
              Assigning to: <strong>{student?.name}</strong>
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{error}</Alert>}
        {fetching ? (
          <Box sx={{ textAlign:'center', py:3 }}>
            <CircularProgress size={32} />
            <Typography variant="body2" sx={{ mt:1, color:'text.secondary' }}>Loading rooms…</Typography>
          </Box>
        ) : (
          <Box sx={{ display:'flex', flexDirection:'column', gap:2, pt:1 }}>
            <TextField
              fullWidth select label="Select Room *" size="small"
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              error={!!fieldErrors.room} helperText={fieldErrors.room}
            >
              <MenuItem value="" disabled><em>Choose a room</em></MenuItem>
              {rooms.map(room => (
                <MenuItem key={room.id} value={room.id}>
                  {getBlockName(room.block_id)} — Room {room.room_number}
                  {' '}(Floor {room.floor}, Capacity: {room.capacity})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth label="Start Date *" size="small" type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              error={!!fieldErrors.date} helperText={fieldErrors.date}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || fetching}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <MeetingRoomOutlined />}
        >
          {loading ? 'Assigning…' : 'Assign Room'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function AdminUsersPage() {
  const [users,           setUsers]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [search,          setSearch]          = useState('');
  const [roleFilter,      setRoleFilter]      = useState('ALL');
  const [createDialog,    setCreateDialog]    = useState(false);
  const [assignDialog,    setAssignDialog]    = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [snackbar,        setSnackbar]        = useState({ open:false, message:'' });
  const showSnack = (msg) => setSnackbar({ open:true, message:msg });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data);
    } catch {
      setError('Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const matchRole   = roleFilter === 'ALL' || u.role === roleFilter;
    const q           = search.toLowerCase();
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
        subtitle="Create and manage all user accounts in the system."
        action={
          <Button
            variant="contained"
            startIcon={<PersonAddOutlined />}
            onClick={() => setCreateDialog(true)}
          >
            Create Student
          </Button>
        }
      />

      {/* Filter bar */}
      <Card sx={{ mb:2.5 }}>
        <CardContent sx={{ py:'14px !important' }}>
          <Box sx={{ display:'flex', gap:2, flexWrap:'wrap', alignItems:'center' }}>
            <TextField
              size="small"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth:240, flex:1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ fontSize:18, color:'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select size="small" label="Role"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              sx={{ minWidth:160 }}
            >
              <MenuItem value="ALL">All Roles ({countByRole('ALL')})</MenuItem>
              {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v.label} ({countByRole(k)})</MenuItem>
              ))}
            </TextField>
          </Box>
          <Typography variant="caption" sx={{ color:'text.disabled', mt:1, display:'block' }}>
            Showing {filtered.length} of {users.length} users
          </Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb:2, borderRadius:2 }}
          action={<Button size="small" color="inherit" onClick={fetchUsers}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {loading && (
        <Card><CardContent>
          {[1,2,3,4,5].map(i => (
            <Box key={i} sx={{ display:'flex', gap:2, mb:1.5, alignItems:'center' }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex:1 }}>
                <Skeleton width="40%" height={18} sx={{ mb:0.5 }} />
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
            icon={<PeopleOutlined sx={{ fontSize:36 }} />}
            title="No users found"
            description="Try adjusting your search or role filter."
          />
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <Card>
          <CardContent sx={{ p:0 }}>
            {filtered.map((u, i) => {
              const roleCfg  = ROLE_CONFIG[u.role] || ROLE_CONFIG.STUDENT;
              const initials = u.name
                ? u.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
                : '?';
              const isStudent = u.role === 'STUDENT';

              return (
                <Box key={u.id}>
                  {i > 0 && <Divider />}
                  <Box sx={{ display:'flex', alignItems:'center', gap:2, px:2.5, py:1.75 }}>
                    <Avatar
                      sx={{
                        width:40, height:40, flexShrink:0,
                        background:'linear-gradient(135deg,#4F46E5,#7C3AED)',
                        fontSize:'0.875rem', fontWeight:700,
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Box sx={{ flex:1, minWidth:0 }}>
                      <Typography variant="body2" sx={{ fontWeight:600 }}>
                        {u.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color:'text.secondary' }}>
                        {u.email}{u.phone ? ` · ${u.phone}` : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.5, flexShrink:0 }}>
                      <Chip
                        label={roleCfg.label} size="small"
                        sx={{ bgcolor:roleCfg.bg, color:roleCfg.color, fontWeight:600, fontSize:'0.6875rem' }}
                      />
                      <Box
                        sx={{
                          width:8, height:8, borderRadius:'50%',
                          bgcolor: u.is_active ? '#10B981' : '#EF4444',
                        }}
                      />
                      <Typography variant="caption" sx={{ color:'text.disabled', display:{xs:'none', sm:'block'} }}>
                        {formatDate(u.created_at)}
                      </Typography>
                      {isStudent && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<MeetingRoomOutlined sx={{ fontSize:'14px !important' }} />}
                          onClick={() => { setSelectedStudent(u); setAssignDialog(true); }}
                          sx={{ fontSize:'0.75rem', py:0.5, whiteSpace:'nowrap' }}
                        >
                          Assign Room
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Create Student Dialog */}
      <CreateStudentDialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        onSuccess={(u) => {
          setUsers(p => [u, ...p]);
          showSnack(`Student account for "${u.name}" created successfully.`);
        }}
      />

      {/* Assign Room Dialog */}
      {selectedStudent && (
        <AssignRoomDialog
          open={assignDialog}
          onClose={() => { setAssignDialog(false); setSelectedStudent(null); }}
          student={selectedStudent}
          onSuccess={() => {
            showSnack(`Room assigned to ${selectedStudent.name} successfully.`);
            setAssignDialog(false);
            setSelectedStudent(null);
          }}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open:false }))}
        anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
      >
        <Alert
          onClose={() => setSnackbar(p => ({ ...p, open:false }))}
          severity="success"
          sx={{ borderRadius:2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminUsersPage;