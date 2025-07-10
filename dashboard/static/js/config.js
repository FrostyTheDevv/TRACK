// Configuration for Stream Tracker Dashboard
const CONFIG = {
    // Mode Configuration
    DEMO_MODE: false, // Set to false for real data from GitHub Actions
    
    // Data source configuration
    DATA_SOURCE: window.location.protocol === 'file:' ? 'api' : 'json-files', // Use API for local file:// viewing
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
        ? 'http://localhost:3001/api'  // Local development
        : null, // Not used in GitHub Pages mode
    
    // WebSocket Configuration (only used when connecting to API)
    SOCKET_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
        ? 'http://localhost:3001'  // Local development
        : null, // Not used in GitHub Pages mode
    
    // Update intervals (in milliseconds)
    REFRESH_INTERVAL: 30000, // 30 seconds
    RETRY_INTERVAL: 5000,   // 5 seconds
    
    // Feature flags
    FEATURES: {
        REAL_TIME_UPDATES: true,
        NOTIFICATIONS: true,
        ANALYTICS: true
    },
    
    // UI Configuration
    ITEMS_PER_PAGE: 10,
    THEME: 'dark', // 'dark' or 'light'
    
    // Debug mode
    DEBUG: window.location.hostname === 'localhost'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
