import apiClient from './apiClient';

/**
 * Authentication API service
 */
const authService = {
  /**
   * Login user
   * @param {Object} credentials - Email and password
   * @returns {Promise} API response with user and token
   */
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    const { token, refreshToken, ...user } = response.data;
    
    if (token) {
      localStorage.setItem('token', token);
      apiClient.setToken(token);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(user));
    
    return { ...response.data, user };
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise} API response
   */
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    const { token, refreshToken, ...user } = response.data;
    
    if (token) {
      localStorage.setItem('token', token);
      apiClient.setToken(token);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(user));
    
    return { ...response.data, user };
  },

  /**
   * Logout user
   * @returns {Promise} API response
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      apiClient.clearToken();
    }
  },

  /**
   * Refresh authentication token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise} API response
   */
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    const { token, refreshToken: newRefreshToken } = response.data;
    
    if (token) {
      localStorage.setItem('token', token);
      apiClient.setToken(token);
    }
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    
    return response.data;
  },

  /**
   * Get current user profile
   * @returns {Promise} API response
   */
  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} API response
   */
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/auth/update-profile', profileData);
    const { user } = response.data;
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  /**
   * Change password
   * @param {Object} passwords - Current and new password
   * @returns {Promise} API response
   */
  changePassword: async (passwords) => {
    return apiClient.put('/auth/change-password', passwords);
  },

  /**
   * Forgot password
   * @param {string} email - User email
   * @returns {Promise} API response
   */
  forgotPassword: async (email) => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password
   * @param {Object} data - Reset token and new password
   * @returns {Promise} API response
   */
  resetPassword: async (data) => {
    return apiClient.put('/auth/reset-password', data);
  },

  /**
   * Get stored user from localStorage
   * @returns {Object|null} User object or null
   */
  getStoredUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Initialize auth from localStorage
   */
  initializeAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      apiClient.setToken(token);
    }
  },
};

export default authService;