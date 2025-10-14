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

// Check Chrome AI availability on startup
async function checkChromeAI() {
  console.log('[ShopScout] 🤖 Checking Chrome Built-in AI availability...');
  
  // Check if LanguageModel API is available
  try {
    if (typeof self.LanguageModel === 'undefined') {
      console.log('[ShopScout] ⚠️ LanguageModel API not available');
      console.log('[ShopScout] Note: Chrome AI requires Chrome 127+ with Gemini Nano model');
      console.log('[ShopScout] Fallback: Will use Serper.dev API for all searches');
      return false;
    }

    console.log('[ShopScout] ✅ LanguageModel API found, checking availability...');
    const availability = await self.LanguageModel.availability();
    console.log('[ShopScout] Availability status:', availability);
    
    if (availability === 'no') {
      console.log('[ShopScout] ⚠️ AI model not available on this device');
      return false;
    }
    
    // Get model parameters
    const params = await self.LanguageModel.params();
    console.log('[ShopScout] ✅ Prompt API ready!');
    console.log('[ShopScout] Model params:', params);
    console.log('[ShopScout] - Temperature range:', params.defaultTemperature, 'to', params.maxTemperature);
    console.log('[ShopScout] - TopK range:', params.defaultTopK, 'to', params.maxTopK);
    
    return true;
  } catch (error) {
    console.log('[ShopScout] ⚠️ Error checking AI:', error.message);
    console.log('[ShopScout] Fallback: Will use Serper.dev API for all searches');
    return false;
  }
}

// Check AI on startup
checkChromeAI().catch(err => console.error('[ShopScout] AI check failed:', err));

// Offscreen document management for Firebase Auth
const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';
let creatingOffscreenDocument;

async function hasOffscreenDocument() {
  // Check if offscreen document exists using chrome.runtime.getContexts (Chrome 116+)
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
    });
    return contexts.length > 0;
  }
  
  // Fallback: assume it doesn't exist if API unavailable
  return false;
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
   * Search for product deals using Chrome AI first, then Serper.dev as fallback
   */
  async searchDeals(query, imageUrl = null, currentPrice = null, productUrl = null) {
    try {
      const cacheKey = `search-${query}`;
      const cached = cache.get(cacheKey, 'searches');
      if (cached) {
        console.log('[ShopScout] Returning cached search results');
        return cached;
      }

      console.log('[ShopScout] 🔍 Searching for deals:', query);
      console.log('[ShopScout] Strategy: Chrome AI (primary) → Serper.dev (fallback)');
      
      let aiResults = [];
      let serperResults = [];
      let aiSuccess = false;
      
      // STEP 1: Try Chrome AI first (fast and free!)
      try {
        console.log('[ShopScout] 🤖 Attempting Chrome AI search...');
        const aiResponse = await this.searchWithChromeAI(query, currentPrice, productUrl);
        
        if (aiResponse.success && aiResponse.deals && aiResponse.deals.length > 0) {
          aiResults = aiResponse.deals;
          aiSuccess = true;
          console.log('[ShopScout] ✅ Chrome AI found', aiResults.length, 'deals in', aiResponse.duration, 'ms');
          
          // If AI found good deals, we might not need Serper.dev
          if (aiResults.length >= 3) {
            console.log('[ShopScout] 🎯 Chrome AI provided sufficient results, skipping Serper.dev');
            const finalData = {
              results: aiResults,
              allResults: aiResults,
              bestDeal: aiResults[0],
              timestamp: Date.now(),
              source: 'chrome-ai',
              aiPowered: true
            };
            cache.set(cacheKey, finalData, 'searches');
            return finalData;
          }
        } else {
          console.log('[ShopScout] ⚠️ Chrome AI did not find deals:', aiResponse.reason);
        }
      } catch (aiError) {
        console.error('[ShopScout] ❌ Chrome AI error:', aiError.message);
      }
      
      // STEP 2: Use Serper.dev as fallback or supplement
      console.log('[ShopScout] 🌐 Calling Serper.dev API...');
      const params = new URLSearchParams({ query: query });
      if (imageUrl) params.append('image', imageUrl);

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/search?${params}`);
      
      if (!response.ok) {
        console.error('[ShopScout] Serper.dev API error:', response.status);
        // If AI had results, return those
        if (aiSuccess && aiResults.length > 0) {
          console.log('[ShopScout] ✅ Returning Chrome AI results (Serper.dev failed)');
          const finalData = {
            results: aiResults,
            allResults: aiResults,
            bestDeal: aiResults[0],
            timestamp: Date.now(),
            source: 'chrome-ai-only',
            aiPowered: true
          };
          cache.set(cacheKey, finalData, 'searches');
          return finalData;
        }
        throw new Error(`Search API error: ${response.status}`);
      }

      const data = await response.json();
      serperResults = data.results || [];
      console.log('[ShopScout] ✅ Serper.dev results received:', serperResults.length, 'deals');
      
      // STEP 3: Combine and deduplicate results
      const combinedResults = this.combineAndDeduplicateResults(aiResults, serperResults);
      console.log('[ShopScout] 📊 Combined results:', combinedResults.length, 'deals');
      console.log('[ShopScout] Sources: AI=' + aiResults.length + ', Serper=' + serperResults.length);
      
      // If no results from either source
      if (combinedResults.length === 0) {
        console.log('[ShopScout] ⚠️  No results from any source');
        return {
          results: [],
          timestamp: Date.now(),
          message: 'No similar products found at this time'
        };
      }
      
      const finalData = {
        results: combinedResults,
        allResults: combinedResults,
        bestDeal: combinedResults[0],
        timestamp: Date.now(),
        source: aiSuccess ? 'chrome-ai+serper' : 'serper-only',
        aiPowered: aiSuccess,
        aiCount: aiResults.length,
        serperCount: serperResults.length
      };
      
      cache.set(cacheKey, finalData, 'searches');
      return finalData;
    } catch (error) {
      console.error('[ShopScout] ❌ Search error:', error.message);
      
      // Return empty results (NO MOCK DATA for production)
      return {
        results: [],
        timestamp: Date.now(),
        error: error.message,
        message: 'Unable to search for deals at this time'
      };
    }
  },

  /**
   * Search with Chrome AI Prompt API
   */
  async searchWithChromeAI(query, currentPrice, productUrl) {
    try {
      console.log('[ChromeAI] Checking AI availability...');
      
      // Check if LanguageModel API is available
      if (typeof self.LanguageModel === 'undefined') {
        console.log('[ChromeAI] ⚠️ LanguageModel API not available');
        return { success: false, reason: 'LanguageModel API not available' };
      }

      console.log('[ChromeAI] ✅ LanguageModel API found, checking availability...');
      const availability = await self.LanguageModel.availability();
      console.log('[ChromeAI] Availability:', availability);
      
      if (availability === 'no') {
        console.log('[ChromeAI] ⚠️ AI model not available on this device');
        return { success: false, reason: 'AI model not available' };
      }

      // Get model parameters
      const params = await self.LanguageModel.params();
      console.log('[ChromeAI] Model params:', params);

      // Create AI session with appropriate parameters
      console.log('[ChromeAI] Creating AI session...');
      const session = await self.LanguageModel.create({
        temperature: Math.min(0.7, params.maxTemperature),
        topK: Math.min(3, params.maxTopK),
      });
      console.log('[ChromeAI] ✅ Session created successfully');

      // Craft prompt
      const prompt = `You are a shopping assistant helping find the best deals for products online.

Product: ${query}
Current Price: $${currentPrice || 'unknown'}
Source: ${productUrl || 'online store'}

Task: Find similar products or better deals for this product from major online retailers (Amazon, Walmart, eBay, Target, Best Buy).

For each deal you find, provide:
1. Product title
2. Price (in USD)
3. Store name (Amazon, Walmart, eBay, Target, or Best Buy)
4. Brief reason why it's a good deal

Format your response as a JSON array with this structure:
[
  {
    "title": "Product name",
    "price": 29.99,
    "source": "Amazon",
    "reason": "20% cheaper than current price",
    "savings": 7.50
  }
]

Important:
- Only include deals that are actually cheaper or offer better value
- Provide realistic prices based on current market rates
- Include 3-5 of the best deals
- If no better deals exist, return an empty array []

Return ONLY the JSON array, no other text.`;

      const startTime = Date.now();
      const response = await session.prompt(prompt);
      const duration = Date.now() - startTime;

      // Parse response
      const deals = this.parseAIResponse(response, currentPrice);

      // Cleanup
      session.destroy();

      if (deals && deals.length > 0) {
        return {
          success: true,
          deals: deals,
          source: 'chrome-ai',
          duration: duration
        };
      }

      return { success: false, reason: 'No deals found', deals: [] };

    } catch (error) {
      console.error('[ShopScout] Chrome AI error:', error);
      return { success: false, reason: error.message, error: error };
    }
  },

  /**
   * Parse AI response
   */
  parseAIResponse(response, currentPrice) {
    try {
      let jsonStr = response.trim();
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const deals = JSON.parse(jsonStr);
      if (!Array.isArray(deals)) return [];

      return deals
        .filter(deal => {
          if (!deal.title || !deal.price || !deal.source) return false;
          const price = parseFloat(deal.price);
          if (isNaN(price) || price <= 0) return false;
          if (currentPrice && price > currentPrice * 1.1) return false;
          return true;
        })
        .map(deal => ({
          title: deal.title,
          price: parseFloat(deal.price),
          currency: 'USD',
          source: deal.source,
          platform: deal.source.toLowerCase().replace(/\s+/g, ''),
          url: this.generateSearchUrl(deal.title, deal.source),
          image: null,
          shipping: 'Check store for details',
          rating: null,
          reviews: 0,
          trustScore: 85,
          inStock: true,
          scrapable: false,
          region: 'US',
          aiGenerated: true,
          reason: deal.reason || 'AI recommended deal',
          savings: deal.savings || (currentPrice ? currentPrice - parseFloat(deal.price) : 0)
        }));
    } catch (error) {
      console.error('[ShopScout] Error parsing AI response:', error);
      return [];
    }
  },

  /**
   * Generate search URL
   */
  generateSearchUrl(productTitle, storeName) {
    const encoded = encodeURIComponent(productTitle);
    const urls = {
      'Amazon': `https://www.amazon.com/s?k=${encoded}`,
      'Walmart': `https://www.walmart.com/search?q=${encoded}`,
      'eBay': `https://www.ebay.com/sch/i.html?_nkw=${encoded}`,
      'Target': `https://www.target.com/s?searchTerm=${encoded}`,
      'Best Buy': `https://www.bestbuy.com/site/searchpage.jsp?st=${encoded}`,
    };
    return urls[storeName] || `https://www.google.com/search?q=${encoded}`;
  },

  /**
   * Combine and deduplicate results from AI and Serper
   */
  combineAndDeduplicateResults(aiResults, serperResults) {
    const combined = [...aiResults];
    const seen = new Set(aiResults.map(r => this.normalizeTitle(r.title)));

    for (const result of serperResults) {
      const normalized = this.normalizeTitle(result.title);
      if (!seen.has(normalized)) {
        combined.push(result);
        seen.add(normalized);
      }
    }

    // Sort by price (cheapest first)
    return combined.sort((a, b) => a.price - b.price);
  },

  /**
   * Normalize title for deduplication
   */
  normalizeTitle(title) {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
  },

  /**
   * Get price history for a product
   */
  async getPriceHistory(productId, currentPrice = 50) {
    try {
      const cached = cache.get(productId, 'priceHistory');
      if (cached) {
        console.log('[ShopScout] Returning cached price history');
        return cached;
      }

      console.log('[ShopScout] Fetching price history for:', productId);
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/price-history/${productId}`);
      
      if (!response.ok) {
        console.warn('[ShopScout] Price history API returned:', response.status);
        throw new Error(`Price history API error: ${response.status}`);
      }

      const data = await response.json();
      cache.set(productId, data, 'priceHistory');
      console.log('[ShopScout] Price history fetched successfully');
      
      return data;
    } catch (error) {
      console.warn('[ShopScout] Price history error (using mock data):', error.message);
      console.log('[ShopScout] Generating price history based on current price:', currentPrice);
      
      // Generate realistic price history based on ACTUAL current price
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const basePrice = parseFloat(currentPrice) || 50;
      
      return {
        prices: Array.from({ length: 30 }, (_, i) => {
          // Create realistic price variation (±10% of current price)
          const variation = (Math.random() - 0.5) * 0.2 * basePrice; // ±10%
          const trendFactor = (i / 30) * 0.05 * basePrice; // Slight upward trend
          return {
            date: now - (29 - i) * day,
            price: parseFloat((basePrice + variation - trendFactor).toFixed(2)),
          };
        }),
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
      // Check if LanguageModel API is available
      if (typeof self.LanguageModel === 'undefined') {
        console.log('[ShopScout] LanguageModel API not available');
        return null;
      }

      const availability = await self.LanguageModel.availability();
      if (availability === 'no') {
        console.log('[ShopScout] AI model not available');
        return null;
      }

      const session = await self.LanguageModel.create({
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

    // Don't try to open side panel automatically - it requires user gesture
    // User needs to click the extension icon to open it
    console.log('[ShopScout] Product data ready. User can click extension icon to view.');

    // Start analysis in background
    this.analyzeProductInBackground(data);

    // Notify side panel if it's already open
    this.notifySidePanel('PRODUCT_UPDATED', data);
  },

  /**
   * Analyze product in background
   */
  async analyzeProductInBackground(productData) {
    try {
      console.log('[ShopScout] 🔍 Starting background analysis for:', productData.title);
      console.log('[ShopScout] Product price:', productData.price);
      console.log('[ShopScout] Product URL:', productData.url);
      
      // Search for deals (Chrome AI first, then Serper.dev fallback)
      const dealData = await api.searchDeals(
        productData.title, 
        productData.image, 
        productData.price, 
        productData.url
      );
      console.log('[ShopScout] Deals found:', dealData?.results?.length || 0);
      if (dealData.aiPowered) {
        console.log('[ShopScout] 🤖 AI-powered results:', dealData.aiCount, 'from AI,', dealData.serperCount, 'from Serper');
      }
      
      // Calculate trust score
      const trustScore = ai.calculateTrustScore(productData, dealData);
      
      // Get AI analysis
      const aiAnalysis = await ai.analyzeProduct(productData);
      
      // Get price history (pass current price for mock data)
      const priceHistory = await api.getPriceHistory(productData.productId, productData.price);

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
    
    (async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tabs[0]) {
          sendResponse({ success: false, error: 'No active tab found' });
          return;
        }
        
        const tab = tabs[0];
        console.log('[ShopScout] Active tab:', tab.id, tab.url);
        
        // Check if tab URL is supported
        const url = tab.url;
        const supportedDomains = ['amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com', 
                                  'amazon.co.uk', 'ebay.co.uk', 'argos.co.uk',
                                  'jumia.co.ke', 'jiji.co.ke', 'jumia.com.ng', 'jiji.ng'];
        const isSupported = supportedDomains.some(domain => url && url.includes(domain));
        
        if (!isSupported) {
          console.log('[ShopScout] Not on a supported shopping site');
          sendResponse({ success: false, error: 'Please navigate to a product page on Amazon, eBay, Walmart, or other supported stores' });
          return;
        }
        
        // Try to inject content script first (in case it's not loaded)
        console.log('[ShopScout] Ensuring content script is injected...');
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          console.log('[ShopScout] ✅ Content script injected successfully');
          
          // Wait a bit for content script to initialize
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (injectError) {
          // Content script might already be loaded, that's okay
          console.log('[ShopScout] Content script injection skipped (might already be loaded):', injectError.message);
        }
        
        // Now try to send message
        console.log('[ShopScout] Sending SCRAPE_PRODUCT message...');
        chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PRODUCT' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[ShopScout] ❌ Content script not responding:', chrome.runtime.lastError.message);
            sendResponse({ success: false, error: 'Content script failed to respond. Please refresh the page and try again.' });
          } else {
            console.log('[ShopScout] ✅ Scrape message sent successfully');
            sendResponse({ success: true });
          }
        });
      } catch (error) {
        console.error('[ShopScout] ❌ Manual scan error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
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
    console.log('[ShopScout] 🎉 Authentication successful:', message.user.email);
    
    // Store user data
    (async () => {
      try {
        await chrome.storage.local.set({
          authenticated: true,
          userId: message.user.uid,
          userEmail: message.user.email,
          displayName: message.user.displayName,
          photoURL: message.user.photoURL,
          emailVerified: message.user.emailVerified,
          authMethod: message.user.authMethod,
          authTimestamp: Date.now(),
          firebaseUser: message.user // Store full user object for AuthContext
        });
        
        console.log('[ShopScout] ✅ User data stored successfully');
        sendResponse({ success: true });
        
        // Give storage a moment to sync
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Close auth tab if it exists
        if (sender.tab) {
          console.log('[ShopScout] Closing auth tab:', sender.tab.id);
          await chrome.tabs.remove(sender.tab.id).catch(() => {});
        }
        
        // Open/refresh sidebar on current active tab
        console.log('[ShopScout] Opening sidebar after authentication...');
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tabs[0]) {
          console.log('[ShopScout] Active tab found:', tabs[0].id);
          try {
            await chrome.sidePanel.open({ tabId: tabs[0].id });
            console.log('[ShopScout] ✅ Sidebar opened successfully!');
            
            // Update state
            state.sidePanelOpen = true;
            state.activeTabId = tabs[0].id;
          } catch (err) {
            console.error('[ShopScout] Failed to open sidebar:', err.message);
            
            // Try global open as fallback
            try {
              await chrome.sidePanel.open({});
              console.log('[ShopScout] ✅ Sidebar opened globally');
            } catch (err2) {
              console.error('[ShopScout] Failed to open sidebar globally:', err2.message);
            }
          }
        } else {
          console.warn('[ShopScout] No active tab found');
        }
      } catch (error) {
        console.error('[ShopScout] Error in AUTH_SUCCESS handler:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Keep channel open for async response
  }

  return false;
});

// Poll for authentication success from web page
async function checkAuthFromWebPage() {
  try {
    const response = await fetch(`${CONFIG.AUTH_URL}/check-auth`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.authenticated && data.user) {
        console.log('[ShopScout] 🎉 Authentication detected from web page!');
        console.log('[ShopScout] User:', data.user.email);
        console.log('[ShopScout] Auth method:', data.user.authMethod);
        
        // Store user data with all required fields
        await chrome.storage.local.set({
          authenticated: true,
          userId: data.user.uid,
          userEmail: data.user.email,
          displayName: data.user.displayName || data.user.email.split('@')[0],
          photoURL: data.user.photoURL || null,
          emailVerified: data.user.emailVerified || false,
          authMethod: data.user.authMethod || 'unknown',
          authTimestamp: Date.now(),
          firebaseUser: {
            uid: data.user.uid,
            email: data.user.email,
            displayName: data.user.displayName || data.user.email.split('@')[0],
            photoURL: data.user.photoURL || null,
            emailVerified: data.user.emailVerified || false
          }
        });
        
        console.log('[ShopScout] ✅ User data stored successfully in chrome.storage.local');
        
        // Verify storage
        const verification = await chrome.storage.local.get(['authenticated', 'userId', 'userEmail']);
        console.log('[ShopScout] Storage verification:', verification);
        
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
        
        // Give storage a moment to fully sync
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Open sidebar - try multiple approaches
        console.log('[ShopScout] Opening sidebar...');
        
        // Approach 1: Try current active tab
        const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (activeTabs[0]) {
          console.log('[ShopScout] Active tab found:', activeTabs[0].id);
          try {
            await chrome.sidePanel.open({ tabId: activeTabs[0].id });
            console.log('[ShopScout] ✅ Sidebar opened on active tab!');
            state.sidePanelOpen = true;
            state.activeTabId = activeTabs[0].id;
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
            state.sidePanelOpen = true;
            state.activeTabId = firstTab.id;
            return true;
          }
        } catch (err) {
          console.error('[ShopScout] Failed to open on first tab:', err.message);
        }
        
        // Approach 3: Try global open (Chrome 116+)
        try {
          await chrome.sidePanel.open({});
          console.log('[ShopScout] ✅ Sidebar opened globally!');
          state.sidePanelOpen = true;
          return true;
        } catch (err) {
          console.error('[ShopScout] Failed to open globally:', err.message);
        }
        
        console.warn('[ShopScout] ⚠️ Could not open sidebar with any method');
        console.log('[ShopScout] User can manually click the extension icon to open sidebar');
        return true;
      }
    } else {
      console.error('[ShopScout] Auth check failed with status:', response.status);
    }
  } catch (error) {
    // Only log errors that aren't network-related (server might not be ready)
    if (error.message && !error.message.includes('fetch')) {
      console.error('[ShopScout] Auth check error:', error.message);
    }
  }
  return false;
}

// Check for web authentication periodically
// The auth page runs on production server and communicates via polling
setInterval(checkAuthFromWebPage, 2000);

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('[ShopScout] Icon clicked on tab:', tab.id);
  
  // CRITICAL: Open sidebar IMMEDIATELY to preserve user gesture
  // Do this BEFORE any async operations that might break the gesture context
  chrome.sidePanel.open({ tabId: tab.id }).then(() => {
    console.log('[ShopScout] ✅ Sidebar opened successfully');
    state.sidePanelOpen = true;
    state.activeTabId = tab.id;
    
    // Now check auth status and open auth page if needed
    chrome.storage.local.get(['authenticated', 'userId']).then(({ authenticated, userId }) => {
      console.log('[ShopScout] Auth status:', { authenticated, userId });
      
      if (!authenticated || !userId) {
        // User not authenticated - open auth page
        console.log('[ShopScout] User not authenticated, opening auth page');
        
        // Use production auth URL
        const authUrl = CONFIG.AUTH_URL;
        console.log('[ShopScout] Opening production auth page:', authUrl);
        
        // Check if auth tab is already open
        chrome.tabs.query({}).then(tabs => {
          const authTabs = tabs.filter(t => t.url && t.url.includes(CONFIG.AUTH_URL));
          
          if (authTabs.length > 0) {
            // Focus existing auth tab
            console.log(`[ShopScout] Focusing existing auth tab`);
            chrome.tabs.update(authTabs[0].id, { active: true });
            chrome.windows.update(authTabs[0].windowId, { focused: true });
          } else {
            // Open new auth tab with production auth URL
            console.log(`[ShopScout] Opening production auth page: ${authUrl}`);
            chrome.tabs.create({ url: authUrl }).then(authTab => {
              console.log(`[ShopScout] ✅ Auth tab opened with ID: ${authTab.id}`);
            }).catch(error => {
              console.error('[ShopScout] Error opening auth tab:', error);
            });
          }
        });
      } else {
        // User is authenticated - request product scrape
        console.log('[ShopScout] User is authenticated');
        chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PRODUCT' }).catch(err => {
          console.log('[ShopScout] No content script on this page');
        });
      }
    });
  }).catch(error => {
    console.error('[ShopScout] ❌ Failed to open sidebar:', error.message);
    console.log('[ShopScout] This usually means a user gesture issue or Chrome API problem');
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

// Inject content script into existing tabs
async function injectContentScriptIntoExistingTabs() {
  console.log('[ShopScout] Injecting content script into existing tabs...');
  
  const supportedDomains = [
    '*://*.amazon.com/*',
    '*://*.amazon.co.uk/*',
    '*://*.ebay.com/*',
    '*://*.ebay.co.uk/*',
    '*://*.walmart.com/*',
    '*://*.target.com/*',
    '*://*.bestbuy.com/*',
    '*://*.jumia.co.ke/*',
    '*://*.jiji.co.ke/*',
    '*://*.jumia.com.ng/*',
    '*://*.jiji.ng/*',
    '*://*.argos.co.uk/*'
  ];
  
  try {
    const tabs = await chrome.tabs.query({});
    let injectedCount = 0;
    
    for (const tab of tabs) {
      if (!tab.url) continue;
      
      // Check if tab URL matches supported domains
      const isSupported = supportedDomains.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\./g, '\\.'));
        return regex.test(tab.url);
      });
      
      if (isSupported) {
        try {
          // Try to inject content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          injectedCount++;
          console.log('[ShopScout] ✅ Injected into tab:', tab.id, tab.url.substring(0, 50));
        } catch (error) {
          // Ignore errors (tab might not allow injection)
          console.log('[ShopScout] ⚠️ Could not inject into tab:', tab.id, error.message);
        }
      }
    }
    
    console.log(`[ShopScout] ✅ Content script injected into ${injectedCount} existing tabs`);
  } catch (error) {
    console.error('[ShopScout] Error injecting content script:', error);
  }
}

// Initialize on install or update
chrome.runtime.onInstalled.addListener(async (details) => {
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
  } else if (details.reason === 'update') {
    console.log('[ShopScout] Extension updated from', details.previousVersion, 'to', chrome.runtime.getManifest().version);
  }
  
  // Inject content script into existing tabs (works for both install and update)
  await injectContentScriptIntoExistingTabs();
});

// Also inject when service worker starts (in case it was restarted)
chrome.runtime.onStartup.addListener(async () => {
  console.log('[ShopScout] Browser started, injecting content script into existing tabs...');
  await injectContentScriptIntoExistingTabs();
});

console.log('[ShopScout] Background service worker initialized');
