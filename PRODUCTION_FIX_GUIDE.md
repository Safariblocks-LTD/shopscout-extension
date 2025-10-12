# ShopScout Production Authentication Fix

## Issues Fixed

### 1. **Auth Server Using Localhost URLs**
- **Problem**: The auth page (`auth.js`) was hardcoded to sync with `http://localhost:3001` instead of production URLs
- **Fix**: Updated `auth.js` to use `https://shopscout-api.fly.dev` for backend sync
- **Files Changed**: `/auth-server/public/auth.js`

### 2. **Auth Data Clearing Too Quickly**
- **Problem**: The auth server was clearing authentication data after the first poll, causing the extension to miss it
- **Fix**: Extended auth data persistence to 60 seconds and delayed clearing for 5 seconds after first read
- **Files Changed**: `/auth-server/server.js`

### 3. **Improved Logging and Error Handling**
- **Problem**: Difficult to debug authentication issues
- **Fix**: Added comprehensive logging throughout the authentication flow
- **Files Changed**: 
  - `/background.js` - Better polling logs
  - `/src/App.tsx` - Sidebar authentication check logs

## Deployment Steps

### Step 1: Deploy Updated Auth Server

```bash
# Navigate to auth server directory
cd auth-server

# Deploy to Fly.io
fly deploy

# Verify deployment
fly status
fly logs
```

### Step 2: Rebuild Extension

```bash
# Navigate back to root
cd ..

# Build the extension
npm run build

# The built extension will be in the 'dist' folder
```

### Step 3: Load Updated Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Remove" on the old ShopScout extension
4. Click "Load unpacked"
5. Select the `dist` folder from your project
6. The extension should now be loaded with the fixes

### Step 4: Test Authentication Flow

1. Click the ShopScout extension icon
2. The sidebar should open showing "Authentication Required"
3. Click "Open Authentication Page" button
4. A new tab will open to `https://shopscout-auth.fly.dev`
5. Sign in with Google (or your preferred method)
6. After successful authentication:
   - You should see "✅ Authentication successful!" message
   - The auth tab should close automatically (or you can close it)
   - The sidebar should update within 2-4 seconds showing your profile
   - You should see your name and email in the sidebar header

## Verification

### Check Browser Console (Extension Background)
1. Go to `chrome://extensions/`
2. Find ShopScout and click "service worker" link
3. Look for these logs:
   ```
   [ShopScout] 🎉 Authentication detected from web page!
   [ShopScout] User: your-email@example.com
   [ShopScout] ✅ User data stored successfully in chrome.storage.local
   [ShopScout] Storage verification: {authenticated: true, userId: "...", userEmail: "..."}
   ```

### Check Sidebar Console
1. Right-click on the sidebar
2. Select "Inspect"
3. Look for these logs:
   ```
   [ShopScout Sidebar] Starting authentication check...
   [ShopScout Sidebar] Auth check result: {authenticated: true, ...}
   [ShopScout Sidebar] ✅ User authenticated: your-email@example.com
   ```

### Check Auth Server Logs
```bash
cd auth-server
fly logs
```

Look for:
```
[Auth Server] Check-auth request received
[Auth Server] Returning auth data for: your-email@example.com
[Auth Server] Auth data cleared after successful delivery
```

## Troubleshooting

### Issue: Sidebar Still Shows "Authentication Required"

**Solution 1: Check Storage**
1. Open DevTools on the sidebar
2. Go to Application > Storage > Local Storage
3. Look for `chrome-extension://[your-extension-id]`
4. Check if `authenticated`, `userId`, and `userEmail` keys exist

**Solution 2: Manual Storage Set**
If storage is empty, open the background service worker console and run:
```javascript
chrome.storage.local.get(null, (data) => console.log('All storage:', data));
```

**Solution 3: Clear and Retry**
```javascript
// In background service worker console
chrome.storage.local.clear();
// Then click the extension icon again and re-authenticate
```

### Issue: Auth Tab Doesn't Close

This is expected behavior if the sidebar can't be opened automatically. The auth is still successful. You can:
1. Manually close the auth tab
2. Click the extension icon to open the sidebar
3. The sidebar should now show your profile

### Issue: "CORS Error" in Console

This means the auth server isn't accepting requests from the extension. Check:
1. Auth server is running: `fly status`
2. CORS is properly configured in `server.js`
3. Extension has proper permissions in `manifest.json`

## Key Changes Summary

### `/auth-server/public/auth.js`
- Line 98: Changed from `http://localhost:3001` to `https://shopscout-api.fly.dev`
- Line 371: Updated console log message

### `/auth-server/server.js`
- Lines 58-73: Extended auth data persistence and delayed clearing
- Better error handling and logging

### `/background.js`
- Lines 710-831: Improved polling with better error handling
- Added storage verification logs
- Added 500ms delay for storage sync
- Better sidebar opening logic

### `/src/App.tsx`
- Lines 31-68: Added comprehensive logging for auth checks
- Better fallback for display name

## Production URLs

- **Auth Server**: `https://shopscout-auth.fly.dev`
- **Backend API**: `https://shopscout-api.fly.dev`
- **Database**: Supabase PostgreSQL (configured in backend)

## Next Steps

After successful authentication:
1. Navigate to any supported shopping site (Amazon, eBay, Walmart, etc.)
2. Click the extension icon
3. The sidebar should analyze the product and show deals
4. Your authentication will persist across browser sessions

## Support

If you continue to have issues:
1. Check all console logs (background, sidebar, auth page)
2. Verify Fly.io deployments are running: `fly status`
3. Check Fly.io logs: `fly logs` in both `auth-server` and `server` directories
4. Ensure your Firebase configuration is correct in `auth.js`
