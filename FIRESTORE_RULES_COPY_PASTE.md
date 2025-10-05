# 📋 Firestore Rules - Copy & Paste

## 🎯 Quick Action Required

Your Firestore database is **blocking all access** because of these rules:

```javascript
// ❌ CURRENT RULES (Blocking Everything)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;  // This blocks everything!
    }
  }
}
```

---

## ✅ COPY THIS - Production-Ready Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only access their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Wishlists - user's saved products
    match /wishlists/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Price alerts - user's price tracking
    match /priceAlerts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Search history - user's searches
    match /searchHistory/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📝 How to Update (30 seconds)

### Step 1: Go to Firestore Rules
```
1. Open: https://console.firebase.google.com/
2. Select: shopscout-9bb63
3. Click: Firestore Database (left sidebar)
4. Click: Rules tab (at the top)
```

### Step 2: Replace Rules
```
1. Select ALL existing text (Ctrl+A / Cmd+A)
2. Delete it
3. Copy the "Production-Ready Rules" above
4. Paste into the editor
```

### Step 3: Publish
```
1. Click: Publish button (top right)
2. Wait for: "Rules published successfully" message
3. ✅ Done!
```

---

## 🔍 What These Rules Do

### Security Features

**✅ Authenticated Users:**
- Can read/write their own documents
- Cannot access other users' data
- Full privacy protection

**❌ Unauthenticated Users:**
- Cannot access any data
- Must sign in first

**✅ Collections Protected:**
- `users` - User profiles
- `wishlists` - Saved products
- `priceAlerts` - Price tracking
- `searchHistory` - Search records

---

## 🧪 Test After Publishing

### Test 1: Sign Up
```
1. Open your extension
2. Sign up with: test@example.com / password123
3. Check background console for: "User created successfully"
4. Go to Firestore → Data tab
5. ✅ Should see: users/[YOUR_UID] document
```

### Test 2: Verify Data
```
In Firestore Data tab, you should see:

users/
  └── [YOUR_USER_ID]/
      ├── email: "test@example.com"
      ├── displayName: "test"
      ├── emailVerified: false
      ├── createdAt: [timestamp]
      ├── lastLoginAt: [timestamp]
      └── authMethod: "email-password"
```

### Test 3: Sign In Again
```
1. Sign out from extension
2. Sign in with same credentials
3. Check Firestore: lastLoginAt should update to new timestamp
4. ✅ If updated, everything is working!
```

---

## ❌ Common Mistakes

### Mistake 1: Not Publishing
- Saving rules ≠ Publishing rules
- **Must click "Publish" button!**

### Mistake 2: Syntax Errors
- Copy the ENTIRE rules block
- Don't modify unless you know what you're doing
- Check for missing brackets

### Mistake 3: Wrong Collection Names
- Rules must match collection names exactly
- `users` not `Users`
- Case-sensitive!

---

## 🚨 If You See Errors

### "PERMISSION_DENIED: Missing or insufficient permissions"

**Cause**: Rules not published or user not authenticated

**Fix**:
1. Verify rules are published (not just saved)
2. Sign out and sign in again
3. Check user is authenticated in extension

### "Firestore: PERMISSION_DENIED"

**Cause**: Trying to access another user's data

**Fix**: This is correct! Security is working.

### No user document created

**Cause**: Rules blocking write access

**Fix**:
1. Verify rules are exactly as shown above
2. Click "Publish" (not just save)
3. Wait 30 seconds for rules to propagate
4. Try signing up again

---

## ✅ Success Checklist

After updating rules, verify:

- [ ] Rules published successfully (not just saved)
- [ ] Can sign up new user
- [ ] User document appears in Firestore
- [ ] User document has all fields
- [ ] lastLoginAt updates on sign-in
- [ ] No permission errors in console

---

## 🎉 You're Done!

Once rules are published:
- ✅ Database is functional
- ✅ Security is production-ready
- ✅ Users can access their own data
- ✅ Privacy is protected

**Next**: Go back to START_HERE.md and continue with Step 2!

---

**Need help?** See FIRESTORE_SETUP.md for detailed explanation.
