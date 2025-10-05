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
 * Supported platforms for price comparison
 * Includes both scrapable platforms and SERP API search platforms
 */
const SUPPORTED_PLATFORMS = {
  // US Platforms (Scrapable)
  amazon: { name: 'Amazon', country: 'US', domain: 'amazon.com', scrapable: true, region: 'US' },
  walmart: { name: 'Walmart', country: 'US', domain: 'walmart.com', scrapable: true, region: 'US' },
  ebay: { name: 'eBay', country: 'US', domain: 'ebay.com', scrapable: true, region: 'US' },
  target: { name: 'Target', country: 'US', domain: 'target.com', scrapable: true, region: 'US' },
  bestbuy: { name: 'Best Buy', country: 'US', domain: 'bestbuy.com', scrapable: true, region: 'US' },
  
  // UK Platforms (Scrapable)
  amazon_uk: { name: 'Amazon UK', country: 'GB', domain: 'amazon.co.uk', scrapable: true, region: 'UK' },
  ebay_uk: { name: 'eBay UK', country: 'GB', domain: 'ebay.co.uk', scrapable: true, region: 'UK' },
  argos: { name: 'Argos', country: 'GB', domain: 'argos.co.uk', scrapable: true, region: 'UK' },
  
  // Kenya Platforms (Scrapable)
  jumia_ke: { name: 'Jumia Kenya', country: 'KE', domain: 'jumia.co.ke', scrapable: true, region: 'KE' },
  jiji_ke: { name: 'Jiji Kenya', country: 'KE', domain: 'jiji.co.ke', scrapable: true, region: 'KE' },
  
  // Nigeria Platforms (Scrapable)
  jumia_ng: { name: 'Jumia Nigeria', country: 'NG', domain: 'jumia.com.ng', scrapable: true, region: 'NG' },
  jiji_ng: { name: 'Jiji Nigeria', country: 'NG', domain: 'jiji.ng', scrapable: true, region: 'NG' },
  
  // Additional platforms for SERP API (not scrapable but searchable)
  temu: { name: 'Temu', country: 'US', domain: 'temu.com', scrapable: false, region: 'US' },
  aliexpress: { name: 'AliExpress', country: 'US', domain: 'aliexpress.com', scrapable: false, region: 'US' },
  etsy: { name: 'Etsy', country: 'US', domain: 'etsy.com', scrapable: false, region: 'US' },
  newegg: { name: 'Newegg', country: 'US', domain: 'newegg.com', scrapable: false, region: 'US' },
  currys: { name: 'Currys', country: 'GB', domain: 'currys.co.uk', scrapable: false, region: 'UK' },
  johnlewis: { name: 'John Lewis', country: 'GB', domain: 'johnlewis.com', scrapable: false, region: 'UK' },
};

/**
 * Detect region from URL
 */
function detectRegion(url) {
  if (!url) return 'US'; // Default to US
  
  const urlLower = url.toLowerCase();
  
  // UK domains
  if (urlLower.includes('.co.uk') || urlLower.includes('uk.')) return 'UK';
  
  // Kenya domains
  if (urlLower.includes('.co.ke') || urlLower.includes('kenya')) return 'KE';
  
  // Nigeria domains
  if (urlLower.includes('.ng') || urlLower.includes('nigeria')) return 'NG';
  
  // Default to US
  return 'US';
}

/**
 * Search for product deals using SERP API with region-based smart comparison
 */
app.get('/api/search', async (req, res) => {
  try {
    const { query, image, platforms, sourceUrl, region: requestedRegion } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log(`[Search] Query: "${query}"`);

    // Detect region from source URL or use requested region
    const userRegion = requestedRegion || detectRegion(sourceUrl);
    console.log(`[Search] User region: ${userRegion}`);

    // Check if SERP API key is configured
    if (!process.env.SERP_API_KEY || process.env.SERP_API_KEY === 'your_serpapi_key_here') {
      console.log('[Search] ⚠️  SERP API key not configured, returning mock data');
      return res.json(getMockSearchResults(query, image));
    }

    console.log('[Search] ✅ Using SERP API with key:', process.env.SERP_API_KEY.substring(0, 10) + '...');

    // Get platforms for the user's region
    const regionPlatforms = Object.entries(SUPPORTED_PLATFORMS)
      .filter(([key, platform]) => platform.region === userRegion)
      .map(([key]) => key);

    // Use specified platforms or all platforms in user's region
    const requestedPlatforms = platforms ? platforms.split(',') : regionPlatforms;
    
    console.log(`[Search] Searching ${requestedPlatforms.length} platforms in ${userRegion} region`);
    
    // Search across platforms in parallel
    const searchPromises = requestedPlatforms.map(async (platformKey) => {
      const platform = SUPPORTED_PLATFORMS[platformKey];
      if (!platform) return null;

      try {
        console.log(`[Search] Searching on ${platform.name}...`);
        
        const params = {
          api_key: process.env.SERP_API_KEY,
          engine: 'google_shopping',
          q: `${query} site:${platform.domain}`,
          num: 5,
          gl: platform.country.toLowerCase(),
        };

        const response = await axios.get('https://serpapi.com/search.json', { params });
        
        const results = (response.data.shopping_results || []).map(item => ({
          title: item.title,
          price: parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0'),
          currency: item.extracted_price?.currency || getCurrencyForRegion(userRegion),
          source: platform.name,
          platform: platformKey,
          url: item.link || '#',
          image: item.thumbnail,
          shipping: item.delivery || 'Shipping info not available',
          rating: item.rating || null,
          reviews: item.reviews || 0,
          trustScore: calculateTrustScore(item, platform),
          inStock: item.tag !== 'Out of stock',
          scrapable: platform.scrapable,
          region: platform.region,
        }));

        console.log(`[Search] Found ${results.length} results on ${platform.name}`);
        return results;
      } catch (error) {
        console.error(`[Search] Error searching ${platform.name}:`, error.message);
        return [];
      }
    });

    // Wait for all searches to complete
    const allResults = await Promise.all(searchPromises);
    
    // Flatten and filter results
    let combinedResults = allResults
      .filter(r => r !== null)
      .flat()
      .filter(r => r.price > 0); // Remove items without prices

    console.log(`[Search] ✅ Found ${combinedResults.length} total results`);

    // Calculate quality score for each result
    combinedResults = combinedResults.map(result => ({
      ...result,
      qualityScore: calculateQualityScore(result),
    }));

    // Sort by quality score (best deals first)
    combinedResults.sort((a, b) => b.qualityScore - a.qualityScore);

    // Get top 2-5 best deals
    const topDeals = combinedResults.slice(0, Math.min(5, Math.max(2, combinedResults.length)));
    
    console.log(`[Search] ✅ Top ${topDeals.length} deals selected from ${combinedResults.length} results`);

    // Find absolute best deal
    const bestDeal = topDeals.length > 0 ? topDeals[0] : null;

    res.json({
      results: topDeals, // Return top 2-5 best deals
      allResults: combinedResults.slice(0, 20), // All results for reference
      bestDeal,
      region: userRegion,
      platforms: requestedPlatforms.map(key => SUPPORTED_PLATFORMS[key]).filter(Boolean),
      timestamp: Date.now(),
      totalResults: combinedResults.length,
      topDealsCount: topDeals.length,
    });
  } catch (error) {
    console.error('[Search] ❌ Error:', error.message);
    console.error('[Search] Stack:', error.stack);
    
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

/**
 * Get currency for region
 */
function getCurrencyForRegion(region) {
  const currencies = {
    US: 'USD',
    UK: 'GBP',
    KE: 'KES',
    NG: 'NGN',
  };
  return currencies[region] || 'USD';
}

/**
 * Calculate quality score (combines price, trust, rating, reviews)
 * Higher score = better deal
 */
function calculateQualityScore(result) {
  let score = 0;

  // Trust score component (0-40 points)
  score += (result.trustScore / 100) * 40;

  // Rating component (0-25 points)
  if (result.rating) {
    score += (result.rating / 5) * 25;
  }

  // Reviews component (0-15 points)
  if (result.reviews) {
    const reviewScore = Math.min(result.reviews / 1000, 1) * 15;
    score += reviewScore;
  }

  // Stock availability (0-10 points)
  if (result.inStock) {
    score += 10;
  }

  // Shipping bonus (0-10 points)
  if (result.shipping && result.shipping.toLowerCase().includes('free')) {
    score += 10;
  }

  // Price is handled by sorting separately
  // Lower price = better, but we want high quality too
  
  return Math.round(score);
}

function calculateTrustScore(item, platform) {
  let score = 50;

  // Platform-based trust scores
  const platformTrustScores = {
    // US Platforms (highly trusted)
    amazon: 35,
    walmart: 35,
    target: 30,
    bestbuy: 30,
    ebay: 25,
    temu: 20,
    aliexpress: 20,
    etsy: 25,
    newegg: 28,
    
    // UK Platforms
    amazon_uk: 35,
    ebay_uk: 25,
    argos: 30,
    currys: 28,
    johnlewis: 32,
    
    // Kenya Platforms
    jumia_ke: 25,
    jiji_ke: 20,
    
    // Nigeria Platforms
    jumia_ng: 25,
    jiji_ng: 20,
  };

  // Add platform trust score
  if (platform && platformTrustScores[platform.name?.toLowerCase().replace(/\s+/g, '_')]) {
    score += platformTrustScores[platform.name.toLowerCase().replace(/\s+/g, '_')];
  } else if (platform) {
    // Use a lookup by checking if platform name contains key
    for (const [key, value] of Object.entries(platformTrustScores)) {
      if (platform.name?.toLowerCase().includes(key.split('_')[0])) {
        score += value;
        break;
      }
    }
  }

  // Boost for ratings
  if (item.rating) {
    if (item.rating >= 4.5) score += 15;
    else if (item.rating >= 4.0) score += 10;
    else if (item.rating >= 3.5) score += 5;
  }

  // Boost for reviews
  if (item.reviews) {
    if (item.reviews > 500) score += 10;
    else if (item.reviews > 100) score += 7;
    else if (item.reviews > 50) score += 5;
  }

  // Penalty for out of stock
  if (item.tag === 'Out of stock') {
    score -= 20;
  }

  return Math.min(100, Math.max(0, score));
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
