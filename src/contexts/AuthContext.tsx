import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLinkSignIn: (email: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const checkStoredSession = async () => {
      try {
        const { firebaseUser } = await chrome.storage.local.get('firebaseUser');
        if (firebaseUser) {
          setUser(firebaseUser);
        }
      } catch (error) {
        console.error('Error checking stored session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStoredSession();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FIREBASE_AUTH',
        action: 'GOOGLE_SIGN_IN'
      });

      if (!response) {
        throw new Error('No response from background script. Make sure the extension is properly loaded.');
      }

      if (response.success && response.user) {
        setUser(response.user);
        await chrome.storage.local.set({ firebaseUser: response.user });
      } else {
        throw new Error(response.error?.message || 'Google sign-in failed');
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
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
      window.localStorage.setItem('emailForSignIn', email);
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
        window.localStorage.removeItem('emailForSignIn');
      } else {
        throw new Error(response.error?.message || 'Magic link sign-in failed');
      }
    } catch (error: any) {
      console.error('Error completing magic link sign-in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      await chrome.storage.local.remove('firebaseUser');
      window.localStorage.removeItem('emailForSignIn');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    sendMagicLink,
    completeMagicLinkSignIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
