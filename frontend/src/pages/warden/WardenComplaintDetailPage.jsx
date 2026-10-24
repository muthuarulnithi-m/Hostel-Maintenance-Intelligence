import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography,
  Button, Chip, Alert, Skeleton, Divider,
  Snackbar,
} from '@mui/material';
import {
  ArrowBackOutlined,
  AssignmentIndOutlined,
  HistoryOutlined,
} from '@mui/icons-material';
import PageHeader          from '../../components/common/PageHeader';
import StatusChip          from '../../components/common/StatusChip';
import PriorityChip        from '../../components/common/PriorityChip';
import ComplaintTimeline   from '../../components/complaints/ComplaintTimeline';
import AssignStaffDialog   from '../../components/complaints/AssignStaffDialog';
import complaintApi        from '../../api/complaintApi';
import {
  formatDateTime,
  formatRelative,
  getCategoryLabel,
  CATEGORY_CONFIG,
  buildTimeline,
} from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';



function WardenComplaintDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const basePath = userRole === 'admin' ? '/admin' : '/warden';

  const [complaint,  setComplaint]  = useState(null);
  const [history,    setHistory]    = useState([]);
  const [attachmentUrls, setAttachmentUrls] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // ── Assign dialog ────────────────────────────────────────────────────────
  const [assignOpen,  setAssignOpen]  = useState(false);
  const [assigning,   setAssigning]   = useState(false);
  const [assignError, setAssignError] = useState('');
  // ── Snackbar feedback ────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnack = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ── Fetch complaint + history ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cData, hData] = await Promise.all([
        complaintApi.getComplaintDetails(id),
        complaintApi.getComplaintHistory(id),
      ]);
      setComplaint(cData);
      setHistory(hData);
    } catch (err) {
      if (err.response?.status === 404) setError('Complaint not found.');
      else if (err.response?.status === 403) setError('No permission to view this complaint.');
      else setError('Unable to load complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];
    const images = (complaint?.attachments || []).filter(item => item.content_type?.startsWith('image/'));
    setAttachmentUrls({});
    if (!images.length) return undefined;

    Promise.all(images.map(async attachment => {
      try {
        const url = await complaintApi.getAttachmentPreview(complaint.id, attachment.id);
        objectUrls.push(url);
        return [attachment.id, url];
      } catch {
        return [attachment.id, null];
      }
    })).then(entries => {
      if (!cancelled) setAttachmentUrls(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [complaint]);

  // ── Assign staff ─────────────────────────────────────────────────────────
  const handleAssign = async (staffId) => {
    setAssigning(true);
    setAssignError('');
    try {
      const updated = await complaintApi.assignComplaint(complaint.id, staffId);
      setComplaint(updated);
      setAssignOpen(false);
      showSnack(
        complaint.assigned_staff_id
          ? 'Staff reassigned successfully.'
          : 'Staff assigned successfully.'
      );
      // Refresh history
      const hData = await complaintApi.getComplaintHistory(id);
      setHistory(hData);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setAssignError(
        typeof detail === 'string' ? detail : 'Assignment failed. Please try again.'
      );
    } finally {
      setAssigning(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
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
        <Button startIcon={<ArrowBackOutlined />} onClick={() => navigate(`${basePath}/complaints`)} sx={{ mb: 2 }}>
          Back to Complaints
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Box>
    );
  }

  if (!complaint) return null;

  const catConfig = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.GENERAL;
  const timeline  = buildTimeline(complaint);

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto' }}>
      <PageHeader
        title={`Complaint #${complaint.id}`}
        subtitle={complaint.title}
        breadcrumbs={[
          { label: 'Dashboard',   href: `${basePath}/dashboard` },
          { label: 'Complaints',  href: `${basePath}/complaints` },
          { label: `#${complaint.id}` },
        ]}
        action={
          <Button startIcon={<ArrowBackOutlined />} variant="outlined" onClick={() => navigate(`${basePath}/complaints`)}>
            Back
          </Button>
        }
      />

      <Grid container spacing={2.5}>

        {/* ── Left column ──────────────────────────────────────────────── */}
        <Grid xs={12} md={8}>

          {/* Details card */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 44, height: 44, borderRadius: 2,
                    bgcolor: catConfig.bg, flexShrink: 0,
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
            </CardContent>
          </Card>

          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Student and room
              </Typography>
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Typography variant="overline" color="text.secondary">Student</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{complaint.student?.name || `Student #${complaint.student_id}`}</Typography>
                  <Typography variant="body2" color="text.secondary">ID #{complaint.student_id}</Typography>
                  {complaint.student?.email && <Typography variant="body2">{complaint.student.email}</Typography>}
                  {complaint.student?.phone && <Typography variant="body2">{complaint.student.phone}</Typography>}
                </Grid>
                <Grid xs={12} sm={6}>
                  <Typography variant="overline" color="text.secondary">Room assignment</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {complaint.room?.hostel_name || complaint.room?.hostel_code || 'Hostel'} · {complaint.room?.block_name || complaint.room?.block_code || 'Block'} · Room {complaint.room?.room_number || `#${complaint.room_id}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Floor {complaint.room?.floor ?? '—'} · Capacity {complaint.room?.capacity ?? '—'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Attachments</Typography>
              {complaint.attachments?.length ? (
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {complaint.attachments.map(attachment => (
                    <Box key={attachment.id} sx={{ width: { xs: '100%', sm: 180 } }}>
                      {attachment.content_type?.startsWith('image/') && attachmentUrls[attachment.id] ? (
                        <Box
                          component="img"
                          src={attachmentUrls[attachment.id]}
                          alt={`Attachment: ${attachment.file_name}`}
                          sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 1.5, border: 1, borderColor: 'divider' }}
                        />
                      ) : (
                        <Box sx={{ height: 140, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary">Preview unavailable</Typography>
                        </Box>
                      )}
                      <Typography variant="caption" display="block" sx={{ mt: 0.75, overflowWrap: 'anywhere' }}>
                        {attachment.file_name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No attachments were submitted with this complaint.</Typography>
              )}
            </CardContent>
          </Card>

          {/* History card — uses real API history + timeline */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <HistoryOutlined sx={{ color: 'text.secondary' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Complaint Timeline
                </Typography>
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
                      <Box sx={{ flexShrink: 0 }}>
                        <StatusChip status={h.new_status} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        {h.old_status && (
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            {h.old_status} → {h.new_status}
                          </Typography>
                        )}
                        {h.note && (
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                            {h.note}
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.25 }}>
                          {formatDateTime(h.created_at)} · by User #{h.changed_by_user_id}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <Grid xs={12} md={4}>

          {/* Actions card */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                {userRole === 'admin' ? 'Admin Actions' : 'Warden Actions'}
              </Typography>

              <Button
                fullWidth
                variant={complaint.assigned_staff_id ? 'outlined' : 'contained'}
                startIcon={<AssignmentIndOutlined />}
                onClick={() => setAssignOpen(true)}
                disabled={['CLOSED', 'CANCELLED'].includes(complaint.status)}
                sx={{ mb: 1.5 }}
              >
                {complaint.assigned_staff_id ? 'Reassign Staff' : 'Assign Staff'}
              </Button>

              {['CLOSED', 'CANCELLED'].includes(complaint.status) && (
                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', textAlign: 'center' }}>
                  This complaint is {complaint.status.toLowerCase()} and cannot be modified.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Meta info card */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Complaint Info
              </Typography>
              {[
                { label: 'Complaint ID',   value: `#${complaint.id}` },
                { label: 'Status',         value: <StatusChip status={complaint.status} /> },
                { label: 'Priority',       value: <PriorityChip priority={complaint.priority} /> },
                { label: 'Category',       value: getCategoryLabel(complaint.category) },
                { label: 'Room',           value: complaint.room_id ? `Room #${complaint.room_id}` : '—' },
                { label: 'Student',        value: complaint.student?.name || `User #${complaint.student_id}` },
                {
                  label: 'Assigned Staff',
                  value: complaint.assigned_staff_id
                    ? `${complaint.assigned_staff?.name || `Staff #${complaint.assigned_staff_id}`} · ${complaint.assigned_staff?.employee_code || ''}`
                    : 'Unassigned',
                },
                { label: 'Assigned Date',  value: complaint.assigned_at ? formatDateTime(complaint.assigned_at) : '—' },
                { label: 'Student Verification', value: complaint.status === 'CLOSED' ? 'Verified' : complaint.status === 'RESOLVED' ? 'Awaiting student verification' : 'Not resolved' },
                { label: 'Submitted',      value: formatDateTime(complaint.created_at) },
                { label: 'Last Updated',   value: formatRelative(complaint.updated_at) },
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

      {/* ── Assign staff dialog ───────────────────────────────────────────── */}
      <AssignStaffDialog
        open={assignOpen}
        onClose={() => { setAssignOpen(false); setAssignError(''); }}
        onAssign={handleAssign}
        currentStaffId={complaint.assigned_staff_id}
        loading={assigning}
        error={assignError}
      />

      {/* ── Snackbar feedback ─────────────────────────────────────────────── */}
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

export default WardenComplaintDetailPage;
