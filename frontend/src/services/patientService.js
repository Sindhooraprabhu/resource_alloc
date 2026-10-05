import apiClient from './apiClient';

/**
 * Patient API service
 */
const patientService = {
  /**
   * Get all patients
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getPatients: async (params = {}) => {
    const response = await apiClient.get('/patients', { params });
    return response.data;
  },

  /**
   * Get patient by ID
   * @param {string} patientId - Patient ID
   * @returns {Promise} API response
   */
  getPatientById: async (patientId) => {
    const response = await apiClient.get(`/patients/${patientId}`);
    return response.data;
  },

  /**
   * Create new patient
   * @param {Object} patientData - Patient data
   * @returns {Promise} API response
   */
  createPatient: async (patientData) => {
    const response = await apiClient.post('/patients', patientData);
    return response.data;
  },

  /**
   * Update patient
   * @param {string} patientId - Patient ID
   * @param {Object} patientData - Patient data to update
   * @returns {Promise} API response
   */
  updatePatient: async (patientId, patientData) => {
    const response = await apiClient.put(`/patients/${patientId}`, patientData);
    return response.data;
  },

  /**
   * Delete patient
   * @param {string} patientId - Patient ID
   * @returns {Promise} API response
   */
  deletePatient: async (patientId) => {
    const response = await apiClient.delete(`/patients/${patientId}`);
    return response.data;
  },

  /**
   * Get patient vitals
   * @param {string} patientId - Patient ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getPatientVitals: async (patientId, params = {}) => {
    const response = await apiClient.get(`/patients/${patientId}/vitals`, { params });
    return response.data;
  },

  /**
   * Add patient vitals
   * @param {string} patientId - Patient ID
   * @param {Object} vitalsData - Vitals data
   * @returns {Promise} API response
   */
  addPatientVitals: async (patientId, vitalsData) => {
    const response = await apiClient.post(`/patients/${patientId}/vitals`, vitalsData);
    return response.data;
  },

  /**
   * Get patient history
   * @param {string} patientId - Patient ID
   * @returns {Promise} API response
   */
  getPatientHistory: async (patientId) => {
    const response = await apiClient.get(`/patients/${patientId}/history`);
    return response.data;
  },

  /**
   * Get patient emergencies
   * @param {string} patientId - Patient ID
   * @returns {Promise} API response
   */
  getPatientEmergencies: async (patientId) => {
    const response = await apiClient.get(`/patients/${patientId}/emergencies`);
    return response.data;
  },

  /**
   * Get patient hospitalizations
   * @param {string} patientId - Patient ID
   * @returns {Promise} API response
   */
  getPatientHospitalizations: async (patientId) => {
    const response = await apiClient.get(`/patients/${patientId}/hospitalizations`);
    return response.data;
  },

  /**
   * Search patients by MRN or name
   * @param {string} query - Search query
   * @returns {Promise} API response
   */
  searchPatients: async (query) => {
    const response = await apiClient.get('/patients/search', { params: { q: query } });
    return response.data;
  },
};

export default patientService;