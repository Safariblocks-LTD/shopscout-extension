# ShopScout Authentication Setup

This document explains the Firebase authentication implementation in ShopScout Chrome Extension.

## Overview

ShopScout uses Firebase Authentication to provide secure user authentication with two methods:
1. **Google Sign-In** - Quick OAuth authentication via Google account
2. **Magic Link Email Sign-In** - Passwordless authentication via email link

## Firebase Configuration

The Firebase project is already configured with the following credentials:

```javascript
{
  apiKey: "AIzaSyCrApKcweIjfoaKCPh3IRqTAMyTi65KdG0",
  authDomain: "shopscout-9bb63.firebaseapp.com",
  projectId: "shopscout-9bb63",
  storageBucket: "shopscout-9bb63.firebasestorage.app",
  messagingSenderId: "647829782777",
  appId: "1:647829782777:web:e1e51c1c0a22dfdf2fe228",
  measurementId: "G-QPH51ENTS9"
}
```

## File Structure

```
src/
├── config/
│   └── firebase.ts              # Firebase initialization
├── contexts/
│   └── AuthContext.tsx          # Authentication context provider
├── components/
│   └── AuthScreen.tsx           # Authentication UI component
├── App.tsx                      # Main app with auth integration
└── main.tsx                     # App wrapper with AuthProvider
```

## Key Components

### 1. Firebase Configuration (`src/config/firebase.ts`)
- Initializes Firebase app
- Exports auth instance for use throughout the app
- Handles analytics initialization (with fallback for extension context)

### 2. Auth Context (`src/contexts/AuthContext.tsx`)
Provides authentication state and methods:
- `user` - Current authenticated user or null
- `loading` - Authentication state loading status
- `signInWithGoogle()` - Google OAuth sign-in
- `sendMagicLink(email)` - Send magic link to email
- `completeMagicLinkSignIn(email)` - Complete magic link sign-in
- `signOut()` - Sign out current user

### 3. Auth Screen (`src/components/AuthScreen.tsx`)
Beautiful authentication UI with:
- Google Sign-In button with official Google branding
- Email input for magic link authentication
- Success state after sending magic link
- Error handling and loading states
- Responsive design with gradient background

### 4. App Integration (`src/App.tsx`)
- Shows `AuthScreen` when user is not authenticated
- Shows `LoadingState` while checking authentication
- Shows main app content when user is authenticated
- Includes sign-out button in header

## Firebase Console Setup Required

To enable authentication methods, configure the following in Firebase Console:

### 1. Enable Google Sign-In
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **shopscout-9bb63**
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Google** provider
5. Add authorized domains:
   - `shopscout-9bb63.firebaseapp.com`
   - `chrome-extension://[YOUR_EXTENSION_ID]` (after loading extension)

### 2. Enable Email Link Sign-In
1. In **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Enable **Email link (passwordless sign-in)** option
4. Configure email templates in **Authentication** → **Templates**

### 3. Add Authorized Domains
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your extension URL (will be available after loading extension)

## Chrome Extension Manifest

The `manifest.json` includes necessary permissions:

```json
{
  "permissions": [
    "identity",  // For OAuth authentication
    "storage"    // For storing auth state
  ],
  "host_permissions": [
    "https://*.googleapis.com/*",
    "https://*.firebaseapp.com/*",
    "https://*.google.com/*"
  ]
}
```

## User Flow

### Google Sign-In Flow
1. User clicks "Continue with Google"
2. Google OAuth popup opens
3. User selects Google account
4. Authentication completes
5. User is redirected to main app

### Magic Link Flow
1. User clicks "Sign in with Magic Link"
2. User enters email address
3. User clicks "Send Magic Link"
4. Email is sent with authentication link
5. User clicks link in email
6. Authentication completes automatically
7. User is redirected to main app

## Security Features

- **Secure Token Storage**: Firebase handles secure token storage
- **Automatic Token Refresh**: Tokens are automatically refreshed
- **Session Persistence**: User stays logged in across browser sessions
- **Chrome Extension Security**: Uses Chrome's identity API for OAuth

## Development Notes

### Testing Authentication
1. Load the extension in Chrome
2. Open the side panel
3. Test Google Sign-In (requires Firebase Console setup)
4. Test Magic Link (requires email configuration in Firebase)

### Debugging
- Check browser console for Firebase errors
- Verify Firebase project configuration
- Ensure authorized domains are configured
- Check Chrome extension permissions

### Common Issues

**Issue**: Google Sign-In popup blocked
- **Solution**: Ensure popup blockers are disabled for the extension

**Issue**: Magic link not received
- **Solution**: Check spam folder, verify email configuration in Firebase Console

**Issue**: "Unauthorized domain" error
- **Solution**: Add the extension URL to authorized domains in Firebase Console

## Next Steps

1. **Configure Firebase Console**: Enable authentication providers
2. **Test Authentication**: Load extension and test both sign-in methods
3. **Customize Email Templates**: Update magic link email templates in Firebase
4. **Add User Profile**: Extend to store user preferences and data
5. **Implement Protected Routes**: Add role-based access if needed

## Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Chrome Extension Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)
- [Firebase Email Link Authentication](https://firebase.google.com/docs/auth/web/email-link-auth)
