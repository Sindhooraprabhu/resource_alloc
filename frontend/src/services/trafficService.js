import apiClient from './apiClient';

/**
 * Traffic API service
 */
const trafficService = {
  /**
   * Get live traffic data
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getLiveTraffic: async (params = {}) => {
    const response = await apiClient.get('/traffic/live', { params });
    return response.data;
  },

  /**
   * Get traffic density
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getTrafficDensity: async (params = {}) => {
    const response = await apiClient.get('/traffic/density', { params });
    return response.data;
  },

  /**
   * Get traffic cameras
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getTrafficCameras: async (params = {}) => {
    const response = await apiClient.get('/traffic/cameras', { params });
    return response.data;
  },

  /**
   * Get traffic incidents
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getTrafficIncidents: async (params = {}) => {
    const response = await apiClient.get('/traffic/incidents', { params });
    return response.data;
  },

  /**
   * Create green corridor
   * @param {Object} corridorData - Corridor data
   * @returns {Promise} API response
   */
  createGreenCorridor: async (corridorData) => {
    const response = await apiClient.post('/traffic/green-corridor', corridorData);
    return response.data;
  },

  /**
   * Get active green corridors
   * @returns {Promise} API response
   */
  getActiveGreenCorridors: async () => {
    const response = await apiClient.get('/traffic/green-corridor/active');
    return response.data;
  },

  /**
   * Update traffic signal
   * @param {string} signalId - Signal ID
   * @param {Object} signalData - Signal data
   * @returns {Promise} API response
   */
  updateTrafficSignal: async (signalId, signalData) => {
    const response = await apiClient.patch(`/traffic/signals/${signalId}`, signalData);
    return response.data;
  },

  /**
   * Get route optimization
   * @param {Object} routeData - Route data (origin, destination, waypoints)
   * @returns {Promise} API response
   */
  getRouteOptimization: async (routeData) => {
    const response = await apiClient.post('/traffic/route', routeData);
    return response.data;
  },
};

export default trafficService;