/**
 * Price Tracking Integration for Content Script
 * This adds real price tracking to the existing content script
 */

// Price tracking functions
function generateProductId(title, url) {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  const urlHash = btoa(url).slice(0, 8);
  return `${cleanTitle.substring(0, 30)}_${urlHash}`;
}

async function recordRealPrice(productData) {
  if (!productData || !productData.price || !productData.title) {
    console.log('[PriceTracker] Missing required data for price recording');
    return;
  }

  try {
    const productId = generateProductId(productData.title, productData.url);
    const cleanPrice = parseFloat(productData.price.replace(/[^0-9.]/g, ''));
    
    console.log('[PriceTracker] Recording price:', {
      productId,
      title: productData.title,
      price: cleanPrice,
      source: productData.site,
      url: productData.url
    });

    // Send to server
    const response = await fetch('https://shopscout-api.fly.dev/api/price-track/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        price: cleanPrice,
        source: productData.site,
        productUrl: productData.url,
        productName: productData.title
      })
    });

    const result = await response.json();
    console.log('[PriceTracker] Price recorded successfully:', result);
    return result;
  } catch (error) {
    console.error('[PriceTracker] Error recording price:', error);
  }
}

// Enhanced scraping with price tracking
const originalScrape = ProductScraper.prototype.scrape;
ProductScraper.prototype.scrape = async function() {
  const data = await originalScrape.call(this);
  
  if (data && data.price && data.title) {
    // Record price immediately after scraping
    recordRealPrice(data);
  }
  
  return data;
};

// Monitor price changes
let lastRecordedPrice = null;
let priceMonitorInterval = null;

function startPriceMonitoring() {
  if (priceMonitorInterval) {
    clearInterval(priceMonitorInterval);
  }
  
  priceMonitorInterval = setInterval(async () => {
    const scraper = new ProductScraper();
    if (scraper.isProductPage()) {
      const productData = await scraper.scrape();
      if (productData && productData.price) {
        const currentPrice = parseFloat(productData.price.replace(/[^0-9.]/g, ''));
        if (currentPrice !== lastRecordedPrice) {
          lastRecordedPrice = currentPrice;
          recordRealPrice(productData);
        }
      }
    }
  }, 15000); // Check every 15 seconds
}

// Start monitoring when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPriceMonitoring);
} else {
  startPriceMonitoring();
}

// Restart monitoring on URL changes
let currentUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    lastRecordedPrice = null;
    startPriceMonitoring();
  }
}, 1000);

console.log('[PriceTracker] Real price tracking system activated');
