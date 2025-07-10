// Configuration for Stream Tracker Dashboard
const CONFIG = {
    // Mode Configuration
    DEMO_MODE: false, // Set to false for real data
    
    // Data source configuration
    DATA_SOURCE: 'api', // Always use API when viewing locally
    API_BASE_URL: 'http://localhost:3001/api', // Always use local API
    
    // WebSocket Configuration
    SOCKET_URL: 'http://localhost:3001', // Always use local WebSocket
    
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
