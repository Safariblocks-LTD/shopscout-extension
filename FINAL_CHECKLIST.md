# ✅ ShopScout Authentication - Final Checklist

## 🎯 Before You Start Testing

### 1. Firebase Console Setup (5 minutes)

#### Enable Email/Password Provider
- [ ] Go to https://console.firebase.google.com/
- [ ] Select project: **shopscout-9bb63**
- [ ] Click: **Authentication** (left sidebar)
- [ ] Click: **Sign-in method** tab
- [ ] Find: **Email/Password**
- [ ] Click on it to open settings
- [ ] Toggle: **Enable** to ON
- [ ] ✅ **CHECK the box**: "Email link (passwordless sign-in)"
- [ ] Click: **Save**

#### Add Extension to Authorized Domains
- [ ] Get extension ID from `chrome://extensions/`
- [ ] In Firebase Console: **Authentication** → **Settings** tab
- [ ] Scroll to: **Authorized domains** section
- [ ] Click: **Add domain**
- [ ] Enter: `chrome-extension://[YOUR_EXTENSION_ID]`
- [ ] Click: **Add**

### 2. Build Extension
- [ ] Run: `npm run build:extension`
- [ ] Verify: No build errors
- [ ] Check: `dist/offscreen.html` exists
- [ ] Check: `dist/offscreen.js` exists

### 3. Load Extension in Chrome
- [ ] Open: `chrome://extensions/`
- [ ] Enable: "Developer mode" (top right)
- [ ] Click: "Load unpacked"
- [ ] Select: `dist/` folder
- [ ] Verify: Extension loads without errors

---

## 🧪 Testing Checklist

### Test 1: Email + Password Sign Up
- [ ] Open ShopScout extension
- [ ] Click: **"Sign Up"** tab
- [ ] Enter email: `test@example.com`
- [ ] Enter password: `testpass123`
- [ ] Click: **"Create Account"**
- [ ] ✅ User signed in immediately
- [ ] ✅ Yellow verification banner appears
- [ ] ✅ User profile shows in header
- [ ] Check email for verification link (check spam!)
- [ ] ✅ Verification email received

### Test 2: Email Verification
- [ ] With user signed in from Test 1
- [ ] Verify: Yellow banner shows "Verify your email address"
- [ ] Click: **"Resend verification email"** in banner
- [ ] ✅ Success message appears
- [ ] Check email for new verification link
- [ ] Click: Verification link in email
- [ ] Reload: Extension
- [ ] ✅ Banner disappears

### Test 3: Sign Out and Sign In
- [ ] Click: Logout icon (top right)
- [ ] ✅ Back to auth screen
- [ ] Click: **"Sign In"** tab
- [ ] Enter: Same email and password
- [ ] Click: **"Sign In"**
- [ ] ✅ User signed in
- [ ] ✅ Profile restored

### Test 4: Magic Link
- [ ] Sign out if signed in
- [ ] Click: **"Magic Link"** tab
- [ ] Enter email: `magiclink@example.com`
- [ ] Click: **"Send Magic Link"**
- [ ] ✅ Success screen: "Check your email"
- [ ] Check email (including spam folder)
- [ ] ✅ Magic link email received
- [ ] Click: Link in email
- [ ] ✅ Extension opens and user signed in
- [ ] ✅ No verification banner (email auto-verified)

### Test 5: Session Persistence
- [ ] Sign in with any method
- [ ] Close: Extension popup
- [ ] Reopen: Extension
- [ ] ✅ Still signed in
- [ ] Close: Chrome completely
- [ ] Reopen: Chrome
- [ ] Open: Extension
- [ ] ✅ Still signed in

### Test 6: Error Handling
- [ ] Try signing up with weak password (< 6 chars)
- [ ] ✅ Error: "Password should be at least 6 characters"
- [ ] Try signing up with existing email
- [ ] ✅ Error: "This email is already registered"
- [ ] Try signing in with wrong password
- [ ] ✅ Error: "Invalid email or password"

---

## 🔍 Debug Checklist

### Background Console Check
- [ ] Open: `chrome://extensions/`
- [ ] Click: "service worker" link under ShopScout
- [ ] Try: Sign up
- [ ] Verify logs show:
  ```
  [Offscreen] Creating user with email: test@example.com
  [Offscreen] Verification email sent
  [Offscreen] User created successfully
  ```

### Extension Console Check
- [ ] Right-click: ShopScout icon
- [ ] Click: Inspect
- [ ] Check: No errors in console
- [ ] Try: Authentication flows
- [ ] Verify: No error messages

---

## 📧 Email Checklist

### Verification Email
- [ ] From: `noreply@shopscout-9bb63.firebaseapp.com`
- [ ] Subject: Contains "Verify your email"
- [ ] Received: Within 1-3 minutes
- [ ] Location: Check spam/junk folder
- [ ] Link: Works and verifies email

### Magic Link Email
- [ ] From: `noreply@shopscout-9bb63.firebaseapp.com`
- [ ] Subject: Contains "Sign in to"
- [ ] Received: Within 1-3 minutes
- [ ] Location: Check spam/junk folder
- [ ] Link: Opens extension and signs in

---

## 🐛 Troubleshooting

### If emails not received:
- [ ] Check spam/junk folder
- [ ] Wait 3 minutes
- [ ] Verify Email/Password is enabled in Firebase
- [ ] Verify "Email link" checkbox is checked
- [ ] Check Firebase Console → Authentication → Users for errors

### If authentication fails:
- [ ] Reload extension at `chrome://extensions/`
- [ ] Check background console for errors
- [ ] Verify offscreen.html exists in dist/
- [ ] Verify offscreen.js exists in dist/
- [ ] Rebuild: `npm run build:extension`

### If "Unauthorized domain" error:
- [ ] Get extension ID from `chrome://extensions/`
- [ ] Add `chrome-extension://[ID]` to Firebase authorized domains
- [ ] Reload extension

---

## ✅ Success Criteria

All these should work:
- ✅ Sign up creates user and sends verification email
- ✅ Sign in works with correct credentials
- ✅ Magic link sends email and signs in user
- ✅ Verification banner appears for unverified users
- ✅ Verification banner disappears after verification
- ✅ Resend verification email works
- ✅ Error messages are clear and helpful
- ✅ Session persists across browser restarts
- ✅ UI is responsive and shows loading states
- ✅ All emails are delivered (check spam)

---

## 🎉 When All Tests Pass

**Your authentication system is:**
- ✅ Fully functional
- ✅ Production ready
- ✅ Secure
- ✅ User-friendly
- ✅ Well-documented

**Next steps:**
1. Deploy to production
2. Monitor user feedback
3. Iterate and improve

---

## 📚 Reference Documents

- **AUTH_SETUP_COMPLETE.md** - Complete implementation details
- **FIREBASE_QUICK_SETUP.md** - 5-minute Firebase setup
- **TEST_AUTH_FLOWS.md** - Detailed testing guide
- **AUTHENTICATION_READY.md** - Quick reference

---

**Ready to test? Start with Firebase setup above!** 🚀

**Estimated time to complete all tests: 15-20 minutes**
