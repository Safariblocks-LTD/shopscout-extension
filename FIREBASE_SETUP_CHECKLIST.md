# 🔥 Firebase Console Setup Checklist

Quick checklist to configure Firebase Authentication for ShopScout.

## Prerequisites
- [ ] Firebase account created
- [ ] Project **shopscout-9bb63** exists
- [ ] Extension loaded in Chrome (to get extension ID)

## Step-by-Step Setup

### 1️⃣ Access Firebase Console
- [ ] Go to https://console.firebase.google.com/
- [ ] Select project: **shopscout-9bb63**

### 2️⃣ Enable Google Sign-In

1. **Navigate to Authentication**
   - [ ] Click **Authentication** in left sidebar
   - [ ] Click **Sign-in method** tab

2. **Enable Google Provider**
   - [ ] Click on **Google** in the providers list
   - [ ] Toggle **Enable** switch to ON
   - [ ] Select support email from dropdown
   - [ ] Click **Save**

3. **Verify Configuration**
   - [ ] Google provider shows as "Enabled"

### 3️⃣ Enable Email Link Authentication

1. **Enable Email/Password Provider**
   - [ ] Click on **Email/Password** in providers list
   - [ ] Toggle **Enable** switch to ON
   - [ ] Check the box for **Email link (passwordless sign-in)**
   - [ ] Click **Save**

2. **Configure Email Templates** (Optional but Recommended)
   - [ ] Click **Templates** tab in Authentication
   - [ ] Click on **Email address sign-in**
   - [ ] Customize email subject and body
   - [ ] Click **Save**

### 4️⃣ Configure Authorized Domains

1. **Get Extension ID**
   - [ ] Open Chrome: `chrome://extensions/`
   - [ ] Find ShopScout extension
   - [ ] Copy the Extension ID (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

2. **Add Authorized Domains**
   - [ ] In Firebase Console, go to **Authentication** → **Settings**
   - [ ] Scroll to **Authorized domains** section
   - [ ] Click **Add domain**
   - [ ] Add: `chrome-extension://[YOUR_EXTENSION_ID]`
   - [ ] Replace `[YOUR_EXTENSION_ID]` with actual ID
   - [ ] Click **Add**

3. **Verify Default Domains**
   - [ ] `localhost` is listed (for development)
   - [ ] `shopscout-9bb63.firebaseapp.com` is listed
   - [ ] Your extension domain is listed

### 5️⃣ Optional: Configure OAuth Consent Screen (for Google Sign-In)

1. **Go to Google Cloud Console**
   - [ ] Visit https://console.cloud.google.com/
   - [ ] Select project: **shopscout-9bb63**

2. **Configure OAuth Consent**
   - [ ] Navigate to **APIs & Services** → **OAuth consent screen**
   - [ ] Select **External** user type
   - [ ] Fill in app information:
     - App name: **ShopScout**
     - User support email: Your email
     - Developer contact: Your email
   - [ ] Click **Save and Continue**

3. **Add Scopes**
   - [ ] Click **Add or Remove Scopes**
   - [ ] Add: `email`, `profile`, `openid`
   - [ ] Click **Update** → **Save and Continue**

4. **Add Test Users** (if in testing mode)
   - [ ] Add your email as test user
   - [ ] Click **Save and Continue**

### 6️⃣ Test Authentication

1. **Test Google Sign-In**
   - [ ] Open ShopScout extension
   - [ ] Click "Continue with Google"
   - [ ] Select Google account
   - [ ] Verify successful sign-in
   - [ ] Check user appears in Firebase Console → Authentication → Users

2. **Test Magic Link**
   - [ ] Click "Sign in with Magic Link"
   - [ ] Enter email address
   - [ ] Click "Send Magic Link"
   - [ ] Check email inbox
   - [ ] Click link in email
   - [ ] Verify successful sign-in

### 7️⃣ Security Rules (Optional)

1. **Set Up Firestore** (if storing user data)
   - [ ] Go to **Firestore Database**
   - [ ] Click **Create database**
   - [ ] Choose production mode
   - [ ] Select region
   - [ ] Update security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## ✅ Verification Checklist

After setup, verify:
- [ ] Google Sign-In works in extension
- [ ] Magic Link email is received
- [ ] Magic Link authentication works
- [ ] Users appear in Firebase Console → Authentication → Users
- [ ] Sign-out works correctly
- [ ] Session persists after browser restart
- [ ] No console errors related to Firebase

## 🚨 Common Issues & Solutions

### Issue: "Unauthorized domain" error
**Solution**: 
- Verify extension ID is correct
- Check authorized domains list includes extension URL
- Wait a few minutes for changes to propagate

### Issue: Google Sign-In popup blocked
**Solution**:
- Allow popups for the extension
- Check Chrome popup blocker settings

### Issue: Magic Link not received
**Solution**:
- Check spam/junk folder
- Verify email provider configuration in Firebase
- Check email templates are configured

### Issue: "API key not valid" error
**Solution**:
- Verify Firebase config in `src/config/firebase.ts`
- Check API key in Firebase Console → Project Settings
- Ensure API key restrictions allow your domain

## 📝 Notes

- **Testing Mode**: OAuth consent screen can be in testing mode during development
- **Production**: Switch to production mode before public release
- **Rate Limits**: Firebase has rate limits on authentication attempts
- **Billing**: Free tier includes 10K verifications/month

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Chrome Extension Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)

---

**Last Updated**: October 4, 2025  
**Project**: ShopScout Chrome Extension  
**Firebase Project**: shopscout-9bb63
