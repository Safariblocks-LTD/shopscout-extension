import { Lock, ExternalLink } from 'lucide-react';

const AuthPrompt = () => {
  const openAuthPage = () => {
    // Use production auth URL
    const authUrl = 'https://shopscout-auth.fly.dev';
    window.open(authUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-3xl mb-4 shadow-xl">
            <img 
              src="/assets/icons/shopscoutlogo128.png" 
              alt="ShopScout" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-primary via-primary-dark to-accent bg-clip-text text-transparent mb-2">
            Authentication Required
          </h1>
          <p className="text-neutral-600 font-body">
            Please sign in to use ShopScout
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-neutral-100">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-xl border border-primary-100">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">Click the button below</h3>
                <p className="text-sm text-neutral-600">
                  This will open the authentication page in a new tab
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-accent-50 rounded-xl border border-accent-100">
              <div className="flex-shrink-0 w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center">
                <span className="text-accent-700 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">Sign in with Google</h3>
                <p className="text-sm text-neutral-600">
                  Choose your preferred authentication method
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-700 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">Start shopping!</h3>
                <p className="text-sm text-neutral-600">
                  This sidebar will automatically update once you're signed in
                </p>
              </div>
            </div>

            <button
              onClick={openAuthPage}
              className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-4 rounded-xl font-bold text-base hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              <span>Open Authentication Page</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            <div className="text-center pt-4">
              <p className="text-xs text-neutral-500">
                🔒 Secure authentication powered by Firebase
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            <strong>Note:</strong> Keep this sidebar open while authenticating
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            The sidebar will automatically detect when you sign in
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPrompt;
