import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography,
  Button, Chip, Alert, Skeleton, Divider,
  Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress,
} from '@mui/material';
import {
  ArrowBackOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  AccessTimeOutlined,
  VerifiedOutlined,
  InfoOutlined,
} from '@mui/icons-material';
import PageHeader          from '../../components/common/PageHeader';
import StatusChip          from '../../components/common/StatusChip';
import PriorityChip        from '../../components/common/PriorityChip';
import ComplaintTimeline   from '../../components/complaints/ComplaintTimeline';
import complaintApi        from '../../api/complaintApi';
import {
  formatDateTime,
  formatRelative,
  getCategoryLabel,
  CATEGORY_CONFIG,
  buildTimeline,
  isCancellable,
} from '../../utils/formatters';

function ComplaintDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // ── Cancel dialog state ──────────────────────────────────────────────────
  const [cancelOpen,   setCancelOpen]   = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelError,  setCancelError]  = useState('');

  // ── Verify dialog state ──────────────────────────────────────────────────
  const [verifyOpen,  setVerifyOpen]  = useState(false);
  const [verifying,   setVerifying]   = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // ── Fetch complaint ──────────────────────────────────────────────────────
  const fetchComplaint = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complaintApi.getComplaintById(id);
      setComplaint(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Complaint not found.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this complaint.');
      } else {
        setError('Unable to load complaint. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  // ── Cancel complaint ─────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Please provide a reason for cancellation.');
      return;
    }
    setCancelling(true);
    setCancelError('');
    try {
      const updated = await complaintApi.cancelComplaint(complaint.id, cancelReason.trim());
      setComplaint(updated);
      setCancelOpen(false);
      setCancelReason('');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setCancelError(
        typeof detail === 'string'
          ? detail
          : 'Unable to cancel complaint. The cancellation window may have expired.'
      );
    } finally {
      setCancelling(false);
    }
  };

  // ── Verify complaint (student confirms fix) ──────────────────────────────
  const handleVerify = async () => {
    setVerifying(true);
    setVerifyError('');
    try {
      const updated = await complaintApi.verifyComplaint(complaint.id);
      setComplaint(updated);
      setVerifyOpen(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setVerifyError(
        typeof detail === 'string' ? detail : 'Unable to verify. Please try again.'
      );
    } finally {
      setVerifying(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
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
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Button
          startIcon={<ArrowBackOutlined />}
          onClick={() => navigate('/student/complaints')}
          sx={{ mb: 2 }}
        >
          Back to Complaints
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!complaint) return null;

  const catConfig    = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.GENERAL;
  const timeline     = buildTimeline(complaint);
  const canCancel    = isCancellable(complaint);
  const canVerify    = complaint.status === 'RESOLVED';

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto' }}>
      <PageHeader
        title={`Complaint #${complaint.id}`}
        subtitle={complaint.title}
        breadcrumbs={[
          { label: 'Dashboard',      href: '/student/dashboard' },
          { label: 'My Complaints',  href: '/student/complaints' },
          { label: `#${complaint.id}` },
        ]}
        action={
          <Button
            startIcon={<ArrowBackOutlined />}
            variant="outlined"
            onClick={() => navigate('/student/complaints')}
          >
            Back
          </Button>
        }
      />

      {/* ── Verification prompt ────────────────────────────────────────────── */}
      {canVerify && (
        <Alert
          severity="info"
          icon={<VerifiedOutlined />}
          sx={{ mb: 2.5, borderRadius: 2 }}
          action={
  <Button
    color="inherit"
    size="small"
    variant="outlined"
    onClick={() => navigate(`/student/complaints/${complaint.id}/verify`)}
  >
    Verify Now
  </Button>
}
        >
          <strong>Action required:</strong> The maintenance staff has marked this complaint as resolved.
          Was the issue fixed?
        </Alert>
      )}

      <Grid container spacing={2.5}>

        {/* ── Left column — main details ───────────────────────────────── */}
        <Grid xs={12} md={8}>

          {/* Details card */}
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
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {complaint.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={getCategoryLabel(complaint.category)}
                      size="small"
                      sx={{ bgcolor: catConfig.bg, color: catConfig.color, fontWeight: 600, fontSize: '0.6875rem' }}
                    />
                    <PriorityChip priority={complaint.priority} />
                    <StatusChip   status={complaint.status} />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Description
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, color: 'text.primary', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {complaint.description}
              </Typography>

              {/* Resolved description */}
              {complaint.resolved_description && (
                <Box sx={{ mt: 2.5, p: 2, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Staff Resolution Note
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#166534' }}>
                    {complaint.resolved_description}
                  </Typography>
                </Box>
              )}

              {/* Hold reason */}
              {complaint.hold_reason && complaint.status === 'ON_HOLD' && (
                <Box sx={{ mt: 2.5, p: 2, bgcolor: '#FFFBEB', borderRadius: 2, border: '1px solid #FDE68A' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Hold Reason
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#92400E' }}>
                    {complaint.hold_reason}
                  </Typography>
                </Box>
              )}

              {/* Cancelled reason */}
              {complaint.cancelled_reason && (
                <Box sx={{ mt: 2.5, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Cancellation Reason
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                    {complaint.cancelled_reason}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Timeline card */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
                Complaint Timeline
              </Typography>
              <ComplaintTimeline events={timeline} currentStatus={complaint.status} />
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right column — meta info + actions ──────────────────────── */}
        <Grid xs={12} md={4}>

          {/* Meta card */}
          <Card sx={{ mb: 2.5 }}>
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
                { label: 'Assigned Staff', value: complaint.assigned_staff_id ? `Staff #${complaint.assigned_staff_id}` : 'Unassigned' },
                { label: 'Submitted',     value: formatDateTime(complaint.created_at) },
                { label: 'Last Updated',  value: formatRelative(complaint.updated_at) },
              ].map((row, i) => (
                <Box key={row.label}>
                  {i > 0 && <Divider sx={{ my: 1.25 }} />}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {row.label}
                    </Typography>
                    {typeof row.value === 'string' ? (
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', textAlign: 'right' }}>
                        {row.value}
                      </Typography>
                    ) : row.value}
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Actions card */}
          {(canVerify || canCancel) && (
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  Actions
                </Typography>

                 {canVerify && (
  <>
    <Button
      fullWidth
      variant="contained"
      color="success"
      startIcon={<CheckCircleOutlined />}
      onClick={() => navigate(`/student/complaints/${complaint.id}/verify`)}
      sx={{ mb: 1 }}
    >
      Verify Resolution
    </Button>
    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mb: 1 }}>
      Opens the full verification and rating screen
    </Typography>
  </>
)}

                {canCancel && (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<CancelOutlined />}
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel Complaint
                  </Button>
                )}

                {canCancel && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mt: 1.5 }}>
                    <InfoOutlined sx={{ fontSize: 13, color: 'text.disabled', mt: 0.2, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: 'text.disabled', lineHeight: 1.4 }}>
                      Complaints can only be cancelled within 30 minutes of submission.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* ── Verify dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={verifyOpen}
        onClose={() => !verifying && setVerifyOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifiedOutlined sx={{ color: 'success.main' }} />
          Confirm Issue is Fixed
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            By confirming, you are saying the maintenance issue has been successfully resolved
            and your complaint will be closed.
          </Typography>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Make sure the issue is actually fixed before confirming. Once closed, the
            complaint cannot be reopened through this action.
          </Alert>
          {verifyError && (
            <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
              {verifyError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setVerifyOpen(false)}
            disabled={verifying}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleVerify}
            disabled={verifying}
            startIcon={verifying ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlined />}
          >
            {verifying ? 'Confirming…' : 'Yes, Issue is Fixed'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Cancel dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={cancelOpen}
        onClose={() => !cancelling && setCancelOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <CancelOutlined />
          Cancel Complaint
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            This action cannot be undone. The complaint will be cancelled.
          </Alert>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
            Reason for Cancellation <span style={{ color: '#F43F5E' }}>*</span>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Why are you cancelling this complaint?"
            value={cancelReason}
            onChange={e => { setCancelReason(e.target.value); setCancelError(''); }}
            error={!!cancelError}
            helperText={cancelError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} disabled={cancelling}>
            Keep Complaint
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={cancelling || !cancelReason.trim()}
            startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : <CancelOutlined />}
          >
            {cancelling ? 'Cancelling…' : 'Cancel Complaint'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Category emoji helper (same as ComplaintCard)
function getCategoryEmoji(category) {
  const map = {
    GENERAL: '📋', ELECTRICAL: '⚡', PLUMBING: '🔧',
    CIVIL: '🪚', CLEANING: '🧹', NETWORK: '🌐', OTHER: '📌',
  };
  return map[category] || '📋';
}

export default ComplaintDetailPage;