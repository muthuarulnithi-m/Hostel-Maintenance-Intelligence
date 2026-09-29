/**
 * analytics.js
 * Pure functions that derive analytics metrics from the complaints array.
 * All functions take (complaints: ComplaintResponse[]) and return plain objects.
 *
 * These are used by the warden analytics dashboard.
 * When the backend adds dedicated analytics endpoints, these can be replaced
 * with API calls — the component interface stays the same.
 */

// ─── Status distribution ──────────────────────────────────────────────────────
/**
 * Returns count per status.
 * e.g. { SUBMITTED: 5, ASSIGNED: 3, IN_PROGRESS: 8, ... }
 */
export function getStatusDistribution(complaints) {
  const counts = {};
  complaints.forEach(c => {
    counts[c.status] = (counts[c.status] || 0) + 1;
  });
  return counts;
}

// ─── Priority distribution ────────────────────────────────────────────────────
/**
 * Returns count per priority.
 * e.g. { LOW: 4, MEDIUM: 10, HIGH: 6, CRITICAL: 2 }
 */
export function getPriorityDistribution(complaints) {
  const counts = {};
  complaints.forEach(c => {
    counts[c.priority] = (counts[c.priority] || 0) + 1;
  });
  return counts;
}

// ─── Category distribution ────────────────────────────────────────────────────
/**
 * Returns count per category, sorted by count descending.
 * e.g. [{ category: 'ELECTRICAL', count: 12 }, ...]
 */
export function getCategoryDistribution(complaints) {
  const counts = {};
  complaints.forEach(c => {
    counts[c.category] = (counts[c.category] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Monthly trend ────────────────────────────────────────────────────────────
/**
 * Returns complaint count per month for the last N months.
 * e.g. [{ month: 'Jun 2026', count: 8 }, { month: 'Jul 2026', count: 12 }, ...]
 */
export function getMonthlyTrend(complaints, monthsBack = 6) {
  const now     = new Date();
  const months  = [];

  // Build month buckets
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      count: 0,
    });
  }

  // Fill counts
  complaints.forEach(c => {
    if (!c.created_at) return;
    const d   = new Date(c.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = months.find(m => m.key === key);
    if (bucket) bucket.count++;
  });

  return months;
}

// ─── Resolution time ──────────────────────────────────────────────────────────
/**
 * For closed complaints, calculates the time from created_at to closed_at in hours.
 * Returns { average, min, max, count } all in hours (rounded).
 */
export function getResolutionTimeStats(complaints) {
  const closed = complaints.filter(
    c => c.status === 'CLOSED' && c.created_at && c.closed_at
  );

  if (closed.length === 0) {
    return { average: 0, min: 0, max: 0, count: 0 };
  }

  const times = closed.map(c => {
    const diffMs = new Date(c.closed_at) - new Date(c.created_at);
    return diffMs / 1000 / 60 / 60; // hours
  });

  const sum = times.reduce((a, b) => a + b, 0);
  return {
    average: Math.round((sum / times.length) * 10) / 10,
    min:     Math.round(Math.min(...times) * 10) / 10,
    max:     Math.round(Math.max(...times) * 10) / 10,
    count:   closed.length,
  };
}

// ─── Staff workload ───────────────────────────────────────────────────────────
/**
 * Groups active complaints by assigned_staff_id.
 * Returns [{ staffId, total, inProgress, onHold, resolved }]
 * sorted by total descending.
 */
export function getStaffWorkload(complaints) {
  const map = {};

  complaints.forEach(c => {
    if (!c.assigned_staff_id) return;
    const id = c.assigned_staff_id;
    if (!map[id]) {
      map[id] = { staffId: id, total: 0, inProgress: 0, onHold: 0, resolved: 0, closed: 0 };
    }
    map[id].total++;
    if (c.status === 'IN_PROGRESS') map[id].inProgress++;
    if (c.status === 'ON_HOLD')     map[id].onHold++;
    if (c.status === 'RESOLVED')    map[id].resolved++;
    if (c.status === 'CLOSED')      map[id].closed++;
  });

  return Object.values(map).sort((a, b) => b.total - a.total);
}

// ─── Key summary metrics ──────────────────────────────────────────────────────
/**
 * Returns top-level summary numbers for the analytics dashboard.
 */
export function getSummaryMetrics(complaints) {
  const total       = complaints.length;
  const open        = complaints.filter(c => c.status === 'SUBMITTED').length;
  const inProgress  = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const onHold      = complaints.filter(c => c.status === 'ON_HOLD').length;
  const resolved    = complaints.filter(c => c.status === 'RESOLVED').length;
  const closed      = complaints.filter(c => c.status === 'CLOSED').length;
  const cancelled   = complaints.filter(c => c.status === 'CANCELLED').length;
  const highPri     = complaints.filter(c => ['HIGH','CRITICAL'].includes(c.priority) &&
    !['CLOSED','CANCELLED'].includes(c.status)).length;
  const unassigned  = complaints.filter(c => !c.assigned_staff_id &&
    !['CLOSED','CANCELLED'].includes(c.status)).length;

  const resolutionRate = total > 0
    ? Math.round(((resolved + closed) / total) * 100)
    : 0;

  const verificationRate = (resolved + closed) > 0
    ? Math.round((closed / (resolved + closed)) * 100)
    : 0;

  return {
    total, open, inProgress, onHold,
    resolved, closed, cancelled,
    highPri, unassigned,
    resolutionRate, verificationRate,
  };
}