import { useState } from 'react';
import { Bird, Sparkles, ArrowRight, Mail, User, Loader2 } from 'lucide-react';

interface WelcomeScreenProps {
  onComplete: (nickname: string, email: string) => void;
}

const WelcomeScreen = ({ onComplete }: WelcomeScreenProps) => {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim() || !email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save to backend
      const response = await fetch('http://localhost:3001/api/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), email: email.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }

      const data = await response.json();
      
      // Save to local storage
      await chrome.storage.local.set({
        userId: data.userId,
        nickname: nickname.trim(),
        email: email.trim(),
        onboarded: true
      });

      onComplete(nickname.trim(), email.trim());
    } catch (err: any) {
      console.error('Error creating profile:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-primary/5 via-white to-accent/5 flex items-center justify-center p-3">
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Logo & Welcome */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl mb-3 shadow-glow">
            <Bird className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
            Welcome to ShopScout
          </h1>
          <p className="text-neutral-600 font-body text-sm">
            Your AI-powered shopping companion
          </p>
        </div>

        {/* Features Preview */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 shadow-card border border-neutral-100">
          <div className="flex items-start gap-2 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold font-heading text-neutral-900">
                Smart Price Tracking
              </h3>
              <p className="text-xs text-neutral-600 font-body">
                Get alerts when prices drop
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2 mb-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold font-heading text-neutral-900">
                Compare Prices Instantly
              </h3>
              <p className="text-xs text-neutral-600 font-body">
                Best deals across all stores
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-success" />
            </div>
            <div>
              <h3 className="text-sm font-semibold font-heading text-neutral-900">
                Privacy First
              </h3>
              <p className="text-xs text-neutral-600 font-body">
                No tracking, no data selling
              </p>
            </div>
          </div>
        </div>

        {/* Onboarding Form */}
        <div className="bg-white rounded-xl p-4 shadow-card border border-neutral-100">
          <h2 className="text-lg font-semibold font-heading text-neutral-900 mb-3">
            Let's get started
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Nickname Input */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5 font-heading">
                Choose a nickname
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g., ShopperPro"
                  maxLength={30}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5 font-heading">
                Email for updates
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-body"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg p-2 text-xs text-danger font-body">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !nickname.trim() || !email.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg text-sm font-semibold hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] font-heading"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <span>Start Shopping Smarter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="mt-3 pt-3 border-t border-neutral-100">
            <p className="text-xs text-neutral-500 text-center font-body leading-relaxed">
              🔒 Privacy-first: No passwords, no tracking.
              <br />
              Only nickname & email for alerts.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 mt-3 font-body">
          By continuing, you agree to receive price alerts
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
