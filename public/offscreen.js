import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendEmailVerification,
  fetchSignInMethodsForEmail,
  indexedDBLocalPersistence,
  setPersistence
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrApKcweIjfoaKCPh3IRqTAMyTi65KdG0",
  authDomain: "shopscout-9bb63.firebaseapp.com",
  projectId: "shopscout-9bb63",
  storageBucket: "shopscout-9bb63.firebasestorage.app",
  messagingSenderId: "647829782777",
  appId: "1:647829782777:web:e1e51c1c0a22dfdf2fe228",
  measurementId: "G-QPH51ENTS9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence to IndexedDB for Chrome extensions
setPersistence(auth, indexedDBLocalPersistence).catch((error) => {
  console.error('[Offscreen] Error setting persistence:', error);
});

console.log('[Offscreen] Firebase Auth and Firestore initialized');

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Offscreen] Received message:', message);
  
  if (message.target !== 'offscreen-auth') {
    console.log('[Offscreen] Message not for offscreen-auth, ignoring');
    return false;
  }

  console.log('[Offscreen] Processing auth request:', message.type);

  (async () => {
    try {
      if (message.type === 'CHECK_USER_EXISTS') {
        console.log('[Offscreen] Checking if user exists:', message.email);
        const signInMethods = await fetchSignInMethodsForEmail(auth, message.email);
        const exists = signInMethods && signInMethods.length > 0;
        console.log('[Offscreen] User exists:', exists, 'Methods:', signInMethods);
        sendResponse({ success: true, exists, methods: signInMethods });
        
      } else if (message.type === 'CREATE_USER_WITH_EMAIL') {
        console.log('[Offscreen] Creating user with email:', message.email);
        
        // Create user account (fastest operation first)
        const userCredential = await createUserWithEmailAndPassword(auth, message.email, message.password);
        const user = userCredential.user;
        
        // Prepare user data
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        };
        
        // Send response immediately - don't wait for Firestore or email
        const response = {
          success: true,
          user: userData
        };
        console.log('[Offscreen] User created, sending immediate response');
        sendResponse(response);
        
        // Do Firestore and email in background (non-blocking)
        Promise.all([
          // Create Firestore document
          setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: userData.displayName,
            photoURL: user.photoURL || null,
            emailVerified: user.emailVerified,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            authMethod: 'email-password'
          }).catch(err => console.error('[Offscreen] Firestore error:', err)),
          
          // Send verification email
          sendEmailVerification(user, {
            url: 'https://shopscout-9bb63.firebaseapp.com',
            handleCodeInApp: false
          }).catch(err => console.error('[Offscreen] Email verification error:', err))
        ]).then(() => {
          console.log('[Offscreen] Background tasks completed');
        });
        
      } else if (message.type === 'SIGN_IN_WITH_EMAIL') {
        console.log('[Offscreen] Signing in with email:', message.email);
        
        // Sign in immediately (don't check existence first - Firebase will error if not found)
        const userCredential = await signInWithEmailAndPassword(auth, message.email, message.password);
        const user = userCredential.user;
        
        // Send response immediately
        const response = {
          success: true,
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL,
            emailVerified: user.emailVerified
          }
        };
        console.log('[Offscreen] Sign-in successful, sending immediate response');
        sendResponse(response);
        
        // Update Firestore in background (non-blocking)
        setDoc(doc(db, 'users', user.uid), {
          lastLoginAt: serverTimestamp()
        }, { merge: true }).catch(err => console.error('[Offscreen] Firestore update error:', err));
        
      } else if (message.type === 'SEND_MAGIC_LINK') {
        console.log('[Offscreen] Sending magic link to:', message.email);
        
        // For magic link, we allow both new and existing users
        const actionCodeSettings = {
          url: 'https://shopscout-9bb63.firebaseapp.com/__/auth/action',
          handleCodeInApp: true,
        };
        
        console.log('[Offscreen] Action code settings:', actionCodeSettings);
        await sendSignInLinkToEmail(auth, message.email, actionCodeSettings);
        console.log('[Offscreen] Magic link sent successfully to:', message.email);
        sendResponse({ success: true });
        
      } else if (message.type === 'COMPLETE_MAGIC_LINK') {
        console.log('[Offscreen] Completing magic link sign-in for:', message.email);
        console.log('[Offscreen] URL:', message.url);
        
        if (isSignInWithEmailLink(auth, message.url)) {
          const userCredential = await signInWithEmailLink(auth, message.email, message.url);
          const user = userCredential.user;
          
          // Check if this is a new user and create/update Firestore document
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            // New user via magic link
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              photoURL: user.photoURL || null,
              emailVerified: true, // Magic link auto-verifies
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              authMethod: 'magic-link'
            });
          } else {
            // Existing user
            await setDoc(doc(db, 'users', user.uid), {
              lastLoginAt: serverTimestamp(),
              emailVerified: true
            }, { merge: true });
          }
          
          const response = {
            success: true,
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              photoURL: user.photoURL,
              emailVerified: true // Magic link always verifies
            }
          };
          console.log('[Offscreen] Magic link sign-in successful:', response);
          sendResponse(response);
        } else {
          throw new Error('Invalid sign-in link');
        }
        
      } else if (message.type === 'SEND_VERIFICATION_EMAIL') {
        console.log('[Offscreen] Sending verification email');
        if (auth.currentUser) {
          await sendEmailVerification(auth.currentUser, {
            url: 'https://shopscout-9bb63.firebaseapp.com',
            handleCodeInApp: false
          });
          sendResponse({ success: true });
        } else {
          throw new Error('No user signed in');
        }
        
      } else if (message.type === 'CHECK_AUTH_STATE') {
        console.log('[Offscreen] Checking auth state');
        const user = auth.currentUser;
        if (user) {
          // Refresh user to get latest emailVerified status
          await user.reload();
          sendResponse({
            success: true,
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              photoURL: user.photoURL,
              emailVerified: user.emailVerified
            }
          });
        } else {
          sendResponse({ success: false, user: null });
        }
      }
    } catch (error) {
      console.error('[Offscreen] Auth error:', error);
      const errorResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      };
      console.log('[Offscreen] Sending error response:', errorResponse);
      sendResponse(errorResponse);
    }
  })();

  return true; // Keep the message channel open for async response
});

console.log('[Offscreen] Document loaded and ready for authentication');
