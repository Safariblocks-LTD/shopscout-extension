# ShopScout AI Testing Guide

## Quick Start Testing

### 1. Enable Chrome AI Features

**Required Chrome Version**: 128+ (Dev/Canary recommended)

1. Open `chrome://flags`
2. Enable these flags:
   - `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**
   - `#prompt-api-for-gemini-nano` → **Enabled**
   - `#summarization-api-for-gemini-nano` → **Enabled**
   - `#language-detection-api` → **Enabled**

3. Restart Chrome

### 2. Download Gemini Nano Model

1. Visit `chrome://components`
2. Find "Optimization Guide On Device Model"
3. Click **Check for update**
4. Wait for download (may take 2-5 minutes, ~1.5GB)
5. Verify status shows "Up-to-date"

### 3. Verify AI Availability

Open DevTools Console and run:

```javascript
// Check basic availability
console.log('AI available:', !!globalThis.ai);
console.log('Summarizer:', !!globalThis.ai?.summarizer);
console.log('Prompt API:', !!globalThis.ai?.languageModel);
console.log('Language Detector:', !!globalThis.ai?.languageDetector);

// Test Summarizer
const summarizer = await ai.summarizer.create();
const summary = await summarizer.summarize('This is a test product with great features and excellent value.');
console.log('Summary:', summary);

// Test Language Detection
const detector = await ai.languageDetector.create();
const result = await detector.detect('This is English text');
console.log('Language:', result[0].detectedLanguage);
```

### 4. Load ShopScout Extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `shopscout` directory
5. Verify extension loads without errors

### 5. Test on Product Page

1. Navigate to a product page (e.g., Amazon, eBay)
2. Open DevTools Console
3. Look for these log messages:
   ```
   [ShopScout AI] Capabilities detected: {...}
   [ShopScout AI] Language detected: en
   [ShopScout AI] Starting summarization pipeline...
   [ShopScout AI] Summarizer created successfully
   [ShopScout AI] Summary generated successfully
   [ShopScout AI] Summary rendered into DOM
   ```

4. Verify summary card appears above deals section
5. Check summary content is relevant and concise

## Manual Testing Checklist

### ✅ A1: Summarizer Speed (Target: ≤1.5s)

**Test Steps:**
1. Clear cache: `chrome.storage.local.clear()`
2. Navigate to product page
3. Open DevTools Performance tab
4. Note time from page load to summary render
5. **Expected**: Summary visible within 1.5 seconds
6. **Expected**: 1-3 bullet points or sentences

**Console Command:**
```javascript
performance.mark('start');
// Wait for summary to appear
performance.mark('end');
performance.measure('summary-time', 'start', 'end');
console.log(performance.getEntriesByType('measure'));
```

### ✅ A2: Prompt Streaming Fallback

**Test Steps:**
1. Disable Summarizer (simulate unavailability):
   ```javascript
   // In console before page load
   globalThis.ai.summarizer = undefined;
   ```
2. Navigate to product page
3. Observe streaming indicator (pulsing dot)
4. **Expected**: First text appears within 1.5s
5. **Expected**: Complete summary within 5s

### ✅ A3: Language Detection

**Test Steps:**
1. Change browser language: `chrome://settings/languages`
2. Or test with multi-language pages
3. Navigate to product page
4. Check console for: `[ShopScout AI] Language detected: XX`
5. **Expected**: Summary in detected language

**Test Languages:**
- English (en)
- Spanish (es)
- French (fr)
- Swahili (sw)
- German (de)

### ✅ A4: Caching

**Test Steps:**
1. Navigate to product page (first load)
2. Note generation time in console
3. Reload page (second load)
4. **Expected**: "Cache hit" message in console
5. **Expected**: Instant summary display (< 100ms)
6. Wait 25 hours, reload
7. **Expected**: Cache expired, new summary generated

**Console Commands:**
```javascript
// Check cache
chrome.storage.local.get(null, (items) => {
  const cacheKeys = Object.keys(items).filter(k => k.startsWith('ai_summary_'));
  console.log('Cached summaries:', cacheKeys.length);
  cacheKeys.forEach(key => console.log(key, items[key]));
});

// Clear cache
chrome.storage.local.clear(() => console.log('Cache cleared'));
```

### ✅ A5: Download Progress

**Test Steps:**
1. Clear model: Visit `chrome://components`, remove Optimization Guide model
2. Load extension
3. Navigate to product page
4. **Expected**: Skeleton with progress bar appears
5. **Expected**: Progress bar animates 0% → 100%
6. **Expected**: Summary replaces skeleton when complete

## Debugging Common Issues

### Issue: "AI not available"

**Solutions:**
1. Check Chrome version: `chrome://version` (need 128+)
2. Verify flags enabled: `chrome://flags`
3. Check model downloaded: `chrome://components`
4. Restart Chrome after enabling flags

### Issue: "Summarizer not available"

**Solutions:**
1. Visit `chrome://optimization-guide-internals`
2. Check "On-Device Model Service" section
3. Verify model path exists
4. Try re-downloading model from `chrome://components`

### Issue: Summary not appearing

**Solutions:**
1. Check console for errors
2. Verify product page is supported (Amazon, eBay, etc.)
3. Check if summary is hidden by CSS (inspect element)
4. Verify content script loaded: Check `chrome://extensions` → ShopScout → Inspect views

### Issue: Slow performance

**Solutions:**
1. First run after model download is slower (1-2s)
2. Subsequent runs should be < 1.5s
3. Check CPU usage (model inference is CPU-intensive)
4. Verify cache is working (should be instant on reload)

## Performance Profiling

### Measure End-to-End Latency

```javascript
// Add to ai-summary-integration.js
console.time('ai-summary-pipeline');

// ... pipeline code ...

console.timeEnd('ai-summary-pipeline');
```

### Track Individual Steps

```javascript
const metrics = {
  languageDetection: 0,
  summarizerCreation: 0,
  summarization: 0,
  rendering: 0
};

performance.mark('lang-start');
await detectUserLanguage();
performance.mark('lang-end');
metrics.languageDetection = performance.measure('lang', 'lang-start', 'lang-end').duration;

// Repeat for each step
console.table(metrics);
```

## Automated Testing

### Run Unit Tests

```bash
# Install dependencies
npm install --save-dev jest

# Run tests
npm test tests/ai-summary.test.js

# Run with coverage
npm test -- --coverage
```

### Expected Test Results

```
PASS  tests/ai-summary.test.js
  ShopScout AI Summary - Acceptance Tests
    A1: Summarizer Speed and Output
      ✓ should generate summary within 1.5s when Summarizer is available
      ✓ should show skeleton immediately and update within 1.5s
    A2: Prompt API Streaming Fallback
      ✓ should start streaming within 1.5s when Summarizer unavailable
      ✓ should handle streaming gracefully and show partial content
    A3: Language Detection
      ✓ should detect language using Language Detector API
      ✓ should fallback to navigator.language when API unavailable
      ✓ should pass detected language to summarization
    A4: Cache Functionality
      ✓ should cache summary after generation
      ✓ should retrieve cached summary within TTL
      ✓ should ignore expired cache
    A5: Model Download Progress
      ✓ should track download progress events
      ✓ should update progress bar UI during download
    Integration: Full Summary Pipeline
      ✓ should complete full pipeline from detection to render

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
```

## Health Check Dashboard

### Request Health Check

```javascript
chrome.runtime.sendMessage({ type: 'AI_HEALTH_CHECK' }, (response) => {
  if (response.success) {
    console.log('=== AI Health Check ===');
    console.log('Timestamp:', new Date(response.healthCheck.timestamp));
    console.log('Capabilities:', response.healthCheck.capabilities);
    console.log('APIs:', response.healthCheck.apis);
    console.log('Browser:', response.healthCheck.browser);
    console.log('Optimization Guide:', response.healthCheck.optimizationGuide);
  }
});
```

### Expected Healthy Output

```javascript
{
  timestamp: 1730000000000,
  capabilities: {
    hasAi: true,
    hasSummarizer: true,
    hasLanguageDetector: true,
    hasPrompt: true,
    hasWriter: false,
    hasRewriter: false
  },
  apis: {
    summarizer: { available: true, status: 'ready' },
    prompt: { available: true, status: 'readily' },
    languageDetector: { available: true, status: 'ready' }
  },
  browser: {
    userAgent: 'Mozilla/5.0 ... Chrome/130.0.0.0',
    language: 'en-US'
  },
  optimizationGuide: 'chrome://optimization-guide-internals'
}
```

## Production Checklist

Before deploying to production:

- [ ] All 5 acceptance tests pass
- [ ] Unit tests pass with 100% coverage
- [ ] Manual testing on 5+ product pages
- [ ] Performance < 1.5s on average
- [ ] Cache working correctly
- [ ] Language detection accurate
- [ ] Accessibility verified (screen reader, keyboard)
- [ ] Error handling graceful
- [ ] Telemetry logging correctly
- [ ] No console errors
- [ ] Works on Chrome 128+
- [ ] Fallback to cloud API tested

## Support

For issues or questions:
1. Check console logs with `[ShopScout AI]` prefix
2. Run health check command
3. Visit `chrome://optimization-guide-internals`
4. Review `AI_INTEGRATION.md` documentation
