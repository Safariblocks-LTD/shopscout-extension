import { useState } from 'react';
import { Mail, Loader2, CheckCircle2, Bird, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuthScreen = () => {
  const { signInWithGoogle, sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError('');
      await sendMagicLink(email);
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary/5 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-slide-down">
          {/* Owl Mascot Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-primary-dark to-primary-dark rounded-3xl shadow-glow mb-6 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse-glow"></div>
            <Bird className="w-10 h-10 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          
          <h1 className="text-4xl font-heading font-bold text-neutral-900 mb-3 tracking-tight">
            Meet ShopScout
          </h1>
          <p className="text-lg text-neutral-600 font-body mb-2">
            Your personal AI shopping agent
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Passwordless & Secure</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-shadow duration-300 p-8 space-y-6 border border-neutral-100 animate-scale-in">
          {!emailSent ? (
            <>
              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-neutral-200 rounded-2xl font-semibold text-neutral-800 hover:bg-neutral-50 hover:border-primary/30 hover:shadow-card-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-card hover:scale-[1.02] active:scale-[0.98]"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span className="font-heading">Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-neutral-500 font-body">or</span>
                </div>
              </div>

              {!showEmailInput ? (
                <button
                  onClick={() => setShowEmailInput(true)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary/10 text-primary-dark rounded-2xl font-semibold hover:bg-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Mail className="w-5 h-5" />
                  <span className="font-heading">Sign in with Magic Link</span>
                </button>
              ) : (
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-neutral-700 mb-2 font-heading"
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-body text-neutral-900 placeholder:text-neutral-400"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-semibold hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-heading">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      <span className="font-heading">Send Magic Link</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailInput(false)}
                  className="w-full text-sm text-neutral-600 hover:text-neutral-900 transition-colors font-body"
                >
                  ← Back to sign in options
                </button>
              </form>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-danger/10 border-2 border-danger/20 rounded-xl animate-slide-down">
                  <p className="text-sm text-danger-dark font-body">{error}</p>
                </div>
              )}
            </>
          ) : (
            /* Email Sent Success */
            <div className="text-center py-8 space-y-4 animate-scale-in">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-full mb-4 animate-bounce-subtle">
                <CheckCircle2 className="w-10 h-10 text-accent animate-shine" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-neutral-900">
                Check your email
              </h3>
              <p className="text-neutral-600 font-body">
                We've sent a magic link to <strong className="text-neutral-900">{email}</strong>
              </p>
              <p className="text-sm text-neutral-500 font-body">
                Click the link in the email to sign in. The link will expire in 1 hour.
              </p>
              
              {/* Resend Option */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="text-primary hover:text-primary-dark font-semibold transition-colors font-heading hover:underline"
                >
                  Try a different email
                </button>
              </div>

              {/* Check Email Tips */}
              <div className="mt-6 p-4 bg-neutral-50 rounded-xl text-left">
                <p className="text-xs font-semibold text-neutral-700 mb-2">📧 Can't find the email?</p>
                <ul className="text-xs text-neutral-600 space-y-1 font-body">
                  <li>• Check your spam/junk folder</li>
                  <li>• Wait 1-2 minutes for delivery</li>
                  <li>• Make sure you entered the correct email</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-500 mt-6 font-body">
          By continuing, you agree to ShopScout's{' '}
          <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
          {' '}and{' '}
          <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
        </p>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-neutral-400 font-body">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-primary-dark rounded-full"></div>
            <span>No Password</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
