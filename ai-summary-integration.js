/**
 * ShopScout AI Summary Integration
 * Connects product detection with Chrome built-in AI summarization
 */

// Import AI utilities (loaded via manifest)
// Assumes ai-utils.js and ai-summary-renderer.js are loaded first

/**
 * Extract product text for summarization
 * @param {Object} productData - Scraped product data
 * @returns {string} Combined text for summarization
 */
function extractProductText(productData) {
  const parts = [];
  
  // Title
  if (productData.title) {
    parts.push(`Product: ${productData.title}`);
  }
  
  // Price
  if (productData.price) {
    parts.push(`Price: ${productData.price}`);
  }
  
  // Rating and reviews
  if (productData.rating) {
    parts.push(`Rating: ${productData.rating}`);
  }
  if (productData.reviews) {
    parts.push(`Reviews: ${productData.reviews}`);
  }
  
  // Seller
  if (productData.seller) {
    parts.push(`Seller: ${productData.seller}`);
  }
  
  // Description (extract from page if available)
  const descriptionSelectors = [
    '#feature-bullets',
    '.product-description',
    '[id*="description"]',
    '[class*="description"]',
    '#productDescription',
    '.a-section.a-spacing-medium'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.innerText?.trim();
      if (text && text.length > 50) {
        parts.push(`Description: ${text.substring(0, 1000)}`);
        break;
      }
    }
  }
  
  // Reviews text (top reviews if available)
  const reviewSelectors = [
    '[data-hook="review-body"]',
    '.review-text',
    '.review-content'
  ];
  
  for (const selector of reviewSelectors) {
    const reviews = Array.from(document.querySelectorAll(selector))
      .slice(0, 5) // Top 5 reviews
      .map(el => el.innerText?.trim())
      .filter(text => text && text.length > 20)
      .join(' ');
    
    if (reviews) {
      parts.push(`Customer feedback: ${reviews.substring(0, 1500)}`);
      break;
    }
  }
  
  return parts.join('\n\n');
}

/**
 * Main function to generate and display AI summary
 * @param {Object} productData - Scraped product data
 * @param {Object} options - Configuration options
 */
async function generateAndDisplaySummary(productData, options = {}) {
  const startTime = performance.now();
  
  console.log('[ShopScout AI Integration] Starting summary generation...');
  
  try {
    // Initialize AI capabilities
    const capabilities = await detectAICapabilities();
    console.log('[ShopScout AI Integration] AI capabilities:', capabilities);
    
    // Detect user language
    const userLang = await detectUserLanguage();
    console.log('[ShopScout AI Integration] User language:', userLang);
    
    // Generate cache key
    const cacheKey = generateCacheKey(
      window.location.href,
      productData.asin || productData.itemId || productData.title,
      userLang
    );
    
    // Check cache first
    const cachedSummary = await getCachedSummary(cacheKey);
    if (cachedSummary) {
      console.log('[ShopScout AI Integration] Using cached summary');
      renderSummaryIntoDOM(cachedSummary, {
        metadata: {
          apiUsed: 'cache',
          timeToFirstRender: performance.now() - startTime,
          languageDetected: userLang
        }
      });
      
      // Notify UI about cached summary
      try {
        chrome.runtime.sendMessage({
          type: 'AI_SUMMARY_GENERATED',
          data: {
            apiUsed: 'cache',
            timeToFirstRender: performance.now() - startTime,
            languageDetected: userLang,
            cached: true,
            productSite: productData.site
          }
        });
      } catch (err) {
        console.warn('[ShopScout AI Integration] Failed to notify UI:', err);
      }
      
      return;
    }
    
    // Show skeleton loader
    const skeleton = showSkeleton();
    
    // Extract product text
    const productText = extractProductText(productData);
    console.log('[ShopScout AI Integration] Product text length:', productText.length);
    
    if (!productText || productText.length < 50) {
      console.warn('[ShopScout AI Integration] Insufficient product text');
      showSummaryError('Not enough product information to generate summary');
      return;
    }
    
    // Set up progress callback
    const onProgress = (progress) => {
      if (skeleton) {
        updateSkeletonProgress(skeleton, progress);
      }
    };
    
    // Set up streaming callback
    let streamingStarted = false;
    const onStreamingChunk = (chunk) => {
      if (!streamingStarted) {
        // Replace skeleton on first chunk
        replaceSkeleton(chunk, {
          apiUsed: 'prompt-streaming',
          timeToFirstRender: performance.now() - startTime,
          languageDetected: userLang
        });
        streamingStarted = true;
      } else {
        // Update existing summary
        renderSummaryIntoDOM(chunk, {
          metadata: {
            apiUsed: 'prompt-streaming',
            languageDetected: userLang
          },
          isStreaming: true
        });
      }
    };
    
    // Generate summary with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Summary generation timeout')), 5000);
    });
    
    const summaryPromise = generateProductSummary(productText, {
      language: userLang,
      onProgress,
      onStreamingChunk,
      preferStreaming: options.preferStreaming || false
    });
    
    const result = await Promise.race([summaryPromise, timeoutPromise]);
    
    if (result.success) {
      console.log('[ShopScout AI Integration] Summary generated successfully');
      console.log('[ShopScout AI Integration] API used:', result.apiUsed);
      console.log('[ShopScout AI Integration] Time to first byte:', result.timeToFirstByte?.toFixed(0), 'ms');
      
      // Replace skeleton with final summary (if not already done by streaming)
      if (!streamingStarted) {
        replaceSkeleton(result.summary, result);
      } else {
        // Update to remove streaming indicator
        renderSummaryIntoDOM(result.summary, {
          metadata: result,
          isStreaming: false
        });
      }
      
      // Cache the summary
      await setCachedSummary(cacheKey, result.summary, result);
      
      // Notify UI about summary generation
      try {
        chrome.runtime.sendMessage({
          type: 'AI_SUMMARY_GENERATED',
          data: {
            ...result,
            cached: false,
            productSite: productData.site,
            totalTime: performance.now() - startTime
          }
        });
      } catch (err) {
        console.warn('[ShopScout AI Integration] Failed to notify UI:', err);
      }
      
      // Log telemetry
      await logTelemetry({
        event: 'summary_generated',
        ...result,
        productSite: productData.site,
        productTextLength: productText.length,
        totalTime: performance.now() - startTime
      });
      
    } else {
      console.error('[ShopScout AI Integration] Summary generation failed:', result.error);
      
      // Show error or fallback
      if (result.fallbackUsed) {
        showSummaryError('AI summarization not available. Using cloud fallback...');
        // TODO: Implement cloud fallback
      } else {
        showSummaryError(`Summary unavailable: ${result.error}`);
      }
      
      // Log telemetry for failure
      await logTelemetry({
        event: 'summary_failed',
        ...result,
        productSite: productData.site,
        totalTime: performance.now() - startTime
      });
    }
    
  } catch (error) {
    console.error('[ShopScout AI Integration] Error:', error);
    showSummaryError('An error occurred while generating summary');
    
    await logTelemetry({
      event: 'summary_error',
      error: error.message,
      stack: error.stack,
      totalTime: performance.now() - startTime
    });
  }
}

/**
 * Initialize AI summary system
 * Call this after product detection
 */
async function initializeAISummary(productData) {
  console.log('[ShopScout AI Integration] Initializing AI summary for product...');
  console.log('[ShopScout AI Integration] Product data:', productData);
  
  // Check if we should generate summary (latency target: ≤1.5s)
  const shouldGenerate = productData && (productData.title || productData.price);
  
  if (!shouldGenerate) {
    console.log('[ShopScout AI Integration] Insufficient product data, skipping summary');
    return;
  }
  
  // Generate and display summary
  try {
    await generateAndDisplaySummary(productData);
  } catch (err) {
    console.error('[ShopScout AI Integration] Failed to generate summary:', err);
    console.error('[ShopScout AI Integration] Error stack:', err.stack);
  }
}

/**
 * Clean up AI summary (when navigating away)
 */
function cleanupAISummary() {
  const summary = document.querySelector('.shopscout-ai-summary, .shopscout-ai-summary-skeleton');
  if (summary) {
    summary.remove();
    console.log('[ShopScout AI Integration] Summary cleaned up');
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeAISummary,
    generateAndDisplaySummary,
    extractProductText,
    cleanupAISummary
  };
}
