import apiClient from './apiClient';

/**
 * Ambulance API service
 */
const ambulanceService = {
  /**
   * Get all ambulances
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getAmbulances: async (params = {}) => {
    const response = await apiClient.get('/ambulances', { params });
    return response.data;
  },

  /**
   * Get ambulance by ID
   * @param {string} ambulanceId - Ambulance ID
   * @returns {Promise} API response
   */
  getAmbulanceById: async (ambulanceId) => {
    const response = await apiClient.get(`/ambulances/${ambulanceId}`);
    return response.data;
  },

  /**
   * Create new ambulance (admin)
   * @param {Object} ambulanceData - Ambulance data
   * @returns {Promise} API response
   */
  createAmbulance: async (ambulanceData) => {
    const response = await apiClient.post('/ambulances', ambulanceData);
    return response.data;
  },

  /**
   * Update ambulance
   * @param {string} ambulanceId - Ambulance ID
   * @param {Object} ambulanceData - Ambulance data to update
   * @returns {Promise} API response
   */
  updateAmbulance: async (ambulanceId, ambulanceData) => {
    const response = await apiClient.put(`/ambulances/${ambulanceId}`, ambulanceData);
    return response.data;
  },

  /**
   * Delete ambulance (admin)
   * @param {string} ambulanceId - Ambulance ID
   * @returns {Promise} API response
   */
  deleteAmbulance: async (ambulanceId) => {
    const response = await apiClient.delete(`/ambulances/${ambulanceId}`);
    return response.data;
  },

  /**
   * Get available ambulances near location
   * @param {Object} location - Location coordinates
   * @returns {Promise} API response
   */
  getAvailableAmbulances: async (location) => {
    const response = await apiClient.get('/ambulances/available', { params: location });
    return response.data;
  },

  /**
   * Update ambulance location
   * @param {string} ambulanceId - Ambulance ID
   * @param {Object} location - Location coordinates
   * @returns {Promise} API response
   */
  updateLocation: async (ambulanceId, location) => {
    const response = await apiClient.patch(`/ambulances/${ambulanceId}/location`, location);
    return response.data;
  },

  /**
   * Update ambulance status
   * @param {string} ambulanceId - Ambulance ID
   * @param {string} status - New status
   * @returns {Promise} API response
   */
  updateStatus: async (ambulanceId, status) => {
    const response = await apiClient.patch(`/ambulances/${ambulanceId}/status`, { status });
    return response.data;
  },

  /**
   * Assign ambulance to emergency
   * @param {string} ambulanceId - Ambulance ID
   * @param {string} emergencyId - Emergency ID
   * @returns {Promise} API response
   */
  assignToEmergency: async (ambulanceId, emergencyId) => {
    const response = await apiClient.post(`/ambulances/${ambulanceId}/assign`, { emergencyId });
    return response.data;
  },

  /**
   * Get ambulance crew
   * @param {string} ambulanceId - Ambulance ID
   * @returns {Promise} API response
   */
  getCrew: async (ambulanceId) => {
    const response = await apiClient.get(`/ambulances/${ambulanceId}/crew`);
    return response.data;
  },
};

export default ambulanceService;