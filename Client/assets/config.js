// API Configuration
const API_CONFIG = {
  BASE_URL: window.location.origin,
  API_URL: window.location.origin + '/api',
  AUTH_URL: window.location.origin + '/auth',
  TIMEOUT: 30000
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
}

