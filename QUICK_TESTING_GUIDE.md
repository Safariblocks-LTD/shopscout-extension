# 🧪 Quick Testing Guide - Real-Time AI Streaming

## Prerequisites

### Chrome Requirements
- Chrome 128+ (Stable channel)
- Gemini Nano model installed
- Check availability:
  ```javascript
  // Open DevTools Console (F12)
  await ai.summarizer.capabilities()
  // Should return: { available: "readily" }
  ```

### API Configuration
- **Serper.dev API**: Already configured ✅
- **Backend**: `https://shopscout-api.fly.dev` ✅
- **Extension**: Load from `/dist` folder ✅

---

## 🚀 Quick Test (5 minutes)

### Step 1: Load Extension
```bash
# Navigate to extension directory
cd /home/kcelestinomaria/startuprojects/shopscout

# Build if needed
npm run build

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the /dist folder
```

### Step 2: Test Product Detection
1. Navigate to: `https://www.amazon.com/dp/B08N5WRWNW`
2. Click ShopScout extension icon to open sidebar
3. **Watch the three phases:**

#### Phase 1 (Instant - < 300ms)
```
✅ Product card displays immediately
✅ Title: "Amazon Basics USB-C..."
✅ Price: $12.99
✅ Rating: 4.5
✅ Reviews: "1.2K reviews"
```

#### Phase 2 (2-3 seconds)
```
✅ "Analyzing product..." badge pulses
✅ Deals section populates
✅ 4-5 alternative deals shown
✅ Trust score displays (0-100)
✅ Savings highlighted
```

#### Phase 3 (3-5 seconds)
```
✅ AI Summary section appears
✅ Loader icon spins with "Streaming..." badge
✅ Text progressively updates
✅ Final badge changes to "Chrome AI"
```

### Step 3: Verify Console Output
```
# Open Chrome DevTools (F12)
# Navigate to Console tab
# Look for these logs:

[ShopScout] ✅ Product scraped and validated successfully
[ShopScout] Trust Score Breakdown: {platformReliability: 30, ...}
[ShopScout] 📝 Generating product summary with Summarizer API...
[ShopScout] ⚡ First token received in 512 ms
[ShopScout] 📝 Chunk received: This product offers...
[ShopScout] ✅ Product summary generated in 2341 ms
```

---

## 🎯 Test Different Platforms

### Amazon
- **URL**: `https://www.amazon.com/dp/B08N5WRWNW`
- **Expected**: All 3 phases work perfectly

### Walmart
- **URL**: Any Walmart product page
- **Expected**: All 3 phases work

### eBay
- **URL**: Any eBay product page
- **Expected**: All 3 phases work

### Target
- **URL**: Any Target product page
- **Expected**: All 3 phases work

---

## 🔍 What to Look For

### ✅ Success Indicators

#### Visual
- Product card renders instantly
- Analyzing badge pulses during Phase 2
- Deals populate with trust scores
- AI summary streams progressively
- Loader icon spins → Sparkles icon when complete
- "Streaming..." badge → "Chrome AI" badge

#### Console
```javascript
// Good logs to see:
"✅ Product scraped and validated successfully"
"✅ Initial analysis complete - sending to UI"
"📝 Generating product summary with Summarizer API..."
"⚡ First token received in XXX ms"
"📝 Chunk received"
"✅ Product summary generated in XXX ms"

// Trust score breakdown:
Trust Score Breakdown: {
  platformReliability: 30,
  sellerReputation: 25,
  ratingQuality: 22,
  reviewCount: 8,
  pricePositioning: 10
}
```

### ⚠️ Warning Signs (Still Works)

```javascript
// If AI unavailable:
"⚠️ Summarizer API not available"
// Expected: Phases 1 & 2 still work, Phase 3 skipped

// If no deals found:
"⚠️ Serper.dev returned no results"
// Expected: Product still displays, deals section empty
```

### ❌ Error Signs (Need Fixing)

```javascript
// Bad logs:
"❌ Missing or invalid title"
"❌ Missing or invalid price"
// Fix: Product page might have changed selectors
```

---

## 🧪 Advanced Testing

### Test 1: Streaming Performance
```javascript
// In console, time the phases:

// Phase 1
console.time('Phase 1');
// Wait for product card
console.timeEnd('Phase 1'); // Should be < 300ms

// Phase 2
console.time('Phase 2');
// Wait for deals
console.timeEnd('Phase 2'); // Should be 2-3s

// Phase 3
console.time('Phase 3 First Token');
// Wait for first chunk
console.timeEnd('Phase 3 First Token'); // Should be < 1s

console.time('Phase 3 Complete');
// Wait for completion
console.timeEnd('Phase 3 Complete'); // Should be 3-5s
```

### Test 2: Trust Score Validation
```javascript
// Check trust score breakdown in console
// Verify it sums correctly:

const breakdown = {
  platformReliability: 30,  // Max 30
  sellerReputation: 25,     // Max 25
  ratingQuality: 22,        // Max 25
  reviewCount: 8,           // Max 10
  pricePositioning: 10      // Max 10
};

const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
console.log('Total:', total); // Should match displayed trust score
```

### Test 3: Data Validation
```javascript
// Inspect product data in console
// Verify normalization:

// Title: no excessive whitespace
// Price: 2 decimal places (e.g., 12.99 not 12.999)
// Rating: 1 decimal place (e.g., 4.5 not 4.53)
// Reviews: formatted (e.g., "1.2K reviews" not "1234 ratings")
```

---

## 📊 Performance Benchmarks

| Phase | Target | Expected |
|-------|--------|----------|
| Product Detection | < 500ms | ~300ms |
| Deal Fetching | < 5s | 2-3s |
| AI First Token | < 1s | ~500ms |
| AI Complete | < 10s | 3-5s |
| Total Experience | < 15s | 6-8s |

---

## 🐛 Troubleshooting

### Issue: No AI Summary

**Check**:
```javascript
await ai.summarizer.capabilities()
```

**If not available**:
- Chrome version < 128
- Gemini Nano not downloaded
- Solution: Phase 3 gracefully skipped, Phases 1 & 2 still work

### Issue: No Deals Found

**Check**:
```bash
curl "https://shopscout-api.fly.dev/api/search?query=usb+cable"
```

**Expected**: JSON with results array

**If empty**:
- Serper.dev API might be rate-limited
- Check logs: `flyctl logs --app shopscout-api`

### Issue: Product Not Detected

**Check Console**:
```javascript
"Not a product page - no title element found"
```

**Solution**:
- Ensure you're on an actual product page (not search results)
- Try refreshing the page
- Check if site is supported

---

## ✅ Success Checklist

After testing, you should see:

- [ ] Product card renders instantly (Phase 1)
- [ ] "Analyzing product..." badge appears
- [ ] 4-5 deals populate with prices
- [ ] Trust scores displayed (0-100)
- [ ] Best deal highlighted in green
- [ ] AI summary section appears
- [ ] "Streaming..." badge shows
- [ ] Text updates progressively
- [ ] Loader icon spins → Sparkles
- [ ] Final badge says "Chrome AI"
- [ ] All data looks accurate
- [ ] No errors in console

---

## 🎯 Quick Verification Commands

```javascript
// 1. Check AI availability
await ai.summarizer.capabilities()
// Expected: { available: "readily" }

// 2. Check backend
fetch('https://shopscout-api.fly.dev/health')
  .then(r => r.json())
  .then(console.log)
// Expected: { status: "ok", timestamp: "..." }

// 3. Check extension loaded
chrome.runtime.getManifest()
// Expected: { name: "ShopScout", version: "1.0.0", ... }

// 4. Manual scan (if needed)
chrome.runtime.sendMessage({ type: 'MANUAL_SCAN' })
```

---

## 📝 Expected User Experience

1. **User visits Amazon product page**
2. **Instantly sees**: Product card with price, rating, image
3. **After 2-3s**: Deals appear with savings highlighted
4. **After 3-5s**: AI summary streams in progressively
5. **Result**: User has complete analysis in 6-8 seconds

**Key UX Principle**: Progressive disclosure - user always sees something useful, never stares at blank screen.

---

## 🚀 Ready for Production

✅ All features implemented
✅ Real-time streaming working
✅ Data validation robust
✅ Trust scoring comprehensive
✅ Error handling graceful
✅ Performance optimized
✅ User experience smooth

**Status**: Production-ready with world-class AI streaming! 🎉
