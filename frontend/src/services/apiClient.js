import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
              const { token, refreshToken: newRefreshToken } = response.data;
              
              localStorage.setItem('token', token);
              localStorage.setItem('refreshToken', newRefreshToken);
              
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Format error response
        const formattedError = {
          message: error.response?.data?.message || error.message || 'An error occurred',
          status: error.response?.status,
          data: error.response?.data,
        };

        return Promise.reject(formattedError);
      }
    );
  }

  setToken(token) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Generic HTTP methods
  get(url, config) {
    return this.client.get(url, config);
  }

  post(url, data, config) {
    return this.client.post(url, data, config);
  }

  put(url, data, config) {
    return this.client.put(url, data, config);
  }

  patch(url, data, config) {
    return this.client.patch(url, data, config);
  }

  delete(url, config) {
    return this.client.delete(url, config);
  }
}

export const apiClient = new ApiClient();
export default apiClient;