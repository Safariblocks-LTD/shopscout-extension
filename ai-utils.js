/**
 * ShopScout Chrome Built-in AI Utilities
 * Implements Summarizer-first pipeline with Language Detector and Prompt API fallback
 * @see https://developer.chrome.com/docs/ai/summarizer-api
 * @see https://developer.chrome.com/docs/ai/prompt-api
 * @see https://developer.chrome.com/docs/ai/language-detection
 */

// AI Availability Detection
const AI_CAPABILITIES = {
  hasAi: false,
  hasSummarizer: false,
  hasLanguageDetector: false,
  hasPrompt: false,
  hasWriter: false,
  hasRewriter: false
};

/**
 * Initialize and detect Chrome built-in AI capabilities
 * @returns {Promise<Object>} AI capabilities object
 */
async function detectAICapabilities() {
  try {
    // Check for Chrome AI APIs using correct globals
    AI_CAPABILITIES.hasSummarizer = 'Summarizer' in self || 'Summarizer' in window;
    AI_CAPABILITIES.hasPrompt = 'LanguageModel' in self || 'LanguageModel' in window;
    AI_CAPABILITIES.hasLanguageDetector = 'LanguageDetector' in self || 'LanguageDetector' in window;
    AI_CAPABILITIES.hasWriter = 'Writer' in self || 'Writer' in window;
    AI_CAPABILITIES.hasRewriter = 'Rewriter' in self || 'Rewriter' in window;
    AI_CAPABILITIES.hasAi = AI_CAPABILITIES.hasSummarizer || AI_CAPABILITIES.hasPrompt;
    
    // Test actual availability with proper API calls
    if (AI_CAPABILITIES.hasSummarizer) {
      try {
        const Summarizer = self.Summarizer || window.Summarizer;
        const availability = await Summarizer.availability();
        AI_CAPABILITIES.summarizerAvailable = availability !== 'unavailable';
        console.log('[ShopScout AI] Summarizer availability:', availability);
      } catch (err) {
        AI_CAPABILITIES.summarizerAvailable = false;
        console.warn('[ShopScout AI] Summarizer availability check failed:', err);
      }
    }
    
    if (AI_CAPABILITIES.hasPrompt) {
      try {
        const LanguageModel = self.LanguageModel || window.LanguageModel;
        const capabilities = await LanguageModel.capabilities();
        AI_CAPABILITIES.promptAvailable = capabilities.available !== 'no';
        console.log('[ShopScout AI] Prompt API capabilities:', capabilities);
      } catch (err) {
        AI_CAPABILITIES.promptAvailable = false;
        console.warn('[ShopScout AI] Prompt API capabilities check failed:', err);
      }
    }
    
    console.log('[ShopScout AI] Capabilities detected:', AI_CAPABILITIES);
    return AI_CAPABILITIES;
  } catch (err) {
    console.warn('[ShopScout AI] Failed to detect capabilities:', err);
    return AI_CAPABILITIES;
  }
}

/**
 * Detect user language using Language Detector API
 * @returns {Promise<string>} Detected language code (e.g., 'en', 'sw', 'fr')
 */
async function detectUserLanguage() {
  let userLang = navigator.language || 'en';
  
  try {
    if (AI_CAPABILITIES.hasLanguageDetector) {
      const LanguageDetector = self.LanguageDetector || window.LanguageDetector;
      const ld = await LanguageDetector.create();
      const pageText = document.body.innerText?.substring(0, 5000) || navigator.language;
      const detection = await ld.detect(pageText);
      
      if (detection && detection.length > 0) {
        // Get top language from detection results
        const topLanguage = detection[0];
        userLang = topLanguage.detectedLanguage || userLang;
        console.log('[ShopScout AI] Language detected:', userLang, 'confidence:', topLanguage.confidence);
      }
    } else {
      console.log('[ShopScout AI] Language Detector unavailable, using navigator.language:', userLang);
    }
  } catch (err) {
    console.warn('[ShopScout AI] Language detection failed:', err);
  }
  
  // Normalize to 2-letter code
  return userLang.split('-')[0].toLowerCase();
}

/**
 * Create a summarizer with progress monitoring
 * @param {Function} onProgress - Progress callback (0-1)
 * @param {string} language - Target language code
 * @returns {Promise<Object|null>} Summarizer instance or null
 */
async function createSummarizerWithMonitor(onProgress, language = 'en') {
  try {
    if (!AI_CAPABILITIES.hasSummarizer) {
      console.log('[ShopScout AI] Summarizer not available');
      return null;
    }
    
    const Summarizer = self.Summarizer || window.Summarizer;
    
    // Check availability first
    const availability = await Summarizer.availability();
    if (availability === 'unavailable') {
      console.log('[ShopScout AI] Summarizer API unavailable');
      return null;
    }
    
    console.log('[ShopScout AI] Creating summarizer...');
    
    const summarizer = await Summarizer.create({
      sharedContext: 'Summarize this product information for a shopping assistant. Focus on key features and benefits.',
      type: 'key-points',
      format: 'plain-text',
      length: 'short',
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          const progress = e.loaded;
          console.log('[ShopScout AI] Model download progress:', Math.round(progress * 100) + '%');
          onProgress?.(Math.min(1, progress));
        });
      }
    });
    
    console.log('[ShopScout AI] Summarizer created successfully');
    return summarizer;
  } catch (err) {
    console.warn('[ShopScout AI] Summarizer init failed:', err);
    return null;
  }
}

/**
 * Generate summary using Summarizer API (primary method)
 * @param {string} text - Text to summarize
 * @param {string} language - Target language
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Summary result with metadata
 */
async function generateSummaryWithSummarizer(text, language, onProgress) {
  const startTime = performance.now();
  
  try {
    const summarizer = await createSummarizerWithMonitor(onProgress, language);
    
    if (!summarizer) {
      return {
        success: false,
        error: 'Summarizer unavailable',
        apiUsed: 'summarizer',
        timeToFirstByte: 0
      };
    }
    
    // Truncate text if too long (Summarizer has limits)
    const maxLength = 32000;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;
    
    const summary = await summarizer.summarize(truncatedText);
    
    const timeToFirstByte = performance.now() - startTime;
    
    console.log('[ShopScout AI] Summarizer completed in', timeToFirstByte.toFixed(0), 'ms');
    
    return {
      success: true,
      summary: summary,
      apiUsed: 'summarizer',
      timeToFirstByte,
      timeToFirstRender: timeToFirstByte,
      modelStatus: 'ready',
      languageDetected: language
    };
  } catch (err) {
    console.error('[ShopScout AI] Summarizer failed:', err);
    return {
      success: false,
      error: err.message,
      apiUsed: 'summarizer',
      timeToFirstByte: performance.now() - startTime
    };
  }
}

/**
 * Generate summary using Prompt API streaming (fallback method)
 * @param {string} text - Text to summarize
 * @param {string} language - Target language
 * @param {Function} onChunk - Callback for each streaming chunk
 * @returns {Promise<Object>} Summary result with metadata
 */
async function generateSummaryWithPromptStreaming(text, language, onChunk) {
  const startTime = performance.now();
  let timeToFirstByte = 0;
  let firstChunk = true;
  
  try {
    if (!AI_CAPABILITIES.hasPrompt) {
      return {
        success: false,
        error: 'Prompt API unavailable',
        apiUsed: 'prompt-streaming'
      };
    }
    
    const LanguageModel = self.LanguageModel || window.LanguageModel;
    
    const languageNames = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      sw: 'Swahili',
      ar: 'Arabic',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean'
    };
    
    const langName = languageNames[language] || 'English';
    
    const systemPrompt = `You are a concise shopping assistant. Summarize product information in ${langName}. 
Rules:
- Maximum 3 bullet points or 2-3 short sentences
- Focus on key features, price value, and quality indicators
- Be objective and factual
- Use ${langName} language for the output`;
    
    const lm = await LanguageModel.create({
      systemPrompt,
      temperature: 0.3,
      topK: 3
    });
    
    const truncatedText = text.substring(0, 8000);
    const prompt = `Summarize this product concisely:\n\n${truncatedText}`;
    
    const stream = lm.promptStreaming(prompt);
    let fullSummary = '';
    
    for await (const chunk of stream) {
      if (firstChunk) {
        timeToFirstByte = performance.now() - startTime;
        firstChunk = false;
      }
      
      fullSummary = chunk; // Chrome returns full text each time, not deltas
      onChunk?.(fullSummary);
    }
    
    const totalTime = performance.now() - startTime;
    
    console.log('[ShopScout AI] Prompt streaming completed in', totalTime.toFixed(0), 'ms');
    
    return {
      success: true,
      summary: fullSummary,
      apiUsed: 'prompt-streaming',
      timeToFirstByte,
      timeToFirstRender: timeToFirstByte,
      modelStatus: 'ready',
      languageDetected: language
    };
  } catch (err) {
    console.error('[ShopScout AI] Prompt streaming failed:', err);
    return {
      success: false,
      error: err.message,
      apiUsed: 'prompt-streaming',
      timeToFirstByte: timeToFirstByte || performance.now() - startTime
    };
  }
}

/**
 * Main summarization pipeline: Summarizer-first with Prompt fallback
 * @param {string} text - Text to summarize
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Summary result
 */
async function generateProductSummary(text, options = {}) {
  const {
    language = 'en',
    onProgress = null,
    onStreamingChunk = null,
    preferStreaming = false
  } = options;
  
  console.log('[ShopScout AI] Starting summarization pipeline...');
  
  // Try Summarizer first (unless streaming explicitly requested)
  if (!preferStreaming && AI_CAPABILITIES.hasSummarizer) {
    const result = await generateSummaryWithSummarizer(text, language, onProgress);
    if (result.success) {
      return result;
    }
    console.log('[ShopScout AI] Summarizer failed, falling back to Prompt API');
  }
  
  // Fallback to Prompt API streaming
  if (AI_CAPABILITIES.hasPrompt) {
    return await generateSummaryWithPromptStreaming(text, language, onStreamingChunk);
  }
  
  // No AI available
  return {
    success: false,
    error: 'No AI APIs available',
    apiUsed: 'none',
    fallbackUsed: true
  };
}

/**
 * Cache management for summaries
 */
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getCachedSummary(cacheKey) {
  try {
    const result = await chrome.storage.local.get([cacheKey]);
    const cached = result[cacheKey];
    
    if (cached && cached.timestamp && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log('[ShopScout AI] Cache hit for', cacheKey);
      return cached.summary;
    }
    
    console.log('[ShopScout AI] Cache miss for', cacheKey);
    return null;
  } catch (err) {
    console.warn('[ShopScout AI] Cache read failed:', err);
    return null;
  }
}

async function setCachedSummary(cacheKey, summary, metadata) {
  try {
    await chrome.storage.local.set({
      [cacheKey]: {
        summary,
        metadata,
        timestamp: Date.now()
      }
    });
    console.log('[ShopScout AI] Cached summary for', cacheKey);
  } catch (err) {
    console.warn('[ShopScout AI] Cache write failed:', err);
  }
}

/**
 * Generate cache key from product data
 */
function generateCacheKey(productUrl, productId, language) {
  const url = new URL(productUrl);
  const key = `ai_summary_${url.hostname}_${productId}_${language}`;
  return key;
}

/**
 * Telemetry logging
 */
async function logTelemetry(metrics) {
  try {
    const telemetryKey = 'ai_telemetry_' + Date.now();
    await chrome.storage.local.set({
      [telemetryKey]: {
        ...metrics,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      }
    });
    console.log('[ShopScout AI] Telemetry logged:', metrics);
  } catch (err) {
    console.warn('[ShopScout AI] Telemetry logging failed:', err);
  }
}

/**
 * AI Health Check for diagnostics
 */
async function getAIHealthCheck() {
  const health = {
    timestamp: Date.now(),
    capabilities: { ...AI_CAPABILITIES },
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language
    },
    apis: {
      summarizer: {
        available: AI_CAPABILITIES.hasSummarizer,
        status: 'unknown'
      },
      prompt: {
        available: AI_CAPABILITIES.hasPrompt,
        status: 'unknown'
      },
      languageDetector: {
        available: AI_CAPABILITIES.hasLanguageDetector,
        status: 'unknown'
      }
    },
    optimizationGuide: 'chrome://optimization-guide-internals'
  };
  
  // Test each API
  if (AI_CAPABILITIES.hasSummarizer) {
    try {
      const availability = await ai.summarizer.availability();
      health.apis.summarizer.status = availability;
    } catch (err) {
      health.apis.summarizer.status = 'error: ' + err.message;
    }
  }
  
  if (AI_CAPABILITIES.hasPrompt) {
    try {
      const capabilities = await ai.languageModel.capabilities();
      health.apis.prompt.status = capabilities.available;
    } catch (err) {
      health.apis.prompt.status = 'error: ' + err.message;
    }
  }
  
  if (AI_CAPABILITIES.hasLanguageDetector) {
    try {
      const testDetector = await ai.languageDetector.create();
      health.apis.languageDetector.status = 'ready';
    } catch (err) {
      health.apis.languageDetector.status = 'error: ' + err.message;
    }
  }
  
  return health;
}

// Initialize on load
detectAICapabilities();

// Export for use in content script and background
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    detectAICapabilities,
    detectUserLanguage,
    generateProductSummary,
    getCachedSummary,
    setCachedSummary,
    generateCacheKey,
    logTelemetry,
    getAIHealthCheck,
    AI_CAPABILITIES
  };
}
