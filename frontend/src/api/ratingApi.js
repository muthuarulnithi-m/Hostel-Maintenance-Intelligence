import axiosInstance from './axios';

/**
 * ratingApi
 * Built against actual Swagger contract.
 *
 * Rules (from backend docs):
 * - Only the complaint owner (student) can rate
 * - Complaint must be CLOSED
 * - Complaint must have assigned staff
 * - One rating per complaint
 */
const ratingApi = {

  /**
   * Submit a rating for a closed complaint.
   * POST /ratings/complaints/{complaint_id}
   * Body: { rating: 1-5, feedback: string }
   * Returns: { id, complaint_id, student_id, staff_id, rating, feedback, created_at }
   */
  createRating: async (complaintId, { rating, feedback }) => {
    const response = await axiosInstance.post(
      `/ratings/complaints/${complaintId}`,
      { rating, feedback }
    );
    return response.data;
  },

  /**
   * Get the rating for a specific complaint.
   * GET /ratings/complaints/{complaint_id}
   * Auth: student (own), warden, admin
   */
  getComplaintRating: async (complaintId) => {
    const response = await axiosInstance.get(
      `/ratings/complaints/${complaintId}`
    );
    return response.data;
  },

  /**
   * Get all ratings submitted by the current student.
   * GET /ratings/my
   * Auth: student
   */
  getMyRatings: async () => {
    const response = await axiosInstance.get('/ratings/my');
    return response.data;
  },
};

export default ratingApi;