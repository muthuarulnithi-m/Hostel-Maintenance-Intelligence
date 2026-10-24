import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography,
  Button, Chip, Alert, Skeleton, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Snackbar, Paper,
} from '@mui/material';
import {
  ArrowBackOutlined,
  PlayArrowOutlined,
  PauseOutlined,
  CheckCircleOutlined,
  ReplayOutlined,
  HistoryOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import PageHeader        from '../../components/common/PageHeader';
import StatusChip        from '../../components/common/StatusChip';
import PriorityChip      from '../../components/common/PriorityChip';
import ComplaintTimeline from '../../components/complaints/ComplaintTimeline';
import complaintApi      from '../../api/complaintApi';
import {
  formatDateTime,
  formatRelative,
  getCategoryLabel,
  CATEGORY_CONFIG,
  buildTimeline,
} from '../../utils/formatters';

// ── Which actions are available per status ────────────────────────────────────
function getAvailableActions(status) {
  switch (status) {
    case 'ASSIGNED':    return ['start'];
    case 'IN_PROGRESS': return ['hold', 'resolve'];
    case 'ON_HOLD':     return ['resume'];
    default:            return [];
  }
}

function StaffComplaintDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // ── Dialog states ─────────────────────────────────────────────────────────
  const [holdOpen,       setHoldOpen]       = useState(false);
  const [holdReason,     setHoldReason]     = useState('');
  const [holdError,      setHoldError]      = useState('');
  const [holding,        setHolding]        = useState(false);

  const [resolveOpen,    setResolveOpen]    = useState(false);
  const [resolveNote,    setResolveNote]    = useState('');
  const [resolveError,   setResolveError]   = useState('');
  const [resolving,      setResolving]      = useState(false);

  const [actionLoading,  setActionLoading]  = useState(false);

  // ── Snackbar ──────────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnack = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cData, hData] = await Promise.all([
        complaintApi.getComplaintById(id),
        complaintApi.getComplaintHistory(id),
      ]);
      setComplaint(cData);
      setHistory(hData);
    } catch (err) {
      if (err.response?.status === 404) setError('Complaint not found.');
      else if (err.response?.status === 403) setError('You do not have permission to view this complaint.');
      else setError('Unable to load complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Start / Resume (same endpoint: PATCH /start) ──────────────────────────
  const handleStart = async () => {
    setActionLoading(true);
    try {
      const updated = await complaintApi.startComplaint(complaint.id);
      setComplaint(updated);
      const hData = await complaintApi.getComplaintHistory(id);
      setHistory(hData);
      showSnack(
        complaint.status === 'ON_HOLD'
          ? 'Complaint resumed — now In Progress.'
          : 'Work started — complaint is now In Progress.'
      );
    } catch (err) {
      const detail = err.response?.data?.detail;
      showSnack(typeof detail === 'string' ? detail : 'Action failed. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Hold ─────────────────────────────────────────────────────────────────
  const handleHold = async () => {
    if (!holdReason.trim()) {
      setHoldError('Please provide a reason for placing this complaint on hold.');
      return;
    }
    setHolding(true);
    setHoldError('');
    try {
      const updated = await complaintApi.holdComplaint(complaint.id, holdReason.trim());
      setComplaint(updated);
      const hData = await complaintApi.getComplaintHistory(id);
      setHistory(hData);
      setHoldOpen(false);
      setHoldReason('');
      showSnack('Complaint placed on hold.');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setHoldError(typeof detail === 'string' ? detail : 'Failed to place on hold. Please try again.');
    } finally {
      setHolding(false);
    }
  };

  // ── Resolve ───────────────────────────────────────────────────────────────
  const handleResolve = async () => {
    if (!resolveNote.trim()) {
      setResolveError('Please describe what was done to resolve this complaint.');
      return;
    }
    setResolving(true);
    setResolveError('');
    try {
      const updated = await complaintApi.resolveComplaint(complaint.id, resolveNote.trim());
      setComplaint(updated);
      const hData = await complaintApi.getComplaintHistory(id);
      setHistory(hData);
      setResolveOpen(false);
      setResolveNote('');
      showSnack('Complaint marked as resolved. Waiting for student verification.');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setResolveError(typeof detail === 'string' ? detail : 'Failed to resolve. Please try again.');
    } finally {
      setResolving(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ maxWidth: 980, mx: 'auto' }}>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 3 }} />
        <Grid container spacing={2.5}>
          <Grid xs={12} md={8}>
            <Card><CardContent><Skeleton variant="rectangular" height={300} /></CardContent></Card>
          </Grid>
          <Grid xs={12} md={4}>
            <Card><CardContent><Skeleton variant="rectangular" height={200} /></CardContent></Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 980, mx: 'auto' }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => navigate('/staff/complaints')} sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Box>
    );
  }

  if (!complaint) return null;

  const catConfig = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.GENERAL;
  const timeline  = buildTimeline(complaint);
  const actions   = getAvailableActions(complaint.status);

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto' }}>
      <PageHeader
        title={`Complaint #${complaint.id}`}
        subtitle={complaint.title}
        breadcrumbs={[
          { label: 'Dashboard',      href: '/staff/dashboard' },
          { label: 'Assigned Work',  href: '/staff/complaints' },
          { label: `#${complaint.id}` },
        ]}
        action={
          <Button startIcon={<ArrowBackOutlined />} variant="outlined" onClick={() => navigate('/staff/complaints')}>
            Back
          </Button>
        }
      />

      {/* ── Status-specific guidance banner ──────────────────────────────── */}
      {complaint.status === 'ASSIGNED' && (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
          This complaint is assigned to you. Click <strong>Start Work</strong> when you begin the repair.
        </Alert>
      )}
      {complaint.status === 'ON_HOLD' && (
        <Alert severity="warning" icon={<WarningAmberOutlined />} sx={{ mb: 2.5, borderRadius: 2 }}>
          This complaint is on hold. Reason: <strong>{complaint.hold_reason || 'Not specified'}</strong>.
          Click <strong>Resume Work</strong> when ready to continue.
        </Alert>
      )}
      {complaint.status === 'RESOLVED' && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
          You have marked this as resolved. Waiting for the student to verify the fix.
        </Alert>
      )}
      {complaint.status === 'CLOSED' && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
          This complaint is <strong>closed</strong> — the student has confirmed the issue is fixed.
        </Alert>
      )}

      <Grid container spacing={2.5}>

        {/* ── Left column ──────────────────────────────────────────────── */}
        <Grid xs={12} md={8}>

          {/* Complaint details */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 44, height: 44, borderRadius: 2, flexShrink: 0,
                    bgcolor: catConfig.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem',
                  }}
                >
                  {getCategoryEmoji(complaint.category)}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {complaint.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={getCategoryLabel(complaint.category)} size="small"
                      sx={{ bgcolor: catConfig.bg, color: catConfig.color, fontWeight: 600, fontSize: '0.6875rem' }}
                    />
                    <PriorityChip priority={complaint.priority} />
                    <StatusChip   status={complaint.status} />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Issue Description
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                {complaint.description}
              </Typography>

              {complaint.hold_reason && (
                <Box sx={{ mt: 2.5, p: 2, bgcolor: '#FFFBEB', borderRadius: 2, border: '1px solid #FDE68A' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#92400E', textTransform: 'uppercase' }}>
                    Hold Reason
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#92400E' }}>
                    {complaint.hold_reason}
                  </Typography>
                </Box>
              )}

              {complaint.resolved_description && (
                <Box sx={{ mt: 2.5, p: 2, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>
                    Your Resolution Note
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#166534' }}>
                    {complaint.resolved_description}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <HistoryOutlined sx={{ color: 'text.secondary' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Timeline</Typography>
              </Box>
              <ComplaintTimeline events={timeline} currentStatus={complaint.status} />
            </CardContent>
          </Card>

          {/* Raw history log */}
          {history.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Status Change Log
                </Typography>
                {history.map((h, i) => (
                  <Box key={h.id}>
                    {i > 0 && <Divider sx={{ my: 1 }} />}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <StatusChip status={h.new_status} />
                      <Box sx={{ flex: 1 }}>
                        {h.note && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                            {h.note}
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          {formatDateTime(h.created_at)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* ── Right column — actions + meta ─────────────────────────────── */}
        <Grid xs={12} md={4}>

          {/* Action card */}
          {actions.length > 0 && (
            <Card sx={{ mb: 2.5, border: '1px solid #C7D2FE' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Work Actions
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                  Update the status of this complaint as you work on it.
                </Typography>

                {/* START WORK */}
                {actions.includes('start') && (
                  <Button
                    fullWidth variant="contained" color="primary"
                    startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowOutlined />}
                    onClick={handleStart}
                    disabled={actionLoading}
                    sx={{ mb: 1.5 }}
                  >
                    {actionLoading ? 'Starting…' : 'Start Work'}
                  </Button>
                )}

                {/* RESUME (ON_HOLD → IN_PROGRESS, same /start endpoint) */}
                {actions.includes('resume') && (
                  <Button
                    fullWidth variant="contained" color="primary"
                    startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <ReplayOutlined />}
                    onClick={handleStart}
                    disabled={actionLoading}
                    sx={{ mb: 1.5 }}
                  >
                    {actionLoading ? 'Resuming…' : 'Resume Work'}
                  </Button>
                )}

                {/* HOLD */}
                {actions.includes('hold') && (
                  <Button
                    fullWidth variant="outlined" color="warning"
                    startIcon={<PauseOutlined />}
                    onClick={() => setHoldOpen(true)}
                    disabled={actionLoading}
                    sx={{ mb: 1.5 }}
                  >
                    Place On Hold
                  </Button>
                )}

                {/* RESOLVE */}
                {actions.includes('resolve') && (
                  <Button
                    fullWidth variant="contained" color="success"
                    startIcon={<CheckCircleOutlined />}
                    onClick={() => setResolveOpen(true)}
                    disabled={actionLoading}
                  >
                    Mark as Resolved
                  </Button>
                )}

                {/* Help text per action */}
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                  {actions.includes('start') && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Click <strong>Start Work</strong> when you begin the repair. The student will be notified.
                    </Typography>
                  )}
                  {actions.includes('resume') && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Click <strong>Resume Work</strong> when you are ready to continue after the hold.
                    </Typography>
                  )}
                  {actions.includes('resolve') && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Click <strong>Mark as Resolved</strong> only when the repair is complete.
                      The student will verify the fix.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Meta info */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Complaint Info
              </Typography>
              {[
                { label: 'Complaint ID',  value: `#${complaint.id}` },
                { label: 'Status',        value: <StatusChip status={complaint.status} /> },
                { label: 'Priority',      value: <PriorityChip priority={complaint.priority} /> },
                { label: 'Category',      value: getCategoryLabel(complaint.category) },
                { label: 'Room',          value: complaint.room_id ? `Room #${complaint.room_id}` : '—' },
                { label: 'Submitted',     value: formatDateTime(complaint.created_at) },
                { label: 'Last Updated',  value: formatRelative(complaint.updated_at) },
                { label: 'Assigned At',   value: formatDateTime(complaint.assigned_at) },
              ].map((row, i) => (
                <Box key={row.label}>
                  {i > 0 && <Divider sx={{ my: 1.25 }} />}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {row.label}
                    </Typography>
                    {typeof row.value === 'string' ? (
                      <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'right' }}>
                        {row.value}
                      </Typography>
                    ) : row.value}
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HOLD DIALOG                                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={holdOpen} onClose={() => !holding && setHoldOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PauseOutlined sx={{ color: 'warning.main' }} />
            Place Complaint On Hold
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            Use this when you cannot continue immediately — for example, waiting for parts,
            access to the room, or an external technician.
          </Alert>

          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
            Reason for Hold <span style={{ color: '#F43F5E' }}>*</span>
          </Typography>
          <TextField
            fullWidth multiline rows={4}
            placeholder={
              'Explain why this complaint needs to be placed on hold.\n\n' +
              'Examples:\n' +
              '• Waiting for replacement fan motor (ETA: 3 days)\n' +
              '• External plumber required — scheduled for Monday\n' +
              '• Room is locked — student unavailable'
            }
            value={holdReason}
            onChange={e => { setHoldReason(e.target.value); setHoldError(''); }}
            error={!!holdError}
            helperText={holdError}
            disabled={holding}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHoldOpen(false)} disabled={holding} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained" color="warning"
            onClick={handleHold}
            disabled={holding || !holdReason.trim()}
            startIcon={holding ? <CircularProgress size={16} color="inherit" /> : <PauseOutlined />}
          >
            {holding ? 'Placing On Hold…' : 'Confirm Hold'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* RESOLVE DIALOG                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={resolveOpen} onClose={() => !resolving && setResolveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleOutlined sx={{ color: 'success.main' }} />
            Mark Complaint as Resolved
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            After marking as resolved, the <strong>student will be asked to verify</strong> that the issue is fixed.
            The complaint will only be closed after their confirmation.
          </Alert>

          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
            Resolution Description <span style={{ color: '#F43F5E' }}>*</span>
          </Typography>
          <TextField
            fullWidth multiline rows={4}
            placeholder={
              'Describe what was done to fix this issue.\n\n' +
              'Examples:\n' +
              '• Replaced faulty capacitor in the ceiling fan — tested and working\n' +
              '• Tightened the leaking pipe joint and replaced the washer\n' +
              '• Cleaned blocked drain — water flow restored'
            }
            value={resolveNote}
            onChange={e => { setResolveNote(e.target.value); setResolveError(''); }}
            error={!!resolveError}
            helperText={resolveError}
            disabled={resolving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveOpen(false)} disabled={resolving} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained" color="success"
            onClick={handleResolve}
            disabled={resolving || !resolveNote.trim()}
            startIcon={resolving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlined />}
          >
            {resolving ? 'Marking Resolved…' : 'Mark as Resolved'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(p => ({ ...p, open: false }))}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function getCategoryEmoji(category) {
  const map = {
    GENERAL:'📋', ELECTRICAL:'⚡', PLUMBING:'🔧',
    CIVIL:'🪚', CLEANING:'🧹', NETWORK:'🌐', OTHER:'📌',
  };
  return map[category] || '📋';
}

export default StaffComplaintDetailPage;