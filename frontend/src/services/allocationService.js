import apiClient from './apiClient';

/**
 * Dynamic Emergency Resource Allocation API service
 */
const allocationService = {
    /**
     * Trigger the allocation engine for an emergency case
     * @param {string} emergencyId - Emergency case ID
     * @param {Object} options - Options (autoConfirm)
     * @returns {Promise} Allocation result with recommendations
     */
    allocateEmergency: async (emergencyId, options = {}) => {
        const response = await apiClient.post(`/allocation/${emergencyId}/allocate`, options);
        return response.data;
    },

    manualAllocation: async (emergencyId, data) => {
        const response = await apiClient.post(`/allocation/${emergencyId}/manual`, data);
        return response.data;
    },

    refreshRoute: async (emergencyId, traffic) => {
        const response = await apiClient.post(`/allocation/${emergencyId}/refresh-route`, { traffic });
        return response.data;
    },

    notifyPatient: async (emergencyId, message, type = 'UPDATE') => {
        const response = await apiClient.post(`/allocation/${emergencyId}/notify-patient`, { message, type });
        return response.data;
    },

    /**
     * Get allocation status for an emergency case
     * @param {string} emergencyId - Emergency case ID
     * @returns {Promise} Full allocation status
     */
    getAllocationStatus: async (emergencyId) => {
        const response = await apiClient.get(`/allocation/${emergencyId}/status`);
        return response.data;
    },

    /**
     * Confirm hospital acceptance and lock resources
     * @param {string} emergencyId - Emergency case ID
     * @param {Object} data - Hospital ID, vitals, ambulance location, ETA
     * @returns {Promise} Confirmation with reservations
     */
    confirmAllocation: async (emergencyId, data) => {
        const response = await apiClient.post(`/allocation/${emergencyId}/confirm`, data);
        return response.data;
    },

    /**
     * Reject hospital allocation and trigger reallocation
     * @param {string} emergencyId - Emergency case ID
     * @param {Object} data - Hospital ID and rejection reason
     * @returns {Promise} Reallocation result
     */
    rejectAllocation: async (emergencyId, data) => {
        const response = await apiClient.post(`/allocation/${emergencyId}/reject`, data);
        return response.data;
    },

    /**
     * Complete or cancel emergency and release resources
     * @param {string} emergencyId - Emergency case ID
     * @param {Object} data - { cancel: boolean }
     * @returns {Promise} Completion result
     */
    completeAllocation: async (emergencyId, data = {}) => {
        const response = await apiClient.post(`/allocation/${emergencyId}/complete`, data);
        return response.data;
    },

    /**
     * Get all active allocations (admin view)
     * @returns {Promise} Active emergency cases
     */
    getActiveAllocations: async () => {
        const response = await apiClient.get('/allocation/active');
        return response.data;
    },

    /**
     * Update patient handover data (vitals, ambulance location, ETA)
     * @param {string} emergencyId - Emergency case ID
     * @param {Object} data - Vitals, location, ETA
     * @returns {Promise} Updated handover data
     */
    updatePatientHandover: async (emergencyId, data) => {
        const response = await apiClient.put(`/allocation/${emergencyId}/handover`, data);
        return response.data;
    }
};

export default allocationService;