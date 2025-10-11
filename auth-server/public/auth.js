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
  signInTab.classList.add('border-primary-500', 'text-primary-600', 'bg-white');
  signInTab.classList.remove('border-transparent', 'text-gray-500');
  signUpTab.classList.remove('border-primary-500', 'text-primary-600', 'bg-white');
  signUpTab.classList.add('border-transparent', 'text-gray-500');
  signInForm.classList.remove('hidden');
  signUpForm.classList.add('hidden');
  hideStatus();
});

signUpTab.addEventListener('click', () => {
  signUpTab.classList.add('border-primary-500', 'text-primary-600', 'bg-white');
  signUpTab.classList.remove('border-transparent', 'text-gray-500');
  signInTab.classList.remove('border-primary-500', 'text-primary-600', 'bg-white');
  signInTab.classList.add('border-transparent', 'text-gray-500');
  signUpForm.classList.remove('hidden');
  signInForm.classList.add('hidden');
  hideStatus();
});

// Status Message Functions
function showStatus(message, type = 'info') {
  statusMessage.innerHTML = `
    <div class="p-4 rounded-xl border-2 ${
      type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
      type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
      'bg-blue-50 border-blue-200 text-blue-800'
    }">
      <p class="font-semibold text-sm">${message}</p>
    </div>
  `;
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

// Sync user to backend
async function syncUserToBackend(user) {
  try {
    console.log('[Auth] Attempting backend sync for:', user.email);
    const response = await fetch('http://localhost:3001/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Auth] Backend sync successful:', data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.warn('[Auth] Backend sync failed:', response.status, errorData);
      console.warn('[Auth] Continuing anyway - user can still use extension');
    }
  } catch (error) {
    console.warn('[Auth] Backend sync error:', error.message);
    console.warn('[Auth] Continuing anyway - user can still use extension');
  }
}

// Complete authentication and redirect to extension
async function completeAuthentication(user, authMethod) {
  try {
    console.log('[Auth] Starting authentication completion for:', user.email);
    
    // Prepare user data first
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      authMethod: authMethod,
      timestamp: Date.now()
    };

    // Send to server IMMEDIATELY for extension to pick up
    console.log('[Auth] Sending auth data to server (priority)...');
    const AUTH_SERVER_URL = window.location.origin; // Use current server URL
    const serverPromise = fetch(`${AUTH_SERVER_URL}/auth-success`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userData })
    }).then(response => {
      if (response.ok) {
        console.log('[Auth] ✅ Auth data sent to server successfully');
      } else {
        console.error('[Auth] Failed to send auth data:', response.status);
      }
    }).catch(error => {
      console.error('[Auth] Error sending auth data:', error);
    });

    // Sync to Supabase PostgreSQL via backend API
    console.log('[Auth] Syncing user to Supabase PostgreSQL...');
    syncUserToBackend(user).then(() => {
      console.log('[Auth] ✅ User synced to Supabase PostgreSQL');
    }).catch(err => {
      console.warn('[Auth] Supabase sync error (non-critical):', err);
    });

    // Wait for server response before showing success
    await serverPromise;

    // Hide loading and show success
    hideLoading();
    showStatus('✅ Authentication successful! The extension will open in a moment...', 'success');
    
    console.log('[Auth] ✅ Authentication complete! Extension should detect in 2 seconds...');
    
    // Show additional instruction after 5 seconds if tab is still open
    setTimeout(() => {
      if (!document.hidden) {
        showStatus('✅ Authentication complete! You can close this tab and click the ShopScout extension icon.', 'success');
      }
    }, 5000);

  } catch (error) {
    console.error('[Auth] Error completing authentication:', error);
    hideLoading();
    showStatus(`Error: ${error.message}`, 'error');
    throw error;
  }
}

// Google Sign In/Up
async function handleGoogleAuth() {
  hideStatus();
  
  try {
    // Don't show loading yet - let popup appear first
    console.log('[Auth] Opening Google sign-in popup...');
    const result = await signInWithPopup(auth, googleProvider);
    
    // Now show loading for the rest of the process
    showLoading();
    console.log('[Auth] Google sign-in successful, completing authentication...');
    
    await completeAuthentication(result.user, 'google');
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
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    
    if (!signInMethods || signInMethods.length === 0) {
      hideLoading();
      showStatus('No account found with this email. Please sign up first.', 'error');
      return;
    }
    
    if (!signInMethods.includes('password')) {
      hideLoading();
      showStatus('This email was registered with a different method. Try Magic Link or Google.', 'error');
      return;
    }
    
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

// Magic Link Sign In
document.getElementById('magicLinkSignInBtn').addEventListener('click', async () => {
  const email = document.getElementById('signInEmail').value.trim();
  
  if (!email) {
    showStatus('Please enter your email first', 'error');
    return;
  }
  
  showLoading();
  hideStatus();
  
  try {
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

console.log('[Auth Page] Initialized on http://localhost:8000');
