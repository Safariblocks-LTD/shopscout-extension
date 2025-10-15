import { ShoppingBag, Sparkles, TrendingDown, Shield, Star, ArrowRight, Bird, Scan } from 'lucide-react';

export default function EmptyState() {
  const handleScanProduct = () => {
    console.log('[EmptyState] Scan button clicked');
    
    // Send message to background script to scan current page
    chrome.runtime.sendMessage({ type: 'MANUAL_SCAN' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[EmptyState] Error:', chrome.runtime.lastError.message);
        return;
      }
      
      if (response?.success) {
        console.log('[EmptyState] ✅ Manual scan triggered successfully');
      } else {
        console.error('[EmptyState] ❌ Manual scan failed:', response?.error);
      }
    });
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
            Ready to Find Better Deals!
          </h1>
          <p className="text-neutral-600 font-body text-sm px-4">
            Unlock powerful shopping insights instantly
          </p>
        </div>

        {/* Manual Scan Button */}
        <div className="mb-4">
          <button
            onClick={handleScanProduct}
            className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-4 px-6 rounded-xl font-bold text-base hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg"
          >
            <Scan className="w-5 h-5" />
            <span>Scan This Product Page</span>
          </button>
          <p className="text-center text-xs text-neutral-500 mt-2">
            Click to analyze the current product page
          </p>
        </div>

        {/* How to Start Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 shadow-card border border-neutral-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold font-heading text-neutral-900">
              How It Works
            </h2>
          </div>
          
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-3 mb-3">
            <p className="text-sm text-neutral-700 font-body leading-relaxed">
              Visit any product page on <span className="font-semibold text-primary">Amazon</span>, <span className="font-semibold text-accent">eBay</span>, <span className="font-semibold text-success">Walmart</span> & <span className="font-semibold text-warning">hundreds of other stores</span>.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-600 font-body">
            <ArrowRight className="w-3 h-3 text-primary" />
            <span>ShopScout automatically detects products or click "Scan" button</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg p-3 shadow-card border border-neutral-100 hover:shadow-card-hover transition-all">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
              <TrendingDown className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xs font-semibold font-heading text-neutral-900 mb-1">
              Price Comparison
            </h3>
            <p className="text-xs text-neutral-600 font-body">
              Find the best deals across stores
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg p-3 shadow-card border border-neutral-100 hover:shadow-card-hover transition-all">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-xs font-semibold font-heading text-neutral-900 mb-1">
              AI Summaries
            </h3>
            <p className="text-xs text-neutral-600 font-body">
              Smart review analysis
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg p-3 shadow-card border border-neutral-100 hover:shadow-card-hover transition-all">
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center mb-2">
              <Shield className="w-4 h-4 text-success" />
            </div>
            <h3 className="text-xs font-semibold font-heading text-neutral-900 mb-1">
              Trust Score
            </h3>
            <p className="text-xs text-neutral-600 font-body">
              Safety & reliability check
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-lg p-3 shadow-card border border-neutral-100 hover:shadow-card-hover transition-all">
            <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center mb-2">
              <Star className="w-4 h-4 text-warning" />
            </div>
            <h3 className="text-xs font-semibold font-heading text-neutral-900 mb-1">
              Price Alerts
            </h3>
            <p className="text-xs text-neutral-600 font-body">
              Track & get notified
            </p>
          </div>
        </div>

        {/* Supported Stores */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-neutral-100">
          <p className="text-xs font-medium text-neutral-700 mb-2 font-heading flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent" />
            <span>Works on 100+ Stores Worldwide</span>
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-md font-body">Amazon</span>
            <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-md font-body">eBay</span>
            <span className="px-2 py-1 bg-success/10 text-success text-xs font-semibold rounded-md font-body">Walmart</span>
            <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-semibold rounded-md font-body">Target</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-md font-body">Best Buy</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-md font-body">Argos</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md font-body">Jumia</span>
            <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-md font-body">+100 more</span>
          </div>
          <p className="text-xs text-neutral-500 font-body">
            🌍 US • UK • Kenya • Nigeria & more regions
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 mt-4 font-body">
          ShopScout v1.0 • Privacy-first Shopping
        </p>
      </div>
    </div>
  );
}
