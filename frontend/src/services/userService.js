import apiClient from './apiClient';

/**
 * User/Staff API service
 */
const userService = {
  /**
   * Get all users
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getUsers: async (params = {}) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise} API response
   */
  getUserById: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Create new user (admin)
   * @param {Object} userData - User data
   * @returns {Promise} API response
   */
  createUser: async (userData) => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise} API response
   */
  updateUser: async (userId, userData) => {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Delete user (admin)
   * @param {string} userId - User ID
   * @returns {Promise} API response
   */
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Promise} API response
   */
  getUsersByRole: async (role) => {
    const response = await apiClient.get('/users', { params: { role } });
    return response.data;
  },

  /**
   * Get doctors
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getDoctors: async (params = {}) => {
    const response = await apiClient.get('/users/doctors', { params });
    return response.data;
  },

  /**
   * Get ambulance staff
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getAmbulanceStaff: async (params = {}) => {
    const response = await apiClient.get('/users/ambulance-staff', { params });
    return response.data;
  },

  /**
   * Get hospital staff
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getHospitalStaff: async (params = {}) => {
    const response = await apiClient.get('/users/hospital-staff', { params });
    return response.data;
  },
};

export default userService;