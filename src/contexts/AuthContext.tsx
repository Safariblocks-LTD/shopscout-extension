import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  checkUserExists: (email: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLinkSignIn: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user to backend
  const syncUserToBackend = async (userData: FirebaseUser, authMethod: string) => {
    try {
      const USE_PRODUCTION = true;
      const API_URL = USE_PRODUCTION ? 'https://shopscout-api.fly.dev' : 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/user/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          emailVerified: userData.emailVerified,
          authMethod
        })
      });

      if (!response.ok) {
        console.error('[Auth] Failed to sync user to Supabase PostgreSQL');
      } else {
        console.log('[Auth] ✅ User synced to Supabase PostgreSQL database');
      }
    } catch (error) {
      console.error('[Auth] Error syncing user to backend:', error);
      // Don't throw - user is still authenticated in Firebase
    }
  };

  useEffect(() => {
    // Check for stored user session
    const checkStoredSession = async () => {
      try {
        const { firebaseUser } = await chrome.storage.local.get('firebaseUser');
        if (firebaseUser) {
          console.log('[AuthContext] Found stored user:', firebaseUser.email);
          setUser(firebaseUser);
        } else {
          console.log('[AuthContext] No stored user found');
        }
      } catch (error) {
        console.error('[AuthContext] Error checking stored session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStoredSession();

    // Listen for storage changes (when user signs in on auth page)
    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.firebaseUser) {
        const newUser = changes.firebaseUser.newValue;
        console.log('[AuthContext] Storage changed - User updated:', newUser?.email);
        setUser(newUser || null);
      }
    };

    chrome.storage.onChanged.addListener(storageListener);

    // Cleanup listener on unmount
    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FIREBASE_AUTH',
        action: 'CHECK_USER_EXISTS',
        email
      });

      if (!response) {
        throw new Error('No response from background script.');
      }

      return response.exists || false;
    } catch (error: any) {
      console.error('Error checking user existence:', error);
      return false;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FIREBASE_AUTH',
        action: 'CREATE_USER_WITH_EMAIL',
        email,
        password
      });

      if (!response) {
        throw new Error('No response from background script. Make sure the extension is properly loaded.');
      }

      if (response.success && response.user) {
        setUser(response.user);
        await chrome.storage.local.set({ firebaseUser: response.user });
        
        // Sync user to Supabase PostgreSQL
        await syncUserToBackend(response.user, 'email-password');
      } else {
        throw new Error(response.error?.message || 'Sign up failed');
      }
    } catch (error: any) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FIREBASE_AUTH',
        action: 'SIGN_IN_WITH_EMAIL',
        email,
        password
      });

      if (!response) {
        throw new Error('No response from background script. Make sure the extension is properly loaded.');
      }

      if (response.success && response.user) {
        setUser(response.user);
        await chrome.storage.local.set({ firebaseUser: response.user });
        
        // Sync user to Supabase PostgreSQL
        await syncUserToBackend(response.user, 'email-password');
      } else {
        throw new Error(response.error?.message || 'Sign in failed');
      }
    } catch (error: any) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FIREBASE_AUTH',
        action: 'SEND_MAGIC_LINK',
        email
      });

      if (!response) {
        throw new Error('No response from background script. Make sure the extension is properly loaded.');
      }

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to send magic link');
      }

      // Save email for later completion
      await chrome.storage.local.set({ emailForSignIn: email });
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      throw error;
    }
  };

  const completeMagicLinkSignIn = async (email: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FIREBASE_AUTH',
        action: 'COMPLETE_MAGIC_LINK',
        email,
        url: window.location.href
      });

      if (response.success && response.user) {
        setUser(response.user);
        await chrome.storage.local.set({ firebaseUser: response.user });
        await chrome.storage.local.remove('emailForSignIn');
        
        // Sync user to Supabase PostgreSQL
        await syncUserToBackend(response.user, 'magic-link');
      } else {
        throw new Error(response.error?.message || 'Magic link sign-in failed');
      }
    } catch (error: any) {
      console.error('Error completing magic link sign-in:', error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FIREBASE_AUTH',
        action: 'SEND_VERIFICATION_EMAIL'
      });

      if (!response || !response.success) {
        throw new Error(response?.error?.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FIREBASE_AUTH',
        action: 'CHECK_AUTH_STATE'
      });

      if (response && response.success && response.user) {
        setUser(response.user);
        await chrome.storage.local.set({ firebaseUser: response.user });
      }
    } catch (error: any) {
      console.error('Error refreshing user:', error);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      await chrome.storage.local.remove('firebaseUser');
      await chrome.storage.local.remove('emailForSignIn');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    checkUserExists,
    signUpWithEmail,
    signInWithEmail,
    sendMagicLink,
    completeMagicLinkSignIn,
    sendVerificationEmail,
    refreshUser,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
