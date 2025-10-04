/**
 * ShopScout Backend Server v1.0
 * Provides API proxy for SERP API and data storage
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow Chrome extension and localhost
    if (!origin || 
        origin.startsWith('chrome-extension://') || 
        origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// In-memory storage (replace with database in production)
const storage = {
  wishlist: new Map(),
  tracked: new Map(),
  priceHistory: new Map(),
};

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Search for product deals using SERP API
 */
app.get('/api/search', async (req, res) => {
  try {
    const { query, image } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log(`[Search] Query: ${query}`);

    // Check if SERP API key is configured
    if (!process.env.SERP_API_KEY || process.env.SERP_API_KEY === 'your_serpapi_key_here') {
      console.log('[Search] SERP API key not configured, returning mock data');
      return res.json(getMockSearchResults(query, image));
    }

    // Call SERP API
    const params = {
      api_key: process.env.SERP_API_KEY,
      engine: 'google_shopping',
      q: query,
      num: 10,
    };

    const response = await axios.get('https://serpapi.com/search.json', { params });

    // Transform SERP API results to our format
    const results = (response.data.shopping_results || []).slice(0, 5).map(item => ({
      title: item.title,
      price: parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0'),
      source: item.source || 'Unknown',
      url: item.link || '#',
      image: item.thumbnail,
      shipping: item.delivery || 'Shipping info not available',
      trustScore: calculateTrustScore(item),
    }));

    res.json({
      results,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Search] Error:', error.message);
    
    // Return mock data on error
    res.json(getMockSearchResults(req.query.query, req.query.image));
  }
});

/**
 * Get price history for a product
 */
app.get('/api/price-history/:productId', (req, res) => {
  try {
    const { productId } = req.params;

    // Check if we have stored price history
    if (storage.priceHistory.has(productId)) {
      return res.json(storage.priceHistory.get(productId));
    }

    // Generate mock price history
    const mockHistory = generateMockPriceHistory();
    storage.priceHistory.set(productId, mockHistory);

    res.json(mockHistory);
  } catch (error) {
    console.error('[Price History] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

/**
 * Save product to wishlist
 */
app.post('/api/wishlist', (req, res) => {
  try {
    const product = req.body;
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const wishlistItem = {
      id,
      ...product,
      savedAt: Date.now(),
    };

    storage.wishlist.set(id, wishlistItem);

    console.log(`[Wishlist] Saved product: ${product.title}`);

    res.json({
      success: true,
      id,
      item: wishlistItem,
    });
  } catch (error) {
    console.error('[Wishlist] Error:', error.message);
    res.status(500).json({ error: 'Failed to save to wishlist' });
  }
});

/**
 * Get user's wishlist
 */
app.get('/api/wishlist', (req, res) => {
  try {
    const wishlist = Array.from(storage.wishlist.values());
    res.json({ wishlist });
  } catch (error) {
    console.error('[Wishlist] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

/**
 * Track price for a product
 */
app.post('/api/track', (req, res) => {
  try {
    const { productId, targetPrice } = req.body;

    if (!productId || !targetPrice) {
      return res.status(400).json({ error: 'productId and targetPrice are required' });
    }

    const trackingId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const trackingItem = {
      id: trackingId,
      productId,
      targetPrice,
      createdAt: Date.now(),
      active: true,
    };

    storage.tracked.set(trackingId, trackingItem);

    console.log(`[Track] Tracking product ${productId} for price ${targetPrice}`);

    res.json({
      success: true,
      id: trackingId,
      item: trackingItem,
    });
  } catch (error) {
    console.error('[Track] Error:', error.message);
    res.status(500).json({ error: 'Failed to track price' });
  }
});

/**
 * Get tracked products
 */
app.get('/api/track', (req, res) => {
  try {
    const tracked = Array.from(storage.tracked.values()).filter(item => item.active);
    res.json({ tracked });
  } catch (error) {
    console.error('[Track] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch tracked products' });
  }
});

/**
 * Helper Functions
 */

function getMockSearchResults(query, image) {
  const basePrice = 50 + Math.random() * 100;
  
  const sources = ['Amazon', 'Walmart', 'eBay', 'Target', 'Best Buy'];
  
  const results = sources.map((source, index) => ({
    title: query,
    price: parseFloat((basePrice * (0.9 + Math.random() * 0.3)).toFixed(2)),
    source,
    url: '#',
    image: image || null,
    shipping: index % 2 === 0 ? 'Free shipping' : `$${(Math.random() * 10).toFixed(2)} shipping`,
    trustScore: 60 + Math.floor(Math.random() * 35),
  }));

  return {
    results: results.sort((a, b) => a.price - b.price),
    timestamp: Date.now(),
  };
}

function calculateTrustScore(item) {
  let score = 50;

  // Boost for known retailers
  const trustedSources = ['amazon', 'walmart', 'target', 'bestbuy'];
  if (trustedSources.some(s => item.source?.toLowerCase().includes(s))) {
    score += 30;
  }

  // Boost for ratings
  if (item.rating && item.rating >= 4.0) {
    score += 15;
  }

  // Boost for reviews
  if (item.reviews && item.reviews > 100) {
    score += 5;
  }

  return Math.min(100, score);
}

function generateMockPriceHistory() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const basePrice = 50 + Math.random() * 50;

  const prices = [];
  for (let i = 30; i >= 0; i--) {
    const variation = (Math.random() - 0.5) * 10;
    const trend = (30 - i) * 0.2; // Slight upward trend
    prices.push({
      date: now - i * day,
      price: parseFloat((basePrice + variation - trend).toFixed(2)),
    });
  }

  return { prices };
}

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🛍️  ShopScout Backend Server v1.0                  ║
║                                                       ║
║   Status: Running                                     ║
║   Port: ${PORT}                                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                       ║
║   API Endpoints:                                      ║
║   • GET  /health                                      ║
║   • GET  /api/search?query=...                        ║
║   • GET  /api/price-history/:productId                ║
║   • POST /api/wishlist                                ║
║   • GET  /api/wishlist                                ║
║   • POST /api/track                                   ║
║   • GET  /api/track                                   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  if (!process.env.SERP_API_KEY || process.env.SERP_API_KEY === 'your_serpapi_key_here') {
    console.log('⚠️  Warning: SERP API key not configured. Using mock data.');
    console.log('   Get your API key from https://serpapi.com/\n');
  }
});
