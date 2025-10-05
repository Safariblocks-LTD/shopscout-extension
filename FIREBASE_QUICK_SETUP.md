# 🔥 Firebase Console Quick Setup (5 Minutes)

## ⚡ Quick Start

### Step 1: Enable Email/Password (2 minutes)

1. Open: https://console.firebase.google.com/
2. Select: **shopscout-9bb63**
3. Click: **Authentication** (left sidebar)
4. Click: **Sign-in method** tab
5. Find: **Email/Password**
6. Click on it
7. Toggle: **Enable** → ON
8. ✅ **CHECK**: "Email link (passwordless sign-in)"
9. Click: **Save**

**✅ Done!** Email/Password and Magic Link are now enabled.

---

### Step 2: Add Extension to Authorized Domains (3 minutes)

#### Get Your Extension ID
1. Open: `chrome://extensions/`
2. Find: **ShopScout**
3. Copy: The ID (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

#### Add to Firebase
1. In Firebase Console: **Authentication** → **Settings** tab
2. Scroll to: **Authorized domains**
3. Click: **Add domain**
4. Enter: `chrome-extension://[YOUR_EXTENSION_ID]`
   - Replace `[YOUR_EXTENSION_ID]` with the ID you copied
5. Click: **Add**

**✅ Done!** Extension can now authenticate.

---

## 🧪 Test It Works

### Test Sign Up
1. Reload extension: `chrome://extensions/` → Reload ShopScout
2. Open ShopScout extension
3. Click: **Sign Up** tab
4. Enter: Your email + password (6+ characters)
5. Click: **Create Account**
6. ✅ Should sign in immediately
7. Check email for verification link

### Test Magic Link
1. Sign out from ShopScout
2. Click: **Magic Link** tab
3. Enter: Your email
4. Click: **Send Magic Link**
5. Check email (including spam)
6. Click link in email
7. ✅ Should sign in automatically

---

## 📧 Email Troubleshooting

### Not receiving emails?

**Check these:**
- [ ] Email/Password provider is **Enabled** in Firebase
- [ ] "Email link (passwordless sign-in)" is **Checked**
- [ ] Extension ID is in **Authorized domains**
- [ ] Check **spam/junk** folder
- [ ] Wait **2-3 minutes** for delivery

**Email details:**
- From: `noreply@shopscout-9bb63.firebaseapp.com`
- Delivery: 30 seconds - 3 minutes
- Check spam folder first!

---

## 🎯 Verification

### How to verify setup is correct:

1. **Firebase Console** → **Authentication** → **Sign-in method**
   - Email/Password: **Enabled** ✅
   - Email link checkbox: **Checked** ✅

2. **Firebase Console** → **Authentication** → **Settings**
   - Authorized domains includes:
     - `localhost` ✅
     - `shopscout-9bb63.firebaseapp.com` ✅
     - `chrome-extension://[YOUR_ID]` ✅

3. **Extension**
   - Reload: `chrome://extensions/` → Reload
   - Open: ShopScout extension
   - Test: Sign up with test email
   - Result: Should sign in successfully ✅

---

## 🚨 Common Issues

### "Unauthorized domain" error
**Fix**: Add your extension ID to Firebase authorized domains

### "Invalid email" error
**Fix**: Check email format is correct (e.g., `user@example.com`)

### "Weak password" error
**Fix**: Use at least 6 characters for password

### "Email already in use" error
**Fix**: Use "Sign In" tab instead of "Sign Up"

### No email received
**Fix**: 
1. Check spam folder
2. Wait 2-3 minutes
3. Verify Email/Password is enabled in Firebase
4. Verify "Email link" checkbox is checked

---

## ✅ That's It!

Your authentication is now fully configured and ready to use! 🎉

**Total setup time: ~5 minutes**

For detailed documentation, see: `AUTH_SETUP_COMPLETE.md`
