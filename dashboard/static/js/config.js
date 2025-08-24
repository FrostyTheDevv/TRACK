// Configuration for Stream Tracker Dashboard (runtime-safe)

(function () {
    // Prefer value injected by /runtime-config.js served by the API server.
    // Fallback to same-origin '/api'.
    const RUNTIME = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || null;
  
    function resolveApiBase() {
      // If runtime provided, trust it
      if (RUNTIME) return RUNTIME;
  
      // Same-origin default
      // e.g. https://example.com  -> https://example.com/api
      // or   http://localhost:3001 -> http://localhost:3001/api
      const { protocol, host } = window.location;
      return `${protocol}//${host}/api`;
    }
  
    function resolveSocketUrl(apiBase) {
      try {
        // remove trailing '/api' to get origin for Socket.IO
        const u = new URL(apiBase, window.location.href);
        if (u.pathname.endsWith('/api')) {
          u.pathname = u.pathname.replace(/\/api$/, '');
        }
        // ensure trailing slash removed
        u.pathname = u.pathname.replace(/\/+$/, '');
        return u.toString();
      } catch {
        // fallback to same-origin root
        const { protocol, host } = window.location;
        return `${protocol}//${host}`;
      }
    }
  
    const API_BASE = resolveApiBase();
    const SOCKET_BASE = resolveSocketUrl(API_BASE);
  
    const CONFIG = {
      // Mode Configuration
      DEMO_MODE: false,                // use live API
      DATA_SOURCE: 'api',              // 'api' (live) or 'json-files' (static)
  
      // API / WebSocket (runtime-derived, no localhost hardcoding)
      API_BASE_URL: API_BASE,
      SOCKET_URL: SOCKET_BASE,
  
      // Update intervals (in milliseconds)
      REFRESH_INTERVAL: 30000,
      RETRY_INTERVAL: 5000,
  
      // Feature flags
      FEATURES: {
        REAL_TIME_UPDATES: true,
        NOTIFICATIONS: true,
        ANALYTICS: true
      },
  
      // UI Configuration
      ITEMS_PER_PAGE: 10,
      THEME: 'dark',
  
      // Debug
      DEBUG: ['localhost', '127.0.0.1'].includes(window.location.hostname)
    };
  
    // expose for non-module scripts
    window.APP_CONFIG = Object.assign({}, window.APP_CONFIG || {}, CONFIG);
  
    // Node/CommonJS export (if bundled that way)
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = CONFIG;
    }
  })();
  