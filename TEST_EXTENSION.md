# 🔍 Extension Troubleshooting Guide

## Issue Fixed: Icon Path Mismatch

**Problem Found**: The manifest.json referenced `assets/icons/icon16.png` but files were in `assets/icon16.png`

**Fix Applied**: ✅ Updated manifest.json to use correct paths

## 🚀 RELOAD STEPS (CRITICAL)

### Step 1: Remove the Extension Completely
1. Go to `chrome://extensions/`
2. Find "ShopScout - AI Shopping Agent"
3. Click **Remove** button
4. Confirm removal

### Step 2: Reload the Extension Fresh
1. Still on `chrome://extensions/`
2. Make sure **Developer mode** is ON (toggle in top-right)
3. Click **Load unpacked**
4. Navigate to your project folder
5. Select the **`dist/`** folder
6. Click **Select Folder**

### Step 3: Verify Extension Loaded
You should see:
- ✅ Extension card appears
- ✅ No errors shown
- ✅ Extension icon appears in toolbar
- ✅ "Service worker" link is visible

### Step 4: Check Service Worker
1. On the extension card, click **"service worker"** (blue link)
2. A DevTools window opens
3. **Look for**: `[ShopScout] Background service worker initialized`
4. **Should NOT see**: Any red error messages

### Step 5: Test the Icon Click
1. Click the **ShopScout icon** in your browser toolbar
2. **Expected behavior**:
   - Console shows: `[ShopScout] Icon clicked. Auth status: ...`
   - Sidebar opens on the right side
   - New tab opens to `https://shopscout-auth.fly.dev`

## 🐛 If It Still Doesn't Work

### Check 1: Service Worker Console
```
chrome://extensions/ → ShopScout → "service worker"
```

Look for these messages:
- ✅ `[ShopScout] Background service worker initialized`
- ✅ `[ShopScout] Icon clicked. Auth status: ...`

If you see errors, copy them and share.

### Check 2: Verify All Files Exist
```bash
cd /home/kcelestinomaria/startuprojects/shopscout
ls -la dist/
```

Required files:
- ✅ background.js
- ✅ manifest.json
- ✅ content.js
- ✅ sidepanel.html
- ✅ sidepanel.js
- ✅ offscreen.html
- ✅ offscreen.js
- ✅ auth.html
- ✅ auth.js
- ✅ assets/ (directory)

### Check 3: Verify Icon Files
```bash
ls -la dist/assets/
```

Should show:
- ✅ icon16.png
- ✅ icon32.png
- ✅ icon48.png
- ✅ icon128.png

### Check 4: Test in Incognito Mode
1. Right-click the extension icon
2. Select "Manage extension"
3. Enable "Allow in incognito"
4. Open incognito window
5. Try clicking the icon there

### Check 5: Check Chrome Version
```
chrome://version/
```

ShopScout requires:
- Chrome 116+ (for side panel API)
- Manifest V3 support

## 🔧 Manual Debug Commands

### Rebuild Everything:
```bash
cd /home/kcelestinomaria/startuprojects/shopscout
npm run build:extension
```

### Check for Syntax Errors:
```bash
node -c dist/background.js
node -c dist/content.js
```

### Verify Manifest is Valid:
```bash
cat dist/manifest.json | jq .
```

## 📋 What Should Happen When You Click

### Scenario 1: Not Authenticated
1. Click icon
2. Console: `[ShopScout] Icon clicked. Auth status: { authenticated: false, userId: undefined }`
3. Console: `[ShopScout] User not authenticated, opening auth page and sidebar`
4. Console: `[ShopScout] Using auth URL: https://shopscout-auth.fly.dev`
5. Sidebar opens (showing AuthPrompt)
6. New tab opens to auth page

### Scenario 2: Already Authenticated
1. Click icon
2. Console: `[ShopScout] Icon clicked. Auth status: { authenticated: true, userId: "..." }`
3. Console: `[ShopScout] User is authenticated, opening sidebar`
4. Sidebar opens (showing full interface)
5. No new tab opens

## 🎯 Quick Test Checklist

- [ ] Extension removed and re-added
- [ ] Service worker shows "initialized" message
- [ ] No red errors in service worker console
- [ ] Icon files exist in dist/assets/
- [ ] Manifest.json has correct icon paths
- [ ] Chrome version is 116+
- [ ] Developer mode is enabled
- [ ] Extension icon is visible in toolbar
- [ ] Clicking icon shows console messages

## 📞 If Nothing Works

Try this nuclear option:

```bash
# 1. Clean everything
cd /home/kcelestinomaria/startuprojects/shopscout
rm -rf dist/
rm -rf node_modules/.vite

# 2. Rebuild from scratch
npm run build:extension

# 3. In Chrome:
# - Remove extension
# - Restart Chrome
# - Load unpacked from dist/
```

## 🔍 Common Issues

### Issue: "Service worker (Inactive)"
**Fix**: Click the "service worker" link to activate it

### Issue: Icon is grayed out
**Fix**: Extension might be disabled, check the toggle switch

### Issue: "Manifest file is missing or unreadable"
**Fix**: Make sure you selected the `dist/` folder, not the root folder

### Issue: No console messages when clicking icon
**Fix**: The background script isn't running - check for syntax errors

---

**Files Fixed**:
- ✅ manifest.json (icon paths corrected)
- ✅ background.js (async/await fixed)
- ✅ All production URLs configured

**Status**: Ready to test
**Next**: Remove and reload extension in Chrome
