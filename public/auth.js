import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import { 
  getAuth, 
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  fetchSignInMethodsForEmail,
  browserLocalPersistence,
  setPersistence
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
// Firestore removed - using Supabase PostgreSQL only

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

// Initialize Firebase Auth only (no Firestore)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Set persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting persistence:', error);
});

// UI Elements
const signInTab = document.getElementById('signInTab');
const signUpTab = document.getElementById('signUpTab');
const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const statusMessage = document.getElementById('statusMessage');
const loadingOverlay = document.getElementById('loadingOverlay');

// Tab Switching
signInTab.addEventListener('click', () => {
  signInTab.classList.add('active');
  signUpTab.classList.remove('active');
  signInForm.classList.remove('hidden');
  signUpForm.classList.add('hidden');
  hideStatus();
});

signUpTab.addEventListener('click', () => {
  signUpTab.classList.add('active');
  signInTab.classList.remove('active');
  signUpForm.classList.remove('hidden');
  signInForm.classList.add('hidden');
  hideStatus();
});

// Status Message Functions
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = type === 'success' ? 'success' : type === 'error' ? 'error' : '';
  statusMessage.classList.remove('hidden');
}

function hideStatus() {
  statusMessage.classList.add('hidden');
}

function showLoading() {
  loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

// Sync user to backend and extension
async function syncUserToBackend(user) {
  try {
    // Use production backend URL
    const API_URL = 'https://shopscout-api.fly.dev';
    const response = await fetch(`${API_URL}/api/user/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      })
    });

    if (!response.ok) {
      console.warn('Backend sync failed, continuing anyway');
    }
  } catch (error) {
    console.warn('Backend sync error:', error);
  }
}

// Complete authentication and notify extension
async function completeAuthentication(user, authMethod) {
  try {
    // Sync to Supabase PostgreSQL via backend API (only database we use)
    console.log('[Auth] Syncing user to Supabase PostgreSQL...');
    await syncUserToBackend(user);
    console.log('[Auth] ✅ User synced to Supabase PostgreSQL');

    // Store user data for extension
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      authMethod: authMethod,
      timestamp: Date.now()
    };

    // Try to communicate with extension
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage({
          type: 'AUTH_SUCCESS',
          user: userData
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Extension not available, storing in localStorage');
            localStorage.setItem('shopscout_auth', JSON.stringify(userData));
          }
        });
      } catch (e) {
        console.log('Extension communication failed, storing in localStorage');
        localStorage.setItem('shopscout_auth', JSON.stringify(userData));
      }
    } else {
      // Not in extension context, store in localStorage
      localStorage.setItem('shopscout_auth', JSON.stringify(userData));
    }

    showStatus('✅ Authentication successful! Opening extension...', 'success');
    
    // Wait a moment then close the tab or redirect
    setTimeout(() => {
      if (window.chrome && chrome.runtime) {
        // In extension context, close this tab
        window.close();
      } else {
        // In web context, show success message
        showStatus('✅ You can now close this tab and use the extension!', 'success');
      }
    }, 2000);

  } catch (error) {
    console.error('Error completing authentication:', error);
    throw error;
  }
}

// Google Sign In/Up
async function handleGoogleAuth() {
  showLoading();
  hideStatus();
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    await completeAuthentication(user, 'google');
    
  } catch (error) {
    hideLoading();
    console.error('Google auth error:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      showStatus('Sign-in cancelled', 'error');
    } else if (error.code === 'auth/popup-blocked') {
      showStatus('Please allow popups for this site', 'error');
    } else {
      showStatus(`Error: ${error.message}`, 'error');
    }
  }
}

document.getElementById('googleSignInBtn').addEventListener('click', handleGoogleAuth);
document.getElementById('googleSignUpBtn').addEventListener('click', handleGoogleAuth);

// Email Sign In
document.getElementById('emailSignInForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('signInEmail').value.trim();
  const password = document.getElementById('signInPassword').value;
  
  if (!email || !password) {
    showStatus('Please enter email and password', 'error');
    return;
  }
  
  showLoading();
  hideStatus();
  
  try {
    // Check if user exists first
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    
    if (!signInMethods || signInMethods.length === 0) {
      hideLoading();
      showStatus('No account found with this email. Please sign up first.', 'error');
      return;
    }
    
    // Check if email/password is available
    if (!signInMethods.includes('password')) {
      hideLoading();
      showStatus('This email was registered with a different method. Try Magic Link or Google.', 'error');
      return;
    }
    
    // Sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await completeAuthentication(userCredential.user, 'email-password');
    
  } catch (error) {
    hideLoading();
    console.error('Email sign-in error:', error);
    
    if (error.code === 'auth/wrong-password') {
      showStatus('Incorrect password', 'error');
    } else if (error.code === 'auth/user-not-found') {
      showStatus('No account found. Please sign up first.', 'error');
    } else if (error.code === 'auth/too-many-requests') {
      showStatus('Too many failed attempts. Please try again later.', 'error');
    } else {
      showStatus(`Error: ${error.message}`, 'error');
    }
  }
});

// Magic Link Sign In (from Sign In tab)
document.getElementById('magicLinkSignInBtn').addEventListener('click', async () => {
  const email = document.getElementById('signInEmail').value.trim();
  
  if (!email) {
    showStatus('Please enter your email first', 'error');
    return;
  }
  
  showLoading();
  hideStatus();
  
  try {
    // Check if user exists
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    
    if (!signInMethods || signInMethods.length === 0) {
      hideLoading();
      showStatus('No account found with this email. Please sign up first.', 'error');
      return;
    }
    
    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };
    
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    
    // Save email for later
    window.localStorage.setItem('emailForSignIn', email);
    
    hideLoading();
    showStatus('✉️ Magic link sent! Check your email and click the link to sign in.', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Magic link error:', error);
    showStatus(`Error: ${error.message}`, 'error');
  }
});

// Magic Link Sign Up
document.getElementById('magicLinkSignUpForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('signUpEmail').value.trim();
  
  if (!email) {
    showStatus('Please enter your email', 'error');
    return;
  }
  
  showLoading();
  hideStatus();
  
  try {
    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };
    
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    
    // Save email for later
    window.localStorage.setItem('emailForSignIn', email);
    
    hideLoading();
    showStatus('✉️ Magic link sent! Check your email and click the link to complete sign up.', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Magic link error:', error);
    showStatus(`Error: ${error.message}`, 'error');
  }
});

// Check if returning from magic link
if (isSignInWithEmailLink(auth, window.location.href)) {
  showLoading();
  
  let email = window.localStorage.getItem('emailForSignIn');
  
  if (!email) {
    hideLoading();
    email = window.prompt('Please provide your email for confirmation');
  }
  
  if (email) {
    signInWithEmailLink(auth, email, window.location.href)
      .then(async (result) => {
        window.localStorage.removeItem('emailForSignIn');
        await completeAuthentication(result.user, 'magic-link');
      })
      .catch((error) => {
        hideLoading();
        console.error('Magic link sign-in error:', error);
        showStatus(`Error: ${error.message}`, 'error');
      });
  } else {
    hideLoading();
    showStatus('Email is required to complete sign-in', 'error');
  }
}

console.log('[Auth Page] Initialized');
