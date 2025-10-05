import { useState } from 'react';
import { Mail, X, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const EmailVerificationBanner = () => {
  const { user, sendVerificationEmail, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Don't show if user is verified or dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    try {
      setLoading(true);
      setError('');
      await sendVerificationEmail();
      setSent(true);
      setTimeout(() => setSent(false), 5000); // Reset after 5 seconds
    } catch (err: any) {
      setError('Failed to send email. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshUser();
    } catch (err: any) {
      console.error('Error refreshing user:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 relative animate-slide-down">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <Mail className="w-4 h-4 text-amber-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 font-heading mb-1">
            Verify your email address
          </p>
          <p className="text-xs text-amber-700 font-body mb-2">
            Check your inbox and click the verification link to unlock all features.
          </p>
          
          <div className="flex items-center gap-3">
            {sent ? (
              <div className="flex items-center gap-2 text-xs text-accent font-body">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verification email sent! Check your inbox.</span>
              </div>
            ) : error ? (
              <div className="text-xs text-danger font-body">
                {error}
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline disabled:opacity-50 font-heading flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  'Resend verification email'
                )}
              </button>
            )}
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-50 font-heading flex items-center gap-1.5 ml-auto"
              title="Check if email is verified"
            >
              {refreshing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  <span>I verified my email</span>
                </>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 hover:bg-amber-100 rounded-lg transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4 text-amber-600" />
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
