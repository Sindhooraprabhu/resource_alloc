import jwtDecode from 'jwt-decode';

/**
 * Utility functions for the LifeLink AI application
 */

/**
 * Format date for display
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format time for display
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.charAt(0) === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone; // Return as-is if format not recognized
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid Indian phone number
 */
export const isValidIndianPhone = (phone) => {
  const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Get severity color based on level
 * @param {string} severity - Severity level (low, medium, high, critical)
 * @returns {string} CSS class for severity color
 */
export const getSeverityColor = (severity) => {
  switch (severity.toLowerCase()) {
    case 'low': return 'text-success';
    case 'medium': return 'text-secondary';
    case 'high': return 'text-warning';
    case 'critical': return 'text-error';
    default: return 'text-text-secondary';
  }
};

/**
 * Get status color based on status
 * @param {string} status - Status value
 * @returns {string} CSS class for status color
 */
export const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'active': return 'text-success';
    case 'inactive': return 'text-error';
    case 'pending': return 'text-secondary';
    case 'completed': return 'text-success';
    case 'cancelled': return 'text-error';
    case 'en route': return 'text-warning';
    case 'at scene': return 'text-secondary';
    case 'available': return 'text-success';
    case 'maintenance': return 'text-warning';
    case 'operational': return 'text-success';
    case 'offline': return 'text-error';
    default: return 'text-text-secondary';
  }
};

/**
 * Debounce function to limit rate of calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit rate of calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit time in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Check if user has required role
 * @param {string} userRole - User's role
 * @param {string[]} requiredRoles - Array of required roles
 * @returns {boolean} True if user has required role
 */
export const hasRole = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole);
};