import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// ─── Install date-fns first ───────────────────────────────────────────────────
// Run: npm install date-fns

/**
 * Format an ISO date string to a readable date.
 * e.g. "2026-09-11T10:26:56.449Z" → "11 Sep 2026"
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return '—';
    return format(date, 'd MMM yyyy');
  } catch {
    return '—';
  }
}

/**
 * Format an ISO date string to date + time.
 * e.g. → "11 Sep 2026, 10:26 AM"
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return '—';
    return format(date, 'd MMM yyyy, h:mm aa');
  } catch {
    return '—';
  }
}

/**
 * Relative time from now.
 * e.g. → "3 hours ago"
 */
export function formatRelative(isoString) {
  if (!isoString) return '—';
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return '—';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '—';
  }
}

// ─── Category display config ──────────────────────────────────────────────────
export const CATEGORY_CONFIG = {
  GENERAL:     { label: 'General',     color: '#64748B', bg: '#F1F5F9' },
  ELECTRICAL:  { label: 'Electrical',  color: '#D97706', bg: '#FFFBEB' },
  PLUMBING:    { label: 'Plumbing',    color: '#0369A1', bg: '#EFF6FF' },
  CARPENTRY:   { label: 'Carpentry',   color: '#92400E', bg: '#FEF3C7' },
  CLEANING:    { label: 'Cleaning',    color: '#065F46', bg: '#ECFDF5' },
  INTERNET:    { label: 'Internet',    color: '#6D28D9', bg: '#EDE9FE' },
  OTHER:       { label: 'Other',       color: '#475569', bg: '#F8FAFC' },
};

/**
 * Get category display label.
 */
export function getCategoryLabel(category) {
  return CATEGORY_CONFIG[category]?.label || category || '—';
}

// ─── Status display config ────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  SUBMITTED:   { label: 'Submitted',   color: '#1D4ED8', bg: '#EFF6FF' },
  ASSIGNED:    { label: 'Assigned',    color: '#0369A1', bg: '#E0F2FE' },
  IN_PROGRESS: { label: 'In Progress', color: '#0D9488', bg: '#F0FDFA' },
  ON_HOLD:     { label: 'On Hold',     color: '#92400E', bg: '#FFFBEB' },
  RESOLVED:    { label: 'Resolved',    color: '#166534', bg: '#F0FDF4' },
  CLOSED:      { label: 'Closed',      color: '#065F46', bg: '#DCFCE7' },
  CANCELLED:   { label: 'Cancelled',   color: '#64748B', bg: '#F1F5F9' },
};

/**
 * Get status display label.
 */
export function getStatusLabel(status) {
  return STATUS_CONFIG[status]?.label || status || '—';
}

// ─── Priority display config ──────────────────────────────────────────────────
export const PRIORITY_CONFIG = {
  LOW:      { label: 'Low',      color: '#64748B', bg: '#F8FAFC' },
  MEDIUM:   { label: 'Medium',   color: '#92400E', bg: '#FFFBEB' },
  HIGH:     { label: 'High',     color: '#C2410C', bg: '#FFF7ED' },
  CRITICAL: { label: 'Critical', color: '#9F1239', bg: '#FFF1F2' },
};

/**
 * Get priority display label.
 */
export function getPriorityLabel(priority) {
  return PRIORITY_CONFIG[priority]?.label || priority || '—';
}

/**
 * Check if a complaint is within the 30-minute cancellation window.
 * Backend allows cancel only if SUBMITTED or ASSIGNED and within 30 min.
 */
export function isCancellable(complaint) {
  if (!complaint) return false;
  if (!['SUBMITTED', 'ASSIGNED'].includes(complaint.status)) return false;
  if (!complaint.created_at) return false;
  try {
    const created  = parseISO(complaint.created_at);
    const nowMs    = Date.now();
    const diffMins = (nowMs - created.getTime()) / 1000 / 60;
    return diffMins <= 30;
  } catch {
    return false;
  }
}

/**
 * Build a human-readable complaint timeline from the complaint object.
 * Returns array of { label, timestamp, description } in chronological order.
 */
export function buildTimeline(complaint) {
  if (!complaint) return [];

  const events = [];

  if (complaint.created_at) {
    events.push({
      key:         'created',
      label:       'Complaint Submitted',
      timestamp:   complaint.created_at,
      description: 'Your complaint has been received and is pending review.',
      status:      'SUBMITTED',
    });
  }

  if (complaint.assigned_at) {
    events.push({
      key:         'assigned',
      label:       'Assigned to Staff',
      timestamp:   complaint.assigned_at,
      description: complaint.assigned_staff_id
        ? `Assigned to staff member #${complaint.assigned_staff_id}.`
        : 'Assigned to a maintenance staff member.',
      status:      'ASSIGNED',
    });
  }

  if (complaint.started_at) {
    events.push({
      key:         'started',
      label:       'Work Started',
      timestamp:   complaint.started_at,
      description: 'The maintenance staff has started working on your complaint.',
      status:      'IN_PROGRESS',
    });
  }

  if (complaint.held_at) {
    events.push({
      key:         'held',
      label:       'Placed On Hold',
      timestamp:   complaint.held_at,
      description: complaint.hold_reason
        ? `Reason: ${complaint.hold_reason}`
        : 'The complaint has been temporarily placed on hold.',
      status:      'ON_HOLD',
    });
  }

  if (complaint.resolved_at) {
    events.push({
      key:         'resolved',
      label:       'Marked as Resolved',
      timestamp:   complaint.resolved_at,
      description: complaint.resolved_description
        ? `Staff note: ${complaint.resolved_description}`
        : 'The maintenance staff has marked this complaint as resolved.',
      status:      'RESOLVED',
    });
  }

  if (complaint.closed_at) {
    events.push({
      key:         'closed',
      label:       'Complaint Closed',
      timestamp:   complaint.closed_at,
      description: 'The complaint has been verified and successfully closed.',
      status:      'CLOSED',
    });
  }

  if (complaint.cancelled_at) {
    events.push({
      key:         'cancelled',
      label:       'Complaint Cancelled',
      timestamp:   complaint.cancelled_at,
      description: complaint.cancelled_reason
        ? `Reason: ${complaint.cancelled_reason}`
        : 'The complaint was cancelled.',
      status:      'CANCELLED',
    });
  }

  // Sort chronologically
  return events.sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
}