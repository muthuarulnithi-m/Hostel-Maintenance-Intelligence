import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  TextField, InputAdornment, Alert, Skeleton,
  Chip, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress,
  Snackbar, MenuItem, Grid,
  //  VisibilityOutlined,
  // VisibilityOffOutlined,
  // LockOutlined,
} from '@mui/material';
import {
  
  SearchOutlined, BuildOutlined, AddOutlined,
  PersonOutlined,
} from '@mui/icons-material';
import PageHeader  from '../../components/common/PageHeader';
import EmptyState  from '../../components/common/EmptyState';
import staffApi    from '../../api/staffApi';
import { formatDate } from '../../utils/formatters';

const AVAIL_CONFIG = {
  AVAILABLE: { label:'Available', color:'#10B981', bg:'#D1FAE5' },
  BUSY:      { label:'Busy',      color:'#F59E0B', bg:'#FEF3C7' },
  ON_LEAVE:  { label:'On Leave',  color:'#94A3B8', bg:'#F1F5F9' },
  INACTIVE:  { label:'Inactive',  color:'#EF4444', bg:'#FEE2E2' },
};

const SKILL_OPTIONS = ['ELECTRICAL','PLUMBING','CIVIL','FURNITURE','SANITATION','NETWORK','CLEANING','SECURITY','GENERAL'];

// ─── Create Staff Dialog ──────────────────────────────────────────────────────
function CreateStaffDialog({ open, onClose, onSuccess }) {
  const [form,    setForm]    = useState({ name:'', email:'', phone:'', password:'', employee_code:'' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const reset = () => { setForm({ name:'', email:'', phone:'', password:'', employee_code:'' }); setErrors({}); setError(''); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())          e.name          = 'Name is required.';
    if (!form.email.trim())         e.email         = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password)             e.password      = 'Password is required.';
    else if (form.password.length < 8) e.password   = 'Minimum 8 characters.';
    if (!form.employee_code.trim()) e.employee_code = 'Employee code is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const created = await staffApi.createStaff({
        name:          form.name.trim(),
        email:         form.email.trim(),
        phone:         form.phone.trim() || undefined,
        password:      form.password,
        employee_code: form.employee_code.trim().toUpperCase(),
      });
      onSuccess(created);
      reset();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to create staff account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !loading && (reset(), onClose())} maxWidth="sm" fullWidth>
      <DialogTitle>Create Staff Account</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{error}</Alert>}
        <Box sx={{ display:'flex', flexDirection:'column', gap:2, pt:1 }}>
          <TextField fullWidth label="Full Name *" size="small"
            value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
            error={!!errors.name} helperText={errors.name} />
          <TextField fullWidth label="Email *" size="small" type="email"
            value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
            error={!!errors.email} helperText={errors.email} />
          <TextField fullWidth label="Phone" size="small"
            value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}
            helperText="Optional" />
          <TextField fullWidth label="Password *" size="small" type="password"
            value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}
            error={!!errors.password} helperText={errors.password || 'Minimum 8 characters'} />
          <TextField fullWidth label="Employee Code *" size="small"
            value={form.employee_code} onChange={e=>setForm(p=>({...p,employee_code:e.target.value}))}
            error={!!errors.employee_code} helperText={errors.employee_code || 'Unique code e.g. EMP001'}
            inputProps={{ style:{ textTransform:'uppercase' } }} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>{reset();onClose();}} disabled={loading} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddOutlined />}>
          {loading ? 'Creating…' : 'Create Staff'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function AdminStaffPage() {
  const [staffList,  setStaffList]  = useState([]);
  const [skillsMap,  setSkillsMap]  = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [availFilter,setAvailFilter]= useState('ALL');
  const [createDialog, setCreateDialog] = useState(false);
  const [snackbar,   setSnackbar]   = useState({ open:false, message:'' });
  const showSnack = (msg) => setSnackbar({ open:true, message:msg });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await staffApi.getAllStaff();
      setStaffList(data);
      // Fetch skills for each
      const map = {};
      await Promise.all(data.map(async s => {
        try {
          const skills = await staffApi.getStaffSkills(s.id);
          map[s.id] = skills;
        } catch { map[s.id] = []; }
      }));
      setSkillsMap(map);
    } catch {
      setError('Unable to load staff list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = staffList.filter(s => {
    const matchAvail  = availFilter === 'ALL' || s.availability_status === availFilter;
    const q           = search.toLowerCase();
    const matchSearch = !search || s.employee_code?.toLowerCase().includes(q) || String(s.id).includes(q);
    return matchAvail && matchSearch;
  });

  return (
    <Box>
      <PageHeader
        title="Staff Management"
        subtitle="Create and manage maintenance staff accounts and skills."
        action={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setCreateDialog(true)}>
            Add Staff
          </Button>
        }
      />

      <Card sx={{ mb:2.5 }}>
        <CardContent sx={{ py:'14px !important' }}>
          <Box sx={{ display:'flex', gap:2, flexWrap:'wrap', alignItems:'center' }}>
            <TextField size="small" placeholder="Search by employee code or ID…"
              value={search} onChange={e=>setSearch(e.target.value)} sx={{ minWidth:240 }}
              slotProps={{
                input: { startAdornment:(
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize:18, color:'text.disabled' }} />
                </InputAdornment>
              )
                },
              }}
            />
            <TextField select size="small" label="Availability"
              value={availFilter} onChange={e=>setAvailFilter(e.target.value)} sx={{ minWidth:160 }}>
              <MenuItem value="ALL">All ({staffList.length})</MenuItem>
              {Object.entries(AVAIL_CONFIG).map(([k,v]) => (
                <MenuItem key={k} value={k}>{v.label} ({staffList.filter(s=>s.availability_status===k).length})</MenuItem>
              ))}
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }}
        action={<Button size="small" color="inherit" onClick={fetchData}>Retry</Button>}>{error}</Alert>}

      {loading && (
        <Grid container spacing={2}>
          {[1,2,3,4].map(i => (
            <Grid xs={12} sm={6} key={i}>
              <Card><CardContent><Skeleton variant="rectangular" height={120} /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && filtered.length === 0 && (
        <Card><EmptyState icon={<BuildOutlined sx={{ fontSize:36 }} />}
          title="No staff found" description="Create a staff account using the button above." /></Card>
      )}

      {!loading && filtered.length > 0 && (
        <Grid container spacing={2}>
          {filtered.map(staff => {
            const avail  = AVAIL_CONFIG[staff.availability_status] || AVAIL_CONFIG.INACTIVE;
            const skills = skillsMap[staff.id] || [];
            return (
              <Grid xs={12} sm={6} md={4} key={staff.id}>
                <Card sx={{ height:'100%' }}>
                  <CardContent>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1.5 }}>
                      <Box sx={{ width:44, height:44, borderRadius:'50%', bgcolor:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <PersonOutlined sx={{ color:'#4F46E5', fontSize:22 }} />
                      </Box>
                      <Box sx={{ flex:1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight:600 }}>Staff #{staff.id}</Typography>
                        <Typography variant="caption" sx={{ color:'text.secondary' }}>{staff.employee_code}</Typography>
                      </Box>
                      <Chip label={avail.label} size="small"
                        sx={{ bgcolor:avail.bg, color:avail.color, fontWeight:600, fontSize:'0.6875rem' }} />
                    </Box>
                    <Divider sx={{ mb:1.5 }} />
                    {/* Skills */}
                    <Typography variant="caption" sx={{ fontWeight:600, color:'text.secondary', display:'block', mb:0.75 }}>
                      SKILLS
                    </Typography>
                    {skills.length === 0 ? (
                      <Typography variant="caption" sx={{ color:'text.disabled' }}>No skills assigned</Typography>
                    ) : (
                      <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.5 }}>
                        {skills.map(s => (
                          <Chip key={s.id} label={s.skill} size="small"
                            sx={{ height:18, fontSize:'0.6rem', bgcolor:'#EEF2FF', color:'#4F46E5', fontWeight:600 }} />
                        ))}
                      </Box>
                    )}
                    <Divider sx={{ my:1.5 }} />
                    <Typography variant="caption" sx={{ color:'text.disabled' }}>
                      Joined: {formatDate(staff.joined_at)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <CreateStaffDialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        onSuccess={(s) => {
          setStaffList(p => [...p, s]);
          setSkillsMap(p => ({ ...p, [s.id]: [] }));
          showSnack('Staff account created successfully.');
        }}
      />

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(p=>({...p,open:false}))}
        anchorOrigin={{ vertical:'bottom', horizontal:'right' }}>
        <Alert onClose={() => setSnackbar(p=>({...p,open:false}))} severity="success" sx={{ borderRadius:2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminStaffPage;