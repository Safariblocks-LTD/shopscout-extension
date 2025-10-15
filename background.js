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
    
    if (availability === 'no' || availability === 'unavailable') {
      console.log('[ShopScout] ⚠️ AI model not available on this device');
      return false;
    }
    
    // availability can be: 'readily', 'after-download', 'available', or 'no'
    console.log('[ShopScout] ✅ AI model is available (status:', availability + ')');
    
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
    console.log('[ShopScout] ========================================');
    console.log('[ShopScout] searchDeals() CALLED');
    console.log('[ShopScout] Query:', query);
    console.log('[ShopScout] Image URL:', imageUrl);
    console.log('[ShopScout] Current Price:', currentPrice);
    console.log('[ShopScout] Product URL:', productUrl);
    console.log('[ShopScout] ========================================');
    
    try {
      const cacheKey = `search-${query}`;
      const cached = cache.get(cacheKey, 'searches');
      if (cached) {
        console.log('[ShopScout] ✅ Returning cached search results');
        return cached;
      }

      console.log('[ShopScout] 🔍 Searching for deals:', query);
      console.log('[ShopScout] Strategy: Serper.dev API ONLY (no AI fallback)');
      console.log('[ShopScout] CONFIG.BACKEND_URL:', CONFIG.BACKEND_URL);
      
      // Use ONLY Serper.dev API for deal searching
      console.log('[ShopScout] 🌐 Calling Serper.dev API...');
      console.log('[ShopScout] Query:', query);
      
      const baseUrl = CONFIG.BACKEND_URL || 'https://shopscout-api.fly.dev';
      console.log('[ShopScout] Base URL:', baseUrl);
      console.log('[ShopScout] API Endpoint:', `${baseUrl}/api/search`);
      
      try {
        const startTime = Date.now();
        
        // Build query params
        const params = new URLSearchParams({ query: query });
        if (imageUrl) params.append('image', imageUrl);
        
        const url = `${baseUrl}/api/search?${params.toString()}`;
        console.log('[ShopScout] 📡 Full URL:', url);
        console.log('[ShopScout] 🚀 Sending request...');
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        
        console.log('[ShopScout] 📥 Response received!');
        console.log('[ShopScout] Status:', response.status, response.statusText);
        console.log('[ShopScout] Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[ShopScout] ❌ API Error Response:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('[ShopScout] 📦 Response data received');
        console.log('[ShopScout] Data preview:', JSON.stringify(data).substring(0, 500));
        console.log('[ShopScout] Full data:', data);
        
        const duration = Date.now() - startTime;
        console.log('[ShopScout] ⏱️ Serper.dev response in', duration, 'ms');
        
        // Check if we have results
        if (data && data.success && data.results && Array.isArray(data.results) && data.results.length > 0) {
          const serperResults = data.results;
          console.log('[ShopScout] ✅ Serper.dev found', serperResults.length, 'deals');
          console.log('[ShopScout] First deal:', JSON.stringify(serperResults[0]));
          
          const finalData = {
            results: serperResults,
            allResults: serperResults,
            bestDeal: serperResults[0],
            timestamp: Date.now(),
            source: 'serper',
            aiPowered: false,
            serperCount: serperResults.length,
            aiCount: 0
          };
          
          cache.set(cacheKey, finalData, 'searches');
          console.log('[ShopScout] ✅ Cached results for future use');
          return finalData;
        } else {
          console.log('[ShopScout] ⚠️ Serper.dev returned no results or invalid format');
          console.log('[ShopScout] Data.success:', data?.success);
          console.log('[ShopScout] Data.results:', data?.results);
          console.log('[ShopScout] Results length:', data?.results?.length);
          
          // Return empty results
          return {
            results: [],
            allResults: [],
            bestDeal: null,
            timestamp: Date.now(),
            source: 'serper',
            message: 'No similar products found at this time',
            serperCount: 0,
            aiCount: 0
          };
        }
      } catch (error) {
        console.error('[ShopScout] ❌ CRITICAL ERROR in Serper.dev API call');
        console.error('[ShopScout] Error name:', error.name);
        console.error('[ShopScout] Error message:', error.message);
        console.error('[ShopScout] Error stack:', error.stack);
        
        // Return empty results with error info
        return {
          results: [],
          allResults: [],
          bestDeal: null,
          timestamp: Date.now(),
          source: 'serper',
          error: error.message,
          message: 'Unable to search for deals. API error occurred.',
          serperCount: 0,
          aiCount: 0
        };
      }
    } catch (outerError) {
      console.error('[ShopScout] ❌ Unexpected error in searchDeals:', outerError.message);
      return {
        results: [],
        allResults: [],
        bestDeal: null,
        timestamp: Date.now(),
        source: 'serper',
        error: outerError.message,
        serperCount: 0,
        aiCount: 0
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
      
      if (availability === 'no' || availability === 'unavailable') {
        console.log('[ChromeAI] ⚠️ AI model not available on this device');
        return { success: false, reason: 'AI model not available' };
      }
      
      console.log('[ChromeAI] ✅ AI model ready (status:', availability + ')');

      // Get model parameters
      const params = await self.LanguageModel.params();
      console.log('[ChromeAI] Model params:', params);

      // Create AI session with optimized parameters for speed
      console.log('[ChromeAI] Creating AI session...');
      const session = await self.LanguageModel.create({
        temperature: 0.3,  // Lower = faster, more focused
        topK: 1,           // Lower = faster, more deterministic
      });
      console.log('[ChromeAI] ✅ Session created successfully');

      // Improved prompt for accuracy
      const prompt = `Find 3-5 real cheaper alternatives for: ${query} (current price: $${currentPrice || 'unknown'})

IMPORTANT:
- Each deal MUST be from a DIFFERENT store (Amazon, Walmart, eBay, Target, or Best Buy)
- Prices must be realistic and LOWER than current price
- Return ONLY valid JSON array:

[{"title":"exact product name","price":99.99,"source":"Walmart","url":"https://walmart.com/product-page"}]

No other text. JSON only.`;

      const startTime = Date.now();
      console.log('[ChromeAI] 🚀 Sending prompt (optimized for speed)...');
      console.log('[ChromeAI] Query:', query);
      console.log('[ChromeAI] Current price:', currentPrice);
      
      // Add timeout to prevent hanging (30 seconds max)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI response timeout (30s)')), 30000)
      );
      
      const response = await Promise.race([
        session.prompt(prompt),
        timeoutPromise
      ]);
      
      const duration = Date.now() - startTime;
      console.log('[ChromeAI] ⏱️ Response received in', duration, 'ms');
      console.log('[ChromeAI] Raw AI response:', response.substring(0, 500));

      // Parse response
      const deals = this.parseAIResponse(response, currentPrice);

      // Cleanup
      session.destroy();

      console.log('[ChromeAI] 📦 Parsed', deals.length, 'deals from AI response');

      if (deals && deals.length > 0) {
        return {
          success: true,
          deals: deals,
          source: 'chrome-ai',
          duration: duration
        };
      }

      console.log('[ChromeAI] ⚠️ No valid deals parsed from response');
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
          if (!deal.title || !deal.price || !deal.source) {
            console.log('[ChromeAI] Filtered out deal - missing required fields:', deal);
            return false;
          }
          const price = parseFloat(deal.price);
          if (isNaN(price) || price <= 0) {
            console.log('[ChromeAI] Filtered out deal - invalid price:', deal);
            return false;
          }
          if (currentPrice && price > currentPrice * 1.1) {
            console.log('[ChromeAI] Filtered out deal - price too high:', deal);
            return false;
          }
          return true;
        })
        .map(deal => {
          // Use AI-provided URL if available, otherwise generate search URL
          const dealUrl = deal.url || this.generateSearchUrl(deal.title, deal.source);
          
          console.log('[ChromeAI] Processing deal:', {
            title: deal.title,
            price: deal.price,
            source: deal.source,
            url: dealUrl
          });
          
          return {
            title: deal.title,
            price: parseFloat(deal.price),
            currency: 'USD',
            source: deal.source, // Keep exact source from AI
            platform: deal.source.toLowerCase().replace(/\s+/g, ''),
            url: dealUrl,
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
          };
        });
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
   * Get price history for a product - NO MOCK DATA
   */
  async getPriceHistory(productId, currentPrice = null) {
    try {
      if (!productId) {
        console.log('[ShopScout] ⚠️ No product ID provided for price history');
        return null;
      }

      const cached = cache.get(productId, 'priceHistory');
      if (cached) {
        console.log('[ShopScout] ✅ Returning cached price history');
        return cached;
      }

      console.log('[ShopScout] 📊 Fetching price history for:', productId);
      console.log('[ShopScout] API URL:', `${CONFIG.BACKEND_URL}/api/price-history/${productId}`);
      
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/price-history/${productId}`);
      
      console.log('[ShopScout] Price history response status:', response.status);
      
      if (!response.ok) {
        console.warn('[ShopScout] ❌ Price history API returned:', response.status);
        return null; // NO MOCK DATA - return null if API fails
      }

      const data = await response.json();
      console.log('[ShopScout] ✅ Price history fetched successfully');
      console.log('[ShopScout] Price history data points:', data?.prices?.length || 0);
      
      cache.set(productId, data, 'priceHistory');
      return data;
    } catch (error) {
      console.error('[ShopScout] ❌ Price history error:', error.message);
      return null; // NO MOCK DATA - return null on error
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
      if (availability === 'no' || availability === 'unavailable') {
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
   * Summarize product information using Chrome Summarizer API
   */
  async summarizeProduct(productData, dealData) {
    try {
      console.log('[ShopScout] Checking Summarizer API...');
      console.log('[ShopScout] self.ai exists:', typeof self.ai !== 'undefined');
      console.log('[ShopScout] self.ai.summarizer exists:', typeof self.ai?.summarizer !== 'undefined');
      
      if (typeof self.ai === 'undefined' || typeof self.ai.summarizer === 'undefined') {
        console.log('[ShopScout] ❌ Summarizer API not available - Chrome AI not enabled');
        console.log('[ShopScout] Note: Requires Chrome 128+ with Built-in AI enabled');
        return null;
      }

      // Check availability (following official docs)
      console.log('[ShopScout] Checking summarizer capabilities...');
      const availability = await self.ai.summarizer.capabilities();
      console.log('[ShopScout] Summarizer availability:', availability);
      
      if (availability.available === 'no') {
        console.log('[ShopScout] ❌ Summarizer model not available on this device');
        return null;
      }

      if (availability.available === 'after-download') {
        console.log('[ShopScout] ⚠️ Summarizer model needs to be downloaded first');
        return null;
      }

      console.log('[ShopScout] 📝 Generating product summary with AI (streaming)...');
      const startTime = Date.now();

      // Build comprehensive product context for summarization
      const productContext = `
Product Information:
Title: ${productData.title}
Current Price: $${productData.price}
Rating: ${productData.rating || 'No rating'}
Reviews: ${productData.reviews || 'No reviews'}
Seller: ${productData.seller || 'Unknown'}
Store: ${productData.site}

Price Comparison:
${dealData.results && dealData.results.length > 0 ? 
  `Found ${dealData.results.length} alternative deals:\n` + 
  dealData.results.slice(0, 3).map((deal, i) => 
    `${i + 1}. ${deal.title} - $${deal.price} at ${deal.source}`
  ).join('\n') : 
  'No alternative deals found'}

${dealData.bestDeal ? `Best Deal: $${dealData.bestDeal.price} at ${dealData.bestDeal.source} (Save $${(productData.price - dealData.bestDeal.price).toFixed(2)})` : ''}

Provide a helpful summary for a shopper considering this product.
      `.trim();

      // Create summarizer with options (following official docs)
      const summarizer = await self.ai.summarizer.create({
        type: 'key-points',
        format: 'plain-text',
        length: 'medium',
        sharedContext: 'This is product information from an online shopping comparison tool.'
      });

      // Use streaming for faster first token (following official docs pattern)
      const stream = await summarizer.summarizeStreaming(productContext);
      let summary = '';
      let firstTokenTime = null;
      
      for await (const chunk of stream) {
        if (!firstTokenTime) {
          firstTokenTime = Date.now() - startTime;
          console.log('[ShopScout] ⚡ First token received in', firstTokenTime, 'ms');
        }
        summary = chunk; // Each chunk contains the progressive summary
        console.log('[ShopScout] 📝 Chunk received:', chunk.substring(0, 50) + '...');
      }

      summarizer.destroy();
      const totalTime = Date.now() - startTime;
      console.log('[ShopScout] ✅ Product summary generated in', totalTime, 'ms');
      console.log('[ShopScout] 📄 Final summary length:', summary.length, 'characters');

      return summary;
    } catch (error) {
      console.error('[ShopScout] Product summarization error:', error);
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
      
      // Get price history (pass current price for mock data)
      const priceHistory = await api.getPriceHistory(productData.productId, productData.price);

      // Send initial results IMMEDIATELY (don't wait for AI summaries)
      const initialResult = {
        product: productData,
        deals: dealData,
        trustScore,
        priceHistory,
        timestamp: Date.now(),
      };

      console.log('[ShopScout] ✅ Initial analysis complete - sending to UI');
      this.notifySidePanel('ANALYSIS_COMPLETE', initialResult);
      
      // Now generate product summary using Summarizer API (non-blocking)
      console.log('[ShopScout] 📝 Generating product summary with Summarizer API...');
      
      // Generate summary with Summarizer API only
      const generateSummaryAsync = async () => {
        try {
          // Use ONLY Summarizer API for product summary (streaming)
          const productSummary = await ai.summarizeProduct(productData, dealData).catch(e => {
            console.log('[ShopScout] ⚠️ Product summary skipped:', e.message);
            return null;
          });

          if (productSummary) {
            const finalResult = {
              ...initialResult,
              summary: productSummary // Single summary field
            };

            console.log('[ShopScout] ✅ Product summary complete');
            cache.set(`analysis-${productData.url}`, finalResult);
            this.notifySidePanel('SUMMARY_COMPLETE', { summary: productSummary });
          }
        } catch (error) {
          console.error('[ShopScout] Summary generation error:', error);
        }
      };

      // Run summary async (don't await)
      generateSummaryAsync();
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

      case 'AI_CHAT':
        // Handle AI Assistant chat (Prompt API powered)
        this.handleAIChat(message.question, message.context).then(response => {
          sendResponse(response);
        });
        return true; // Keep channel open for async response

      default:
        sendResponse({ error: 'Unknown action' });
    }
    return true;
  },

  /**
   * Handle AI Assistant chat using Prompt API
   */
  async handleAIChat(question, context) {
    try {
      console.log('[AI Assistant] Processing question:', question);
      
      // Check if Prompt API is available
      if (typeof self.LanguageModel === 'undefined') {
        return {
          success: false,
          error: 'AI Assistant is not available. Please use Chrome 127+ with Gemini Nano.'
        };
      }

      const availability = await self.LanguageModel.availability();
      if (availability === 'no' || availability === 'unavailable') {
        return {
          success: false,
          error: 'AI model is not available on this device.'
        };
      }

      // Create AI session with product context
      const session = await self.LanguageModel.create({
        systemPrompt: `You are ShopScout AI Assistant, a helpful shopping advisor. You help users make informed purchasing decisions.
        
Current Product Context:
${context.productTitle ? `Product: ${context.productTitle}` : ''}
${context.productPrice ? `Price: $${context.productPrice}` : ''}
${context.productRating ? `Rating: ${context.productRating}` : ''}
${context.bestDealPrice ? `Best Alternative: $${context.bestDealPrice}` : ''}
${context.dealsCount ? `Alternatives Found: ${context.dealsCount}` : ''}

Provide helpful, concise answers about this product. Be friendly and informative.`,
        temperature: 0.7,
        topK: 3
      });

      console.log('[AI Assistant] Sending prompt to Gemini Nano...');
      const startTime = Date.now();
      
      const response = await session.prompt(question);
      const duration = Date.now() - startTime;
      
      session.destroy();
      
      console.log('[AI Assistant] Response received in', duration, 'ms');
      
      return {
        success: true,
        answer: response,
        duration: duration
      };
    } catch (error) {
      console.error('[AI Assistant] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Notify side panel
   */
  notifySidePanel(type, data) {
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
            sendResponse({ success: false, error: 'Could not communicate with page. Please refresh and try again.' });
            return;
          }
          
          if (response && response.success) {
            console.log('[ShopScout] ✅ Manual scan successful');
            sendResponse({ success: true });
          } else {
            console.log('[ShopScout] ⚠️ Manual scan failed:', response?.error);
            sendResponse({ success: false, error: response?.error || 'Failed to scrape product data' });
          }
        });
      } catch (error) {
        console.error('[ShopScout] ❌ Manual scan error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // CRITICAL: Keep message channel open for async response
    
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
