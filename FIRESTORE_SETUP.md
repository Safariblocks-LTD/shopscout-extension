# 🔥 Firestore Database Setup - Complete Guide

## Current Status

✅ You've already created Firestore Database  
❌ Security rules are blocking all access (need to update)

---

## Step 1: Update Firestore Security Rules (2 minutes)

### Current Rules (Blocking Everything)
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;  // ❌ This blocks everything!
    }
  }
}
```

### ✅ Production-Ready Rules (Copy This)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can only access their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Optional: Shopping data collections (add as needed)
    match /wishlists/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /priceAlerts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /searchHistory/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### How to Update Rules

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select**: shopscout-9bb63
3. **Click**: Firestore Database (left sidebar)
4. **Click**: Rules tab (top)
5. **Replace** the existing rules with the production-ready rules above
6. **Click**: Publish

**✅ Done!** Your database is now secure and functional.

---

## Step 2: Understand the Rules

### What These Rules Do

**Users Collection:**
```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```
- ✅ Authenticated users can read/write ONLY their own document
- ❌ Cannot access other users' documents
- ❌ Unauthenticated users cannot access anything

**Security Features:**
- `request.auth != null` - User must be signed in
- `request.auth.uid == userId` - User ID must match document ID
- Each user has complete privacy

---

## Step 3: Verify It's Working

### A. Check in Firebase Console

1. **Sign up** in your extension with a test email
2. **Go to**: Firebase Console → Firestore Database
3. **Click**: Data tab
4. **Look for**: `users` collection
5. **Verify**: You see a document with your user's UID

**Expected Structure:**
```
users/
  └── [USER_UID]/
      ├── email: "test@example.com"
      ├── displayName: "test"
      ├── photoURL: null
      ├── emailVerified: false
      ├── createdAt: [timestamp]
      ├── lastLoginAt: [timestamp]
      └── authMethod: "email-password"
```

### B. Test in Extension

1. **Sign up** with new email
2. **Open**: Chrome DevTools → Console
3. **Check**: No Firestore permission errors
4. **Sign in** again
5. **Verify**: lastLoginAt updates

---

## Step 4: Test Security Rules

### Test 1: Authenticated User Can Access Own Data ✅

```javascript
// This should work
const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
// ✅ Success - user can read their own document
```

### Test 2: Authenticated User Cannot Access Others' Data ❌

```javascript
// This should fail
const otherUserDoc = await getDoc(doc(db, 'users', 'some-other-uid'));
// ❌ Permission denied - correct!
```

### Test 3: Unauthenticated User Cannot Access Anything ❌

```javascript
// This should fail
const userDoc = await getDoc(doc(db, 'users', 'any-uid'));
// ❌ Permission denied - correct!
```

---

## Step 5: What Data Is Stored

### User Document Structure

When a user signs up, we automatically create:

```javascript
{
  email: "user@example.com",           // User's email
  displayName: "user",                  // Display name (from email)
  photoURL: null,                       // Profile photo (null for now)
  emailVerified: false,                 // Email verification status
  createdAt: Timestamp,                 // Account creation time
  lastLoginAt: Timestamp,               // Last sign-in time
  authMethod: "email-password"          // How they signed up
}
```

### Auth Methods Tracked

- `"email-password"` - Signed up with email + password
- `"magic-link"` - Signed up with magic link

---

## Step 6: Future Collections (Optional)

You can add more collections as needed:

### Wishlists
```javascript
wishlists/
  └── [USER_UID]/
      └── items/
          └── [ITEM_ID]/
              ├── productId: "..."
              ├── title: "..."
              ├── price: 99.99
              ├── url: "..."
              ├── savedAt: Timestamp
```

### Price Alerts
```javascript
priceAlerts/
  └── [USER_UID]/
      └── alerts/
          └── [ALERT_ID]/
              ├── productId: "..."
              ├── targetPrice: 79.99
              ├── currentPrice: 99.99
              ├── createdAt: Timestamp
```

### Search History
```javascript
searchHistory/
  └── [USER_UID]/
      └── searches/
          └── [SEARCH_ID]/
              ├── query: "..."
              ├── timestamp: Timestamp
              ├── results: [...]
```

**To add these**: Just update the Firestore rules with the patterns shown in Step 1.

---

## 🔍 Debugging Firestore Issues

### Issue: "Missing or insufficient permissions"

**Cause**: Security rules are blocking access

**Solution**:
1. Verify rules are published (not just saved)
2. Check user is authenticated (`request.auth != null`)
3. Verify document ID matches user ID
4. Check browser console for specific error

### Issue: User document not created

**Cause**: Firestore write failed during sign up

**Solution**:
1. Check background console for errors
2. Verify Firestore is enabled
3. Verify security rules allow write
4. Check Firebase quota limits

### Issue: "PERMISSION_DENIED" error

**Cause**: Trying to access another user's data

**Solution**: This is correct! Security rules are working.

---

## ✅ Verification Checklist

Before proceeding, verify:

- [ ] Firestore Database is enabled
- [ ] Security rules are updated and published
- [ ] Rules allow authenticated users to access own data
- [ ] Rules block access to other users' data
- [ ] Test user document created successfully
- [ ] No permission errors in console

---

## 🎯 Quick Test

### 1. Sign Up
```
1. Open extension
2. Sign up with: test@example.com / password123
3. Check background console - should see:
   "[Offscreen] User created successfully"
```

### 2. Check Firestore
```
1. Firebase Console → Firestore Database → Data
2. Look for: users collection
3. Find: Document with your user's UID
4. Verify: All fields are present
```

### 3. Sign In Again
```
1. Sign out
2. Sign in with same credentials
3. Check Firestore: lastLoginAt should update
```

**All working?** ✅ You're ready to go!

---

## 🚀 Next Steps

Now that Firestore is configured:

1. ✅ **Firestore Database** - Configured and secured
2. ✅ **Authentication** - Working end-to-end
3. ✅ **User Profiles** - Automatically created
4. ✅ **Security Rules** - Production-ready

**You can now:**
- Sign up users → Creates Firestore document
- Sign in users → Updates lastLoginAt
- Track user activity
- Store user preferences
- Add wishlists, price alerts, etc.

---

## 📚 Resources

- **Firestore Documentation**: https://firebase.google.com/docs/firestore
- **Security Rules**: https://firebase.google.com/docs/firestore/security/get-started
- **Best Practices**: https://firebase.google.com/docs/firestore/best-practices

---

**Your Firestore database is now configured and ready for production!** 🎉
