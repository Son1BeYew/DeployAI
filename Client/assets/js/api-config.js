// API Configuration for production and development
const API_CONFIG = {
  getBaseURL() {
    // In production, use relative paths (same domain)
    // In development, can use localhost
    const hostname = window.location.hostname;
    
    // Production - use relative paths
    if (hostname === 'enternapic.io.vn' || hostname === 'www.enternapic.io.vn') {
      return ''; // Empty string means relative to current domain
    }
    
    // Development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // Default to relative paths
    return '';
  },
  
  getAPIURL(endpoint) {
    const base = this.getBaseURL();
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }
};

// Export for use in other scripts
window.API_CONFIG = API_CONFIG;
