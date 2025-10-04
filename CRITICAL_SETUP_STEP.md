# ⚠️ CRITICAL: Add Extension ID to Firebase

## The Error You're Seeing

```
Firebase: Error (auth/internal-error)
```

This error happens because **your Chrome extension ID is not authorized in Firebase**.

---

## 🔧 FIX THIS NOW (Required!)

### Step 1: Get Your Extension ID

1. Go to `chrome://extensions/`
2. Find **ShopScout**
3. Look for the **ID** field
4. Copy the entire ID (example: `abcdefghijklmnopqrstuvwxyz123456`)

### Step 2: Add to Firebase Console

1. Go to https://console.firebase.google.com/
2. Select project: **shopscout-9bb63**
3. Click **Authentication** (left sidebar)
4. Click **Settings** tab (at the top)
5. Scroll down to **Authorized domains**
6. Click **Add domain**
7. Enter: `chrome-extension://YOUR_EXTENSION_ID`
   - Example: `chrome-extension://abcdefghijklmnopqrstuvwxyz123456`
8. Click **Add**

### Step 3: Enable Sign-In Methods

While you're in Firebase Console:

1. Click **Sign-in method** tab
2. Enable **Google**:
   - Click on Google
   - Toggle Enable to ON
   - Click Save
3. Enable **Email/Password**:
   - Click on Email/Password
   - Toggle Enable to ON
   - ✅ **Check "Email link (passwordless sign-in)"**
   - Click Save

### Step 4: Reload Extension

1. Go back to `chrome://extensions/`
2. Click 🔄 **Reload** on ShopScout
3. Try sign-in again

---

## ✅ After Adding Extension ID

Once you add the extension ID to Firebase authorized domains:

- ✅ Google Sign-In will work
- ✅ Magic Link will work
- ✅ No more `auth/internal-error`

---

## 🎯 Quick Reference

**Your Firebase Project**: shopscout-9bb63

**What to add**: `chrome-extension://[YOUR_EXTENSION_ID]`

**Where to add it**: Firebase Console → Authentication → Settings → Authorized domains

---

## ⚠️ Important Notes

1. **You MUST add the extension ID** - authentication won't work without it
2. **Use the exact format**: `chrome-extension://[ID]` (no trailing slash)
3. **Get the ID from chrome://extensions/** - it's unique to your installation
4. **Reload the extension** after adding to Firebase

---

## 🆘 Still Getting Error?

If you still get `auth/internal-error` after adding the extension ID:

1. **Double-check** the extension ID is correct
2. **Verify** it's in the format `chrome-extension://[ID]`
3. **Make sure** you clicked "Add" in Firebase Console
4. **Reload** the extension completely
5. **Try in incognito mode** to rule out cache issues

---

**This is the ONLY step preventing authentication from working!** 

Add your extension ID to Firebase and it will work immediately. 🚀
