import apiClient from './apiClient';

/**
 * Emergency API service
 */
const emergencyService = {
  /**
   * Activate emergency SOS
   * @param {Object} emergencyData - Emergency data
   * @returns {Promise} API response with emergency and recommendations
   */
  activateSOS: async (emergencyData) => {
    const response = await apiClient.post('/emergencies/sos', emergencyData);
    return response.data;
  },

  /**
   * Get active emergencies
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getActiveEmergencies: async (params = {}) => {
    const response = await apiClient.get('/emergencies/active', { params });
    return response.data;
  },

  /**
   * Get emergency history
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getEmergencyHistory: async (params = {}) => {
    const response = await apiClient.get('/emergencies/history', { params });
    return response.data;
  },

  /**
   * Get emergency by ID
   * @param {string} emergencyId - Emergency ID
   * @returns {Promise} API response
   */
  getEmergencyById: async (emergencyId) => {
    const response = await apiClient.get(`/emergencies/${emergencyId}`);
    return response.data;
  },

  /**
   * Update emergency status
   * @param {string} emergencyId - Emergency ID
   * @param {Object} statusData - Status update data
   * @returns {Promise} API response
   */
  updateEmergencyStatus: async (emergencyId, statusData) => {
    const response = await apiClient.patch(`/emergencies/${emergencyId}/status`, statusData);
    return response.data;
  },

  /**
   * Get nearby hospitals
   * @param {Object} location - Location coordinates
   * @returns {Promise} API response
   */
  getNearbyHospitals: async (location) => {
    const response = await apiClient.get('/hospitals/nearby', { params: location });
    return response.data;
  },

  /**
   * Report incident
   * @param {Object} incidentData - Incident report data
   * @returns {Promise} API response
   */
  reportIncident: async (incidentData) => {
    const response = await apiClient.post('/incidents', incidentData);
    return response.data;
  },

  /**
   * Get incident reports (for admin)
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getIncidentReports: async (params = {}) => {
    const response = await apiClient.get('/incidents', { params });
    return response.data;
  },

  /**
   * Get allocation history for emergency
   * @param {string} emergencyId - Emergency ID
   * @returns {Promise} API response
   */
  getAllocationHistory: async (emergencyId) => {
    const response = await apiClient.get(`/emergencies/${emergencyId}/allocation-history`);
    return response.data;
  },

  getAllAllocationHistories: async () => {
    const response = await apiClient.get('/emergencies/allocation-history');
    return response.data;
  },

  /**
   * Save push subscription for emergency notifications
   * @param {string} emergencyId - Emergency ID
   * @param {Object} subscription - Push subscription object
   * @returns {Promise} API response
   */
  savePushSubscription: async (emergencyId, subscription) => {
    const response = await apiClient.post(`/emergencies/${emergencyId}/push-subscription`, { subscription });
    return response.data;
  },
};

export default emergencyService;