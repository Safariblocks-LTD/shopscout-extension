/**
 * AI Summary Generator for Sidepanel
 * Uses Chrome Built-in AI APIs (Prompt API / Summarizer API)
 * These APIs are available in the sidepanel context
 */

interface ProductData {
  title: string;
  price?: number | string | null;
  rating?: number | string | null;
  reviews?: number | string | null;
  description?: string | null;
  features?: string[];
  [key: string]: any;
}

interface SummaryResult {
  success: boolean;
  summary?: string;
  apiUsed?: string;
  timeToGenerate?: number;
  error?: string;
}

/**
 * Generate AI summary using Chrome Built-in AI
 */
export async function generateAISummary(productData: ProductData): Promise<SummaryResult> {
  const startTime = performance.now();
  
  try {
    // Prepare product text
    const productText = formatProductText(productData);
    
    // Try Summarizer API first (Chrome 138+)
    if ('Summarizer' in self || 'Summarizer' in window) {
      try {
        const Summarizer = (self as any).Summarizer || (window as any).Summarizer;
        const availability = await Summarizer.availability();
        
        console.log('[AI Summary] Summarizer availability:', availability);
        
        if (availability === 'readily' || availability === 'after-download') {
          console.log('[AI Summary] Using Summarizer API');
          
          const summarizer = await Summarizer.create({
            sharedContext: 'Summarize this product for a shopping assistant. Focus on key features and value.',
            type: 'key-points',
            format: 'plain-text',
            length: 'short'
          });
          
          const summary = await summarizer.summarize(productText);
          
          const timeToGenerate = performance.now() - startTime;
          
          return {
            success: true,
            summary,
            apiUsed: 'summarizer',
            timeToGenerate
          };
        }
      } catch (err: any) {
        console.warn('[AI Summary] Summarizer failed:', err.message);
      }
    }

    // Fallback to Prompt API (Chrome Extensions only)
    if ('LanguageModel' in self || 'LanguageModel' in window) {
      try {
        const LanguageModel = (self as any).LanguageModel || (window as any).LanguageModel;
        const capabilities = await LanguageModel.capabilities();
        
        console.log('[AI Summary] LanguageModel capabilities:', capabilities);
        
        if (capabilities.available === 'readily' || capabilities.available === 'after-download') {
          console.log('[AI Summary] Using Prompt API');
          
          const session = await LanguageModel.create({
            systemPrompt: `You are a concise shopping assistant. Summarize product information in 2-3 bullet points or short sentences. Focus on key features, price value, and quality indicators.`,
            temperature: 0.3,
            topK: 3
          });
          
          const prompt = `Summarize this product concisely:\n\n${productText}`;
          const summary = await session.prompt(prompt);
          
          const timeToGenerate = performance.now() - startTime;
          
          return {
            success: true,
            summary,
            apiUsed: 'prompt',
            timeToGenerate
          };
        }
      } catch (err: any) {
        console.warn('[AI Summary] Prompt API failed:', err.message);
      }
    }

    return {
      success: false,
      error: 'Chrome AI not available. Ensure Chrome 138+ with AI features enabled.'
    };

  } catch (error: any) {
    console.error('[AI Summary] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Format product data into text for summarization
 */
function formatProductText(product: ProductData): string {
  const parts: string[] = [];
  
  if (product.title) {
    parts.push(`Product: ${product.title}`);
  }
  
  if (product.price) {
    parts.push(`Price: ${product.price}`);
  }
  
  if (product.rating) {
    parts.push(`Rating: ${product.rating}`);
  }
  
  if (product.reviews) {
    parts.push(`Reviews: ${product.reviews}`);
  }
  
  if (product.description) {
    parts.push(`Description: ${product.description.substring(0, 500)}`);
  }
  
  if (product.features && product.features.length > 0) {
    parts.push(`Features: ${product.features.slice(0, 5).join(', ')}`);
  }
  
  return parts.join('\n\n');
}

/**
 * Check if AI is available in current context
 */
export function isAIAvailable(): boolean {
  return ('Summarizer' in self || 'Summarizer' in window || 
          'LanguageModel' in self || 'LanguageModel' in window);
}

/**
 * Get AI capabilities
 */
export async function getAICapabilities() {
  const capabilities = {
    available: false,
    summarizer: false,
    prompt: false,
    summarizerStatus: 'unknown',
    promptStatus: 'unknown'
  };

  // Check Summarizer API
  if ('Summarizer' in self || 'Summarizer' in window) {
    try {
      const Summarizer = (self as any).Summarizer || (window as any).Summarizer;
      const availability = await Summarizer.availability();
      capabilities.summarizer = availability !== 'unavailable';
      capabilities.summarizerStatus = availability;
      capabilities.available = true;
    } catch (err) {
      console.warn('[AI] Summarizer check failed:', err);
    }
  }

  // Check Prompt API (LanguageModel)
  if ('LanguageModel' in self || 'LanguageModel' in window) {
    try {
      const LanguageModel = (self as any).LanguageModel || (window as any).LanguageModel;
      const promptCaps = await LanguageModel.capabilities();
      capabilities.prompt = promptCaps.available === 'readily' || promptCaps.available === 'after-download';
      capabilities.promptStatus = promptCaps.available;
      capabilities.available = true;
    } catch (err) {
      console.warn('[AI] Prompt API check failed:', err);
    }
  }

  return capabilities;
}
