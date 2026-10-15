import axiosInstance from './axios';

const hostelApi = {

  // ── Hostels ──────────────────────────────────────────────────────────────

  getAll: async () => {
    const response = await axiosInstance.get('/hostels');
    return response.data;
  },

  getById: async (hostelId) => {
    const response = await axiosInstance.get(`/hostels/${hostelId}`);
    return response.data;
  },

  /**
   * POST /hostels
   * Body: { name, code, address }
   */
  create: async ({ name, code, address }) => {
    const response = await axiosInstance.post('/hostels', { name, code, address });
    return response.data;
  },

  /**
   * PATCH /hostels/{hostel_id}
   * Body: { name, address, is_active }
   */
  update: async (hostelId, data) => {
    const response = await axiosInstance.patch(`/hostels/${hostelId}`, data);
    return response.data;
  },

  // ── Blocks ───────────────────────────────────────────────────────────────

  getBlocks: async (hostelId = null) => {
    const params = hostelId ? { hostel_id: hostelId } : {};
    const response = await axiosInstance.get('/blocks', { params });
    return response.data;
  },

  getBlockById: async (blockId) => {
    const response = await axiosInstance.get(`/blocks/${blockId}`);
    return response.data;
  },

  /**
   * POST /blocks
   * Body: { hostel_id, name, code }
   */
  createBlock: async ({ hostel_id, name, code }) => {
    const response = await axiosInstance.post('/blocks', { hostel_id, name, code });
    return response.data;
  },

  /**
   * PATCH /blocks/{block_id}
   * Body: { name, is_active }
   */
  updateBlock: async (blockId, data) => {
    const response = await axiosInstance.patch(`/blocks/${blockId}`, data);
    return response.data;
  },

  // ── Rooms ────────────────────────────────────────────────────────────────

  getRooms: async (blockId = null) => {
    const params = blockId ? { block_id: blockId } : {};
    const response = await axiosInstance.get('/rooms', { params });
    return response.data;
  },

  getRoomById: async (roomId) => {
    const response = await axiosInstance.get(`/rooms/${roomId}`);
    return response.data;
  },

  /**
   * POST /rooms
   * Body: { block_id, room_number, floor, capacity }
   */
  createRoom: async ({ block_id, room_number, floor, capacity }) => {
    const response = await axiosInstance.post('/rooms', {
      block_id, room_number, floor, capacity,
    });
    return response.data;
  },

  /**
   * PATCH /rooms/{room_id}
   * Body: { floor, capacity, is_active }
   */
  updateRoom: async (roomId, data) => {
    const response = await axiosInstance.patch(`/rooms/${roomId}`, data);
    return response.data;
  },

  // ── Student Room Assignments ──────────────────────────────────────────────

  /**
   * POST /assignments
   * Body: { student_id, room_id, start_date }
   */
  assignStudent: async ({ student_id, room_id, start_date }) => {
    const response = await axiosInstance.post('/assignments', {
      student_id, room_id, start_date,
    });
    return response.data;
  },

  /**
   * GET /assignments
   * Query: student_id?, room_id?, active_only?
   */
  getAssignments: async ({ student_id, room_id, active_only = true } = {}) => {
    const params = {};
    if (student_id  !== undefined) params.student_id  = student_id;
    if (room_id     !== undefined) params.room_id     = room_id;
    if (active_only !== undefined) params.active_only = active_only;
    const response = await axiosInstance.get('/assignments', { params });
    return response.data;
  },

  /**
   * GET /assignments/student/{student_id}
   */
  getStudentAssignments: async (studentId) => {
    const response = await axiosInstance.get(
      `/assignments/student/${studentId}`
    );
    return response.data;
  },

  /**
   * PATCH /assignments/{assignment_id}/end
   * Query param: end_date (YYYY-MM-DD)
   */
  endAssignment: async (assignmentId, endDate) => {
    const response = await axiosInstance.patch(
      `/assignments/${assignmentId}/end`,
      null,
      { params: { end_date: endDate } }
    );
    return response.data;
  },
};

export default hostelApi;