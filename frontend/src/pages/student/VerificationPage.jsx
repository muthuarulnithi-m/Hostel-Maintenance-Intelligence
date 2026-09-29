import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button,
  Alert, Skeleton, Divider, Paper,
  CircularProgress, Snackbar, Chip,
} from '@mui/material';
import {
  CheckCircleOutlined,
  ThumbUpOutlined,
  ThumbDownOutlined,
  StarOutlined,
  Star,
  StarBorderOutlined,
  SentimentVeryDissatisfiedOutlined,
  SentimentSatisfiedAltOutlined,
  HomeOutlined,
  ReportProblemOutlined,
} from '@mui/icons-material';
import complaintApi    from '../../api/complaintApi';
import StatusChip      from '../../components/common/StatusChip';
import PriorityChip    from '../../components/common/PriorityChip';
import LoadingState    from '../../components/common/LoadingState';
import {
  formatDateTime,
  getCategoryLabel,
  CATEGORY_CONFIG,
} from '../../utils/formatters';

// ─── Star rating component ─────────────────────────────────────────────────────
function StarRating({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= (hovered || value);
        return (
          <Box
            key={star}
            onClick={() => !disabled && onChange(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(0)}
            sx={{
              cursor: disabled ? 'default' : 'pointer',
              color: filled ? '#F59E0B' : '#E2E8F0',
              fontSize: '2rem',
              transition: 'color 0.15s, transform 0.1s',
              '&:hover': disabled ? {} : { transform: 'scale(1.15)' },
              display: 'flex',
            }}
          >
            {filled
              ? <Star sx={{ fontSize: 'inherit' }} />
              : <StarBorderOutlined sx={{ fontSize: 'inherit' }} />
            }
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Rating label ─────────────────────────────────────────────────────────────
const RATING_LABELS = {
  1: 'Poor — very unsatisfied',
  2: 'Fair — below expectations',
  3: 'Good — meets expectations',
  4: 'Very Good — above expectations',
  5: 'Excellent — outstanding service!',
};

function VerificationPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [complaint,  setComplaint]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // ── Verification state ───────────────────────────────────────────────────
  const [step,       setStep]       = useState('verify'); // 'verify' | 'rate' | 'done' | 'not-fixed'
  const [verifying,  setVerifying]  = useState(false);
  const [verifyError,setVerifyError]= useState('');

  // ── Rating state (frontend only — no backend endpoint yet) ───────────────
  const [rating,     setRating]     = useState(0);
  const [submitted,  setSubmitted]  = useState(false);

  // ── Snackbar ──────────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnack = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ── Fetch complaint ──────────────────────────────────────────────────────
  const fetchComplaint = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complaintApi.getComplaintById(id);
      setComplaint(data);

      // If already closed, jump to done
      if (data.status === 'CLOSED') setStep('done');
    } catch (err) {
      if (err.response?.status === 404) setError('Complaint not found.');
      else setError('Unable to load complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchComplaint(); }, [fetchComplaint]);

  // ── Verify (confirm fixed) ────────────────────────────────────────────────
  const handleVerify = async () => {
    setVerifying(true);
    setVerifyError('');
    try {
      const updated = await complaintApi.verifyComplaint(complaint.id);
      setComplaint(updated);
      setStep('rate'); // move to rating screen
    } catch (err) {
      const detail = err.response?.data?.detail;
      setVerifyError(
        typeof detail === 'string' ? detail : 'Verification failed. Please try again.'
      );
    } finally {
      setVerifying(false);
    }
  };

  // ── Submit rating (frontend only for now) ─────────────────────────────────
  const handleSubmitRating = () => {
    // TODO: When backend adds POST /complaints/{id}/rate,
    // call it here with { rating, comment }
    // For now: store in localStorage as a placeholder
    const stored = JSON.parse(localStorage.getItem('complaint_ratings') || '{}');
    stored[complaint.id] = { rating, submitted_at: new Date().toISOString() };
    localStorage.setItem('complaint_ratings', JSON.stringify(stored));

    setSubmitted(true);
    setStep('done');
    showSnack('Thank you for your feedback!');
  };

  // ── Skip rating ───────────────────────────────────────────────────────────
  const handleSkipRating = () => {
    setStep('done');
  };

  // ── Not fixed — go back to complaint detail ───────────────────────────────
  const handleNotFixed = () => {
    setStep('not-fixed');
  };

  // ─── Loading / error ───────────────────────────────────────────────────────
  if (loading) return <LoadingState message="Loading complaint…" />;

  if (error) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', pt: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/student/complaints')}>
          Back to My Complaints
        </Button>
      </Box>
    );
  }

  if (!complaint) return null;

  // Guard — only RESOLVED complaints should reach this page
  if (complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED') {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', pt: 4 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          This complaint is not awaiting verification. Current status: <strong>{complaint.status}</strong>
        </Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(`/student/complaints/${id}`)}>
          View Complaint
        </Button>
      </Box>
    );
  }

  const catConfig = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.OTHER;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>

      {/* ── Complaint summary strip ──────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '14px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                bgcolor: catConfig.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              {getCategoryEmoji(complaint.category)}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                #{complaint.id} — {complaint.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, mt: 0.25, flexWrap: 'wrap' }}>
                <Chip
                  label={getCategoryLabel(complaint.category)} size="small"
                  sx={{ height: 18, fontSize: '0.65rem', bgcolor: catConfig.bg, color: catConfig.color, fontWeight: 600 }}
                />
                <PriorityChip priority={complaint.priority} size="small" />
                <StatusChip   status={complaint.status} />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STEP: VERIFY — Was the issue fixed?                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {step === 'verify' && (
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: '50%',
                bgcolor: '#EEF2FF', mx: 'auto', mb: 2.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <CheckCircleOutlined sx={{ color: '#4F46E5', fontSize: 34 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Has your issue been resolved?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, maxWidth: 420, mx: 'auto' }}>
              The maintenance staff has marked your complaint as resolved.
              Please verify whether the issue is actually fixed.
            </Typography>

            {/* Staff resolution note */}
            {complaint.resolved_description && (
              <Paper
                variant="outlined"
                sx={{ p: 2, mt: 2.5, mb: 3, borderRadius: 2, bgcolor: '#F0FDF4', borderColor: '#BBF7D0', textAlign: 'left' }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Staff Resolution Note
                </Typography>
                <Typography variant="body2" sx={{ color: '#166534', mt: 0.5 }}>
                  {complaint.resolved_description}
                </Typography>
                {complaint.resolved_at && (
                  <Typography variant="caption" sx={{ color: '#4ADE80', display: 'block', mt: 0.5 }}>
                    Resolved on {formatDateTime(complaint.resolved_at)}
                  </Typography>
                )}
              </Paper>
            )}

            {verifyError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, textAlign: 'left' }}>
                {verifyError}
              </Alert>
            )}

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 3 }}>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={verifying
                  ? <CircularProgress size={18} color="inherit" />
                  : <ThumbUpOutlined />
                }
                onClick={handleVerify}
                disabled={verifying}
                sx={{ px: 4, py: 1.5, fontSize: '0.9375rem' }}
              >
                {verifying ? 'Confirming…' : 'Yes, Issue is Fixed'}
              </Button>

              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<ThumbDownOutlined />}
                onClick={handleNotFixed}
                disabled={verifying}
                sx={{ px: 4, py: 1.5, fontSize: '0.9375rem' }}
              >
                No, Still Not Fixed
              </Button>
            </Box>

            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 2 }}>
              If you confirm, this complaint will be closed. If not fixed, you can contact the warden.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STEP: NOT FIXED                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {step === 'not-fixed' && (
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: '50%',
                bgcolor: '#FFF1F2', mx: 'auto', mb: 2.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <SentimentVeryDissatisfiedOutlined sx={{ color: '#F43F5E', fontSize: 34 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Issue Not Resolved
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 420, mx: 'auto' }}>
              We're sorry the issue wasn't fixed properly. Please contact your warden or
              visit the complaint details page — your complaint remains open and visible to the warden.
            </Typography>

            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
              <strong>What happens next:</strong> Your complaint status remains as RESOLVED
              until the warden takes action. Please contact your warden directly to report
              that the issue was not fixed. The warden can reassign the complaint to staff
              for a follow-up.
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<ReportProblemOutlined />}
                onClick={() => navigate(`/student/complaints/${id}`)}
              >
                View Complaint Details
              </Button>
              <Button
                variant="contained"
                startIcon={<HomeOutlined />}
                onClick={() => navigate('/student/dashboard')}
              >
                Go to Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STEP: RATE — Rate the maintenance service                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {step === 'rate' && (
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: '50%',
                bgcolor: '#FEF3C7', mx: 'auto', mb: 2.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <StarOutlined sx={{ color: '#F59E0B', fontSize: 34 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Rate the Service
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              How satisfied are you with the maintenance work done?
              Your feedback helps improve the service.
            </Typography>

            {/* Star rating */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <StarRating value={rating} onChange={setRating} />
              {rating > 0 && (
                <Typography
                  variant="body2"
                  sx={{ mt: 1.5, color: '#F59E0B', fontWeight: 600 }}
                >
                  {RATING_LABELS[rating]}
                </Typography>
              )}
            </Box>

            {/* Note about rating storage */}
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
              <Typography variant="caption">
                <strong>Note:</strong> Rating functionality is coming soon. Your rating will be
                saved when the backend rating system is ready.
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleSkipRating}
              >
                Skip for Now
              </Button>
              <Button
                variant="contained"
                startIcon={<StarOutlined />}
                onClick={handleSubmitRating}
                disabled={rating === 0}
                sx={{ px: 4 }}
              >
                Submit Rating
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STEP: DONE — Complaint successfully closed                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {step === 'done' && (
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Box
              sx={{
                width: 72, height: 72, borderRadius: '50%',
                bgcolor: '#D1FAE5', mx: 'auto', mb: 2.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <SentimentSatisfiedAltOutlined sx={{ color: '#10B981', fontSize: 40 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Complaint Closed
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Thank you for confirming. Your complaint has been successfully closed.
            </Typography>

            {/* Show submitted rating */}
            {submitted && rating > 0 && (
              <Box sx={{ my: 2.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Your rating
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                  {[1,2,3,4,5].map(s => (
                    <Star
                      key={s}
                      sx={{ fontSize: 28, color: s <= rating ? '#F59E0B' : '#E2E8F0' }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600 }}>
                  {RATING_LABELS[rating]}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Summary */}
            <Paper
              variant="outlined"
              sx={{ borderRadius: 2, p: 2, mb: 3, textAlign: 'left', bgcolor: '#FAFAFA' }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                COMPLAINT SUMMARY
              </Typography>
              {[
                { label: 'Complaint ID',  value: `#${complaint.id}` },
                { label: 'Issue',         value: complaint.title },
                { label: 'Category',      value: getCategoryLabel(complaint.category) },
                { label: 'Closed At',     value: formatDateTime(complaint.closed_at) || 'Just now' },
              ].map((row, i) => (
                <Box key={row.label}>
                  {i > 0 && <Divider sx={{ my: 0.75 }} />}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.label}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'right' }}>{row.value}</Typography>
                  </Box>
                </Box>
              ))}
            </Paper>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/student/complaints')}
              >
                My Complaints
              </Button>
              <Button
                variant="contained"
                startIcon={<HomeOutlined />}
                onClick={() => navigate('/student/dashboard')}
              >
                Go to Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

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
    CARPENTRY:'🪚', CLEANING:'🧹', INTERNET:'🌐', OTHER:'📌',
  };
  return map[category] || '📋';
}

export default VerificationPage;