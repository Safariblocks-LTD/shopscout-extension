# 🔧 Authentication Troubleshooting Guide

## Issue Fixed: `auth/internal-error` with Google Sign-In

### Problem
The `signInWithPopup()` method doesn't work reliably in Chrome extension context, causing `auth/internal-error`.

### Solution Applied
Changed from `signInWithPopup()` to `signInWithRedirect()` which works better in extensions.

### What Was Changed
- Updated `src/contexts/AuthContext.tsx`
- Now uses `signInWithRedirect()` instead of `signInWithPopup()`
- Added `getRedirectResult()` handler to process the redirect callback

---

## Testing the Fix

### 1. Reload the Extension
```
1. Go to chrome://extensions/
2. Find ShopScout
3. Click the 🔄 Reload button
```

### 2. Test Google Sign-In
```
1. Click ShopScout icon
2. Click "Continue with Google"
3. You'll be redirected to Google's sign-in page
4. Select your Google account
5. You'll be redirected back to the extension
6. ✅ You should be signed in!
```

---

## Common Firebase Auth Errors

### `auth/internal-error`
**Cause**: Usually popup-based auth in extension context  
**Solution**: ✅ Fixed by using redirect method

### `auth/unauthorized-domain`
**Cause**: Extension domain not in Firebase authorized domains  
**Solution**:
1. Go to Firebase Console
2. Authentication → Settings → Authorized domains
3. Add: `chrome-extension://[YOUR_EXTENSION_ID]`
4. Also add: `[YOUR_EXTENSION_ID].chromiumapp.org`

### `auth/popup-blocked`
**Cause**: Browser blocking popup windows  
**Solution**: Not applicable anymore (we use redirect now)

### `auth/operation-not-allowed`
**Cause**: Google provider not enabled in Firebase  
**Solution**:
1. Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Save changes

### `auth/invalid-api-key`
**Cause**: Wrong API key in firebase config  
**Solution**: Verify `src/config/firebase.ts` has correct credentials

---

## Verification Checklist

After reloading the extension, verify:

- [ ] Extension reloaded successfully
- [ ] No console errors on extension load
- [ ] Auth screen appears
- [ ] "Continue with Google" button works
- [ ] Redirects to Google sign-in page
- [ ] After signing in, redirects back to extension
- [ ] User is authenticated
- [ ] Main app content appears
- [ ] Sign-out button works

---

## Alternative: Use Magic Link Instead

If Google Sign-In still has issues, use Magic Link:

1. Click "Sign in with Magic Link"
2. Enter your email
3. Check your email inbox
4. Click the link
5. ✅ Signed in!

Magic Link is more reliable in extension context.

---

## Debug Mode

To see detailed error messages:

1. Right-click extension icon → Inspect
2. Go to Console tab
3. Try signing in again
4. Check for error messages
5. Share the error if you need help

---

## Firebase Console Checklist

Ensure these are configured:

### Authentication → Sign-in method
- [x] Google provider: **Enabled**
- [x] Email/Password: **Enabled**
- [x] Email link (passwordless): **Checked**

### Authentication → Settings → Authorized domains
- [x] `localhost`
- [x] `shopscout-9bb63.firebaseapp.com`
- [x] `chrome-extension://[YOUR_EXTENSION_ID]`
- [x] `[YOUR_EXTENSION_ID].chromiumapp.org`

### Google Cloud Console (if using Google Sign-In)
- [x] OAuth consent screen configured
- [x] Test users added (if in testing mode)

---

## Still Having Issues?

### Check Browser Console
```javascript
// Open DevTools on extension
// Look for these errors:
- "Firebase: Error (auth/...)"
- "Chrome runtime error"
- Network errors
```

### Verify Firebase Config
```typescript
// src/config/firebase.ts should have:
const firebaseConfig = {
  apiKey: "AIzaSyCrApKcweIjfoaKCPh3IRqTAMyTi65KdG0",
  authDomain: "shopscout-9bb63.firebaseapp.com",
  projectId: "shopscout-9bb63",
  // ... rest of config
};
```

### Check Manifest Permissions
```json
// manifest.json should have:
{
  "permissions": ["identity", "storage"],
  "host_permissions": [
    "https://*.googleapis.com/*",
    "https://*.firebaseapp.com/*",
    "https://*.google.com/*"
  ]
}
```

---

## Next Steps

1. **Reload extension** with the fix
2. **Test Google Sign-In** (should work now with redirect)
3. **Test Magic Link** (as backup)
4. **Verify session persistence** (close/reopen extension)

The redirect method is more reliable for Chrome extensions! 🚀
