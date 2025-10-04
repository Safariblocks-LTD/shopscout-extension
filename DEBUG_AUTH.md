# 🐛 Debug Authentication Issues

## Current Error: "Cannot read properties of null (reading 'success')"

This error means the background script isn't responding. Let's debug it step by step.

---

## 🔍 Step 1: Check Background Script

1. **Open background script console**:
   ```
   1. Go to chrome://extensions/
   2. Find ShopScout
   3. Click "service worker" (blue link)
   4. This opens the background script console
   ```

2. **Look for these messages**:
   - ✅ `[ShopScout] Background service worker initialized`
   - ✅ `[ShopScout] Setting up offscreen document for auth...`
   - ✅ `[ShopScout] Sending message to offscreen: GOOGLE_SIGN_IN`
   - ✅ `[ShopScout] Received response from offscreen: {...}`

3. **If you see errors**:
   - Note the exact error message
   - Check if offscreen document failed to create

---

## 🔍 Step 2: Check Offscreen Document

1. **Look for offscreen document**:
   ```
   1. In background console, look for:
      "Offscreen document loaded and ready for authentication"
   2. If missing, offscreen.js didn't load
   ```

2. **Check if files exist**:
   ```bash
   ls -la dist/offscreen.*
   ```
   Should show:
   - `offscreen.html`
   - `offscreen.js`

---

## 🔍 Step 3: Test Message Flow

1. **Reload extension**:
   ```
   chrome://extensions/ → 🔄 Reload
   ```

2. **Open extension**:
   ```
   Click ShopScout icon
   ```

3. **Open DevTools**:
   ```
   Right-click extension → Inspect
   ```

4. **Try sign-in and watch console**:
   - Click "Continue with Google"
   - Check both consoles (extension + background)
   - Look for error messages

---

## 🔧 Common Fixes

### Fix 1: Reload Extension

```
1. chrome://extensions/
2. Find ShopScout
3. Click 🔄 Reload
4. Try again
```

### Fix 2: Check Manifest Permission

Open `manifest.json` and verify:
```json
"permissions": [
  "offscreen"  ← Must be present
]
```

### Fix 3: Verify Offscreen Files

```bash
# Check if files exist in dist/
ls dist/offscreen.html
ls dist/offscreen.js

# If missing, rebuild:
npm run build:extension
```

### Fix 4: Clear Extension Data

```
1. chrome://extensions/
2. Click "Remove" on ShopScout
3. Reload the page
4. Click "Load unpacked"
5. Select dist/ folder
```

---

## 📊 Expected Console Output

### Background Console (service worker):
```
[ShopScout] Background service worker initialized
[ShopScout] Message received: FIREBASE_AUTH
[ShopScout] Setting up offscreen document for auth...
[ShopScout] Sending message to offscreen: GOOGLE_SIGN_IN
Offscreen document loaded and ready for authentication
[ShopScout] Received response from offscreen: {success: true, user: {...}}
```

### Extension Console (DevTools):
```
(No errors - just successful sign-in)
```

---

## 🚨 Error Messages & Solutions

### Error: "Failed to create offscreen document"

**Cause**: Missing offscreen permission or files

**Fix**:
1. Check manifest.json has "offscreen" permission
2. Verify offscreen.html and offscreen.js exist in dist/
3. Rebuild: `npm run build:extension`
4. Reload extension

### Error: "No response from background script"

**Cause**: Background script not running or crashed

**Fix**:
1. Go to chrome://extensions/
2. Check if "service worker" link is present
3. If it says "inactive", click it to wake it up
4. Try sign-in again

### Error: "Unauthorized domain"

**Cause**: Extension ID not in Firebase authorized domains

**Fix**:
1. Get extension ID from chrome://extensions/
2. Add to Firebase Console → Authentication → Settings → Authorized domains
3. Format: `chrome-extension://[YOUR_ID]`

---

## 🧪 Manual Test

Try this in the background console:

```javascript
// Test offscreen document creation
async function testOffscreen() {
  try {
    await chrome.offscreen.createDocument({
      url: '/offscreen.html',
      reasons: ['DOM_SCRAPING'],
      justification: 'test'
    });
    console.log('✅ Offscreen created successfully');
  } catch (error) {
    console.error('❌ Offscreen creation failed:', error);
  }
}

testOffscreen();
```

---

## 📝 Checklist Before Testing

- [ ] Extension reloaded in Chrome
- [ ] offscreen.html exists in dist/
- [ ] offscreen.js exists in dist/
- [ ] "offscreen" permission in manifest.json
- [ ] Background service worker is active
- [ ] No console errors on load

---

## 🆘 Still Not Working?

1. **Check browser console** (F12) for errors
2. **Check background console** (service worker link)
3. **Verify all files copied** to dist/
4. **Try removing and re-adding** the extension
5. **Check Firebase Console** for any errors

---

## 📸 What to Check

Take screenshots of:
1. Background console output
2. Extension console output (DevTools)
3. Any error messages
4. Files in dist/ folder

This will help identify the exact issue!

---

**After following these steps, the exact error will be visible in the console logs.** 🔍
