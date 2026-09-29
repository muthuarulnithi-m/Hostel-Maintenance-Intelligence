import axiosInstance from './axios';

/**
 * staffApi
 * All staff-related API calls.
 *
 * IMPORTANT: GET /staff returns { id, user_id, employee_code,
 * availability_status, joined_at } — no name field.
 * To display staff names, we need GET /auth/me or a users endpoint.
 * For now we display employee_code and availability_status.
 */
const staffApi = {

  /**
   * Get all staff members.
   * GET /staff?availability_status=AVAILABLE
   * Auth: WARDEN or ADMIN
   * Returns: StaffResponse[]
   */
  getAllStaff: async (availabilityStatus = null) => {
    const params = availabilityStatus ? { availability_status: availabilityStatus } : {};
    const response = await axiosInstance.get('/staff', { params });
    return response.data;
  },

  /**
   * Get a single staff member.
   * GET /staff/{staff_id}
   * Returns: StaffResponse
   */
  getStaffById: async (staffId) => {
    const response = await axiosInstance.get(`/staff/${staffId}`);
    return response.data;
  },

  /**
   * Get skills for a staff member.
   * GET /staff/{staff_id}/skills
   * Returns: [{ id, staff_id, skill }]
   */
  getStaffSkills: async (staffId) => {
    const response = await axiosInstance.get(`/staff/${staffId}/skills`);
    return response.data;
  },

  /**
   * Update staff availability.
   * PATCH /staff/{staff_id}/availability
   * Body: { availability_status }
   */
  updateAvailability: async (staffId, availabilityStatus) => {
    const response = await axiosInstance.patch(
      `/staff/${staffId}/availability`,
      { availability_status: availabilityStatus }
    );
    return response.data;
  },

  /**
   * Create a new staff account (admin only).
   * POST /staff
   * Body: { name, email, phone, password, employee_code }
   */
  createStaff: async ({ name, email, phone, password, employee_code }) => {
    const response = await axiosInstance.post('/staff', {
      name, email, phone, password, employee_code,
    });
    return response.data;
  },
};

export default staffApi;