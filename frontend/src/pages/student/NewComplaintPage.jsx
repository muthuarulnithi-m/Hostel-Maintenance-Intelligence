import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, MenuItem, Grid, Alert, CircularProgress,
  Stepper, Step, StepLabel, Divider, Paper,
  IconButton, Chip, LinearProgress,
} from '@mui/material';
import {
  TitleOutlined,
  CategoryOutlined,
  PriorityHighOutlined,
  DescriptionOutlined,
  PhotoCameraOutlined,
  CloseOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ArrowBackOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import PageHeader     from '../../components/common/PageHeader';
import complaintApi   from '../../api/complaintApi';
import {
  CATEGORY_CONFIG,
  PRIORITY_CONFIG,
} from '../../utils/formatters';
// ADD these imports to NewComplaintPage.jsx:
import { useCallback } from 'react';
import { classifyComplaint, isUrgentComplaint } from '../../utils/intelligence';
import ClassificationSuggestion from '../../components/intelligence/ClassificationSuggestion';

// ─── Step labels ──────────────────────────────────────────────────────────────
const STEPS = ['Describe Issue', 'Review & Confirm', 'Submitted'];

// ─── Category options ─────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = Object.entries(CATEGORY_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

// ─── Priority options ─────────────────────────────────────────────────────────
const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

// ─── Allowed image types ──────────────────────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB   = 5;

function NewComplaintPage() {
  const navigate = useNavigate();

  // ── Form data ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    '',
    priority:    'MEDIUM',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Photo state ──────────────────────────────────────────────────────────
  const [photo,        setPhoto]        = useState(null);   // File object
  const [photoPreview, setPhotoPreview] = useState(null);   // Data URL for preview
  const [photoError,   setPhotoError]   = useState('');
  const fileInputRef = useRef(null);

  // ── Submission state ─────────────────────────────────────────────────────
  const [activeStep,      setActiveStep]      = useState(0);
  const [submitting,      setSubmitting]       = useState(false);
  const [submitError,     setSubmitError]      = useState('');
  const [createdComplaint, setCreatedComplaint] = useState(null);
  const [uploadingPhoto,  setUploadingPhoto]   = useState(false);
  const [photoUploaded,   setPhotoUploaded]    = useState(false);
  const [classification,     setClassification]     = useState(null);
  const [suggestionApplied,  setSuggestionApplied]  = useState(false);
  const [isUrgent,           setIsUrgent]            = useState(false);

  // ── Handle form field change ─────────────────────────────────────────────
  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
    setSubmitError('');
  };

  // ── Handle photo selection ────────────────────────────────────────────────
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError('Only JPG, PNG, or WEBP images are allowed.');
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setPhotoError(`Image must be smaller than ${MAX_SIZE_MB}MB.`);
      return;
    }

    setPhoto(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Remove photo ─────────────────────────────────────────────────────────
  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setPhotoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Validate form ────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};

    if (!form.title.trim()) {
      errors.title = 'A short title is required.';
    } else if (form.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters.';
    } else if (form.title.trim().length > 100) {
      errors.title = 'Title must be under 100 characters.';
    }

    if (!form.category) {
      errors.category = 'Please select a category.';
    }

    if (!form.description.trim()) {
      errors.description = 'Please describe the issue.';
    } else if (form.description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters. Be specific.';
    } else if (form.description.trim().length > 1000) {
      errors.description = 'Description must be under 1000 characters.';
    }

    if (!form.priority) {
      errors.priority = 'Please select a priority.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Move to confirmation step ─────────────────────────────────────────────
  const handleReview = () => {
    if (validate()) setActiveStep(1);
  };

  // ── Go back to form step ─────────────────────────────────────────────────
  const handleBack = () => {
    setActiveStep(0);
    setSubmitError('');
  };

  // ── Final submit ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      // Step 1: Create the complaint
      const created = await complaintApi.createComplaint({
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category,
        priority:    form.priority,
      });

      setCreatedComplaint(created);

      // Step 2: Upload photo if selected
      if (photo) {
        setUploadingPhoto(true);
        try {
          await complaintApi.uploadAttachment(created.id, photo);
          setPhotoUploaded(true);
        } catch (photoErr) {
          // Photo upload failure should NOT block the complaint creation
          // The complaint is already created — just note that photo upload failed
          console.warn('Photo upload failed:', photoErr);
          setPhotoUploaded(false);
        } finally {
          setUploadingPhoto(false);
        }
      }

      // Move to success step
      setActiveStep(2);

    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;

        if (status === 422) {
          setSubmitError('Please check your complaint details and try again.');
        } else if (status === 400) {
          // Likely "no room assignment" error
          setSubmitError(
            typeof detail === 'string'
              ? detail
              : 'You do not have an active room assignment. Please contact the warden.'
          );
        } else if (status === 401) {
          setSubmitError('Your session has expired. Please login again.');
        } else if (status >= 500) {
          setSubmitError('Server error. Please try again in a moment.');
        } else {
          setSubmitError(
            typeof detail === 'string' ? detail : 'Submission failed. Please try again.'
          );
        }
      } else {
        setSubmitError('Cannot connect to server. Make sure the backend is running.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <PageHeader
        title="New Complaint"
        subtitle="Submit a maintenance issue for your room."
        breadcrumbs={[
          { label: 'Dashboard',     href: '/student/dashboard' },
          { label: 'My Complaints', href: '/student/complaints' },
          { label: 'New Complaint' },
        ]}
      />

      {/* ── Progress stepper ──────────────────────────────────────────────── */}
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {STEPS.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 0 — Complaint form                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeStep === 0 && (
        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Describe the Issue
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Please provide clear details. The more specific you are, the faster it can be resolved.
            </Typography>

            <Grid container spacing={2.5}>

              {/* Title */}
              <Grid xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
                  Complaint Title <span style={{ color: '#F43F5E' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  placeholder="e.g. Ceiling fan making noise and stopping"
                  value={form.title}
                  onChange={handleChange('title')}
                  error={!!fieldErrors.title}
                  helperText={fieldErrors.title || `${form.title.length}/100 characters`}
                  inputProps={{ maxLength: 100 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box sx={{ mr: 1, color: 'text.disabled', display: 'flex' }}>
                          <TitleOutlined sx={{ fontSize: 18 }} />
                        </Box>
                      ),
                    },
                  }}
                />
              </Grid>

              {/* Category */}
              <Grid xs={12} sm={6}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
                  Category <span style={{ color: '#F43F5E' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  select
                  value={form.category}
                  onChange={handleChange('category')}
                  error={!!fieldErrors.category}
                  helperText={fieldErrors.category || 'Select the type of issue'}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box sx={{ mr: 1, color: 'text.disabled', display: 'flex' }}>
                          <CategoryOutlined sx={{ fontSize: 18 }} />
                        </Box>
                      ),
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>Select category</em>
                  </MenuItem>
                  {CATEGORY_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Priority */}
              <Grid xs={12} sm={6}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
                  Priority <span style={{ color: '#F43F5E' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  select
                  value={form.priority}
                  onChange={handleChange('priority')}
                  error={!!fieldErrors.priority}
                  helperText={fieldErrors.priority || 'How urgent is this issue?'}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box sx={{ mr: 1, color: 'text.disabled', display: 'flex' }}>
                          <PriorityHighOutlined sx={{ fontSize: 18 }} />
                        </Box>
                      ),
                    },
                  }}
                >
                  {PRIORITY_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            bgcolor: PRIORITY_CONFIG[opt.value]?.color,
                          }}
                        />
                        {opt.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Description */}
              <Grid xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
                  Description <span style={{ color: '#F43F5E' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  placeholder={
                    'Describe the issue clearly.\n\n' +
                    'Example: The ceiling fan in my room is making a loud rattling noise and stops every 10 minutes. ' +
                    'It has been happening since yesterday evening.'
                  }
                  value={form.description}
                  onChange={e => {handleChange('description')(e);classifyDebounced(e.target.value);}}
                  error={!!fieldErrors.description}
                  helperText={
                    fieldErrors.description
                      ? fieldErrors.description
                      : `${form.description.length}/1000 — minimum 20 characters`
                  }
                  inputProps={{ maxLength: 1000 }}
                />
              </Grid>
          {/* Urgent warning */}
          {isUrgent && (
          <Grid xs={12}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              <strong>⚠️ Urgent issue detected.</strong> If this is an emergency
              (fire, flood, electric shock), please contact the warden or hostel
               administration immediately. Do not rely solely on this system.
            </Alert>
          </Grid>
          )}

{/* Classification suggestion */}
{classification && classification.category !== 'GENERAL' && (
  <Grid xs={12}>
    <ClassificationSuggestion
      result={classification}
      applied={suggestionApplied}
      onApply={({ category, priority }) => {
        setForm(prev => ({ ...prev, category, priority }));
        setFieldErrors(prev => ({ ...prev, category: '', priority: '' }));
        setSuggestionApplied(true);
      }}
    />
  </Grid>
)}
 
              {/* Photo upload */}
              <Grid xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, display: 'block' }}>
                  Photo{' '}
                  <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional — max 5MB, JPG/PNG/WEBP)</span>
                </Typography>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelect}
                />

                {!photoPreview ? (
                  <Paper
                    variant="outlined"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      borderStyle: 'dashed',
                      borderColor: photoError ? 'error.main' : 'divider',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <PhotoCameraOutlined sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Click to attach a photo of the issue
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      JPG, PNG, or WEBP — max 5MB
                    </Typography>
                    {photoError && (
                      <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.5 }}>
                        {photoError}
                      </Typography>
                    )}
                  </Paper>
                ) : (
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Box
                      component="img"
                      src={photoPreview}
                      alt="Preview"
                      sx={{
                        width: '100%', maxWidth: 300,
                        borderRadius: 2, border: '2px solid',
                        borderColor: 'divider', display: 'block',
                      }}
                    />
                    <IconButton
                      onClick={handleRemovePhoto}
                      size="small"
                      sx={{
                        position: 'absolute', top: -8, right: -8,
                        bgcolor: 'error.main', color: '#fff',
                        '&:hover': { bgcolor: 'error.dark' },
                        width: 24, height: 24,
                      }}
                    >
                      <CloseOutlined sx={{ fontSize: 14 }} />
                    </IconButton>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {photo?.name} ({(photo?.size / 1024 / 1024).toFixed(2)}MB)
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>

            {/* Action */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleReview}
                sx={{ px: 4 }}
              >
                Review Complaint →
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 1 — Confirmation screen                                        */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeStep === 1 && (
        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Review Your Complaint
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Please review carefully before submitting.
            </Typography>

            {/* Warning notice */}
            <Alert
              severity="warning"
              icon={<WarningAmberOutlined />}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              <strong>Once submitted, this complaint cannot be edited.</strong>{' '}
              Please make sure all details are correct.
            </Alert>

            {/* Summary */}
            <Paper
              variant="outlined"
              sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}
            >
              {[
                { label: 'Title',       value: form.title },
                { label: 'Category',    value: CATEGORY_CONFIG[form.category]?.label || form.category },
                { label: 'Priority',    value: PRIORITY_CONFIG[form.priority]?.label || form.priority },
                { label: 'Description', value: form.description, multiline: true },
                { label: 'Photo',       value: photo ? `${photo.name} (${(photo.size / 1024 / 1024).toFixed(2)}MB)` : 'No photo attached' },
              ].map((row, i) => (
                <Box key={row.label}>
                  {i > 0 && <Divider />}
                  <Box sx={{ px: 2.5, py: 1.75, display: 'flex', gap: 2, alignItems: row.multiline ? 'flex-start' : 'center' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600, color: 'text.secondary',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        minWidth: 90, flexShrink: 0, pt: row.multiline ? 0.25 : 0,
                      }}
                    >
                      {row.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.primary', fontWeight: row.label === 'Title' ? 600 : 400,
                        whiteSpace: row.multiline ? 'pre-wrap' : 'normal',
                      }}
                    >
                      {row.value}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Paper>

            {/* Photo preview in confirmation */}
            {photoPreview && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                  ATTACHED PHOTO
                </Typography>
                <Box
                  component="img"
                  src={photoPreview}
                  alt="Attached"
                  sx={{ maxWidth: 240, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
                />
              </Box>
            )}

            {/* Submit error */}
            {submitError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {submitError}
              </Alert>
            )}

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackOutlined />}
                onClick={handleBack}
                disabled={submitting}
              >
                Edit Complaint
              </Button>
              <Button
                variant="contained"
                endIcon={submitting ? null : <SendOutlined />}
                onClick={handleSubmit}
                disabled={submitting}
                size="large"
                sx={{ px: 4 }}
              >
                {submitting ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CircularProgress size={18} color="inherit" />
                    {uploadingPhoto ? 'Uploading photo…' : 'Submitting…'}
                  </Box>
                ) : 'Confirm & Submit'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* STEP 2 — Success screen                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeStep === 2 && createdComplaint && (
        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 4 }, textAlign: 'center' }}>
            {/* Success icon */}
            <Box
              sx={{
                width: 72, height: 72, borderRadius: '50%',
                bgcolor: '#D1FAE5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}
            >
              <CheckCircleOutlined sx={{ color: '#10B981', fontSize: 40 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Complaint Submitted!
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Your complaint has been received and will be reviewed shortly.
            </Typography>

            {/* Complaint ID badge */}
            <Box sx={{ my: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Your complaint reference number
              </Typography>
              <Box
                sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 1,
                  bgcolor: '#EEF2FF', border: '1px solid #C7D2FE',
                  borderRadius: 2, px: 2.5, py: 1, mt: 0.5,
                }}
              >
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#3730A3', fontSize: '1.1rem' }}>
                  #{createdComplaint.id}
                </Typography>
              </Box>
            </Box>

            {/* Photo upload status */}
            {photo && (
              <Alert
                severity={photoUploaded ? 'success' : 'warning'}
                sx={{ mb: 2.5, borderRadius: 2, textAlign: 'left' }}
              >
                {photoUploaded
                  ? 'Photo attached successfully.'
                  : 'Complaint submitted, but photo upload failed. You can try again from the complaint details page.'}
              </Alert>
            )}

            {/* What happens next */}
            <Paper
              variant="outlined"
              sx={{ borderRadius: 2, p: 2, mb: 3, textAlign: 'left', bgcolor: '#FAFAFA' }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                WHAT HAPPENS NEXT
              </Typography>
              {[
                'Your complaint is reviewed by the warden',
                'It is assigned to the appropriate maintenance staff',
                'Staff begins work and updates the status',
                'Once resolved, you will be asked to verify the fix',
              ].map((step, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 0.75 }}>
                  <Box
                    sx={{
                      width: 20, height: 20, borderRadius: '50%',
                      bgcolor: '#EEF2FF', color: '#4F46E5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0, mt: 0.1,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {step}
                  </Typography>
                </Box>
              ))}
            </Paper>

            {/* Navigation buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/student/complaints/${createdComplaint.id}`)}
              >
                View Complaint
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/student/complaints')}
              >
                My Complaints
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default NewComplaintPage;