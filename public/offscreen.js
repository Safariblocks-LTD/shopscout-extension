import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import { 
  getAuth, 
  signInWithPopup,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  GoogleAuthProvider 
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';

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

console.log('[Offscreen] Script loaded');

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
      if (message.type === 'GOOGLE_SIGN_IN') {
        console.log('[Offscreen] Starting Google sign-in...');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const response = {
          success: true,
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          }
        };
        console.log('[Offscreen] Google sign-in successful, sending response:', response);
        sendResponse(response);
      } else if (message.type === 'SEND_MAGIC_LINK') {
        console.log('[Offscreen] Sending magic link to:', message.email);
        const actionCodeSettings = {
          url: 'https://shopscout-9bb63.firebaseapp.com/__/auth/action',
          handleCodeInApp: true,
        };
        
        await sendSignInLinkToEmail(auth, message.email, actionCodeSettings);
        sendResponse({ success: true });
      } else if (message.type === 'COMPLETE_MAGIC_LINK') {
        const result = await signInWithEmailLink(auth, message.email, message.url);
        const user = result.user;
        
        sendResponse({
          success: true,
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          }
        });
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
