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

// In-memory storage for caching
const storage = {
  priceHistory: new Map(),
  searchCache: new Map()
};

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow Chrome extension, localhost, and production domains
    if (!origin || 
        origin.startsWith('chrome-extension://') || 
        origin.startsWith('http://localhost') ||
        origin.startsWith('https://shopscout-auth.fly.dev') ||
        origin.startsWith('https://shopscout-api.fly.dev')) {
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test Serper.dev API endpoint
app.get('/api/test-serp', async (req, res) => {
  try {
    console.log('[Test] Testing Serper.dev API...');
    console.log('[Test] API Key:', process.env.SERP_API_KEY ? 'SET' : 'NOT SET');
    
    const requestBody = {
      q: 'usb cable',
      num: 5,
      gl: 'us',
      hl: 'en',
    };
    
    const response = await axios.post('https://google.serper.dev/shopping', requestBody, {
      headers: {
        'X-API-KEY': process.env.SERP_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('[Test] Serper.dev API Response Status:', response.status);
    console.log('[Test] Shopping Results Count:', response.data.shopping?.length || 0);
    
    res.json({
      success: true,
      status: response.status,
      resultsCount: response.data.shopping?.length || 0,
      hasError: !!response.data.error,
      error: response.data.error || null,
      sampleResult: response.data.shopping?.[0] || null
    });
  } catch (error) {
    console.error('[Test] Serper.dev API Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      response: error.response?.data || null
    });
  }
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
      console.error('[Search] ❌ SERP API key not configured!');
      return res.json({ 
        results: [],
        allResults: [],
        bestDeal: null,
        region: 'US',
        platforms: [],
        timestamp: Date.now(),
        message: 'Price comparison temporarily unavailable - SERP API key not configured'
      });
    }

    console.log('[Search] ✅ Using Serper.dev API with key:', process.env.SERP_API_KEY.substring(0, 10) + '...');

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
        
        // Generate hierarchical search queries
        const searchHierarchy = generateSearchHierarchy(query);
        console.log(`[Search] ${platform.name} - Search hierarchy (${searchHierarchy.length} levels):`, JSON.stringify(searchHierarchy));
        
        let allResults = [];
        let successfulQuery = null;
        
        // Try each query level until we get results
        for (let i = 0; i < searchHierarchy.length; i++) {
          const searchQuery = searchHierarchy[i];
          console.log(`[Search] ${platform.name} - Level ${i + 1}/${searchHierarchy.length}: Trying "${searchQuery}"`);
          
          const requestBody = {
            q: searchQuery,
            num: 10,
            gl: platform.country.toLowerCase(),
            hl: 'en',
          };

          try {
            console.log(`[Search] ${platform.name} - Making Serper.dev API request...`);
            const response = await axios.post('https://google.serper.dev/shopping', requestBody, {
              headers: {
                'X-API-KEY': process.env.SERP_API_KEY,
                'Content-Type': 'application/json'
              },
              timeout: 15000
            });
            
            console.log(`[Search] ${platform.name} - Serper.dev API response received, status: ${response.status}`);
            const resultCount = response.data.shopping?.length || 0;
            console.log(`[Search] ${platform.name} - Level ${i + 1} response: ${resultCount} results`);
            
            if (response.data.error) {
              console.error(`[Search] ${platform.name} - Serper.dev API Error:`, response.data.error);
            }
            
            if (response.data.shopping && response.data.shopping.length > 0) {
              allResults = response.data.shopping;
              successfulQuery = searchQuery;
              console.log(`[Search] ${platform.name} - ✅ Found ${resultCount} results with query: "${searchQuery}"`);
              break; // Stop at first successful query
            } else {
              console.log(`[Search] ${platform.name} - No results at level ${i + 1}, trying next level...`);
            }
          } catch (levelError) {
            console.error(`[Search] ${platform.name} - Level ${i + 1} failed:`, levelError.message);
            if (levelError.response) {
              console.error(`[Search] ${platform.name} - Error response:`, levelError.response.status, levelError.response.data);
            }
            // Continue to next level
          }
        }
        
        if (allResults.length === 0) {
          console.log(`[Search] ⚠️  No results found after trying all ${searchHierarchy.length} query levels`);
          return [];
        }
        
        console.log(`[Search] Using results from query: "${successfulQuery}"`);
        console.log(`[Search] Processing ${allResults.length} shopping results`);
        
        const platformResults = allResults;
        
        const results = platformResults
          .map(item => {
            // Extract price from Serper.dev format
            const priceStr = item.price?.replace(/[^0-9.]/g, '') || '0';
            const price = parseFloat(priceStr);
            
            // Skip only if completely invalid
            if (!item.title || !item.link || price <= 0) {
              return null;
            }
            
            // Detect source from URL
            let detectedSource = platform.name;
            const url = item.link.toLowerCase();
            if (url.includes('amazon')) detectedSource = 'Amazon';
            else if (url.includes('walmart')) detectedSource = 'Walmart';
            else if (url.includes('ebay')) detectedSource = 'eBay';
            else if (url.includes('target')) detectedSource = 'Target';
            else if (url.includes('bestbuy')) detectedSource = 'Best Buy';
            
            return {
              title: item.title,
              price: price,
              currency: getCurrencyForRegion(userRegion),
              source: detectedSource,
              platform: platformKey,
              url: item.link,
              image: item.imageUrl || item.thumbnail,
              shipping: item.delivery || 'Shipping info not available',
              rating: item.rating || null,
              reviews: item.reviews || item.ratingCount || 0,
              trustScore: calculateTrustScore(item, platform),
              inStock: true,
              scrapable: platform.scrapable,
              region: platform.region,
            };
          })
          .filter(item => item !== null); // Remove invalid items

        console.log(`[Search] ✅ Found ${results.length} valid results on ${platform.name}`);
        return results;
      } catch (error) {
        console.error(`[Search] ❌ Error searching ${platform.name}:`, error.message);
        if (error.response) {
          console.error(`[Search] SERP API Error Response:`, JSON.stringify(error.response.data));
          console.error(`[Search] Status:`, error.response.status);
        } else {
          console.error(`[Search] Error stack:`, error.stack);
        }
        // Return empty array - NO MOCK DATA for production
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
      success: true, // CRITICAL: Extension expects this field
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

    console.log(`[Search] ✅ Found ${results.length} valid results on ${platform.name}`);
    return results;
  } catch (error) {
    console.error(`[Search] ❌ Error searching ${platform.name}:`, error.message);
    if (error.response) {
      console.error(`[Search] SERP API Error Response:`, JSON.stringify(error.response.data));
      console.error(`[Search] Status:`, error.response.status);
    } else {
      console.error(`[Search] Error stack:`, error.stack);
    }
    // Return empty array - NO MOCK DATA for production
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
  success: true, // CRITICAL: Extension expects this field
  results: topDeals, // Return top 2-5 best deals
  allResults: combinedResults.slice(0, 20), // All results for reference
  bestDeal,
  region: userRegion,
  platforms: requestedPlatforms.map(key => SUPPORTED_PLATFORMS[key]).filter(Boolean),
  timestamp: Date.now(),
  totalResults: combinedResults.length,
  topDealsCount: topDeals.length,
});

/**
 * Get price history for a product - REAL DATA ONLY
 */
app.get('/api/price-history/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 30 } = req.query;
    
    // Get real price history from database - NO MOCK DATA
    const history = await PriceHistory.findAll({
      where: { productId },
      order: [['recordedAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    if (!history || history.length === 0) {
      return res.json({ prices: [] });
    }
    
    res.json({
      prices: history.map(h => ({
        date: h.recordedAt.getTime(),
        price: parseFloat(h.price),
        source: h.source
      }))
    });
  } catch (error) {
    console.error('Error getting price history:', error.message);
    res.status(500).json({ error: 'Failed to get price history' });
  }
});

/**
 * Record real-time price data for a product
 * This endpoint captures actual prices when products are viewed/scraped
 */
app.post('/api/price-track/record', async (req, res) => {
  try {
    const { productId, price, source, productUrl, productName } = req.body;
    
    if (!productId || !price || !source) {
      return res.status(400).json({ 
        error: 'Missing required fields: productId, price, source' 
      });
    }

    const priceTracker = require('./price-tracker');
    const record = await priceTracker.recordPrice(
      productId, 
      parseFloat(price), 
      source, 
      productUrl, 
      productName
    );

    res.json({ 
      success: true, 
      record: {
        id: record.id,
        productId: record.productId,
        price: parseFloat(record.price),
        source: record.source,
        recordedAt: record.recordedAt
      }
    });
  } catch (error) {
    console.error('[Price Tracker] Error recording price:', error.message);
    res.status(500).json({ 
      error: 'Failed to record price', 
      message: error.message 
    });
  }
});

/**
 * Get detailed price statistics for a product
 */
app.get('/api/price-stats/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const priceTracker = require('./price-tracker');
    
    const stats = await priceTracker.getPriceStats(productId);
    
    if (!stats) {
      return res.json({ 
        message: 'No price data found for this product',
        prices: [] 
      });
    }

    res.json(stats);
  } catch (error) {
    console.error('[Price Tracker] Error getting price stats:', error.message);
    res.status(500).json({ 
      error: 'Failed to get price stats', 
      message: error.message 
    });
  }
});

/**
 * Get products with recent price drops
 */
app.get('/api/price-drops', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const priceTracker = require('./price-tracker');
    
    const priceDrops = await priceTracker.getPriceDrops(parseInt(days));
    res.json({ priceDrops });
  } catch (error) {
    console.error('[Price Tracker] Error getting price drops:', error.message);
    res.status(500).json({ 
      error: 'Failed to get price drops', 
      message: error.message 
    });
  }
});

/**
 * Track multiple products at once
 */
app.post('/api/price-track/bulk', async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        error: 'Products array is required' 
      });
    }

    const priceTracker = require('./price-tracker');
    const results = await priceTracker.trackProducts(products);
    
    res.json({ 
      success: true, 
      results,
      tracked: results.filter(r => !r.error).length,
      errors: results.filter(r => r.error).length
    });
  } catch (error) {
    console.error('[Price Tracker] Error tracking products:', error.message);
    res.status(500).json({ 
      error: 'Failed to track products', 
      message: error.message 
    });
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
/**
 * Generate hierarchical search queries with progressive relaxation
 * Example: "ASUS ROG Gaming Laptop 15.6 inch" → 
 *   1. "ASUS ROG Gaming Laptop 15.6 inch"
 *   2. "ASUS Gaming Laptop"
 *   3. "Gaming Laptop"
 *   4. "Laptop"
 */
function generateSearchHierarchy(query) {
  const queries = [];
  
  // Clean and normalize query
  const normalized = query
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // Remove special chars except hyphens
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = normalized.split(' ');
  
  // Identify key components
  const brands = ['apple', 'samsung', 'sony', 'lg', 'dell', 'hp', 'lenovo', 'asus', 'acer', 
                  'microsoft', 'google', 'amazon', 'anker', 'logitech', 'razer', 'corsair',
                  'nvidia', 'amd', 'intel', 'canon', 'nikon', 'gopro', 'bose', 'jbl'];
  
  const categories = ['laptop', 'phone', 'tablet', 'monitor', 'keyboard', 'mouse', 'headphones',
                     'speaker', 'camera', 'watch', 'charger', 'cable', 'adapter', 'case',
                     'screen', 'drive', 'router', 'printer', 'tv', 'console'];
  
  const modifiers = ['gaming', 'wireless', 'bluetooth', 'usb', 'portable', 'pro', 'plus',
                    'mini', 'max', 'ultra', 'premium', 'professional'];
  
  // Level 1: Full query (refined)
  queries.push(refineSearchQuery(query));
  
  // Level 2: Brand + Category + Primary Modifier
  const brand = words.find(w => brands.includes(w));
  const category = words.find(w => categories.includes(w));
  const modifier = words.find(w => modifiers.includes(w));
  
  if (brand && category) {
    if (modifier) {
      queries.push(`${brand} ${modifier} ${category}`);
    }
    queries.push(`${brand} ${category}`);
  }
  
  // Level 3: Category + Primary Modifier
  if (category && modifier) {
    queries.push(`${modifier} ${category}`);
  }
  
  // Level 4: Category only
  if (category) {
    queries.push(category);
  }
  
  // Remove duplicates while preserving order
  return [...new Set(queries)];
}

/**
 * Refine search query to extract key product identifiers
 * Removes filler words and focuses on brand, model, key features
 */
function refineSearchQuery(query) {
  // Remove common filler words
  const fillerWords = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'with', 'from', 'by', 'about', 'as', 'into', 'like', 'through',
    'after', 'over', 'between', 'out', 'against', 'during', 'without',
    'before', 'under', 'around', 'among', 'of', 'is', 'are', 'was', 'were'
  ];
  
  // Split into words
  let words = query.toLowerCase().split(/\s+/);
  
  // Remove filler words but keep important ones
  words = words.filter(word => {
    // Keep if not a filler word
    if (!fillerWords.includes(word)) return true;
    return false;
  });
  
  // Extract key identifiers
  const refined = words.join(' ');
  
  // If query is too short after refinement, use original
  if (refined.length < 10) {
    return query;
  }
  
  return refined;
}

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

/**
 * Generate mock results for a platform (fallback when SERP API fails)
 */
function generateMockResultsForPlatform(query, platform, platformKey, region) {
  const basePrice = 30 + Math.random() * 70; // $30-$100
  const numResults = 2 + Math.floor(Math.random() * 3); // 2-4 results
  
  return Array.from({ length: numResults }, (_, i) => ({
    title: `${query} - ${platform.name} Deal ${i + 1}`,
    price: parseFloat((basePrice + (Math.random() * 20 - 10)).toFixed(2)),
    currency: getCurrencyForRegion(region),
    source: platform.name,
    platform: platformKey,
    url: `https://${platform.domain}/search?q=${encodeURIComponent(query)}`,
    image: null,
    shipping: i === 0 ? 'Free shipping' : `$${(Math.random() * 10).toFixed(2)} shipping`,
    rating: 3.5 + Math.random() * 1.5,
    reviews: Math.floor(Math.random() * 1000) + 100,
    trustScore: 70 + Math.floor(Math.random() * 25),
    inStock: Math.random() > 0.1,
    scrapable: platform.scrapable,
    region: platform.region,
    qualityScore: 0,
    isMockData: true
  }));
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

/**
 * Record real-time price data for a product
 * This endpoint captures actual prices when products are viewed/scraped
 */
app.post('/api/price-track/record', async (req, res) => {
  try {
    const { productId, price, source, productUrl, productName } = req.body;
    
    if (!productId || !price || !source) {
      return res.status(400).json({ 
        error: 'Missing required fields: productId, price, source' 
      });
    }

    const { recordPrice } = await import('./price-tracker.js');
    const record = await recordPrice(productId, parseFloat(price), source, productUrl, productName);

    res.json({ 
      success: true, 
      record: {
        id: record.id,
        productId: record.productId,
        price: parseFloat(record.price),
        source: record.source,
        recordedAt: record.recordedAt
      }
    });
  } catch (error) {
    console.error('[Price Tracker] Error:', error.message);
    res.status(500).json({ error: 'Failed to record price', message: error.message });
  }
});

/**
 * Get detailed price statistics for a product
 */
app.get('/api/price-stats/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { getPriceStats } = await import('./price-tracker.js');
    
    const stats = await getPriceStats(productId);
    
    if (!stats) {
      return res.json({ prices: [] });
    }

    res.json(stats);
  } catch (error) {
    console.error('[Price Tracker] Error:', error.message);
    res.status(500).json({ error: 'Failed to get price stats', message: error.message });
  }
});

/**
 * Get products with recent price drops
 */
app.get('/api/price-drops', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const { getPriceDrops } = await import('./price-tracker.js');
    
    const priceDrops = await getPriceDrops(parseInt(days));
    res.json({ priceDrops });
  } catch (error) {
    console.error('[Price Tracker] Error:', error.message);
    res.status(500).json({ error: 'Failed to get price drops', message: error.message });
  }
});

/**
 * Get price history for a product - FIXED to use real data
 */
app.get('/api/price-history/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('[Price History] Request for product:', productId);

    // Always use real data from database
    const { getPriceHistory } = await import('./price-tracker.js');
    const history = await getPriceHistory(productId, 30);
    
    res.json({ prices: history });
  } catch (error) {
    console.error('[Price History] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch price history', message: error.message });
  }
});
