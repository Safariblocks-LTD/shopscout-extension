# 🔐 ShopScout Authentication Flow

Visual guide to understanding how authentication works in ShopScout.

---

## 📊 Authentication Flow Diagram

### Google Sign-In Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER OPENS EXTENSION                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Check Auth State    │
              │  (AuthContext)       │
              └──────────┬───────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
        ┌──────────────┐   ┌──────────────┐
        │ Authenticated│   │Not Authenticated│
        │   (user)     │   │   (null)     │
        └──────┬───────┘   └──────┬───────┘
               │                  │
               ▼                  ▼
        ┌──────────────┐   ┌──────────────────┐
        │  Show Main   │   │  Show Auth       │
        │  App Content │   │  Screen          │
        └──────────────┘   └──────┬───────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ User Clicks             │
                    │ "Continue with Google"  │
                    └─────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │ Firebase Auth           │
                    │ Opens Google OAuth      │
                    │ Popup                   │
                    └─────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │ User Selects            │
                    │ Google Account          │
                    └─────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │ Google Authenticates    │
                    │ Returns Token           │
                    └─────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │ Firebase Stores         │
                    │ User Session            │
                    └─────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │ AuthContext Updates     │
                    │ user state              │
                    └─────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │ App Re-renders          │
                    │ Shows Main Content      │
                    └─────────────────────────┘
```

---

### Magic Link Email Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER OPENS EXTENSION                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Not Authenticated   │
              │  Show Auth Screen    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ User Clicks              │
              │ "Sign in with Magic Link"│
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ Show Email Input Form    │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ User Enters Email        │
              │ Clicks "Send Magic Link" │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ Firebase Sends           │
              │ Authentication Email     │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ Show Success Message     │
              │ "Check your email"       │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ User Opens Email         │
              │ Clicks Magic Link        │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ Link Opens Extension     │
              │ with Auth Token          │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ Firebase Verifies Token  │
              │ Creates Session          │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ AuthContext Updates      │
              │ user state               │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ App Shows Main Content   │
              └──────────────────────────┘
```

---

## 🔄 Session Persistence Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              USER CLOSES AND REOPENS EXTENSION                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ App Initializes      │
              │ AuthProvider Loads   │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ onAuthStateChanged       │
              │ Checks Firebase Storage  │
              └──────────┬───────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
     ┌──────────────────┐  ┌──────────────────┐
     │ Valid Session    │  │ No Session       │
     │ Found            │  │ Found            │
     └──────┬───────────┘  └──────┬───────────┘
            │                     │
            ▼                     ▼
     ┌──────────────────┐  ┌──────────────────┐
     │ Restore User     │  │ Show Auth        │
     │ Show Main App    │  │ Screen           │
     └──────────────────┘  └──────────────────┘
```

---

## 🚪 Sign-Out Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              USER CLICKS SIGN-OUT BUTTON                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Call signOut()       │
              │ from AuthContext     │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ Firebase Signs Out User  │
              │ Clears Session           │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ onAuthStateChanged       │
              │ Detects user = null      │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ AuthContext Updates      │
              │ user state to null       │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │ App Re-renders           │
              │ Shows Auth Screen        │
              └──────────────────────────┘
```

---

## 🏗️ Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         main.tsx                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    AuthProvider                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │                   App.tsx                           │ │ │
│  │  │                                                     │ │ │
│  │  │  ┌──────────────────┐    ┌──────────────────────┐ │ │ │
│  │  │  │  AuthScreen      │    │  Main App Content    │ │ │ │
│  │  │  │                  │    │                      │ │ │ │
│  │  │  │  - Google Btn    │    │  - Header (Logout)  │ │ │ │
│  │  │  │  - Magic Link    │    │  - Product Info     │ │ │ │
│  │  │  │  - Email Input   │    │  - Price Compare    │ │ │ │
│  │  │  │  - Error/Success │    │  - Reviews          │ │ │ │
│  │  │  └──────────────────┘    └──────────────────────┘ │ │ │
│  │  │                                                     │ │ │
│  │  │  Conditional Rendering:                            │ │ │
│  │  │  if (!user) → AuthScreen                           │ │ │
│  │  │  if (user) → Main App Content                      │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  Context Provides:                                        │ │
│  │  - user (User | null)                                     │ │
│  │  - loading (boolean)                                      │ │
│  │  - signInWithGoogle()                                     │ │
│  │  - sendMagicLink(email)                                   │ │
│  │  - signOut()                                              │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Firebase Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Services Used                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  firebase/app        │  → Initialize Firebase
└──────────┬───────────┘
           │
           ├─────────────────────────────────────────────────────┐
           │                                                     │
           ▼                                                     ▼
┌──────────────────────┐                           ┌──────────────────────┐
│  firebase/auth       │                           │  firebase/analytics  │
└──────────┬───────────┘                           └──────────┬───────────┘
           │                                                  │
           ├──────────────────────────────┐                  │
           │                              │                  │
           ▼                              ▼                  ▼
┌──────────────────────┐      ┌──────────────────────┐   ┌──────────────┐
│  GoogleAuthProvider  │      │  Email Link Auth     │   │  Track Events│
│  signInWithPopup()   │      │  sendSignInLinkToEmail│   │  (Optional)  │
└──────────────────────┘      │  signInWithEmailLink │   └──────────────┘
                              └──────────────────────┘
```

---

## 📱 User Experience Timeline

### First-Time User
```
0s    → Opens extension
0.5s  → Sees loading state
1s    → Auth screen appears
2s    → User clicks "Continue with Google"
3s    → Google popup opens
5s    → User selects account
6s    → Authenticated, main app loads
7s    → User starts shopping! 🛍️
```

### Returning User (with session)
```
0s    → Opens extension
0.5s  → Sees loading state
1s    → Session restored automatically
1.5s  → Main app appears
2s    → User continues shopping! 🛍️
```

### Magic Link User
```
0s    → Opens extension
1s    → Auth screen appears
2s    → Clicks "Sign in with Magic Link"
3s    → Enters email
4s    → Clicks "Send Magic Link"
5s    → Success message shown
---   → User checks email
---   → Clicks link in email
+1s   → Extension opens, authenticated
+2s   → Main app appears
+3s   → User starts shopping! 🛍️
```

---

## 🎨 UI State Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                      UI State Machine                           │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   LOADING    │
                    │  (Spinner)   │
                    └──────┬───────┘
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
          ┌──────────────┐   ┌──────────────┐
          │     AUTH     │   │     MAIN     │
          │    SCREEN    │   │     APP      │
          └──────┬───────┘   └──────┬───────┘
                 │                  │
        ┌────────┼────────┐         │
        │        │        │         │
        ▼        ▼        ▼         ▼
    ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
    │IDLE │  │LOAD │  │SUCCESS│ │MAIN │
    └─────┘  └─────┘  └─────┘  └─────┘
                                   │
                                   ▼
                              ┌─────────┐
                              │ SIGN OUT│
                              └────┬────┘
                                   │
                                   ▼
                              ┌─────────┐
                              │  AUTH   │
                              │ SCREEN  │
                              └─────────┘
```

---

## 🔒 Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Measures                            │
└─────────────────────────────────────────────────────────────────┘

User Action
    │
    ▼
┌─────────────────┐
│ Chrome Extension│
│   (Frontend)    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│ Firebase Auth   │
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Google │ │  Email │
│  OAuth │ │Provider│
└────────┘ └────────┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│  Secure Token   │
│   Generated     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Chrome Storage  │
│  (Encrypted)    │
└─────────────────┘
```

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                Authentication Data Flow                         │
└─────────────────────────────────────────────────────────────────┘

User Credentials
       │
       ▼
Firebase Auth API
       │
       ├─→ Validate
       ├─→ Generate Token
       └─→ Create Session
              │
              ▼
        Auth Token
              │
              ├─→ Store in Chrome Storage
              ├─→ Set in AuthContext
              └─→ Auto-refresh on expiry
                     │
                     ▼
              User Object
                     │
                     ├─→ uid
                     ├─→ email
                     ├─→ displayName
                     ├─→ photoURL
                     └─→ metadata
```

---

## 🎯 Key Takeaways

1. **Two Authentication Methods**
   - Google Sign-In (OAuth)
   - Magic Link (Email)

2. **Automatic Session Management**
   - Persistent across browser restarts
   - Automatic token refresh
   - Secure storage

3. **Beautiful User Experience**
   - Loading states
   - Success messages
   - Error handling
   - Smooth transitions

4. **Security First**
   - Industry-standard Firebase Auth
   - OAuth 2.0
   - Encrypted token storage
   - No password storage (Magic Link)

5. **Developer Friendly**
   - React Context API
   - Clean component structure
   - Easy to extend
   - Well documented

---

**Ready to test your authentication flow!** 🚀
