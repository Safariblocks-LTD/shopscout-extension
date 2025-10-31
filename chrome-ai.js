/**
 * Chrome Built-in AI Integration
 * Uses Chrome's Prompt API to find product deals
 */

const ChromeAI = {
  /**
   * Check if Chrome AI is available
   */
  async isAvailable() {
    try {
      if (!('LanguageModel' in self || 'LanguageModel' in window)) {
        console.log('[ChromeAI] Prompt API not available');
        return false;
      }
      
      const LanguageModel = self.LanguageModel || window.LanguageModel;
      const capabilities = await LanguageModel.capabilities();
      console.log('[ChromeAI] Capabilities:', capabilities);
      
      return capabilities.available === 'readily' || capabilities.available === 'after-download';
    } catch (error) {
      console.error('[ChromeAI] Error checking availability:', error);
      return false;
    }
  },

  /**
   * Create AI session
   */
  async createSession() {
    try {
      const LanguageModel = self.LanguageModel || window.LanguageModel;
      const session = await LanguageModel.create({
        temperature: 0.7,
        topK: 3,
      });
      console.log('[ChromeAI] Session created successfully');
      return session;
    } catch (error) {
      console.error('[ChromeAI] Error creating session:', error);
      return null;
    }
  },

  /**
   * Search for product deals using Chrome AI
   */
  async searchDeals(productTitle, currentPrice, productUrl) {
    console.log('[ChromeAI] 🤖 Starting AI-powered deal search...');
    console.log('[ChromeAI] Product:', productTitle);
    console.log('[ChromeAI] Current Price:', currentPrice);

    try {
      // Check if AI is available
      const available = await this.isAvailable();
      if (!available) {
        console.log('[ChromeAI] ⚠️ AI not available, will use fallback');
        return { success: false, reason: 'AI not available' };
      }

      // Create session
      const session = await this.createSession();
      if (!session) {
        console.log('[ChromeAI] ⚠️ Could not create AI session');
        return { success: false, reason: 'Session creation failed' };
      }

      // Craft prompt for finding deals
      const prompt = `You are a shopping assistant helping find the best deals for products online.

Product: ${productTitle}
Current Price: $${currentPrice}
Source: ${productUrl}

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

      console.log('[ChromeAI] Sending prompt to AI...');
      const startTime = Date.now();
      
      const response = await session.prompt(prompt);
      
      const duration = Date.now() - startTime;
      console.log('[ChromeAI] ✅ AI response received in', duration, 'ms');
      console.log('[ChromeAI] Raw response:', response.substring(0, 200) + '...');

      // Parse AI response
      const deals = this.parseAIResponse(response, currentPrice);
      
      // Destroy session to free resources
      session.destroy();

      if (deals && deals.length > 0) {
        console.log('[ChromeAI] ✅ Found', deals.length, 'deals via AI');
        return {
          success: true,
          deals: deals,
          source: 'chrome-ai',
          duration: duration
        };
      } else {
        console.log('[ChromeAI] ⚠️ AI found no better deals');
        return {
          success: false,
          reason: 'No better deals found',
          deals: []
        };
      }

    } catch (error) {
      console.error('[ChromeAI] ❌ Error searching deals:', error);
      return {
        success: false,
        reason: error.message,
        error: error
      };
    }
  },

  /**
   * Parse AI response and extract deals
   */
  parseAIResponse(response, currentPrice) {
    try {
      // Try to extract JSON from response
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON array in response
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const deals = JSON.parse(jsonStr);
      
      if (!Array.isArray(deals)) {
        console.warn('[ChromeAI] Response is not an array');
        return [];
      }

      // Validate and format deals
      const validDeals = deals
        .filter(deal => {
          // Must have required fields
          if (!deal.title || !deal.price || !deal.source) {
            return false;
          }
          
          // Price must be a number
          const price = parseFloat(deal.price);
          if (isNaN(price) || price <= 0) {
            return false;
          }
          
          // Must be cheaper than current price (or at least not more expensive)
          if (price > currentPrice * 1.1) { // Allow 10% margin
            return false;
          }
          
          return true;
        })
        .map(deal => ({
          title: deal.title,
          price: parseFloat(deal.price),
          currency: 'USD',
          source: deal.source,
          platform: deal.source.toLowerCase().replace(/\s+/g, ''),
          url: this.generateSearchUrl(deal.title, deal.source),
          image: null, // AI doesn't provide images
          shipping: 'Check store for details',
          rating: null,
          reviews: 0,
          trustScore: 85, // AI-suggested deals get good trust score
          inStock: true,
          scrapable: false,
          region: 'US',
          aiGenerated: true,
          reason: deal.reason || 'AI recommended deal',
          savings: deal.savings || (currentPrice - parseFloat(deal.price))
        }));

      console.log('[ChromeAI] Parsed', validDeals.length, 'valid deals from AI response');
      return validDeals;

    } catch (error) {
      console.error('[ChromeAI] Error parsing AI response:', error);
      console.error('[ChromeAI] Response was:', response);
      return [];
    }
  },

  /**
   * Generate search URL for a product on a specific store
   */
  generateSearchUrl(productTitle, storeName) {
    const encodedTitle = encodeURIComponent(productTitle);
    
    const storeUrls = {
      'Amazon': `https://www.amazon.com/s?k=${encodedTitle}`,
      'Walmart': `https://www.walmart.com/search?q=${encodedTitle}`,
      'eBay': `https://www.ebay.com/sch/i.html?_nkw=${encodedTitle}`,
      'Target': `https://www.target.com/s?searchTerm=${encodedTitle}`,
      'Best Buy': `https://www.bestbuy.com/site/searchpage.jsp?st=${encodedTitle}`,
    };

    return storeUrls[storeName] || `https://www.google.com/search?q=${encodedTitle}`;
  }
};

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChromeAI;
}
