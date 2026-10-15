import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  Alert, Skeleton, Grid, Divider, Chip,
  Accordion, AccordionSummary, AccordionDetails,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Snackbar, CircularProgress,
  Step, Stepper, StepLabel,
} from '@mui/material';
import {
  HomeWorkOutlined, ExpandMoreOutlined,
  MeetingRoomOutlined, LayersOutlined,
  AddOutlined, CheckCircleOutlined,
} from '@mui/icons-material';
import PageHeader  from '../../components/common/PageHeader';
import EmptyState  from '../../components/common/EmptyState';
import hostelApi   from '../../api/hostelApi';

// ─── Create Hostel Dialog ─────────────────────────────────────────────────────
function CreateHostelDialog({ open, onClose, onSuccess }) {
  const [form,    setForm]    = useState({ name: '', code: '', address: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const reset = () => { setForm({ name:'', code:'', address:'' }); setErrors({}); setError(''); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Hostel name is required.';
    if (!form.code.trim())    e.code    = 'Hostel code is required.';
    if (!form.address.trim()) e.address = 'Address is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const created = await hostelApi.create({
        name:    form.name.trim(),
        code:    form.code.trim().toUpperCase(),
        address: form.address.trim(),
      });
      onSuccess(created);
      reset();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to create hostel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => { if (!loading) { reset(); onClose(); } }} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Hostel</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField fullWidth label="Hostel Name *" size="small"
            value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))}
            error={!!errors.name} helperText={errors.name}
            placeholder="e.g. Boys Hostel Block A" />
          <TextField fullWidth label="Hostel Code *" size="small"
            value={form.code} onChange={e => setForm(p=>({...p,code:e.target.value}))}
            error={!!errors.code} helperText={errors.code || 'Short unique code e.g. BHA'}
            placeholder="e.g. BHA" inputProps={{ style: { textTransform: 'uppercase' } }} />
          <TextField fullWidth label="Address *" size="small" multiline rows={2}
            value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))}
            error={!!errors.address} helperText={errors.address}
            placeholder="Full hostel address" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { reset(); onClose(); }} disabled={loading} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddOutlined />}>
          {loading ? 'Creating…' : 'Create Hostel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Create Block Dialog ──────────────────────────────────────────────────────
function CreateBlockDialog({ open, onClose, onSuccess, hostels }) {
  const [form,    setForm]    = useState({ hostel_id: '', name: '', code: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const reset = () => { setForm({ hostel_id:'', name:'', code:'' }); setErrors({}); setError(''); };

  const validate = () => {
    const e = {};
    if (!form.hostel_id) e.hostel_id = 'Please select a hostel.';
    if (!form.name.trim()) e.name    = 'Block name is required.';
    if (!form.code.trim()) e.code    = 'Block code is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const created = await hostelApi.createBlock({
        hostel_id: Number(form.hostel_id),
        name:      form.name.trim(),
        code:      form.code.trim().toUpperCase(),
      });
      onSuccess(created);
      reset();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to create block.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => { if (!loading) { reset(); onClose(); } }} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Block</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField fullWidth select label="Hostel *" size="small"
            value={form.hostel_id} onChange={e => setForm(p=>({...p,hostel_id:e.target.value}))}
            error={!!errors.hostel_id} helperText={errors.hostel_id}>
            <MenuItem value="" disabled><em>Select hostel</em></MenuItem>
            {hostels.map(h => <MenuItem key={h.id} value={h.id}>{h.name} ({h.code})</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Block Name *" size="small"
            value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))}
            error={!!errors.name} helperText={errors.name}
            placeholder="e.g. Block A" />
          <TextField fullWidth label="Block Code *" size="small"
            value={form.code} onChange={e => setForm(p=>({...p,code:e.target.value}))}
            error={!!errors.code} helperText={errors.code || 'Short code e.g. A'}
            placeholder="e.g. A" inputProps={{ style: { textTransform: 'uppercase' } }} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { reset(); onClose(); }} disabled={loading} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddOutlined />}>
          {loading ? 'Creating…' : 'Create Block'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Create Room Dialog ───────────────────────────────────────────────────────
function CreateRoomDialog({ open, onClose, onSuccess, blocks }) {
  const [form,    setForm]    = useState({ block_id:'', room_number:'', floor:'', capacity:'1' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const reset = () => { setForm({ block_id:'', room_number:'', floor:'', capacity:'1' }); setErrors({}); setError(''); };

  const validate = () => {
    const e = {};
    if (!form.block_id)          e.block_id    = 'Please select a block.';
    if (!form.room_number.trim()) e.room_number = 'Room number is required.';
    if (!form.floor)              e.floor       = 'Floor number is required.';
    else if (isNaN(form.floor) || Number(form.floor) < 0) e.floor = 'Enter a valid floor number.';
    if (!form.capacity || Number(form.capacity) < 1) e.capacity = 'Capacity must be at least 1.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const created = await hostelApi.createRoom({
        block_id:    Number(form.block_id),
        room_number: form.room_number.trim(),
        floor:       Number(form.floor),
        capacity:    Number(form.capacity),
      });
      onSuccess(created);
      reset();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => { if (!loading) { reset(); onClose(); } }} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Room</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField fullWidth select label="Block *" size="small"
            value={form.block_id} onChange={e => setForm(p=>({...p,block_id:e.target.value}))}
            error={!!errors.block_id} helperText={errors.block_id}>
            <MenuItem value="" disabled><em>Select block</em></MenuItem>
            {blocks.map(b => <MenuItem key={b.id} value={b.id}>Block {b.name} ({b.code})</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Room Number *" size="small"
            value={form.room_number} onChange={e => setForm(p=>({...p,room_number:e.target.value}))}
            error={!!errors.room_number} helperText={errors.room_number}
            placeholder="e.g. 101 or A-101" />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth label="Floor *" size="small" type="number"
                value={form.floor} onChange={e => setForm(p=>({...p,floor:e.target.value}))}
                error={!!errors.floor} helperText={errors.floor}
                inputProps={{ min: 0 }} placeholder="0" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Capacity *" size="small" type="number"
                value={form.capacity} onChange={e => setForm(p=>({...p,capacity:e.target.value}))}
                error={!!errors.capacity} helperText={errors.capacity || 'Max students per room'}
                inputProps={{ min: 1 }} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { reset(); onClose(); }} disabled={loading} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddOutlined />}>
          {loading ? 'Creating…' : 'Create Room'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function AdminHostelPage() {
  const [hostels, setHostels] = useState([]);
  const [blocks,  setBlocks]  = useState([]);
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [hostelDialog, setHostelDialog] = useState(false);
  const [blockDialog,  setBlockDialog]  = useState(false);
  const [roomDialog,   setRoomDialog]   = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const showSnack = (msg) => setSnackbar({ open: true, message: msg });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [h, b, r] = await Promise.all([
        hostelApi.getAll(),
        hostelApi.getBlocks(),
        hostelApi.getRooms(),
      ]);
      setHostels(h);
      setBlocks(b);
      setRooms(r);
    } catch {
      setError('Unable to load hostel data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sequential creation guide steps
  const setupSteps = [
    { label: 'Create Hostel',  done: hostels.length > 0 },
    { label: 'Create Block',   done: blocks.length  > 0 },
    { label: 'Create Room',    done: rooms.length   > 0 },
  ];
  const currentStep = setupSteps.findIndex(s => !s.done);

  if (loading) {
    return (
      <Box>
        <PageHeader title="Hostel Management" />
        <Card><CardContent><Skeleton variant="rectangular" height={200} /></CardContent></Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Hostel Management"
        subtitle="Set up and manage hostels, blocks, and rooms."
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={fetchData}>Refresh</Button>
            <Button size="small" variant="contained" startIcon={<AddOutlined />}
              onClick={() => {
                if (hostels.length === 0)      setHostelDialog(true);
                else if (blocks.length === 0)  setBlockDialog(true);
                else                           setRoomDialog(true);
              }}>
              Add {hostels.length === 0 ? 'Hostel' : blocks.length === 0 ? 'Block' : 'Room'}
            </Button>
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchData}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* ── Setup guide ─────────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Setup Guide — Follow this order
          </Typography>
          <Stepper activeStep={currentStep === -1 ? 3 : currentStep} alternativeLabel>
            {setupSteps.map((step, i) => (
              <Step key={step.label} completed={step.done}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, flexWrap: 'wrap' }}>
            <Button size="small" variant={hostels.length === 0 ? 'contained' : 'outlined'}
              startIcon={<HomeWorkOutlined />} onClick={() => setHostelDialog(true)}>
              + Hostel
            </Button>
            <Button size="small" variant={hostels.length > 0 && blocks.length === 0 ? 'contained' : 'outlined'}
              startIcon={<LayersOutlined />} onClick={() => setBlockDialog(true)}
              disabled={hostels.length === 0}>
              + Block
            </Button>
            <Button size="small" variant={blocks.length > 0 && rooms.length === 0 ? 'contained' : 'outlined'}
              startIcon={<MeetingRoomOutlined />} onClick={() => setRoomDialog(true)}
              disabled={blocks.length === 0}>
              + Room
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Hostels',      value: hostels.length,                   color: '#4F46E5', icon: <HomeWorkOutlined /> },
          { label: 'Blocks',       value: blocks.length,                    color: '#0D9488', icon: <LayersOutlined /> },
          { label: 'Rooms',        value: rooms.length,                     color: '#D97706', icon: <MeetingRoomOutlined /> },
          { label: 'Active Rooms', value: rooms.filter(r=>r.is_active).length, color: '#10B981', icon: <CheckCircleOutlined /> },
        ].map(item => (
          <Grid item xs={6} md={3} key={item.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: '20px !important' }}>
                <Box sx={{ width:44, height:44, borderRadius:2, bgcolor:`${item.color}18`, mx:'auto', mb:1, display:'flex', alignItems:'center', justifyContent:'center', color:item.color }}>
                  {React.cloneElement(item.icon, { sx:{ fontSize:22 } })}
                </Box>
                <Typography variant="h4" sx={{ fontWeight:800, color:item.color, lineHeight:1 }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" sx={{ color:'text.secondary' }}>{item.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Hostel → Block → Room tree ───────────────────────────────────── */}
      {hostels.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HomeWorkOutlined sx={{ fontSize: 36 }} />}
            title="No hostels configured yet"
            description='Click "+ Hostel" above to create your first hostel.'
          />
        </Card>
      ) : (
        hostels.map(hostel => {
          const hostelBlocks = blocks.filter(b => b.hostel_id === hostel.id);
          return (
            <Card key={hostel.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display:'flex', alignItems:'center', gap:2, mb:2 }}>
                  <Box sx={{ width:44, height:44, borderRadius:2, background:'linear-gradient(135deg,#4F46E5,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <HomeWorkOutlined sx={{ color:'#fff', fontSize:22 }} />
                  </Box>
                  <Box sx={{ flex:1 }}>
                    <Typography variant="h6" sx={{ fontWeight:700 }}>{hostel.name}</Typography>
                    <Typography variant="caption" sx={{ color:'text.secondary' }}>
                      Code: {hostel.code} · {hostel.address}
                    </Typography>
                  </Box>
                  <Chip label={hostel.is_active ? 'Active':'Inactive'} size="small"
                    sx={{ bgcolor:hostel.is_active?'#D1FAE5':'#F1F5F9', color:hostel.is_active?'#065F46':'#64748B', fontWeight:600 }} />
                </Box>
                <Divider sx={{ mb:1.5 }} />
                {hostelBlocks.length === 0 ? (
                  <Box sx={{ display:'flex', alignItems:'center', gap:2, py:1 }}>
                    <Typography variant="body2" sx={{ color:'text.secondary', flex:1 }}>
                      No blocks yet.
                    </Typography>
                    <Button size="small" startIcon={<AddOutlined />} onClick={() => setBlockDialog(true)}>
                      Add Block
                    </Button>
                  </Box>
                ) : (
                  hostelBlocks.map(block => {
                    const blockRooms = rooms.filter(r => r.block_id === block.id);
                    return (
                      <Accordion key={block.id} disableGutters elevation={0}
                        sx={{ border:'1px solid #E2E8F0', borderRadius:'8px !important', mb:1, '&:before':{ display:'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                          <Box sx={{ display:'flex', alignItems:'center', gap:1.5, flex:1 }}>
                            <LayersOutlined sx={{ fontSize:18, color:'#0D9488' }} />
                            <Typography variant="body2" sx={{ fontWeight:600 }}>Block {block.name}</Typography>
                            <Chip label={`${blockRooms.length} rooms`} size="small"
                              sx={{ height:18, fontSize:'0.6rem', bgcolor:'#F0FDFA', color:'#0D9488', fontWeight:600 }} />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt:0 }}>
                          <Box sx={{ display:'flex', flexWrap:'wrap', gap:1, mb:1.5 }}>
                            {blockRooms.length === 0 ? (
                              <Typography variant="caption" sx={{ color:'text.disabled' }}>
                                No rooms yet.
                              </Typography>
                            ) : (
                              blockRooms.map(room => (
                                <Chip key={room.id}
                                  label={`Room ${room.room_number} (Cap: ${room.capacity})`}
                                  size="small"
                                  icon={<MeetingRoomOutlined sx={{ fontSize:'14px !important' }} />}
                                  sx={{
                                    bgcolor: room.is_active ? '#EEF2FF' : '#F1F5F9',
                                    color:   room.is_active ? '#4F46E5' : '#94A3B8',
                                    fontWeight:500, fontSize:'0.6875rem',
                                    '& .MuiChip-icon':{ color:'inherit' },
                                  }}
                                />
                              ))
                            )}
                          </Box>
                          <Button size="small" startIcon={<AddOutlined />} onClick={() => setRoomDialog(true)}>
                            Add Room to this Block
                          </Button>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <CreateHostelDialog
        open={hostelDialog}
        onClose={() => setHostelDialog(false)}
        onSuccess={(h) => { setHostels(p => [...p, h]); showSnack(`Hostel "${h.name}" created successfully.`); }}
      />
      <CreateBlockDialog
        open={blockDialog}
        onClose={() => setBlockDialog(false)}
        hostels={hostels}
        onSuccess={(b) => { setBlocks(p => [...p, b]); showSnack(`Block "${b.name}" created successfully.`); }}
      />
      <CreateRoomDialog
        open={roomDialog}
        onClose={() => setRoomDialog(false)}
        blocks={blocks}
        onSuccess={(r) => { setRooms(p => [...p, r]); showSnack(`Room ${r.room_number} created successfully.`); }}
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

export default AdminHostelPage;