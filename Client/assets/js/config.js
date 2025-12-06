// API Configuration
const API_CONFIG = {
  BASE_URL: window.location.origin,
  API_URL: window.location.origin + '/api',
  AUTH_URL: window.location.origin + '/auth',
  TIMEOUT: 30000,
  
  // Helper function to build endpoint URLs
  endpoint: function(path) {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${this.BASE_URL}/${cleanPath}`;
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
}
