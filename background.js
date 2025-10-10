/**
 * ShopScout Background Service Worker v1.0
 * Orchestrates API calls, caching, and communication between content script and side panel
 */

// Configuration
// Always use production URLs in the built extension
const CONFIG = {
  BACKEND_URL: 'https://shopscout-api.fly.dev',
  AUTH_URL: 'https://shopscout-auth.fly.dev',
  CACHE_TTL: 12 * 60 * 60 * 1000, // 12 hours
  MAX_CACHE_SIZE: 100,
  DEBOUNCE_DELAY: 500,
};

// Offscreen document management for Firebase Auth
const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';
let creatingOffscreenDocument;

async function hasOffscreenDocument() {
  const matchedClients = await clients.matchAll();
  return matchedClients.some(
    (client) => client.url.includes(chrome.runtime.id) && client.url.includes(OFFSCREEN_DOCUMENT_PATH)
  );
}

async function setupOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    return;
  }

  if (creatingOffscreenDocument) {
    await creatingOffscreenDocument;
  } else {
    creatingOffscreenDocument = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ['DOM_SCRAPING'],
      justification: 'Firebase authentication requires DOM access for popup flows'
    });
    
    await creatingOffscreenDocument;
    creatingOffscreenDocument = null;
  }
}

async function closeOffscreenDocument() {
  if (!(await hasOffscreenDocument())) {
    return;
  }
  await chrome.offscreen.closeDocument();
}

// In-memory cache for product data and search results
const cache = {
  products: new Map(),
  searches: new Map(),
  priceHistory: new Map(),
  
  set(key, value, type = 'products') {
    const entry = {
      data: value,
      timestamp: Date.now(),
    };
    
    this[type].set(key, entry);
    
    // Cleanup old entries if cache is too large
    if (this[type].size > CONFIG.MAX_CACHE_SIZE) {
      const firstKey = this[type].keys().next().value;
      this[type].delete(firstKey);
    }
  },
  
  get(key, type = 'products') {
    const entry = this[type].get(key);
    if (!entry) return null;
    
    // Check if cache is still valid
    if (Date.now() - entry.timestamp > CONFIG.CACHE_TTL) {
      this[type].delete(key);
      return null;
    }
    
    return entry.data;
  },
  
  clear(type) {
    if (type) {
      this[type].clear();
    } else {
      this.products.clear();
      this.searches.clear();
      this.priceHistory.clear();
    }
  }
};

// State management
const state = {
  currentProduct: null,
  activeTabId: null,
  sidePanelOpen: false,
  pendingRequests: new Map(),
};

/**
 * API Communication Layer
 */
const api = {
  /**
   * Search for product deals across retailers
   */
  async searchDeals(query, imageUrl = null) {
    try {
      const cacheKey = `${query}-${imageUrl || 'no-image'}`;
      const cached = cache.get(cacheKey, 'searches');
      if (cached) {
        console.log('[ShopScout] Returning cached search results');
        return cached;
      }

      const params = new URLSearchParams({
        query: query,
      });
      
      if (imageUrl) {
        params.append('image', imageUrl);
      }

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }

      const data = await response.json();
      cache.set(cacheKey, data, 'searches');
      
      return data;
    } catch (error) {
      console.error('[ShopScout] Search error:', error);
      
      // Return mock data for development/demo
      return {
        results: [
          {
            title: query,
            price: Math.random() * 100 + 20,
            source: 'Amazon',
            url: '#',
            image: imageUrl,
            shipping: 'Free shipping',
            trustScore: 85,
          },
          {
            title: query,
            price: Math.random() * 100 + 20,
            source: 'Walmart',
            url: '#',
            image: imageUrl,
            shipping: 'Free shipping',
            trustScore: 90,
          },
          {
            title: query,
            price: Math.random() * 100 + 20,
            source: 'eBay',
            url: '#',
            image: imageUrl,
            shipping: '$5.99 shipping',
            trustScore: 75,
          },
        ],
        timestamp: Date.now(),
      };
    }
  },

  /**
   * Get price history for a product
   */
  async getPriceHistory(productId) {
    try {
      const cached = cache.get(productId, 'priceHistory');
      if (cached) {
        return cached;
      }

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/price-history/${productId}`);
      
      if (!response.ok) {
        throw new Error(`Price history API error: ${response.status}`);
      }

      const data = await response.json();
      cache.set(productId, data, 'priceHistory');
      
      return data;
    } catch (error) {
      console.error('[ShopScout] Price history error:', error);
      
      // Return mock data
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      return {
        prices: Array.from({ length: 30 }, (_, i) => ({
          date: now - (29 - i) * day,
          price: 50 + Math.random() * 20 - 10,
        })),
      };
    }
  },

  /**
   * Save product to wishlist
   */
  async saveToWishlist(product) {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        throw new Error(`Wishlist API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[ShopScout] Wishlist save error:', error);
      
      // Fallback to local storage
      const wishlist = await this.getWishlist();
      wishlist.push({
        ...product,
        id: Date.now().toString(),
        savedAt: Date.now(),
      });
      await chrome.storage.local.set({ wishlist });
      
      return { success: true, id: wishlist[wishlist.length - 1].id };
    }
  },

  /**
   * Get user's wishlist
   */
  async getWishlist() {
    try {
      const { wishlist } = await chrome.storage.local.get('wishlist');
      return wishlist || [];
    } catch (error) {
      console.error('[ShopScout] Get wishlist error:', error);
      return [];
    }
  },

  /**
   * Track price for alerts
   */
  async trackPrice(productId, targetPrice) {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, targetPrice }),
      });

      if (!response.ok) {
        throw new Error(`Track API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[ShopScout] Track price error:', error);
      
      // Fallback to local storage with alarms
      const tracked = await this.getTrackedProducts();
      tracked.push({
        productId,
        targetPrice,
        createdAt: Date.now(),
      });
      await chrome.storage.local.set({ tracked });
      
      // Set up alarm to check price
      chrome.alarms.create(`price-check-${productId}`, {
        periodInMinutes: 60, // Check every hour
      });
      
      return { success: true };
    }
  },

  /**
   * Get tracked products
   */
  async getTrackedProducts() {
    try {
      const { tracked } = await chrome.storage.local.get('tracked');
      return tracked || [];
    } catch (error) {
      console.error('[ShopScout] Get tracked error:', error);
      return [];
    }
  },
};

/**
 * AI Analysis using Chrome Built-In APIs
 */
const ai = {
  /**
   * Analyze product using multimodal AI
   */
  async analyzeProduct(productData) {
    try {
      // Check if AI APIs are available
      if (!self.ai || !self.ai.languageModel) {
        console.log('[ShopScout] Chrome AI APIs not available');
        return null;
      }

      const session = await self.ai.languageModel.create({
        systemPrompt: 'You are a helpful shopping assistant. Analyze products and provide concise insights about value, quality, and potential concerns.',
      });

      const prompt = `Analyze this product:
Title: ${productData.title}
Price: $${productData.price}
Seller: ${productData.seller || 'Unknown'}
Rating: ${productData.rating || 'N/A'}

Provide a brief analysis (2-3 sentences) about whether this is a good deal and any concerns.`;

      const result = await session.prompt(prompt);
      session.destroy();

      return result;
    } catch (error) {
      console.error('[ShopScout] AI analysis error:', error);
      return null;
    }
  },

  /**
   * Summarize reviews
   */
  async summarizeReviews(reviews) {
    try {
      if (!self.ai || !self.ai.summarizer) {
        console.log('[ShopScout] Summarizer API not available');
        return null;
      }

      const summarizer = await self.ai.summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: 'short',
      });

      const summary = await summarizer.summarize(reviews);
      summarizer.destroy();

      return summary;
    } catch (error) {
      console.error('[ShopScout] Review summarization error:', error);
      return null;
    }
  },

  /**
   * Calculate trust score
   */
  calculateTrustScore(productData, dealData) {
    let score = 50; // Base score

    // Seller verification
    if (productData.seller) {
      if (productData.seller.toLowerCase().includes('amazon') || 
          productData.seller.toLowerCase().includes('walmart')) {
        score += 20;
      } else {
        score += 10;
      }
    }

    // Rating
    if (productData.rating) {
      const rating = parseFloat(productData.rating);
      if (rating >= 4.5) score += 15;
      else if (rating >= 4.0) score += 10;
      else if (rating >= 3.5) score += 5;
    }

    // Reviews count
    if (productData.reviews) {
      const reviewCount = parseInt(productData.reviews.replace(/\D/g, ''));
      if (reviewCount > 1000) score += 10;
      else if (reviewCount > 100) score += 5;
    }

    // Price comparison
    if (dealData && dealData.results && dealData.results.length > 0) {
      const prices = dealData.results.map(r => r.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const currentPrice = productData.price;

      if (currentPrice < avgPrice * 0.7) {
        // Suspiciously low price
        score -= 15;
      } else if (currentPrice < avgPrice * 0.9) {
        // Good deal
        score += 5;
      }
    }

    return Math.max(0, Math.min(100, score));
  },
};

/**
 * Message Handlers
 */
const handlers = {
  /**
   * Handle product detection from content script
   */
  async handleProductDetected(data, sender) {
    console.log('[ShopScout] Product detected:', data);
    
    state.currentProduct = data;
    state.activeTabId = sender.tab.id;

    // Cache product data
    cache.set(data.url, data);

    // Open side panel
    try {
      await chrome.sidePanel.open({ tabId: sender.tab.id });
      state.sidePanelOpen = true;
    } catch (error) {
      console.error('[ShopScout] Error opening side panel:', error);
    }

    // Start analysis in background
    this.analyzeProductInBackground(data);

    // Notify side panel
    this.notifySidePanel('PRODUCT_UPDATED', data);
  },

  /**
   * Analyze product in background
   */
  async analyzeProductInBackground(productData) {
    try {
      // Search for deals
      const dealData = await api.searchDeals(productData.title, productData.image);
      
      // Calculate trust score
      const trustScore = ai.calculateTrustScore(productData, dealData);
      
      // Get AI analysis
      const aiAnalysis = await ai.analyzeProduct(productData);
      
      // Get price history
      const priceHistory = productData.productId 
        ? await api.getPriceHistory(productData.productId)
        : null;

      const analysisResult = {
        product: productData,
        deals: dealData,
        trustScore,
        aiAnalysis,
        priceHistory,
        timestamp: Date.now(),
      };

      // Cache complete analysis
      cache.set(`analysis-${productData.url}`, analysisResult);

      // Notify side panel
      this.notifySidePanel('ANALYSIS_COMPLETE', analysisResult);
    } catch (error) {
      console.error('[ShopScout] Background analysis error:', error);
      this.notifySidePanel('ANALYSIS_ERROR', { error: error.message });
    }
  },

  /**
   * Handle requests from side panel
   */
  async handleSidePanelRequest(message, sender, sendResponse) {
    switch (message.action) {
      case 'GET_CURRENT_PRODUCT':
        sendResponse({ product: state.currentProduct });
        break;

      case 'GET_ANALYSIS':
        const cached = cache.get(`analysis-${state.currentProduct?.url}`);
        if (cached) {
          sendResponse({ analysis: cached });
        } else if (state.currentProduct) {
          this.analyzeProductInBackground(state.currentProduct);
          sendResponse({ analysis: null, pending: true });
        } else {
          sendResponse({ analysis: null });
        }
        break;

      case 'SAVE_TO_WISHLIST':
        const result = await api.saveToWishlist(message.data);
        sendResponse(result);
        break;

      case 'TRACK_PRICE':
        const trackResult = await api.trackPrice(message.productId, message.targetPrice);
        sendResponse(trackResult);
        break;

      case 'GET_WISHLIST':
        const wishlist = await api.getWishlist();
        sendResponse({ wishlist });
        break;

      case 'REFRESH_ANALYSIS':
        if (state.currentProduct) {
          cache.clear('searches');
          this.analyzeProductInBackground(state.currentProduct);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No product loaded' });
        }
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  },

  /**
   * Notify side panel of updates
   */
  notifySidePanel(type, data) {
    if (!state.activeTabId) return;

    chrome.runtime.sendMessage({
      type,
      data,
    }).catch(err => {
      // Side panel might not be open
      console.log('[ShopScout] Could not notify side panel:', err.message);
    });
  },
};

/**
 * Event Listeners
 */

// Listen for messages from content script, side panel, and auth page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ShopScout] Message received:', message.type);

  if (message.type === 'PRODUCT_DETECTED') {
    handlers.handleProductDetected(message.data, sender);
    sendResponse({ received: true });
    
  } else if (message.type === 'MANUAL_SCAN') {
    // Handle manual scan request from sidebar
    console.log('[ShopScout] Manual scan requested');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        console.log('[ShopScout] Sending SCRAPE_PRODUCT to tab:', tabs[0].id);
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SCRAPE_PRODUCT' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[ShopScout] Error sending scrape message:', chrome.runtime.lastError.message);
            sendResponse({ success: false, error: 'Not on a supported product page' });
          } else {
            console.log('[ShopScout] Scrape message sent successfully');
            sendResponse({ success: true });
          }
        });
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true; // Keep channel open for async response
    
  } else if (message.type === 'SIDEPANEL_REQUEST') {
    handlers.handleSidePanelRequest(message, sender, sendResponse);
    return true; // Keep channel open for async response
    
  } else if (message.type === 'FIREBASE_AUTH') {
    // Handle Firebase authentication through offscreen document
    (async () => {
      try {
        console.log('[ShopScout] Setting up offscreen document for auth...');
        await setupOffscreenDocument();
        
        console.log('[ShopScout] Sending message to offscreen:', message.action);
        const response = await chrome.runtime.sendMessage({
          target: 'offscreen-auth',
          type: message.action,
          email: message.email,
          password: message.password,
          url: message.url
        });
        
        console.log('[ShopScout] Received response from offscreen:', response);
        
        // Keep offscreen document open for verification email sending
        if (message.action !== 'SEND_VERIFICATION_EMAIL') {
          await closeOffscreenDocument();
        }
        
        sendResponse(response);
      } catch (error) {
        console.error('[ShopScout] Firebase auth error:', error);
        await closeOffscreenDocument();
        sendResponse({ success: false, error: { message: error.message } });
      }
    })();
    return true;
    
  } else if (message.type === 'AUTH_SUCCESS') {
    // Handle authentication success from auth page
    console.log('[ShopScout] Authentication successful:', message.user);
    
    // Store user data
    chrome.storage.local.set({
      authenticated: true,
      userId: message.user.uid,
      userEmail: message.user.email,
      displayName: message.user.displayName,
      photoURL: message.user.photoURL,
      emailVerified: message.user.emailVerified,
      authMethod: message.user.authMethod,
      authTimestamp: Date.now()
    }).then(() => {
      console.log('[ShopScout] User data stored');
      sendResponse({ success: true });
      
      // Close auth tab if it exists
      if (sender.tab) {
        chrome.tabs.remove(sender.tab.id).catch(() => {});
      }
      
      // Open side panel on current active tab
      chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        if (tabs[0]) {
          chrome.sidePanel.open({ tabId: tabs[0].id }).catch(err => {
            console.log('[ShopScout] Could not open side panel:', err);
          });
        }
      });
    });
    
    return true; // Keep channel open for async response
  }

  return false;
});

// Poll for authentication success from web page
async function checkAuthFromWebPage() {
  try {
    const response = await fetch(`${CONFIG.AUTH_URL}/check-auth`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.authenticated && data.user) {
        console.log('[ShopScout] 🎉 Authentication detected from web page!');
        console.log('[ShopScout] User:', data.user.email);
        
        // Store user data
        await chrome.storage.local.set({
          authenticated: true,
          userId: data.user.uid,
          userEmail: data.user.email,
          displayName: data.user.displayName,
          photoURL: data.user.photoURL,
          emailVerified: data.user.emailVerified,
          authMethod: data.user.authMethod,
          authTimestamp: Date.now()
        });
        
        console.log('[ShopScout] ✅ User data stored successfully');
        
        // Close auth tabs
        console.log('[ShopScout] Closing auth tabs...');
        const tabs = await chrome.tabs.query({});
        const authTabs = tabs.filter(t => t.url && t.url.includes(CONFIG.AUTH_URL));
        
        if (authTabs.length > 0) {
          console.log(`[ShopScout] Found ${authTabs.length} auth tab(s) to close`);
          for (const authTab of authTabs) {
            console.log(`[ShopScout] Closing tab: ${authTab.url}`);
            await chrome.tabs.remove(authTab.id).catch(err => {
              console.error('[ShopScout] Error closing tab:', err);
            });
          }
        }
        
        // Open sidebar - try multiple approaches
        console.log('[ShopScout] Opening sidebar...');
        
        // Approach 1: Try current active tab
        const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (activeTabs[0]) {
          console.log('[ShopScout] Active tab found:', activeTabs[0].id);
          try {
            await chrome.sidePanel.open({ tabId: activeTabs[0].id });
            console.log('[ShopScout] ✅ Sidebar opened on active tab!');
            return true;
          } catch (err) {
            console.error('[ShopScout] Failed to open on active tab:', err.message);
          }
        }
        
        // Approach 2: Try to open on window
        try {
          const windows = await chrome.windows.getAll({ populate: true });
          if (windows[0] && windows[0].tabs && windows[0].tabs[0]) {
            const firstTab = windows[0].tabs[0];
            console.log('[ShopScout] Trying first tab:', firstTab.id);
            await chrome.sidePanel.open({ tabId: firstTab.id });
            console.log('[ShopScout] ✅ Sidebar opened on first tab!');
            return true;
          }
        } catch (err) {
          console.error('[ShopScout] Failed to open on first tab:', err.message);
        }
        
        // Approach 3: Try global open (Chrome 116+)
        try {
          await chrome.sidePanel.open({});
          console.log('[ShopScout] ✅ Sidebar opened globally!');
          return true;
        } catch (err) {
          console.error('[ShopScout] Failed to open globally:', err.message);
        }
        
        console.warn('[ShopScout] ⚠️ Could not open sidebar with any method');
        return true;
      }
    }
  } catch (error) {
    // Silently fail - auth server might not be running yet
  }
  return false;
}

// Check for web authentication periodically
setInterval(checkAuthFromWebPage, 2000);

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Use callback to maintain user gesture context
  chrome.storage.local.get(['authenticated', 'userId'], (result) => {
    const { authenticated, userId } = result;
    
    console.log('[ShopScout] Icon clicked. Auth status:', { authenticated, userId });
    
    if (!authenticated || !userId) {
      // User not authenticated - open BOTH auth page AND sidebar
      console.log('[ShopScout] User not authenticated, opening auth page and sidebar');
      
      // Use configured auth server
      const authUrl = CONFIG.AUTH_URL;
      console.log('[ShopScout] Using auth URL:', authUrl);
      
      // First, open the sidebar (with AuthPrompt)
      try {
        await chrome.sidePanel.open({ tabId: tab.id });
        console.log('[ShopScout] ✅ Sidebar opened with AuthPrompt');
      } catch (error) {
        console.error('[ShopScout] Error opening sidebar:', error);
      }
      
      // Check if auth tab is already open
      const tabs = await chrome.tabs.query({});
      const authTabs = tabs.filter(t => t.url && t.url.includes(CONFIG.AUTH_URL));
      
      if (authTabs.length > 0) {
        // Focus existing auth tab
        console.log(`[ShopScout] Found ${authTabs.length} existing auth tab(s), focusing first one`);
        await chrome.tabs.update(authTabs[0].id, { active: true });
        await chrome.windows.update(authTabs[0].windowId, { focused: true });
      } else {
        // Open new auth tab with production URL
        console.log(`[ShopScout] Opening auth page: ${authUrl}`);
        try {
          const tab = await chrome.tabs.create({ url: authUrl });
          console.log(`[ShopScout] Auth tab opened with ID: ${tab.id}`);
        } catch (error) {
          console.error('[ShopScout] Error opening auth tab:', error);
        }
      }
      return;
    }
    
{{ ... }}
    console.log('[ShopScout] User is authenticated, opening sidebar');
    chrome.sidePanel.open({ tabId: tab.id }).then(() => {
      console.log('[ShopScout] ✅ Sidebar opened successfully');
      state.sidePanelOpen = true;
      state.activeTabId = tab.id;

      // Request product scrape from content script
      chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PRODUCT' }).catch(err => {
        console.log('[ShopScout] No content script on this page');
      });
    }).catch(error => {
      console.error('[ShopScout] Error opening sidebar:', error);
    });
  });
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tabId === state.activeTabId) {
    // Page navigation detected, clear current product
    state.currentProduct = null;
  }
});

// Handle alarms for price tracking
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('price-check-')) {
    const productId = alarm.name.replace('price-check-', '');
    // Implement price check logic here
    console.log('[ShopScout] Checking price for:', productId);
  }
});

// Initialize on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[ShopScout] Extension installed');
    
    // Set up default storage
    chrome.storage.local.set({
      wishlist: [],
      tracked: [],
      settings: {
        autoOpen: true,
        notifications: true,
      },
      authenticated: false
    });

    console.log('[ShopScout] Extension installed successfully!');
    console.log('[ShopScout] Click the extension icon to sign in');
  }
});

console.log('[ShopScout] Background service worker initialized');
