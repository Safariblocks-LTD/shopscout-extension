/**
 * ShopScout Backend Server v1.0
 * Provides API proxy for SERP API and data storage
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { Op } from 'sequelize';
import {
  initializeDatabase,
  User,
  Wishlist,
  PriceTracking,
  PriceHistory,
  SearchHistory,
  userOperations
} from './database.js';

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

// Middleware to extract and validate user ID
function getUserId(req) {
  const userId = req.headers['x-user-id'];
  if (!userId || userId === 'anonymous') {
    return null;
  }
  return userId;
}

// Middleware to require authentication
function requireAuth(req, res, next) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.userId = userId;
  next();
}

/**
 * Homepage
 */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ShopScout Backend Server</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #6366F1; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .method { color: #10B981; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>🛍️ ShopScout Backend Server</h1>
      <p><strong>Status:</strong> Running ✅</p>
      <p><strong>Port:</strong> ${PORT}</p>
      <p><strong>Version:</strong> 2.0</p>
      
      <h2>Available Endpoints:</h2>
      <div class="endpoint"><span class="method">GET</span> /health - Health check</div>
      <div class="endpoint"><span class="method">POST</span> /api/user/sync - Sync user from Firebase</div>
      <div class="endpoint"><span class="method">GET</span> /api/search?query=... - Search products</div>
      <div class="endpoint"><span class="method">GET</span> /api/price-history/:productId - Get price history</div>
      <div class="endpoint"><span class="method">POST</span> /api/wishlist - Add to wishlist</div>
      <div class="endpoint"><span class="method">GET</span> /api/wishlist - Get wishlist</div>
      <div class="endpoint"><span class="method">DELETE</span> /api/wishlist/:id - Remove from wishlist</div>
      <div class="endpoint"><span class="method">POST</span> /api/track - Track price</div>
      <div class="endpoint"><span class="method">GET</span> /api/track - Get tracked items</div>
      <div class="endpoint"><span class="method">DELETE</span> /api/track/:id - Stop tracking</div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString()
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
 * Sync user from Firebase authentication
 */
app.post('/api/user/sync', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL, emailVerified } = req.body;
    
    if (!uid || !email) {
      return res.status(400).json({ error: 'uid and email are required' });
    }

    // Try to find user by ID or email
    let user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { id: uid },
          { email: email }
        ]
      } 
    });
    
    if (user) {
      // Update existing user
      await user.update({
        id: uid, // Update ID in case found by email
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || null,
        emailVerified: emailVerified || false,
        lastLoginAt: new Date(),
        authMethod: 'google'
      });
      console.log(`[User] ✅ Updated existing user: ${email}`);
    } else {
      // Create new user
      user = await User.create({
        id: uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || null,
        emailVerified: emailVerified || false,
        authMethod: 'google',
        lastLoginAt: new Date()
      });
      console.log(`[User] ✅ Created new user: ${email}`);
    }
    
    res.json({
      success: true,
      userId: user.id,
      displayName: user.displayName,
      email: user.email
    });
  } catch (error) {
    console.error('[User] ❌ Sync error:', error.message);
    
    // Handle duplicate key error gracefully
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('[User] User already exists, attempting to update...');
      try {
        const user = await User.findOne({ where: { email } });
        if (user) {
          await user.update({
            id: uid,
            displayName: displayName || email.split('@')[0],
            photoURL: photoURL || null,
            emailVerified: emailVerified || false,
            lastLoginAt: new Date()
          });
          return res.json({
            success: true,
            userId: user.id,
            displayName: user.displayName,
            email: user.email
          });
        }
      } catch (updateError) {
        console.error('[User] Update failed:', updateError.message);
      }
    }
    
    res.status(500).json({ error: 'Failed to sync user', details: error.message });
  }
});

/**
 * Create simple user (nickname + email only) - Legacy endpoint
 */
app.post('/api/user/create', async (req, res) => {
  try {
    const { nickname, email } = req.body;
    
    if (!nickname || !email) {
      return res.status(400).json({ error: 'nickname and email are required' });
    }

    // Generate a simple user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user in database
    const user = await User.create({
      id: userId,
      email,
      displayName: nickname,
      emailVerified: false,
      authMethod: 'simple'
    });
    
    console.log(`[User] Created user: ${nickname} (${email})`);
    
    res.json({
      success: true,
      userId: user.id,
      nickname: user.displayName,
      email: user.email
    });
  } catch (error) {
    console.error('[User] Create error:', error.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * Save product to wishlist
 */
app.post('/api/wishlist', requireAuth, async (req, res) => {
  try {
    const { title, price, url, image, source, productId } = req.body;

    const wishlistItem = await Wishlist.create({
      userId: req.userId,
      productId,
      title,
      price,
      url,
      image,
      source
    });

    console.log(`[Wishlist] User ${req.userId} saved: ${title}`);

    res.json({
      success: true,
      id: wishlistItem.id,
      item: wishlistItem
    });
  } catch (error) {
    console.error('[Wishlist] Error:', error.message);
    res.status(500).json({ error: 'Failed to save to wishlist' });
  }
});

/**
 * Get user's wishlist
 */
app.get('/api/wishlist', requireAuth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findAll({
      where: { userId: req.userId },
      order: [['savedAt', 'DESC']]
    });
    
    res.json({ wishlist });
  } catch (error) {
    console.error('[Wishlist] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

/**
 * Delete item from wishlist
 */
app.delete('/api/wishlist/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Wishlist.destroy({
      where: {
        id,
        userId: req.userId // Ensure user can only delete their own items
      }
    });
    
    if (deleted) {
      console.log(`[Wishlist] User ${req.userId} removed item ${id}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('[Wishlist] Error:', error.message);
    res.status(500).json({ error: 'Failed to delete from wishlist' });
  }
});

/**
 * Track price for a product
 */
app.post('/api/track', requireAuth, async (req, res) => {
  try {
    const { productId, targetPrice, productTitle, productUrl, currentPrice } = req.body;

    if (!productId || !targetPrice) {
      return res.status(400).json({ error: 'productId and targetPrice are required' });
    }

    const trackingItem = await PriceTracking.create({
      userId: req.userId,
      productId,
      productTitle,
      productUrl,
      currentPrice: currentPrice || targetPrice,
      targetPrice,
      active: true
    });

    console.log(`[Track] User ${req.userId} tracking ${productId} for $${targetPrice}`);

    res.json({
      success: true,
      id: trackingItem.id,
      item: trackingItem
    });
  } catch (error) {
    console.error('[Track] Error:', error.message);
    res.status(500).json({ error: 'Failed to track price' });
  }
});

/**
 * Get tracked products
 */
app.get('/api/track', requireAuth, async (req, res) => {
  try {
    const tracked = await PriceTracking.findAll({
      where: {
        userId: req.userId,
        active: true
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ tracked });
  } catch (error) {
    console.error('[Track] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch tracked products' });
  }
});

/**
 * Delete tracked product
 */
app.delete('/api/track/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await PriceTracking.destroy({
      where: {
        id,
        userId: req.userId
      }
    });
    
    if (deleted) {
      console.log(`[Track] User ${req.userId} removed tracking ${id}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Tracking not found' });
    }
  } catch (error) {
    console.error('[Track] Error:', error.message);
    res.status(500).json({ error: 'Failed to delete tracking' });
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

// Initialize database and start server
async function startServer() {
  // Initialize MySQL database
  const dbConnected = await initializeDatabase();
  
  if (!dbConnected) {
    console.log('\n⚠️  Server starting without database connection');
    console.log('   Install MySQL and configure .env file\n');
  }

  // Start Express server
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🛍️  ShopScout Backend Server v2.0                  ║
║                                                       ║
║   Status: Running                                     ║
║   Port: ${PORT}                                        ║
║   Database: ${dbConnected ? 'MySQL ✅' : 'Disconnected ❌'}                              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                       ║
║   API Endpoints:                                      ║
║   • GET  /health                                      ║
║   • POST /api/user/sync                               ║
║   • GET  /api/search?query=...                        ║
║   • GET  /api/price-history/:productId                ║
║   • POST /api/wishlist                                ║
║   • GET  /api/wishlist                                ║
║   • DELETE /api/wishlist/:id                          ║
║   • POST /api/track                                   ║
║   • GET  /api/track                                   ║
║   • DELETE /api/track/:id                             ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);

    if (!process.env.SERP_API_KEY || process.env.SERP_API_KEY === 'your_serpapi_key_here') {
      console.log('⚠️  Warning: SERP API key not configured. Using mock data.');
      console.log('   Get your API key from https://serpapi.com/\n');
    }
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
