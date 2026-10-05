import apiClient from './apiClient';

/**
 * Hospital API service
 */
const hospitalService = {
  /**
   * Get all hospitals with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getHospitals: async (params = {}) => {
    const response = await apiClient.get('/hospitals', { params });
    return response.data;
  },

  /**
   * Get nearby hospitals
   * @param {Object} location - Location coordinates
   * @param {Object} options - Additional options
   * @returns {Promise} API response
   */
  getNearbyHospitals: async (location, options = {}) => {
    const params = { ...location, ...options };
    const response = await apiClient.get('/hospitals/nearby', { params });
    return response.data;
  },

  /**
   * Get hospital by ID
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise} API response
   */
  getHospitalById: async (hospitalId) => {
    const response = await apiClient.get(`/hospitals/${hospitalId}`);
    return response.data;
  },

  /**
   * Create new hospital (admin)
   * @param {Object} hospitalData - Hospital data
   * @returns {Promise} API response
   */
  createHospital: async (hospitalData) => {
    const response = await apiClient.post('/hospitals', hospitalData);
    return response.data;
  },

  /**
   * Update hospital
   * @param {string} hospitalId - Hospital ID
   * @param {Object} hospitalData - Hospital data to update
   * @returns {Promise} API response
   */
  updateHospital: async (hospitalId, hospitalData) => {
    const response = await apiClient.put(`/hospitals/${hospitalId}`, hospitalData);
    return response.data;
  },

  /**
   * Delete hospital (admin)
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise} API response
   */
  deleteHospital: async (hospitalId) => {
    const response = await apiClient.delete(`/hospitals/${hospitalId}`);
    return response.data;
  },

  /**
   * Get hospital resources
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise} API response
   */
  getHospitalResources: async (hospitalId) => {
    const response = await apiClient.get(`/hospitals/${hospitalId}/resources`);
    return response.data;
  },

  /**
   * Update hospital resources
   * @param {string} hospitalId - Hospital ID
   * @param {Object} resources - Resources data
   * @returns {Promise} API response
   */
  updateHospitalResources: async (hospitalId, resources) => {
    const response = await apiClient.put(`/hospitals/${hospitalId}/resources`, resources);
    return response.data;
  },

  /**
   * Get hospital staff
   * @param {string} hospitalId - Hospital ID
   * @returns {Promise} API response
   */
  getHospitalStaff: async (hospitalId) => {
    const response = await apiClient.get(`/hospitals/${hospitalId}/staff`);
    return response.data;
  },

  /**
   * Get hospital specialties
   * @returns {Promise} API response
   */
  getSpecialties: async () => {
    const response = await apiClient.get('/hospitals/meta/specialties');
    return response.data;
  },

  /**
   * Get hospital departments
   * @returns {Promise} API response
   */
  getDepartments: async () => {
    const response = await apiClient.get('/hospitals/meta/departments');
    return response.data;
  },
};

export default hospitalService;