import axiosInstance from './axios';

/**
 * authApi
 * All authentication-related API calls.
 * Built against the actual backend Swagger contract.
 */
const authApi = {

  /**
   * Login
   * POST /auth/login
   * Body: { email, password }
   * Returns: { access_token, token_type }
   */
  login: async (email, password) => {
    const response = await axiosInstance.post('/auth/login', {
      email,
      password,
    });
    return response.data; // { access_token, token_type }
  },

  /**
   * Get current user
   * GET /auth/me
   * Requires: Bearer token in Authorization header (set by axios interceptor)
   * Returns: { id, name, email, phone, role, is_active, created_at }
   */
  getMe: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },

  /**
   * Register new user
   * POST /auth/register
   * Body: { name, email, phone, password }
   * Note: role is NOT sent — backend assigns STUDENT by default for public registration
   * Returns: { id, name, email, phone, role, is_active, created_at }
   */
  register: async ({ name, email, phone, password }) => {
    const response = await axiosInstance.post('/auth/register', {
      name,
      email,
      phone,
      password,
    });
    return response.data;
  },
};

export default authApi;