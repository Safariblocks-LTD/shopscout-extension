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
    // Access AI APIs in sidepanel context
    const ai = (window as any).ai || (self as any).ai;
    
    if (!ai) {
      return {
        success: false,
        error: 'Chrome AI not available. Enable AI flags and download Gemini Nano.'
      };
    }

    // Prepare product text
    const productText = formatProductText(productData);
    
    // Try Summarizer API first
    if (ai.summarizer) {
      try {
        const availability = await ai.summarizer.availability();
        
        if (availability === 'readily' || availability === 'after-download') {
          console.log('[AI Summary] Using Summarizer API');
          
          const summarizer = await ai.summarizer.create({
            type: 'key-points',
            format: 'plain-text',
            length: 'short'
          });
          
          const summary = await summarizer.summarize(productText, {
            context: 'Summarize this product for a shopping assistant. Focus on key features and value.'
          });
          
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

    // Fallback to Prompt API
    if (ai.languageModel) {
      try {
        const capabilities = await ai.languageModel.capabilities();
        
        if (capabilities.available === 'readily') {
          console.log('[AI Summary] Using Prompt API');
          
          const session = await ai.languageModel.create({
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
      error: 'No AI API available or ready'
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
  const ai = (window as any).ai || (self as any).ai;
  return !!(ai?.summarizer || ai?.languageModel);
}

/**
 * Get AI capabilities
 */
export async function getAICapabilities() {
  const ai = (window as any).ai || (self as any).ai;
  
  if (!ai) {
    return {
      available: false,
      summarizer: false,
      prompt: false
    };
  }

  const capabilities = {
    available: true,
    summarizer: false,
    prompt: false,
    summarizerStatus: 'unknown',
    promptStatus: 'unknown'
  };

  // Check Summarizer
  if (ai.summarizer) {
    try {
      const availability = await ai.summarizer.availability();
      capabilities.summarizer = availability !== 'unavailable';
      capabilities.summarizerStatus = availability;
    } catch (err) {
      console.warn('[AI] Summarizer check failed:', err);
    }
  }

  // Check Prompt API
  if (ai.languageModel) {
    try {
      const promptCaps = await ai.languageModel.capabilities();
      capabilities.prompt = promptCaps.available === 'readily';
      capabilities.promptStatus = promptCaps.available;
    } catch (err) {
      console.warn('[AI] Prompt API check failed:', err);
    }
  }

  return capabilities;
}
