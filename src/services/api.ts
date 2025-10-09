/**
 * API Service - Handles all backend communication
 * Connects extension to backend server (port 3001)
 */

// Set USE_PRODUCTION to true when deploying
const USE_PRODUCTION = true;
const API_BASE_URL = USE_PRODUCTION 
  ? 'https://shopscout-api.fly.dev' 
  : 'http://localhost:3001';

/**
 * Get authentication token from Firebase
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { firebaseUser } = await chrome.storage.local.get('firebaseUser');
    if (firebaseUser?.uid) {
      return firebaseUser.uid;
    }
    return null;
  } catch (error) {
    console.error('[API] Error getting auth token:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add auth token if available
  if (token) {
    headers['X-User-ID'] = token;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * API Methods
 */

export const api = {
  /**
   * Health check
   */
  async health() {
    return apiRequest<{ status: string; version: string; timestamp: string }>('/health');
  },

  /**
   * Search for products
   */
  async searchProducts(query: string, image?: string) {
    const params = new URLSearchParams({ query });
    if (image) params.append('image', image);
    
    return apiRequest<{
      results: Array<{
        title: string;
        price: number;
        source: string;
        url: string;
        image: string | null;
        shipping: string;
        trustScore: number;
      }>;
      timestamp: number;
    }>(`/api/search?${params}`);
  },

  /**
   * Get price history for a product
   */
  async getPriceHistory(productId: string) {
    return apiRequest<{
      prices: Array<{
        date: number;
        price: number;
      }>;
    }>(`/api/price-history/${productId}`);
  },

  /**
   * Wishlist operations
   */
  wishlist: {
    async add(product: {
      title: string;
      price: number;
      url: string;
      image?: string;
      source?: string;
    }) {
      return apiRequest<{
        success: boolean;
        id: string;
        item: any;
      }>('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify(product),
      });
    },

    async getAll() {
      return apiRequest<{
        wishlist: Array<any>;
      }>('/api/wishlist');
    },

    async remove(id: string) {
      return apiRequest<{ success: boolean }>(`/api/wishlist/${id}`, {
        method: 'DELETE',
      });
    },
  },

  /**
   * Price tracking operations
   */
  tracking: {
    async add(productId: string, targetPrice: number) {
      return apiRequest<{
        success: boolean;
        id: string;
        item: any;
      }>('/api/track', {
        method: 'POST',
        body: JSON.stringify({ productId, targetPrice }),
      });
    },

    async getAll() {
      return apiRequest<{
        tracked: Array<any>;
      }>('/api/track');
    },

    async remove(id: string) {
      return apiRequest<{ success: boolean }>(`/api/track/${id}`, {
        method: 'DELETE',
      });
    },
  },
};

export default api;
