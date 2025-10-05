# 🔐 ShopScout Web-Based Authentication Flow

## Overview

ShopScout now features a **professional, web-based authentication system** that opens when users first click the extension icon. This provides a seamless, secure authentication experience with multiple sign-in options.

---

## 🎯 Authentication Flow

### First-Time User Experience

1. **User installs extension** → Extension icon appears in browser toolbar
2. **User clicks extension icon** → Opens authentication page (`auth.html`) in a new tab
3. **User sees beautiful auth page** with options:
   - **Sign In with Google** (OAuth popup)
   - **Sign In with Email** (for existing users with verified email)
   - **Sign Up with Magic Link** (passwordless email authentication)
4. **After successful authentication** → Auth tab closes, extension sidebar opens automatically
5. **Subsequent clicks** → Extension sidebar opens directly (user already authenticated)

---

## 🔑 Authentication Methods

### 1. Google OAuth (Recommended)

**Sign Up Flow:**
- Click "Sign up with Google" button
- Google OAuth popup appears
- User selects Google account
- **Instant registration** - account created in Firebase
- User data synced to MySQL database
- Extension sidebar opens automatically

**Sign In Flow:**
- Click "Continue with Google" button
- Google OAuth popup appears
- User selects existing Google account
- Authenticated instantly
- Extension sidebar opens

**Benefits:**
- ✅ Instant authentication (no email verification needed)
- ✅ Secure OAuth 2.0 flow
- ✅ No password management
- ✅ Profile photo and name automatically imported

---

### 2. Magic Link (Passwordless)

**Sign Up Flow:**
- Enter email address
- Click "Send Magic Link"
- Firebase sends secure link to email
- User clicks link in email
- **Instant sign-up** - account created and verified
- Extension sidebar opens

**Sign In Flow:**
- Enter email on Sign In tab
- Click "Send me a magic link instead"
- Check email for magic link
- Click link to authenticate
- Extension sidebar opens

**Benefits:**
- ✅ No passwords to remember
- ✅ Email automatically verified
- ✅ Secure, time-limited links
- ✅ Perfect for mobile-to-desktop flow

---

### 3. Email + Password (Legacy Support)

**Sign In Only:**
- Enter email and password
- Click "Sign In"
- System checks if account exists
- If email not found → prompts to sign up
- If wrong password → shows error
- On success → Extension sidebar opens

**Note:** Email/password sign-up is handled through the offscreen document for existing users who registered via the old flow.

---

## 🏗️ Technical Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Extension Icon Click                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │ Check Auth State │
                    └─────────────────┘
                              ↓
                    ┌─────────────────┐
                    │  Authenticated?  │
                    └─────────────────┘
                      ↙              ↘
                   NO                 YES
                    ↓                  ↓
          ┌──────────────────┐   ┌──────────────┐
          │ Open auth.html   │   │ Open Sidebar │
          │ in new tab       │   └──────────────┘
          └──────────────────┘
                    ↓
          ┌──────────────────────────────────┐
          │     Authentication Page          │
          │  • Google OAuth                  │
          │  • Magic Link                    │
          │  • Email Sign In                 │
          └──────────────────────────────────┘
                    ↓
          ┌──────────────────────────────────┐
          │  User Authenticates              │
          └──────────────────────────────────┘
                    ↓
          ┌──────────────────────────────────┐
          │  Firebase Auth Success           │
          │  • Create/Update Firestore doc   │
          │  • Sync to MySQL backend         │
          │  • Store in chrome.storage       │
          └──────────────────────────────────┘
                    ↓
          ┌──────────────────────────────────┐
          │  Send AUTH_SUCCESS message       │
          │  to background.js                │
          └──────────────────────────────────┘
                    ↓
          ┌──────────────────────────────────┐
          │  Background.js:                  │
          │  • Stores user data              │
          │  • Closes auth tab               │
          │  • Opens extension sidebar       │
          └──────────────────────────────────┘
```

---

## 📁 File Structure

```
shopscout/
├── public/
│   ├── auth.html          # Authentication page UI
│   ├── auth.js            # Authentication logic (Firebase)
│   └── offscreen.js       # Legacy auth support
├── background.js          # Extension service worker
│   ├── Checks auth state on icon click
│   ├── Opens auth page if not authenticated
│   ├── Handles AUTH_SUCCESS messages
│   └── Opens sidebar after authentication
├── server/
│   └── index.js           # Backend API
│       └── POST /api/user/sync  # Syncs Firebase users to MySQL
└── src/
    └── App.tsx            # Sidebar app
        └── Checks authentication state
```

---

## 🔄 Data Flow

### User Data Storage

**1. Firebase Firestore** (Primary Auth)
```javascript
users/{uid}
  ├── email: string
  ├── displayName: string
  ├── photoURL: string
  ├── emailVerified: boolean
  ├── createdAt: timestamp
  ├── lastLoginAt: timestamp
  └── authMethod: 'google' | 'magic-link' | 'email-password'
```

**2. MySQL Database** (Backend Sync)
```sql
users
  ├── id (Firebase UID)
  ├── email
  ├── displayName
  ├── photoURL
  ├── emailVerified
  ├── authMethod
  ├── createdAt
  └── lastLoginAt
```

**3. Chrome Storage** (Extension State)
```javascript
{
  authenticated: true,
  userId: 'firebase-uid',
  userEmail: 'user@example.com',
  displayName: 'User Name',
  photoURL: 'https://...',
  emailVerified: true,
  authMethod: 'google',
  authTimestamp: 1234567890
}
```

---

## 🚀 Setup Instructions

### 1. Firebase Configuration

**Enable Authentication Methods:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `shopscout-9bb63`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable:
   - ✅ **Google** (OAuth)
   - ✅ **Email/Password** (with Email link enabled)

**Configure Authorized Domains:**
1. In Authentication → Settings → **Authorized domains**
2. Add your extension ID: `chrome-extension://YOUR_EXTENSION_ID`
3. Add localhost for testing: `localhost`

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

### 2. Build Extension

```bash
# Install dependencies
npm install

# Build extension
npm run build

# The auth files will be automatically copied to dist/
```

---

### 3. Load Extension

1. Open Chrome: `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist` folder
5. Copy your **Extension ID**
6. Add Extension ID to Firebase authorized domains

---

### 4. Start Backend Server

```bash
cd server
npm install
node index.js
```

The server will start on `http://localhost:3001`

---

## 🧪 Testing the Flow

### Test Google OAuth

1. Click extension icon
2. Auth page opens
3. Click "Sign up with Google"
4. Select Google account in popup
5. ✅ Auth tab closes, sidebar opens
6. ✅ User data visible in sidebar header

### Test Magic Link

1. Click extension icon
2. Click "Sign Up" tab
3. Enter email address
4. Click "Send Magic Link"
5. Check email (including spam)
6. Click magic link in email
7. ✅ Auth tab closes, sidebar opens

### Test Email Sign In

1. Have an existing account (created via offscreen flow)
2. Click extension icon
3. Enter email and password
4. Click "Sign In"
5. ✅ Auth tab closes, sidebar opens

### Test Subsequent Clicks

1. After authentication
2. Click extension icon again
3. ✅ Sidebar opens directly (no auth page)

---

## 🔒 Security Features

### Firebase Security
- ✅ OAuth 2.0 for Google authentication
- ✅ Secure, time-limited magic links
- ✅ Email verification required for email/password
- ✅ Firestore security rules enforce user isolation

### Extension Security
- ✅ Authentication state stored in chrome.storage.local
- ✅ User ID (Firebase UID) used for all backend requests
- ✅ No passwords stored in extension
- ✅ Secure communication between auth page and background script

### Backend Security
- ✅ CORS configured for extension origin only
- ✅ User ID validation on all authenticated endpoints
- ✅ MySQL prepared statements prevent SQL injection
- ✅ User data isolated by Firebase UID

---

## 🎨 UI/UX Features

### Professional Design
- ✅ Modern gradient backgrounds
- ✅ Smooth animations and transitions
- ✅ Responsive layout
- ✅ Clear visual hierarchy
- ✅ Loading states and error messages

### User Experience
- ✅ Tab-based navigation (Sign In / Sign Up)
- ✅ Clear call-to-action buttons
- ✅ Helpful error messages
- ✅ Success confirmations
- ✅ Automatic tab closing after auth
- ✅ Automatic sidebar opening

---

## 🐛 Troubleshooting

### Auth page doesn't open
- Check if extension is loaded properly
- Check browser console for errors
- Verify `auth.html` exists in `dist/` folder

### Google OAuth popup blocked
- Allow popups for the auth page
- Check Firebase authorized domains
- Verify Google OAuth is enabled in Firebase

### Magic link not received
- Check spam/junk folder
- Wait 2-3 minutes
- Verify Email/Password with Email link is enabled in Firebase

### "No account found" error
- This is correct behavior for new users
- Click "Sign Up" tab to create account
- Or use Google OAuth for instant sign-up

### Sidebar doesn't open after auth
- Check background.js console for errors
- Verify AUTH_SUCCESS message is sent
- Check chrome.storage.local for user data

---

## 📊 Database Schema

### MySQL Users Table

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,        -- Firebase UID
  email VARCHAR(255) UNIQUE NOT NULL,
  displayName VARCHAR(255),
  photoURL TEXT,
  emailVerified BOOLEAN DEFAULT FALSE,
  authMethod VARCHAR(50),             -- 'google', 'magic-link', 'email-password'
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastLoginAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔄 Migration from Old System

The new system is **backward compatible** with the old onboarding flow:

```javascript
// App.tsx checks both new and legacy auth
chrome.storage.local.get(['authenticated', 'displayName', 'userEmail'], (result) => {
  if (result.authenticated) {
    // New system
    setOnboarded(true);
  } else {
    // Check legacy system
    chrome.storage.local.get(['onboarded', 'nickname', 'email'], (legacy) => {
      if (legacy.onboarded) {
        setOnboarded(true);
      }
    });
  }
});
```

---

## 🎯 Next Steps

### Recommended Enhancements

1. **Add Sign Out functionality** in sidebar
2. **Profile management page** for updating user info
3. **Remember me** option for persistent sessions
4. **Social login** (Facebook, Apple)
5. **Two-factor authentication** for enhanced security
6. **Password reset flow** for email/password users
7. **Account deletion** option

---

## 📝 API Endpoints

### POST /api/user/sync

Syncs Firebase authenticated user to MySQL database.

**Request:**
```json
{
  "uid": "firebase-uid",
  "email": "user@example.com",
  "displayName": "User Name",
  "photoURL": "https://...",
  "emailVerified": true
}
```

**Response:**
```json
{
  "success": true,
  "userId": "firebase-uid",
  "displayName": "User Name",
  "email": "user@example.com"
}
```

---

## ✅ Success Criteria

Your authentication system is working correctly when:

- [ ] Clicking extension icon opens auth page (first time)
- [ ] Google OAuth sign-up works instantly
- [ ] Magic link email is received and works
- [ ] Email sign-in validates user existence
- [ ] Auth tab closes after successful authentication
- [ ] Sidebar opens automatically after auth
- [ ] Subsequent clicks open sidebar directly
- [ ] User data appears in sidebar header
- [ ] User data synced to MySQL database
- [ ] Firestore document created for user

---

## 🎉 Conclusion

You now have a **world-class authentication system** that rivals Big Tech implementations:

✅ **Multiple auth methods** (Google, Magic Link, Email)  
✅ **Professional UI/UX** with modern design  
✅ **Secure** Firebase + MySQL architecture  
✅ **Seamless** user experience  
✅ **Production-ready** code quality  

Your users will have a smooth, secure authentication experience from the moment they install ShopScout!

---

**Questions?** Check the troubleshooting section or review the code comments in `auth.js` and `background.js`.
