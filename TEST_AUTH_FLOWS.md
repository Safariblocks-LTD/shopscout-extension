# 🧪 Authentication Testing Guide

## Pre-Testing Setup

### 1. Firebase Console Configuration
- [ ] Email/Password provider **Enabled**
- [ ] "Email link (passwordless sign-in)" **Checked**
- [ ] Extension ID added to authorized domains

### 2. Extension Setup
```bash
# Build the extension
npm run build:extension

# Load in Chrome
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the dist/ folder
```

### 3. Open Consoles for Debugging
```
Background Console:
  chrome://extensions/ → ShopScout → "service worker" link

Extension Console:
  Right-click ShopScout icon → Inspect
```

---

## Test Flow 1: Email + Password Sign Up

### Steps
1. Open ShopScout extension
2. Verify you see the auth screen with 3 tabs
3. Click **"Sign Up"** tab
4. Enter test email: `test@example.com`
5. Enter password: `testpass123` (6+ characters)
6. Click **"Create Account"** button

### Expected Results
- ✅ Loading spinner appears
- ✅ Background console shows:
  ```
  [ShopScout] Setting up offscreen document for auth...
  [Offscreen] Creating user with email: test@example.com
  [Offscreen] Verification email sent
  [Offscreen] User created successfully
  ```
- ✅ User is signed in immediately
- ✅ Extension shows main interface
- ✅ User profile appears in header
- ✅ **Yellow verification banner** appears at top
- ✅ Email received with verification link

### Check Email
- **From**: noreply@shopscout-9bb63.firebaseapp.com
- **Subject**: "Verify your email for shopscout-9bb63"
- **Time**: Within 1-3 minutes
- **Location**: Check spam/junk folder

---

## Test Flow 2: Email Verification

### Steps
1. With user signed in (from Test Flow 1)
2. Verify yellow banner shows: "Verify your email address"
3. Click **"Resend verification email"** in banner
4. Check email for new verification link
5. Click verification link in email
6. Return to extension and reload

### Expected Results
- ✅ "Resend" shows loading spinner
- ✅ Success message: "Verification email sent!"
- ✅ New email received
- ✅ After clicking link and reloading: **Banner disappears**
- ✅ User's `emailVerified` is now `true`

---

## Test Flow 3: Sign Out and Sign In

### Steps
1. Click the **logout icon** (top right)
2. Verify you're back to auth screen
3. Click **"Sign In"** tab
4. Enter same email: `test@example.com`
5. Enter same password: `testpass123`
6. Click **"Sign In"** button

### Expected Results
- ✅ Loading spinner appears
- ✅ Background console shows:
  ```
  [Offscreen] Signing in with email: test@example.com
  [Offscreen] Sign-in successful
  ```
- ✅ User is signed in
- ✅ Extension shows main interface
- ✅ User profile restored
- ✅ If email verified: No banner
- ✅ If email not verified: Banner appears

---

## Test Flow 4: Magic Link (Passwordless)

### Steps
1. Sign out if signed in
2. Click **"Magic Link"** tab
3. Enter email: `magiclink@example.com`
4. Click **"Send Magic Link"** button
5. Verify success screen appears
6. Check email for magic link
7. Click the link in email

### Expected Results
- ✅ Loading spinner appears
- ✅ Success screen: "Check your email"
- ✅ Background console shows:
  ```
  [Offscreen] Sending magic link to: magiclink@example.com
  [Offscreen] Magic link sent successfully
  ```
- ✅ Email received within 1-3 minutes
- ✅ Clicking link opens extension
- ✅ User is automatically signed in
- ✅ Email is automatically verified (emailVerified: true)
- ✅ No verification banner appears

### Check Email
- **From**: noreply@shopscout-9bb63.firebaseapp.com
- **Subject**: "Sign in to shopscout-9bb63"
- **Time**: Within 1-3 minutes
- **Location**: Check spam/junk folder

---

## Test Flow 5: Error Handling

### Test 5a: Weak Password
1. Click "Sign Up" tab
2. Enter email: `weak@example.com`
3. Enter password: `123` (too short)
4. Click "Create Account"

**Expected**: Error message: "Password should be at least 6 characters."

### Test 5b: Email Already Exists
1. Click "Sign Up" tab
2. Enter email: `test@example.com` (already used)
3. Enter password: `testpass123`
4. Click "Create Account"

**Expected**: Error message: "This email is already registered. Please sign in instead."

### Test 5c: Wrong Password
1. Click "Sign In" tab
2. Enter email: `test@example.com`
3. Enter password: `wrongpassword`
4. Click "Sign In"

**Expected**: Error message: "Invalid email or password."

### Test 5d: Invalid Email Format
1. Click "Sign Up" tab
2. Enter email: `notanemail`
3. Enter password: `testpass123`
4. Click "Create Account"

**Expected**: Browser validation error or Firebase error: "Please enter a valid email address."

---

## Test Flow 6: Session Persistence

### Steps
1. Sign in with any method
2. Close the extension popup
3. Reopen the extension
4. Close Chrome completely
5. Reopen Chrome
6. Open ShopScout extension

### Expected Results
- ✅ User remains signed in after closing popup
- ✅ User remains signed in after closing Chrome
- ✅ User profile loads immediately
- ✅ No need to sign in again
- ✅ Verification banner state persists

---

## Test Flow 7: Banner Dismissal

### Steps
1. Sign in with unverified email
2. Verify banner appears
3. Click **X** button to dismiss banner
4. Reload extension

### Expected Results
- ✅ Banner disappears when dismissed
- ✅ Banner reappears on reload (until email verified)
- ✅ Banner permanently disappears after email verification

---

## Debugging Checklist

### If Authentication Fails

1. **Check Background Console**
   ```
   chrome://extensions/ → "service worker" link
   Look for error messages
   ```

2. **Check Firebase Console**
   ```
   Authentication → Users
   Verify user was created
   ```

3. **Check Offscreen Document**
   ```
   Background console should show:
   [ShopScout] Setting up offscreen document for auth...
   [Offscreen] Document loaded and ready for authentication
   ```

4. **Verify Files Exist**
   ```bash
   ls dist/offscreen.html
   ls dist/offscreen.js
   ls dist/background.js
   ```

5. **Check Network Tab**
   ```
   Extension DevTools → Network
   Look for Firebase API calls
   ```

---

## Expected Console Output

### Successful Sign Up
```
[ShopScout] Background service worker initialized
[ShopScout] Message received: FIREBASE_AUTH
[ShopScout] Setting up offscreen document for auth...
[ShopScout] Sending message to offscreen: CREATE_USER_WITH_EMAIL
[Offscreen] Received message: {target: 'offscreen-auth', type: 'CREATE_USER_WITH_EMAIL', ...}
[Offscreen] Processing auth request: CREATE_USER_WITH_EMAIL
[Offscreen] Creating user with email: test@example.com
[Offscreen] Verification email sent
[Offscreen] User created successfully: {success: true, user: {...}}
[ShopScout] Received response from offscreen: {success: true, user: {...}}
```

### Successful Sign In
```
[ShopScout] Message received: FIREBASE_AUTH
[ShopScout] Setting up offscreen document for auth...
[ShopScout] Sending message to offscreen: SIGN_IN_WITH_EMAIL
[Offscreen] Processing auth request: SIGN_IN_WITH_EMAIL
[Offscreen] Signing in with email: test@example.com
[Offscreen] Sign-in successful: {success: true, user: {...}}
[ShopScout] Received response from offscreen: {success: true, user: {...}}
```

### Successful Magic Link Send
```
[ShopScout] Message received: FIREBASE_AUTH
[ShopScout] Setting up offscreen document for auth...
[ShopScout] Sending message to offscreen: SEND_MAGIC_LINK
[Offscreen] Processing auth request: SEND_MAGIC_LINK
[Offscreen] Sending magic link to: test@example.com
[Offscreen] Action code settings: {url: 'chrome-extension://...', handleCodeInApp: true}
[Offscreen] Magic link sent successfully to: test@example.com
[ShopScout] Received response from offscreen: {success: true}
```

---

## Performance Benchmarks

### Expected Timing
- **Sign Up**: 1-2 seconds
- **Sign In**: 1-2 seconds
- **Magic Link Send**: 1-2 seconds
- **Email Delivery**: 30 seconds - 3 minutes
- **Verification Email**: 30 seconds - 3 minutes

### If Slower Than Expected
- Check internet connection
- Check Firebase Console for issues
- Check background console for errors
- Verify offscreen document is loading correctly

---

## Success Criteria

### All Tests Pass When:
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

## Troubleshooting Common Issues

### Issue: "No response from background script"
**Solution**: Reload extension at `chrome://extensions/`

### Issue: Emails not received
**Solution**: 
1. Check spam folder
2. Wait 3 minutes
3. Verify Firebase Email/Password is enabled
4. Verify "Email link" checkbox is checked

### Issue: "Unauthorized domain"
**Solution**: Add extension ID to Firebase authorized domains

### Issue: Offscreen document errors
**Solution**: 
1. Verify offscreen.html exists in dist/
2. Verify offscreen.js exists in dist/
3. Rebuild: `npm run build:extension`

### Issue: User not persisting
**Solution**: Check chrome.storage.local permissions in manifest.json

---

## Final Verification

After completing all tests:

1. **Firebase Console Check**
   - Go to Authentication → Users
   - Verify test users are created
   - Check email verification status

2. **Extension Check**
   - Sign in/out multiple times
   - Verify smooth experience
   - Check for any console errors

3. **Email Check**
   - Verify all emails received
   - Check spam folder
   - Verify links work correctly

4. **Production Ready**
   - All tests pass ✅
   - No console errors ✅
   - Emails delivered ✅
   - UI works smoothly ✅

---

**Your authentication system is fully tested and ready for production!** 🎉
