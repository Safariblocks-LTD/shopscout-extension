/**
 * ShopScout Configuration
 * Central configuration for all environment-specific settings
 */

// Detect environment
const isProduction = typeof chrome !== 'undefined' && 
  chrome.runtime && 
  chrome.runtime.getManifest && 
  !chrome.runtime.getManifest().key; // Extensions in dev mode have a key

// API URLs
export const API_CONFIG = {
  // Backend API URL
  BACKEND_URL: isProduction 
    ? 'https://shopscout-api.fly.dev' 
    : 'http://localhost:3001',
  
  // Auth Server URL
  AUTH_URL: isProduction 
    ? 'https://shopscout-auth.fly.dev' 
    : 'http://localhost:8000',
};

// Cache configuration
export const CACHE_CONFIG = {
  TTL: 12 * 60 * 60 * 1000, // 12 hours
  MAX_SIZE: 100,
  DEBOUNCE_DELAY: 500,
};

// Export for use in other files
export default API_CONFIG;
