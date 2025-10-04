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
  waitForElement(selector, timeout = 5000) {
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

    // Extract price
    const priceElement = utils.querySelector(this.config.selectors.price);
    data.priceRaw = utils.extractText(priceElement);
    data.price = utils.normalizePrice(data.priceRaw);

    // Extract image
    const imageElement = utils.querySelector(this.config.selectors.image);
    data.image = utils.extractImageUrl(imageElement);

    // Extract seller
    const sellerElement = utils.querySelector(this.config.selectors.seller);
    data.seller = utils.extractText(sellerElement);

    // Extract product ID (ASIN, item ID, etc.)
    if (typeof this.config.selectors.asin === 'function') {
      data.productId = this.config.selectors.asin();
    } else if (typeof this.config.selectors.itemId === 'function') {
      data.productId = this.config.selectors.itemId();
    }

    // Extract reviews count
    if (this.config.selectors.reviews) {
      const reviewsElement = utils.querySelector(this.config.selectors.reviews);
      data.reviews = utils.extractText(reviewsElement);
    }

    // Extract rating
    if (this.config.selectors.rating) {
      const ratingElement = utils.querySelector(this.config.selectors.rating);
      data.rating = utils.extractText(ratingElement);
    }

    // Validate essential data
    if (!data.title || !data.price) {
      console.log('[ShopScout] Missing essential product data');
      return null;
    }

    this.productData = data;
    console.log('[ShopScout] Product scraped successfully:', data);
    
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

async function initialize() {
  scraper = new ProductScraper();
  
  // Check if this is a product page
  if (!scraper.isProductPage()) {
    console.log('[ShopScout] Not a product page');
    return;
  }

  // Scrape product data
  const productData = await scraper.scrape();
  
  if (productData && productData.url !== lastScrapedUrl) {
    lastScrapedUrl = productData.url;
    
    // Send to background script
    chrome.runtime.sendMessage({
      type: 'PRODUCT_DETECTED',
      data: productData
    }).catch(err => {
      console.log('[ShopScout] Error sending message:', err);
    });
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_PRODUCT') {
    scraper = new ProductScraper();
    scraper.scrape().then(data => {
      sendResponse({ success: true, data });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
});

// Observe DOM changes for dynamic content
const observer = new MutationObserver((mutations) => {
  // Debounce re-initialization
  clearTimeout(observer.timer);
  observer.timer = setTimeout(() => {
    if (scraper && scraper.isProductPage() && window.location.href !== lastScrapedUrl) {
      initialize();
    }
  }, 1000);
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

console.log('[ShopScout] Content script loaded');
