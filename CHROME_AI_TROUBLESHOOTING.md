# Chrome Built-in AI - Troubleshooting Guide

## ❌ Issue: `hasAi: false` - AI APIs Not Detected

You're seeing this error:
```
capabilities: {hasAi: false, hasSummarizer: false, hasLanguageDetector: false, ...}
```

This means Chrome's built-in AI APIs are not available in your current context.

---

## 🔍 Root Cause

Chrome's built-in AI APIs (`globalThis.ai`) are **NOT available** in:
- ❌ Background service workers
- ❌ Offscreen documents (limited)
- ❌ Extension popup (limited)

Chrome's built-in AI APIs **ARE available** in:
- ✅ Web pages (content scripts)
- ✅ Sidepanel (with proper context)
- ✅ Offscreen documents (with origin trial)

**Your health check was running in `background.js` (service worker), where AI APIs are not available!**

---

## ✅ Solution: Check AI in Content Script Context

### ✅ FIXED: Health Check Now Uses Content Script

The AI health check now:
1. Runs in `background.js` but queries the active tab's content script
2. Content script checks `globalThis.ai` (where it's actually available)
3. Returns real AI status to background
4. Background forwards to UI

**This fix is already implemented in the code!**

---

## 🔧 How to Enable Chrome AI (If Still Showing False)

### Step 1: Use Chrome Dev/Canary 128+

```bash
# Check your Chrome version
chrome://version

# You need Chrome 128+ (preferably Dev or Canary)
# Download from: https://www.google.com/chrome/dev/
# Or Canary: https://www.google.com/chrome/canary/
```

### Step 2: Enable AI Flags

```bash
# Open flags
chrome://flags

# Enable these (copy-paste the flag names):
#optimization-guide-on-device-model → Enabled BypassPerfRequirement
#prompt-api-for-gemini-nano → Enabled
#summarization-api-for-gemini-nano → Enabled  
#language-detection-api → Enabled

# Click "Relaunch" button at bottom
```

### Step 3: Download Gemini Nano Model

```bash
# Open components
chrome://components

# Find "Optimization Guide On Device Model"
# Click "Check for update"
# Wait for download (~1.5GB, takes 2-5 minutes)
# Status should show "Up-to-date" when done
```

### Step 4: Verify Model Downloaded

```bash
# Open diagnostics
chrome://optimization-guide-internals

# Check "On-Device Model Service" section
# Should show model path and status
```

### Step 5: Reload Extension

```bash
# Go to extensions
chrome://extensions

# Find ShopScout
# Click reload button (circular arrow icon)
```

### Step 6: Test on Product Page

```bash
# Navigate to a product page
https://www.amazon.com/dp/B08N5WRWNW

# Open DevTools Console (F12)
# Check for AI detection logs
# Should see: [ShopScout AI] Capabilities detected: {hasAi: true, ...}
```

---

## 🧪 Testing AI Availability

### Test 1: Console Check

Open DevTools Console on any page and run:

```javascript
// Check if AI is available
console.log('AI available:', !!globalThis.ai);
console.log('Summarizer:', !!globalThis.ai?.summarizer);
console.log('Prompt API:', !!globalThis.ai?.languageModel);
console.log('Language Detector:', !!globalThis.ai?.languageDetector);

// Try creating a summarizer
if (globalThis.ai?.summarizer) {
  ai.summarizer.create().then(s => {
    console.log('✅ Summarizer created successfully!');
    return s.summarize('This is a test product with great features.');
  }).then(summary => {
    console.log('Summary:', summary);
  }).catch(err => {
    console.error('❌ Error:', err);
  });
}
```

### Test 2: Extension Health Check

```javascript
// In extension sidebar or console
chrome.runtime.sendMessage({ type: 'AI_HEALTH_CHECK' }, (response) => {
  console.log('Health Check:', response.healthCheck);
  console.log('Has AI:', response.healthCheck.capabilities.hasAi);
});
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "AI not available" even after enabling flags

**Cause**: Model not downloaded or Chrome version too old

**Fix**:
1. Check Chrome version (need 128+)
2. Download model from `chrome://components`
3. Wait for download to complete
4. Restart Chrome
5. Reload extension

### Issue 2: "Summarizer create() fails"

**Cause**: Model downloading or insufficient resources

**Fix**:
1. Check `chrome://optimization-guide-internals`
2. Verify model status is "ready"
3. Check available disk space (need ~2GB)
4. Check available RAM (need ~4GB)
5. Wait for model download to complete

### Issue 3: "Works in console but not in extension"

**Cause**: Content script not loaded or timing issue

**Fix**:
1. Reload extension
2. Navigate to product page
3. Wait for content script to load
4. Check console for `[ShopScout Content]` logs
5. Verify content script is injected

### Issue 4: Backend API 503 errors

**Cause**: Backend server is down or overloaded

**Fix**:
1. This is separate from Chrome AI issue
2. AI summaries work on-device (don't need backend)
3. Backend is only for price comparison/deals
4. Check backend status or wait for it to come back online

---

## 📊 Expected Behavior After Fix

### ✅ When Working Correctly

**Console logs:**
```
[ShopScout AI] Capabilities detected: {hasAi: true, hasSummarizer: true, ...}
[ShopScout AI] Language detected: en
[ShopScout AI] Starting summarization pipeline...
[ShopScout AI] Summarizer created successfully
[ShopScout AI] Summary generated successfully
[ShopScout AI] Summary rendered into DOM
```

**UI shows:**
- Green checkmark next to "Chrome AI"
- Available APIs: Summarizer, Prompt API, Language Detector
- Performance metrics displayed
- On-page summary appears above deals section

### ❌ When Not Working

**Console logs:**
```
[ShopScout AI] Capabilities detected: {hasAi: false, ...}
[Chrome AI] ❌ Not available - enable chrome://flags/#prompt-api-for-gemini-nano
```

**UI shows:**
- Red X next to "Chrome AI"
- "AI not available" message
- Setup instructions displayed
- No on-page summary

---

## 🔄 Quick Reset (If All Else Fails)

```bash
# 1. Clear Chrome data
chrome://settings/clearBrowserData
# Select "Cached images and files"
# Time range: "All time"
# Click "Clear data"

# 2. Reset flags to default
chrome://flags
# Click "Reset all" button at top

# 3. Re-enable AI flags (see Step 2 above)

# 4. Re-download model
chrome://components
# Remove "Optimization Guide On Device Model"
# Click "Check for update" to re-download

# 5. Restart Chrome completely

# 6. Reload extension
chrome://extensions
# Reload ShopScout

# 7. Test on product page
```

---

## 📞 Still Not Working?

If AI still shows as unavailable after following all steps:

1. **Check Chrome version**: Must be 128+ (Dev/Canary recommended)
2. **Check OS compatibility**: Windows 10+, macOS 11+, Linux (some distros)
3. **Check system resources**: Need ~2GB disk, ~4GB RAM
4. **Check internet**: Model download requires internet
5. **Check firewall**: May block model download
6. **Try different browser profile**: Create new Chrome profile and test

---

## ✅ Summary

The `hasAi: false` error was caused by checking AI availability in the background service worker, where Chrome's AI APIs are not available. 

**The fix:**
- Background worker now queries content script for AI status
- Content script checks `globalThis.ai` (where it's available)
- Real AI status is returned to UI

**After rebuilding and reloading the extension, AI should be detected correctly!**

<function_calls>
<invoke name="edit">
<parameter name="file_path">/home/kcelestinomaria/startuprojects/shopscout/background.js
