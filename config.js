/**
 * ShopScout Configuration
 * Central configuration for all environment-specific settings
 */

// Production URLs - always use production for Chrome Web Store builds
export const API_CONFIG = {
  // Backend API URL
  BACKEND_URL: 'https://shopscout-api.fly.dev',
  
  // Auth Server URL
  AUTH_URL: 'https://shopscout-auth.fly.dev',
};

// Cache configuration
export const CACHE_CONFIG = {
  TTL: 12 * 60 * 60 * 1000, // 12 hours
  MAX_SIZE: 100,
  DEBOUNCE_DELAY: 500,
};

// Export for use in other files
export default API_CONFIG;
