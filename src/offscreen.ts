import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  GoogleAuthProvider 
} from 'firebase/auth';

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

console.log('[Offscreen] Firebase initialized');
console.log('[Offscreen] Auth instance:', auth);
console.log('[Offscreen] Auth config:', {
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Offscreen] Received message:', message);
  
  if (message.target !== 'offscreen-auth') {
    console.log('[Offscreen] Message not for offscreen-auth, ignoring');
    return false;
  }

  console.log('[Offscreen] Processing auth request:', message.type);

  (async () => {
    try {
      if (message.type === 'GOOGLE_SIGN_IN') {
        console.log('[Offscreen] Starting Google sign-in with redirect...');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        // Try popup first, but handle errors gracefully
        try {
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
          console.log('[Offscreen] Google sign-in successful, sending response');
          sendResponse(response);
        } catch (popupError: any) {
          console.error('[Offscreen] Popup failed, this is expected in offscreen documents:', popupError);
          // Return a specific error so we can handle it differently
          sendResponse({
            success: false,
            error: {
              code: 'popup-not-supported',
              message: 'Popup authentication is not supported in offscreen documents. Please use Magic Link instead.'
            }
          });
        }
      } else if (message.type === 'SEND_MAGIC_LINK') {
        console.log('[Offscreen] ========== SEND MAGIC LINK START ==========');
        console.log('[Offscreen] Email address:', message.email);
        console.log('[Offscreen] Auth state:', auth.currentUser ? 'User logged in' : 'No user');
        
        // The URL must be in Firebase Console authorized domains
        const actionCodeSettings = {
          url: 'https://shopscout-9bb63.firebaseapp.com',
          handleCodeInApp: true,
        };
        
        console.log('[Offscreen] Action code settings:', JSON.stringify(actionCodeSettings, null, 2));
        console.log('[Offscreen] Calling sendSignInLinkToEmail...');
        
        try {
          const result = await sendSignInLinkToEmail(auth, message.email, actionCodeSettings);
          console.log('[Offscreen] ✅ sendSignInLinkToEmail completed');
          console.log('[Offscreen] Result:', result);
          console.log('[Offscreen] Magic link sent successfully to:', message.email);
          console.log('[Offscreen] ========== SEND MAGIC LINK SUCCESS ==========');
          sendResponse({ success: true });
        } catch (emailError: any) {
          console.error('[Offscreen] ❌ FAILED to send magic link');
          console.error('[Offscreen] Error code:', emailError.code);
          console.error('[Offscreen] Error message:', emailError.message);
          console.error('[Offscreen] Full error:', emailError);
          console.log('[Offscreen] ========== SEND MAGIC LINK FAILED ==========');
          sendResponse({
            success: false,
            error: {
              code: emailError.code,
              message: `Failed to send email: ${emailError.message}`
            }
          });
        }
      } else if (message.type === 'COMPLETE_MAGIC_LINK') {
        console.log('[Offscreen] Completing magic link sign-in');
        const result = await signInWithEmailLink(auth, message.email, message.url);
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
        console.log('[Offscreen] Magic link sign-in successful');
        sendResponse(response);
      }
    } catch (error: any) {
      console.error('[Offscreen] Auth error:', error);
      const errorResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      };
      console.log('[Offscreen] Sending error response');
      sendResponse(errorResponse);
    }
  })();

  return true; // Keep the message channel open for async response
});

console.log('[Offscreen] Document loaded and ready for authentication');
