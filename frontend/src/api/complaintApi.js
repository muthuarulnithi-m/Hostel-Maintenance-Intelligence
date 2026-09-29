import axiosInstance from './axios';

/**
 * complaintApi
 * All complaint-related API calls.
 * Built against actual Swagger contract.
 */
const complaintApi = {

  // ── Student endpoints ────────────────────────────────────────────────────

  /**
   * GET /complaints/my
   * Auth: student
   */
  getMyComplaints: async () => {
    const response = await axiosInstance.get('/complaints/my');
    return response.data;
  },

  /**
   * GET /complaints/{complaint_id}
   * Auth: any authenticated user
   */
  getComplaintById: async (complaintId) => {
    const response = await axiosInstance.get(`/complaints/${complaintId}`);
    return response.data;
  },

  /**
   * POST /complaints
   * Auth: student
   * Body: { title, description, category, priority }
   */
  createComplaint: async ({ title, description, category, priority }) => {
    const response = await axiosInstance.post('/complaints', {
      title, description, category, priority,
    });
    return response.data;
  },

  /**
   * POST /complaints/{complaint_id}/attachments
   * Auth: student (owner)
   * Body: multipart/form-data with field "file"
   */
  uploadAttachment: async (complaintId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post(
      `/complaints/${complaintId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  /**
   * PATCH /complaints/{complaint_id}/cancel
   * Auth: student (owner) — within 30 min
   * Body: { reason }
   */
  cancelComplaint: async (complaintId, reason) => {
    const response = await axiosInstance.patch(
      `/complaints/${complaintId}/cancel`,
      { reason }
    );
    return response.data;
  },

  /**
   * PATCH /complaints/{complaint_id}/verify
   * Auth: student (owner)
   * No body required
   */
  verifyComplaint: async (complaintId) => {
    const response = await axiosInstance.patch(
      `/complaints/${complaintId}/verify`
    );
    return response.data;
  },

  // ── Warden / Admin endpoints ─────────────────────────────────────────────

  /**
   * GET /complaints
   * Auth: WARDEN or ADMIN
   * Query: complaint_status (optional)
   */
  getAllComplaints: async (status = null) => {
    const params = status ? { complaint_status: status } : {};
    const response = await axiosInstance.get('/complaints', { params });
    return response.data;
  },

  /**
   * PATCH /complaints/{complaint_id}/assign
   * Auth: WARDEN or ADMIN
   * Body: { staff_id }
   */
  assignComplaint: async (complaintId, staffId) => {
    const response = await axiosInstance.patch(
      `/complaints/${complaintId}/assign`,
      { staff_id: staffId }
    );
    return response.data;
  },

  // ── Staff endpoints ──────────────────────────────────────────────────────

  /**
   * PATCH /complaints/{complaint_id}/start
   * Auth: assigned staff
   * No body required
   */
  startComplaint: async (complaintId) => {
    const response = await axiosInstance.patch(
      `/complaints/${complaintId}/start`
    );
    return response.data;
  },

  /**
   * PATCH /complaints/{complaint_id}/hold
   * Auth: assigned staff
   * Body: { reason }
   */
  holdComplaint: async (complaintId, reason) => {
    const response = await axiosInstance.patch(
      `/complaints/${complaintId}/hold`,
      { reason }
    );
    return response.data;
  },

  /**
   * PATCH /complaints/{complaint_id}/resolve
   * Auth: assigned staff
   * Body: { description }
   */
  resolveComplaint: async (complaintId, description) => {
    const response = await axiosInstance.patch(
      `/complaints/${complaintId}/resolve`,
      { description }
    );
    return response.data;
  },

  // ── Shared endpoints ─────────────────────────────────────────────────────

  /**
   * GET /complaints/{complaint_id}/history
   * Returns: [{ id, complaint_id, changed_by_user_id,
   *             old_status, new_status, note, created_at }]
   */
  getComplaintHistory: async (complaintId) => {
    const response = await axiosInstance.get(
      `/complaints/${complaintId}/history`
    );
    return response.data;
  },

  /**
   * GET /complaints/alerts
   * Auth: WARDEN or ADMIN
   * Returns repeat complaint alerts
   */
  getAlerts: async () => {
    const response = await axiosInstance.get('/complaints/alerts');
    return response.data;
  },

  /**
   * PATCH /complaints/alerts/{alert_id}/acknowledge
   * Auth: WARDEN or ADMIN
   */
  acknowledgeAlert: async (alertId) => {
    const response = await axiosInstance.patch(
      `/complaints/alerts/${alertId}/acknowledge`
    );
    return response.data;
  },
};

export default complaintApi;