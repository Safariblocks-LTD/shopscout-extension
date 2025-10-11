/**
 * ShopScout Configuration Type Definitions
 */

export interface ApiConfig {
  BACKEND_URL: string;
  AUTH_URL: string;
}

export interface CacheConfig {
  TTL: number;
  MAX_SIZE: number;
  DEBOUNCE_DELAY: number;
}

export const API_CONFIG: ApiConfig;
export const CACHE_CONFIG: CacheConfig;
export default API_CONFIG;
