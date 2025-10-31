/**
 * ShopScout Content Script v1.0
 * Automatically detects and scrapes product information from shopping sites
 * Supports: Amazon, eBay, Walmart, Temu, Shopify stores, and more
 */

// Site-specific scraper configurations
const SCRAPER_CONFIGS = {
  amazon: {
    patterns: [/amazon\.(com|co\.uk|ca|de|fr|es|it|co\.jp)/],
    selectors: {
      title: [
        '#productTitle',
        '#title',
        'h1.product-title',
        '[data-feature-name="title"] h1'
      ],
      price: [
        '.a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-price-whole',
        '[data-a-color="price"] .a-offscreen'
      ],
      image: [
        '#landingImage',
        '#imgBlkFront',
        '#main-image',
        '.a-dynamic-image'
      ],
      seller: [
        '#sellerProfileTriggerId',
        '#merchant-info',
        '.tabular-buybox-text[tabular-attribute-name="Sold by"] span'
      ],
      asin: () => {
        const match = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
        return match ? match[1] : null;
      },
      reviews: [
        '#acrCustomerReviewText',
        '[data-hook="total-review-count"]'
      ],
      rating: [
        'span[data-hook="rating-out-of-text"]',
        '.a-icon-star .a-icon-alt',
        'i.a-icon-star span.a-icon-alt',
        '#acrPopover',
        '.a-icon-alt'
      ]
    }
  },
  
  ebay: {
    patterns: [/ebay\.(com|co\.uk|ca|de|fr|es|it)/],
    selectors: {
      title: [
        'h1.x-item-title__mainTitle',
        '.it-ttl',
        '[data-testid="x-item-title"]'
      ],
      price: [
        '.x-price-primary .ux-textspans',
        '.notranslate.vi-VR-cvipPrice',
        '[itemprop="price"]'
      ],
      image: [
        '.ux-image-carousel-item.active img',
        '#icImg',
        '.vi-image-gallery__image img'
      ],
      seller: [
        '.x-sellercard-atf__info__about-seller a',
        '.mbg-nw',
        '[data-testid="str-title"] a'
      ],
      itemId: () => {
        const match = window.location.pathname.match(/\/itm\/(\d+)/);
        return match ? match[1] : null;
      },
      reviews: [
        '.reviews-count',
        '[data-testid="reviews-count"]'
      ],
      rating: [
        '.x-star-rating .ux-textspans',
        '.reviews-star-rating'
      ]
    }
  },
  
  walmart: {
    patterns: [/walmart\.com/],
    selectors: {
      title: [
        'h1[itemprop="name"]',
        '.prod-ProductTitle',
        '[data-automation-id="product-title"]'
      ],
      price: [
        '[itemprop="price"]',
        '.price-characteristic',
        '[data-automation-id="product-price"] span'
      ],
      image: [
        '.hover-zoom-hero-image',
        '[data-testid="hero-image-container"] img',
        '.prod-hero-image img'
      ],
      seller: [
        '.seller-name',
        '[data-automation-id="seller-name"]'
      ],
      itemId: () => {
        const match = window.location.pathname.match(/\/ip\/[^\/]+\/(\d+)/);
        return match ? match[1] : null;
      },
      reviews: [
        '[data-testid="reviews-count"]',
        '.reviews-count-number'
      ],
      rating: [
        '[data-testid="rating-number"]',
        '.rating-number'
      ]
    }
  },
  
  temu: {
    patterns: [/temu\.com/],
    selectors: {
      title: [
        'h1[data-testid="product-title"]',
        '.product-title',
        'h1.goods-title'
      ],
      price: [
        '.price-current',
        '[data-testid="product-price"]',
        '.goods-price'
      ],
      image: [
        '.main-image img',
        '[data-testid="product-image"]',
        '.goods-gallery__main img'
      ],
      seller: [
        '.store-name',
        '[data-testid="store-name"]'
      ],
      reviews: [
        '.review-count',
        '[data-testid="review-count"]'
      ],
      rating: [
        '.rating-score',
        '[data-testid="rating-score"]'
      ]
    }
  },
  
  shopify: {
    patterns: [/\.myshopify\.com/, /shopify/],
    selectors: {
      title: [
        'h1.product-title',
        '.product__title',
        '[itemprop="name"]'
      ],
      price: [
        '.price__current',
        '.product-price',
        '[itemprop="price"]'
      ],
      image: [
        '.product__media img',
        '.product-single__photo',
        '[data-product-featured-media] img'
      ],
      seller: [
        '.vendor',
        '[itemprop="brand"]'
      ],
      reviews: [
        '.spr-badge-caption',
        '.product-reviews-count'
      ],
      rating: [
        '.spr-starrating',
        '[itemprop="ratingValue"]'
      ]
    }
  },
  
  target: {
    patterns: [/target\.com/],
    selectors: {
      title: [
        'h1[data-test="product-title"]',
        '.ProductTitle'
      ],
      price: [
        '[data-test="product-price"]',
        '.ProductPrice'
      ],
      image: [
        '[data-test="product-image"] img',
        '.ProductImage img'
      ],
      seller: [
        '[data-test="store-name"]'
      ],
      reviews: [
        '[data-test="ratings-count"]'
      ],
      rating: [
        '[data-test="rating"]'
      ]
    }
  },
  
  bestbuy: {
    patterns: [/bestbuy\.com/],
    selectors: {
      title: [
        '.sku-title h1',
        '[data-testid="product-title"]'
      ],
      price: [
        '.priceView-customer-price span',
        '[data-testid="customer-price"]'
      ],
      image: [
        '.primary-image',
        '[data-testid="product-image"]'
      ],
      seller: [
        '.fulfillment-fulfillment-summary'
      ],
      reviews: [
        '.c-reviews-v4 button'
      ],
      rating: [
        '.c-reviews-v4 .c-review-average'
      ]
    }
  }
};

// Utility functions
const utils = {
  /**
   * Safely query selector with fallback array
   */
  querySelector(selectors) {
    if (!Array.isArray(selectors)) {
      selectors = [selectors];
    }
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  },

  /**
   * Extract text content safely
   */
  extractText(element) {
    if (!element) return null;
    return element.textContent?.trim() || element.innerText?.trim() || null;
  },

  /**
   * Extract image URL with highest resolution
   */
  extractImageUrl(element) {
    if (!element) return null;
    
    // Try data attributes first (often higher res)
    const dataAttrs = ['data-old-hires', 'data-a-dynamic-image', 'data-zoom-image', 'data-src'];
    for (const attr of dataAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        // Handle JSON format (Amazon dynamic images)
        if (value.startsWith('{')) {
          try {
            const images = JSON.parse(value);
            const urls = Object.keys(images);
            if (urls.length > 0) return urls[0];
          } catch (e) {
            // Continue to next attribute
          }
        } else {
          return value;
        }
      }
    }
    
    // Fallback to src
    return element.src || element.getAttribute('src');
  },

  /**
   * Clean and normalize price
   */
  normalizePrice(priceText) {
    if (!priceText) return null;
    
    // Extract numbers and decimal point
    const match = priceText.match(/[\d,]+\.?\d*/);
    if (!match) return null;
    
    const price = match[0].replace(/,/g, '');
    return parseFloat(price);
  },

  /**
   * Detect current site
   */
  detectSite() {
    const hostname = window.location.hostname;
    
    for (const [siteName, config] of Object.entries(SCRAPER_CONFIGS)) {
      for (const pattern of config.patterns) {
        if (pattern.test(hostname)) {
          return siteName;
        }
      }
    }
    
    return null;
  },

  /**
   * Wait for element to appear
   */
  waitForElement(selector, timeout = 2000) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }
};

/**
 * Main scraper class
 */
class ProductScraper {
  constructor() {
    this.site = utils.detectSite();
    this.config = this.site ? SCRAPER_CONFIGS[this.site] : null;
    this.productData = null;
  }

  /**
   * Scrape product data from current page
   */
  async scrape() {
    if (!this.config) {
      console.log('[ShopScout] Site not supported or not a product page');
      return null;
    }

    console.log(`[ShopScout] Scraping product from ${this.site}`);
    console.log('[ShopScout] Using selectors:', this.config.selectors);

    const data = {
      site: this.site,
      url: window.location.href,
      timestamp: Date.now(),
      title: null,
      price: null,
      priceRaw: null,
      image: null,
      seller: null,
      productId: null,
      reviews: null,
      rating: null
    };

    // Extract title - Try multiple selectors
    console.log('[ShopScout] 📝 Attempting to extract title...');
    for (const selector of this.config.selectors.title) {
      const titleElement = document.querySelector(selector);
      if (titleElement) {
        data.title = utils.extractText(titleElement);
        if (data.title) {
          console.log('[ShopScout] ✅ Title found:', data.title);
          console.log('[ShopScout] Title selector:', selector);
          break;
        }
      }
    }
    
    if (!data.title) {
      console.log('[ShopScout] ⚠️ Could not extract title from any selector');
    }

    // Extract price
    const priceElement = utils.querySelector(this.config.selectors.price);
    data.priceRaw = utils.extractText(priceElement);
    data.price = utils.normalizePrice(data.priceRaw);
    console.log('[ShopScout] Price found:', data.price, 'Raw:', data.priceRaw, 'Element:', priceElement);

    // Extract image
    const imageElement = utils.querySelector(this.config.selectors.image);
    data.image = utils.extractImageUrl(imageElement);
    console.log('[ShopScout] Image found:', data.image ? 'Yes' : 'No', 'Element:', imageElement);

    // Extract seller
    const sellerElement = utils.querySelector(this.config.selectors.seller);
    data.seller = utils.extractText(sellerElement);
    console.log('[ShopScout] Seller found:', data.seller, 'Element:', sellerElement);

    // Extract product ID (ASIN, item ID, etc.)
    if (typeof this.config.selectors.asin === 'function') {
      data.productId = this.config.selectors.asin();
    } else if (typeof this.config.selectors.itemId === 'function') {
      data.productId = this.config.selectors.itemId();
    }
    console.log('[ShopScout] Product ID:', data.productId);

    // Extract reviews count
    if (this.config.selectors.reviews) {
      const reviewsElement = utils.querySelector(this.config.selectors.reviews);
      data.reviews = utils.extractText(reviewsElement);
      console.log('[ShopScout] Reviews found:', data.reviews);
    }

    // Extract rating - ACCURATE extraction
    if (this.config.selectors.rating) {
      const ratingElement = utils.querySelector(this.config.selectors.rating);
      const ratingText = utils.extractText(ratingElement);
      console.log('[ShopScout] Rating raw text:', ratingText);
      
      if (ratingText) {
        // Extract numeric rating (e.g., "4.1 out of 5 stars" -> 4.1)
        const match = ratingText.match(/(\d+\.?\d*)\s*(out of|\/)?/i);
        if (match) {
          data.rating = parseFloat(match[1]);
          console.log('[ShopScout] ✅ Rating parsed:', data.rating);
        } else {
          data.rating = ratingText;
          console.log('[ShopScout] ⚠️ Rating could not be parsed, using raw:', data.rating);
        }
      }
    }

    // Comprehensive data validation and normalization
    console.log('[ShopScout] 🔍 Validating and normalizing product data...');
    
    // Validate title
    if (!data.title || data.title.trim().length === 0) {
      console.warn('[ShopScout] ⚠️ Missing or invalid title!');
      return null;
    }
    
    // Normalize title (remove excessive whitespace, limit length)
    data.title = data.title.trim().replace(/\s+/g, ' ').substring(0, 500);
    
    // Validate price
    if (!data.price || isNaN(data.price) || data.price <= 0) {
      console.warn('[ShopScout] ⚠️ Missing or invalid price!');
      console.warn('[ShopScout] Price value:', data.price);
      console.warn('[ShopScout] Raw price:', data.priceRaw);
      return null;
    }
    
    // Normalize price (ensure 2 decimal places)
    data.price = parseFloat(data.price.toFixed(2));
    
    // Normalize rating (convert to numeric string if needed)
    if (data.rating) {
      if (typeof data.rating === 'number') {
        data.rating = data.rating.toFixed(1);
      } else if (typeof data.rating === 'string') {
        const numRating = parseFloat(data.rating);
        if (!isNaN(numRating) && numRating >= 0 && numRating <= 5) {
          data.rating = numRating.toFixed(1);
        }
      }
    }
    
    // Normalize reviews (ensure consistent format)
    if (data.reviews) {
      // Extract just the number if it's in format like "1,234 reviews"
      const reviewMatch = data.reviews.match(/[\d,]+/);
      if (reviewMatch) {
        const reviewCount = parseInt(reviewMatch[0].replace(/,/g, ''));
        if (!isNaN(reviewCount)) {
          data.reviews = reviewCount >= 1000 
            ? `${(reviewCount / 1000).toFixed(1)}K reviews`
            : `${reviewCount} reviews`;
        }
      }
    } else {
      data.reviews = '0 reviews';
    }
    
    // Validate image URL
    if (data.image) {
      try {
        new URL(data.image);
      } catch (e) {
        console.warn('[ShopScout] ⚠️ Invalid image URL:', data.image);
        data.image = null;
      }
    }
    
    // Normalize seller name
    if (data.seller) {
      data.seller = data.seller.trim().substring(0, 100);
    }

    this.productData = data;
    console.log('[ShopScout] ✅ Product scraped and validated successfully');
    console.log('[ShopScout] Final data:', {
      title: data.title.substring(0, 50) + '...',
      price: data.price,
      rating: data.rating,
      reviews: data.reviews,
      seller: data.seller
    });
    
    return data;
  }

  /**
   * Check if current page is a product page
   */
  isProductPage() {
    if (!this.config) return false;
    
    // Quick check for title element
    const titleElement = utils.querySelector(this.config.selectors.title);
    return titleElement !== null;
  }
}

/**
 * Initialize content script
 */
let scraper = null;
let lastScrapedUrl = null;
let isInitializing = false;

async function initialize() {
  // Prevent concurrent initializations
  if (isInitializing) {
    console.log('[ShopScout] Already initializing, skipping...');
    return;
  }
  
  // Check if URL has changed
  if (lastScrapedUrl === window.location.href) {
    console.log('[ShopScout] Same URL, skipping re-scan');
    return;
  }
  
  isInitializing = true;
  
  try {
    console.log('[ShopScout] 🚀 Initializing scraper for:', window.location.href);
    scraper = new ProductScraper();
    
    console.log('[ShopScout] Detected site:', scraper.site);
    console.log('[ShopScout] Has config:', !!scraper.config);
    
    // Check if this is a product page
    if (!scraper.isProductPage()) {
      console.log('[ShopScout] Not a product page - no title element found');
      return;
    }

    console.log('[ShopScout] ✅ Product page detected! Starting scrape...');
    
    // Debounce function to prevent excessive scraping (optimized for speed)
    let scrapeTimeout;
    async function debouncedScrape() {
      clearTimeout(scrapeTimeout);
      scrapeTimeout = setTimeout(async () => {
        try {
          console.log('[ShopScout] ⚡ Fast product scrape initiated...');
          const startTime = performance.now();
          const productData = await scraper.scrape();
          const duration = performance.now() - startTime;
          
          if (productData) {
            console.log(`[ShopScout] ✅ Product scraped in ${duration.toFixed(0)}ms`);
            console.log('[ShopScout] Product data:', {
              title: productData.title?.substring(0, 50) + '...',
              price: productData.price,
              site: productData.site
            });
            
            // Record real price immediately
            recordRealPrice();
            
            try {
              await chrome.runtime.sendMessage({
                type: 'PRODUCT_DETECTED',
                data: productData
              });
              console.log('[ShopScout] Product data sent to background successfully');
              
              // Generate AI summary immediately after product detection
              if (typeof initializeAISummary === 'function') {
                console.log('[ShopScout] Triggering AI summary generation...');
                initializeAISummary(productData).catch(err => {
                  console.error('[ShopScout] AI summary failed:', err);
                });
              }
            } catch (msgError) {
              console.error('[ShopScout] Failed to send product data:', msgError);
            }
          } else {
            console.error('[ShopScout] Could not scrape product data - scraper returned null');
          }
        } catch (error) {
          console.error('[ShopScout] Scraping error:', error);
          console.error('[ShopScout] Error stack:', error.stack);
        }
      }, 300); // Reduced from 1000ms to 300ms for faster response
    }

    debouncedScrape();
  } catch (error) {
    console.error('[ShopScout] ❌ Initialization error:', error);
  } finally {
    isInitializing = false;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ShopScout Content] ✅ Message received:', message.type);
  console.log('[ShopScout Content] Full message:', message);
  
  // Handle AI status check request
  if (message.type === 'GET_AI_STATUS') {
    console.log('[ShopScout Content] AI status check requested');
    console.log('[ShopScout Content] Checking Summarizer:', 'Summarizer' in self || 'Summarizer' in window);
    console.log('[ShopScout Content] Checking LanguageModel:', 'LanguageModel' in self || 'LanguageModel' in window);
    
    (async () => {
      try {
        // Check for Chrome AI APIs using correct globals
        const hasSummarizer = 'Summarizer' in self || 'Summarizer' in window;
        const hasLanguageModel = 'LanguageModel' in self || 'LanguageModel' in window;
        const hasLanguageDetector = 'LanguageDetector' in self || 'LanguageDetector' in window;
        const hasWriter = 'Writer' in self || 'Writer' in window;
        const hasRewriter = 'Rewriter' in self || 'Rewriter' in window;
        
        const healthCheck = {
          timestamp: Date.now(),
          capabilities: {
            hasAi: hasSummarizer || hasLanguageModel,
            hasSummarizer,
            hasLanguageDetector,
            hasPrompt: hasLanguageModel,
            hasWriter,
            hasRewriter
          },
          browser: {
            userAgent: navigator.userAgent,
            language: navigator.language
          },
          apis: {
            summarizer: { available: hasSummarizer, status: 'unknown' },
            prompt: { available: hasLanguageModel, status: 'unknown' },
            languageDetector: { available: hasLanguageDetector, status: 'unknown' }
          },
          optimizationGuide: 'chrome://optimization-guide-internals'
        };
        
        // Test Summarizer
        if (hasSummarizer) {
          try {
            const Summarizer = self.Summarizer || window.Summarizer;
            const availability = await Summarizer.availability();
            healthCheck.apis.summarizer.status = availability;
          } catch (err) {
            healthCheck.apis.summarizer.status = 'error: ' + err.message;
          }
        }
        
        // Test Prompt API
        if (hasLanguageModel) {
          try {
            const LanguageModel = self.LanguageModel || window.LanguageModel;
            const capabilities = await LanguageModel.capabilities();
            healthCheck.apis.prompt.status = capabilities.available;
            healthCheck.capabilities.hasPrompt = capabilities.available !== 'no';
          } catch (err) {
            healthCheck.apis.prompt.status = 'error: ' + err.message;
          }
        }
        
        // Test Language Detector
        if (hasLanguageDetector) {
          try {
            const LanguageDetector = self.LanguageDetector || window.LanguageDetector;
            const availability = await LanguageDetector.availability?.();
            healthCheck.apis.languageDetector.status = availability || 'ready';
          } catch (err) {
            healthCheck.apis.languageDetector.status = 'error: ' + err.message;
          }
        }
        
        console.log('[ShopScout Content] AI health check completed:', healthCheck);
        sendResponse({ success: true, healthCheck });
      } catch (error) {
        console.error('[ShopScout Content] AI health check error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'SCRAPE_PRODUCT') {
    console.log('[ShopScout Content] Starting manual scrape...');
    console.log('[ShopScout Content] Current URL:', window.location.href);
    
    if (!scraper) {
      scraper = new ProductScraper();
      console.log('[ShopScout Content] Created new scraper');
    }
    
    console.log('[ShopScout Content] Scraper site:', scraper.site);
    console.log('[ShopScout Content] Scraper config exists:', !!scraper.config);
    
    // Check if on product page
    if (!scraper.isProductPage()) {
      console.log('[ShopScout Content] ❌ Not on a product page');
      console.log('[ShopScout Content] Checking title selectors...');
      
      // Debug: check each title selector
      if (scraper.config && scraper.config.selectors && scraper.config.selectors.title) {
        scraper.config.selectors.title.forEach((selector, index) => {
          const element = document.querySelector(selector);
          console.log(`[ShopScout Content] Title selector ${index + 1}: "${selector}" -> ${element ? 'FOUND' : 'NOT FOUND'}`);
          if (element) {
            console.log(`[ShopScout Content] Element text:`, element.textContent?.trim().substring(0, 100));
          }
        });
      }
      
      sendResponse({ success: false, error: 'Not on a product page' });
      return true;
    }
    
    console.log('[ShopScout Content] ✅ Product page confirmed');
    
    // Scrape product data (ASYNC - must await)
    (async () => {
      try {
        console.log('[ShopScout Content] 🔍 Starting scrape operation...');
        const data = await scraper.scrape();
        console.log('[ShopScout Content] 📊 Scrape completed, data:', data ? 'SUCCESS' : 'NULL');
        
        if (data) {
          console.log('[ShopScout Content] ✅ Product scraped successfully:');
          console.log('[ShopScout Content] - Title:', data.title?.substring(0, 50) + '...');
          console.log('[ShopScout Content] - Price:', data.price);
          console.log('[ShopScout Content] - Site:', data.site);
          console.log('[ShopScout Content] - Image:', data.image ? 'YES' : 'NO');
          
          // Send product data to background script
          try {
            await chrome.runtime.sendMessage({
              type: 'PRODUCT_DETECTED',
              data: data
            });
            console.log('[ShopScout Content] ✅ Product data sent to background');
            
            // Generate AI summary for manual scrape
            if (typeof initializeAISummary === 'function') {
              console.log('[ShopScout Content] Triggering AI summary generation...');
              initializeAISummary(data).catch(err => {
                console.error('[ShopScout Content] AI summary failed:', err);
              });
            }
          } catch (err) {
            console.error('[ShopScout Content] Error sending product data:', err);
          }
          
          sendResponse({ success: true, data });
        } else {
          console.error('[ShopScout Content] ❌ Failed to scrape product data - returned null');
          console.error('[ShopScout Content] This usually means title or price extraction failed');
          sendResponse({ success: false, error: 'Failed to scrape product data' });
        }
      } catch (error) {
        console.error('[ShopScout Content] ❌ Scrape error:', error);
        console.error('[ShopScout Content] Error stack:', error.stack);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Keep channel open for async response
  }
});

// ============================================================================
// NAVIGATION DETECTION SYSTEM - Production Grade
// ============================================================================

let currentUrl = window.location.href;
let urlCheckInterval = null;
let domObserver = null;

/**
 * Detect URL changes with multiple strategies for maximum reliability
 */
function startNavigationDetection() {
  console.log('[ShopScout] 🎯 Starting navigation detection system...');
  
  // Strategy 1: High-frequency URL polling (100ms for instant detection)
  urlCheckInterval = setInterval(() => {
    if (window.location.href !== currentUrl) {
      console.log('[ShopScout] 🔄 URL change detected:', window.location.href);
      currentUrl = window.location.href;
      lastScrapedUrl = null;
      
      // Clean up AI summary on navigation
      if (typeof cleanupAISummary === 'function') {
        cleanupAISummary();
      }
      
      initialize();
    }
  }, 100); // Check every 100ms for instant response
  
  // Strategy 2: Intercept history API (for SPAs like Amazon)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    console.log('[ShopScout] 📍 pushState intercepted');
    currentUrl = window.location.href;
    lastScrapedUrl = null;
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => initialize(), 50);
    return;
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    console.log('[ShopScout] 📍 replaceState intercepted');
    currentUrl = window.location.href;
    lastScrapedUrl = null;
    setTimeout(() => initialize(), 50);
    return;
  };
  
  // Strategy 3: Listen for popstate (back/forward buttons)
  window.addEventListener('popstate', () => {
    console.log('[ShopScout] ⬅️ popstate event detected');
    currentUrl = window.location.href;
    lastScrapedUrl = null;
    setTimeout(() => initialize(), 50);
  });
  
  // Strategy 4: DOM observer for dynamic content
  domObserver = new MutationObserver(() => {
    // Only trigger if URL changed
    if (window.location.href !== currentUrl) {
      console.log('[ShopScout] 🔍 DOM change + URL change detected');
      currentUrl = window.location.href;
      lastScrapedUrl = null;
      initialize();
    }
  });
  
  // Start observing DOM
  if (document.body) {
    domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Strategy 5: Listen for click events on links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && link.href.startsWith(window.location.origin)) {
      console.log('[ShopScout] 🖱️ Internal link clicked, preparing for navigation...');
      // Check for URL change after a short delay
      setTimeout(() => {
        if (window.location.href !== currentUrl) {
          console.log('[ShopScout] 🔄 Navigation confirmed after click');
          currentUrl = window.location.href;
          lastScrapedUrl = null;
          initialize();
        }
      }, 100);
    }
  }, true); // Use capture phase
  
  console.log('[ShopScout] ✅ Navigation detection system active');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize immediately if page is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[ShopScout] 📄 DOM loaded');
    initialize();
    startNavigationDetection();
  });
} else {
  console.log('[ShopScout] 📄 Document already loaded');
  // Initialize immediately
  initialize();
  startNavigationDetection();
}

console.log('[ShopScout] 🚀 Content script loaded on:', window.location.href);
console.log('[ShopScout] ✅ Content script ready to receive messages');

// Test message listener
window.addEventListener('load', () => {
  console.log('[ShopScout] 📄 Page fully loaded, content script active');
});

// Add global test function for debugging
window.shopScoutTest = function() {
  console.log('[ShopScout] 🧪 Test function called - content script is working!');
  console.log('[ShopScout] Current scraper:', scraper);
  console.log('[ShopScout] Site detected:', scraper?.site);
  console.log('[ShopScout] Config exists:', !!scraper?.config);
  
  if (scraper) {
    console.log('[ShopScout] Is product page:', scraper.isProductPage());
    
    // Test title selectors
    if (scraper.config?.selectors?.title) {
      console.log('[ShopScout] Testing title selectors:');
      scraper.config.selectors.title.forEach((selector, i) => {
        const element = document.querySelector(selector);
        console.log(`  ${i+1}. "${selector}" -> ${element ? '✅ FOUND' : '❌ NOT FOUND'}`);
        if (element) {
          console.log(`     Text: "${element.textContent?.trim().substring(0, 100)}..."`);
        }
      });
    }
  }
  
  // Auto-record price data for real products
  async function recordRealPrice() {
    if (scraper && scraper.isProductPage()) {
      try {
        const productData = await scraper.scrape();
        if (productData && productData.price && productData.title) {
          const productId = generateProductId(productData.title, productData.url);
          
          console.log('[ShopScout] Recording real price:', {
            productId,
            title: productData.title,
            price: productData.price,
            source: scraper.site,
            url: productData.url
          });

          // Send real price data to server
          fetch('https://shopscout-api.fly.dev/api/price-track/record', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId,
              price: parseFloat(productData.price.replace(/[^0-9.]/g, '')),
              source: scraper.site,
              productUrl: productData.url,
              productName: productData.title
            })
          }).then(response => response.json())
            .then(data => console.log('[ShopScout] Price recorded:', data))
            .catch(error => console.error('[ShopScout] Error recording price:', error));
        }
      } catch (error) {
        console.error('[ShopScout] Error recording real price:', error);
      }
    }
  }

  // Generate consistent product ID from title and URL
  function generateProductId(title, url) {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const urlHash = btoa(url).slice(0, 8);
    return `${cleanTitle.substring(0, 30)}_${urlHash}`;
  }

  // Record price when page loads and when it changes
  setTimeout(recordRealPrice, 2000); // Record after page loads
  
  // Monitor for price changes (for dynamic content)
  let lastRecordedPrice = null;
  setInterval(() => {
    if (scraper && scraper.isProductPage()) {
      scraper.scrape().then(productData => {
        if (productData && productData.price) {
          const currentPrice = parseFloat(productData.price.replace(/[^0-9.]/g, ''));
          if (currentPrice !== lastRecordedPrice) {
            lastRecordedPrice = currentPrice;
            recordRealPrice();
          }
        }
      });
    }
  }, 30000); // Check every 30 seconds
  
  return 'ShopScout content script is active!';
};
