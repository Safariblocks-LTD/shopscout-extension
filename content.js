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
        '.a-icon-star .a-icon-alt',
        '[data-hook="rating-out-of-text"]'
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

    // Extract title
    const titleElement = utils.querySelector(this.config.selectors.title);
    data.title = utils.extractText(titleElement);
    console.log('[ShopScout] Title found:', data.title, 'Element:', titleElement);

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

    // Extract rating
    if (this.config.selectors.rating) {
      const ratingElement = utils.querySelector(this.config.selectors.rating);
      data.rating = utils.extractText(ratingElement);
      console.log('[ShopScout] Rating found:', data.rating);
    }

    // Validate essential data
    if (!data.title || !data.price) {
      console.warn('[ShopScout] ⚠️ Missing essential product data!');
      console.warn('[ShopScout] Title:', data.title);
      console.warn('[ShopScout] Price:', data.price);
      console.warn('[ShopScout] Trying to find elements on page...');
      
      // Debug: Try to find what's actually on the page
      const allH1 = document.querySelectorAll('h1');
      console.log('[ShopScout] Found', allH1.length, 'h1 elements on page');
      allH1.forEach((h1, i) => {
        console.log(`[ShopScout] H1 #${i}:`, h1.textContent?.substring(0, 100));
      });
      
      return null;
    }

    this.productData = data;
    console.log('[ShopScout] ✅ Product scraped successfully:', data);
    
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
    
    // Scrape product data
    const productData = await scraper.scrape();
    
    if (productData) {
      lastScrapedUrl = productData.url;
      
      console.log('[ShopScout] 📤 Sending product data to background script...');
      
      // Send to background script
      chrome.runtime.sendMessage({
        type: 'PRODUCT_DETECTED',
        data: productData
      }).then(() => {
        console.log('[ShopScout] ✅ Product data sent successfully');
      }).catch(err => {
        console.error('[ShopScout] ❌ Error sending message:', err);
      });
    } else {
      console.warn('[ShopScout] ⚠️ Scraping returned no data');
    }
  } catch (error) {
    console.error('[ShopScout] ❌ Initialization error:', error);
  } finally {
    isInitializing = false;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ShopScout Content] Message received:', message.type);
  
  if (message.type === 'SCRAPE_PRODUCT') {
    console.log('[ShopScout Content] Starting manual scrape...');
    
    if (!scraper) {
      scraper = new ProductScraper();
    }
    
    // Check if on product page
    if (!scraper.isProductPage()) {
      console.log('[ShopScout Content] Not on a product page');
      sendResponse({ success: false, error: 'Not on a product page' });
      return true;
    }
    
    // Scrape product data
    scraper.scrape().then(data => {
      if (data) {
        console.log('[ShopScout Content] Product scraped:', data.title);
        
        // Send product data to background script
        chrome.runtime.sendMessage({
          type: 'PRODUCT_DETECTED',
          data: data
        }).catch(err => {
          console.error('[ShopScout Content] Error sending product data:', err);
        });
        
        sendResponse({ success: true, data });
      } else {
        console.log('[ShopScout Content] Failed to scrape product data');
        sendResponse({ success: false, error: 'Failed to scrape product data' });
      }
    }).catch(error => {
      console.error('[ShopScout Content] Scrape error:', error);
      sendResponse({ success: false, error: error.message });
    });
    
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
