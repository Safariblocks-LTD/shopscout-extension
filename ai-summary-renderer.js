/**
 * ShopScout AI Summary Renderer
 * Handles DOM insertion, skeleton UI, and progressive rendering of AI summaries
 */

/**
 * Create skeleton loader for AI summary
 * @returns {HTMLElement} Skeleton element
 */
function createSummarySkeleton() {
  const skeleton = document.createElement('div');
  skeleton.className = 'shopscout-ai-summary-skeleton';
  skeleton.setAttribute('role', 'status');
  skeleton.setAttribute('aria-label', 'AI summary loading');
  
  skeleton.innerHTML = `
    <div class="shopscout-ai-summary-header">
      <div class="shopscout-ai-icon-skeleton"></div>
      <div class="shopscout-ai-title-skeleton"></div>
    </div>
    <div class="shopscout-ai-content-skeleton">
      <div class="shopscout-ai-line-skeleton"></div>
      <div class="shopscout-ai-line-skeleton"></div>
      <div class="shopscout-ai-line-skeleton short"></div>
    </div>
    <div class="shopscout-ai-progress-bar">
      <div class="shopscout-ai-progress-fill" style="width: 0%"></div>
    </div>
  `;
  
  return skeleton;
}

/**
 * Update skeleton progress bar
 * @param {HTMLElement} skeleton - Skeleton element
 * @param {number} progress - Progress value (0-1)
 */
function updateSkeletonProgress(skeleton, progress) {
  const progressFill = skeleton.querySelector('.shopscout-ai-progress-fill');
  if (progressFill) {
    progressFill.style.width = `${Math.round(progress * 100)}%`;
  }
}

/**
 * Create AI summary card element
 * @param {string} summary - Summary text
 * @param {Object} metadata - Summary metadata
 * @param {boolean} isStreaming - Whether content is streaming
 * @returns {HTMLElement} Summary card element
 */
function createSummaryCard(summary, metadata = {}, isStreaming = false) {
  const card = document.createElement('div');
  card.className = 'shopscout-ai-summary' + (isStreaming ? ' streaming' : '');
  card.setAttribute('role', 'region');
  card.setAttribute('aria-live', 'polite');
  card.setAttribute('aria-label', 'AI-generated product summary');
  card.setAttribute('tabindex', '0');
  
  // Format summary as bullets if it contains line breaks or is long
  const formattedSummary = formatSummaryContent(summary);
  
  const apiLabel = {
    'summarizer': 'Chrome AI Summarizer',
    'prompt-streaming': 'Chrome AI',
    'none': 'AI Summary'
  }[metadata.apiUsed] || 'AI Summary';
  
  card.innerHTML = `
    <div class="shopscout-ai-summary-header">
      <div class="shopscout-ai-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="shopscout-ai-title">
        <span class="shopscout-ai-badge">${apiLabel}</span>
        ${isStreaming ? '<span class="shopscout-ai-streaming-indicator">●</span>' : ''}
      </div>
    </div>
    <div class="shopscout-ai-content">
      ${formattedSummary}
    </div>
    ${metadata.timeToFirstRender ? `
      <div class="shopscout-ai-meta">
        <span class="shopscout-ai-timing">Generated in ${Math.round(metadata.timeToFirstRender)}ms</span>
        ${metadata.languageDetected ? `<span class="shopscout-ai-lang">${metadata.languageDetected.toUpperCase()}</span>` : ''}
      </div>
    ` : ''}
  `;
  
  return card;
}

/**
 * Format summary content (convert to bullets if needed)
 * @param {string} summary - Raw summary text
 * @returns {string} Formatted HTML
 */
function formatSummaryContent(summary) {
  if (!summary) return '<p class="shopscout-ai-empty">No summary available</p>';
  
  // Escape HTML
  const escaped = summary
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // Check if summary has bullet points or numbered lists
  const hasBullets = /^[\s]*[-•*]\s/m.test(summary) || /^\d+\.\s/m.test(summary);
  
  if (hasBullets) {
    // Convert to HTML list
    const lines = escaped.split('\n').filter(line => line.trim());
    const items = lines
      .filter(line => /^[\s]*[-•*]\s/.test(line) || /^\d+\.\s/.test(line))
      .map(line => line.replace(/^[\s]*[-•*]\s/, '').replace(/^\d+\.\s/, '').trim())
      .map(item => `<li>${item}</li>`)
      .join('');
    
    return `<ul class="shopscout-ai-list">${items}</ul>`;
  }
  
  // Split into paragraphs
  const paragraphs = escaped
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}</p>`)
    .join('');
  
  return paragraphs || `<p>${escaped}</p>`;
}

/**
 * Find insertion point for summary (before deals/pricing section)
 * @param {HTMLElement} container - Product page container
 * @returns {HTMLElement|null} Insertion point
 */
function findSummaryInsertionPoint(container = document.body) {
  // Common selectors for deals/pricing sections
  const dealSelectors = [
    '#dealBadge',
    '.deal-badge',
    '#corePrice_feature_div',
    '#corePriceDisplay_desktop_feature_div',
    '#price',
    '.price-section',
    '#buybox',
    '.buybox',
    '[id*="price"]',
    '[class*="price"]',
    '[id*="deal"]',
    '[class*="deal"]',
    '#availability',
    '.availability'
  ];
  
  for (const selector of dealSelectors) {
    const element = container.querySelector(selector);
    if (element) {
      console.log('[ShopScout AI] Found insertion point:', selector);
      return element;
    }
  }
  
  // Fallback: find main product info container
  const fallbackSelectors = [
    '#dp-container',
    '#centerCol',
    '.product-info',
    '[id*="product"]',
    'main'
  ];
  
  for (const selector of fallbackSelectors) {
    const element = container.querySelector(selector);
    if (element) {
      console.log('[ShopScout AI] Using fallback insertion point:', selector);
      return element.firstElementChild;
    }
  }
  
  return null;
}

/**
 * Insert or update AI summary in DOM
 * @param {string} summary - Summary text
 * @param {Object} options - Rendering options
 */
function renderSummaryIntoDOM(summary, options = {}) {
  const {
    metadata = {},
    isStreaming = false,
    container = document.body
  } = options;
  
  // Check if summary already exists
  let existingSummary = container.querySelector('.shopscout-ai-summary');
  
  if (existingSummary) {
    // Update existing summary
    const contentDiv = existingSummary.querySelector('.shopscout-ai-content');
    if (contentDiv) {
      contentDiv.innerHTML = formatSummaryContent(summary);
    }
    
    // Update streaming indicator
    if (!isStreaming) {
      existingSummary.classList.remove('streaming');
      const streamingIndicator = existingSummary.querySelector('.shopscout-ai-streaming-indicator');
      if (streamingIndicator) {
        streamingIndicator.remove();
      }
    }
    
    return existingSummary;
  }
  
  // Create new summary card
  const summaryCard = createSummaryCard(summary, metadata, isStreaming);
  
  // Find insertion point
  const insertionPoint = findSummaryInsertionPoint(container);
  
  if (insertionPoint) {
    // Insert before the insertion point
    insertionPoint.parentNode.insertBefore(summaryCard, insertionPoint);
    
    // Animate fade-in
    setTimeout(() => {
      summaryCard.classList.add('visible');
    }, 10);
    
    console.log('[ShopScout AI] Summary rendered into DOM');
  } else {
    console.warn('[ShopScout AI] Could not find suitable insertion point');
  }
  
  return summaryCard;
}

/**
 * Show skeleton loader
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement} Skeleton element
 */
function showSkeleton(container = document.body) {
  // Remove existing skeleton or summary
  const existing = container.querySelector('.shopscout-ai-summary-skeleton, .shopscout-ai-summary');
  if (existing) {
    existing.remove();
  }
  
  const skeleton = createSummarySkeleton();
  const insertionPoint = findSummaryInsertionPoint(container);
  
  if (insertionPoint) {
    insertionPoint.parentNode.insertBefore(skeleton, insertionPoint);
    console.log('[ShopScout AI] Skeleton shown');
  }
  
  return skeleton;
}

/**
 * Replace skeleton with actual summary
 * @param {string} summary - Summary text
 * @param {Object} metadata - Summary metadata
 */
function replaceSkeleton(summary, metadata = {}) {
  const skeleton = document.querySelector('.shopscout-ai-summary-skeleton');
  
  if (skeleton) {
    const summaryCard = createSummaryCard(summary, metadata);
    skeleton.parentNode.replaceChild(summaryCard, skeleton);
    
    // Animate fade-in
    setTimeout(() => {
      summaryCard.classList.add('visible');
    }, 10);
    
    console.log('[ShopScout AI] Skeleton replaced with summary');
  } else {
    // No skeleton, render directly
    renderSummaryIntoDOM(summary, { metadata });
  }
}

/**
 * Show error state
 * @param {string} errorMessage - Error message
 */
function showSummaryError(errorMessage) {
  const skeleton = document.querySelector('.shopscout-ai-summary-skeleton');
  const existing = document.querySelector('.shopscout-ai-summary');
  
  const errorCard = document.createElement('div');
  errorCard.className = 'shopscout-ai-summary error';
  errorCard.setAttribute('role', 'alert');
  errorCard.innerHTML = `
    <div class="shopscout-ai-summary-header">
      <div class="shopscout-ai-icon error">⚠</div>
      <div class="shopscout-ai-title">AI Summary Unavailable</div>
    </div>
    <div class="shopscout-ai-content">
      <p class="shopscout-ai-error-message">${errorMessage}</p>
    </div>
  `;
  
  if (skeleton) {
    skeleton.parentNode.replaceChild(errorCard, skeleton);
  } else if (existing) {
    existing.parentNode.replaceChild(errorCard, existing);
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createSummarySkeleton,
    updateSkeletonProgress,
    createSummaryCard,
    renderSummaryIntoDOM,
    showSkeleton,
    replaceSkeleton,
    showSummaryError,
    findSummaryInsertionPoint
  };
}
