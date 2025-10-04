# 🔧 Quick Fix Guide - Authentication Setup

## ✅ Build Complete!

The extension has been rebuilt with offscreen document support. Here's what you need to do:

---

## 🚀 Step-by-Step Setup

### 1. Get Your Extension ID

```
1. Go to chrome://extensions/
2. Find ShopScout extension
3. Copy the ID (looks like: abcdefghijklmnopqrstuvwxyz123456)
```

### 2. Add to Firebase Authorized Domains

**This is CRITICAL - authentication won't work without it!**

```
1. Go to https://console.firebase.google.com/
2. Select project: shopscout-9bb63
3. Click Authentication (left sidebar)
4. Click Settings tab
5. Scroll to "Authorized domains"
6. Click "Add domain"
7. Enter: chrome-extension://[YOUR_EXTENSION_ID]
   Example: chrome-extension://abcdefghijklmnopqrstuvwxyz123456
8. Click Add
```

### 3. Enable Google Sign-In

```
1. In Firebase Console, go to Authentication
2. Click "Sign-in method" tab
3. Find "Google" in the list
4. Click on it
5. Toggle "Enable" to ON
6. Click Save
```

### 4. Enable Magic Link (Email)

```
1. In "Sign-in method" tab
2. Find "Email/Password"
3. Click on it
4. Toggle "Enable" to ON
5. ✅ CHECK the box: "Email link (passwordless sign-in)"
6. Click Save
```

### 5. Reload Extension

```
1. Go to chrome://extensions/
2. Find ShopScout
3. Click the 🔄 Reload button
```

---

## 🧪 Test Authentication

### Test Google Sign-In

```
1. Click ShopScout extension icon
2. Click "Continue with Google"
3. Popup should open
4. Select your Google account
5. ✅ You should be signed in!
```

### Test Magic Link

```
1. Click "Sign in with Magic Link"
2. Enter your email
3. Click "Send Magic Link"
4. Check your inbox (wait 1-2 minutes)
5. Check spam folder if needed
6. Click link in email
7. ✅ You should be signed in!
```

---

## ⚠️ Common Issues & Fixes

### Issue: "Cannot read properties of null"

**Cause**: Offscreen files not loaded or Firebase domain not authorized

**Fix**:
1. Make sure extension is reloaded
2. Check that offscreen.html and offscreen.js exist in dist/
3. Add extension ID to Firebase authorized domains

### Issue: "Unauthorized domain" error

**Fix**:
1. Get extension ID from chrome://extensions/
2. Add chrome-extension://[ID] to Firebase authorized domains
3. Reload extension

### Issue: Google popup doesn't open

**Fix**:
1. Check browser console (F12) for errors
2. Make sure offscreen permission is in manifest.json
3. Verify Firebase Google provider is enabled

### Issue: Magic Link email not received

**Fix**:
1. Enable "Email link (passwordless sign-in)" in Firebase
2. Check spam/junk folder
3. Wait 2-3 minutes for delivery
4. Make sure Email/Password provider is enabled

---

## 📋 Verification Checklist

Before testing, make sure:

**Firebase Console:**
- [ ] Extension ID added to authorized domains
- [ ] Google sign-in enabled
- [ ] Email/Password enabled
- [ ] "Email link (passwordless sign-in)" checked

**Extension:**
- [ ] Extension reloaded in Chrome
- [ ] offscreen.html exists in dist/
- [ ] offscreen.js exists in dist/
- [ ] No console errors

---

## 🎯 Expected Behavior

### Google Sign-In
- Click button → Popup opens → Select account → Signed in ✅
- Time: 3-5 seconds

### Magic Link
- Enter email → Send → Check inbox → Click link → Signed in ✅
- Time: 1-3 minutes (email delivery)

### Session Persistence
- Close extension → Reopen → Still signed in ✅
- Close Chrome → Reopen → Still signed in ✅

---

## 📝 Files to Check

If you're still having issues, verify these files exist:

```
dist/
├── offscreen.html     ← Must exist
├── offscreen.js       ← Must exist
├── background.js      ← Updated with offscreen logic
├── manifest.json      ← Has "offscreen" permission
└── sidepanel.html     ← Main UI
```

---

## 🔍 Debug Steps

1. **Open Chrome DevTools**:
   - Right-click extension → Inspect
   - Check Console tab for errors

2. **Check Background Script**:
   - Go to chrome://extensions/
   - Click "service worker" under ShopScout
   - Check for errors

3. **Check Offscreen Document**:
   - Look for "Offscreen document loaded" message in background console
   - If missing, offscreen.js didn't load

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ No console errors
- ✅ Google popup opens when clicking button
- ✅ Magic Link email arrives in inbox
- ✅ User profile appears at top after sign-in
- ✅ Session persists across browser restarts

---

## 🆘 Still Not Working?

1. **Double-check extension ID** is in Firebase authorized domains
2. **Clear browser cache** and reload extension
3. **Try incognito mode** to rule out conflicts
4. **Check Firebase Console logs** for errors
5. **Verify all providers are enabled** in Firebase

---

**Once you add your extension ID to Firebase authorized domains and reload, everything should work!** 🚀
