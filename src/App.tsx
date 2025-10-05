import { useState, useEffect } from 'react';
import { Bird, Sparkles, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import ProductSnapshot from './components/ProductSnapshot';
import PriceHistory from './components/PriceHistory';
import ReviewSummary from './components/ReviewSummary';
import TrustBadge from './components/TrustBadge';
import ActionBar from './components/ActionBar';
import EmptyState from './components/EmptyState';
import AuthPrompt from './components/AuthPrompt';
import PriceComparison from './components/PriceComparison';
import { ProductData, AnalysisData } from './types';

const LoadingState = () => (
  <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
      <p className="text-neutral-600 font-body">Loading...</p>
    </div>
  </div>
);

function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [nickname, setNickname] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [product, setProduct] = useState<ProductData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Check if user is authenticated - poll every 2 seconds
  useEffect(() => {
    const checkAuth = () => {
      chrome.storage.local.get(['authenticated', 'displayName', 'userEmail', 'userId'], (result) => {
        if (result.authenticated && result.userId) {
          setOnboarded(true);
          setNickname(result.displayName || '');
          setUserEmail(result.userEmail || '');
          setLoading(false);
        } else {
          // Check legacy onboarding
          chrome.storage.local.get(['onboarded', 'nickname', 'email'], (legacyResult) => {
            if (legacyResult.onboarded) {
              setOnboarded(true);
              setNickname(legacyResult.nickname || '');
              setUserEmail(legacyResult.email || '');
            }
            setLoading(false);
          });
        }
      });
    };

    // Check immediately
    checkAuth();

    // Then check every 2 seconds to detect authentication
    const interval = setInterval(checkAuth, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Request current product data
    chrome.runtime.sendMessage(
      { type: 'SIDEPANEL_REQUEST', action: 'GET_CURRENT_PRODUCT' },
      (response) => {
        if (response?.product) {
          setProduct(response.product);
          loadAnalysis();
        } else {
          setLoading(false);
        }
      }
    );

    // Listen for product updates
    const messageListener = (message: any) => {
      if (message.type === 'PRODUCT_UPDATED') {
        setProduct(message.data);
        setAnalyzing(true);
      } else if (message.type === 'ANALYSIS_COMPLETE') {
        setAnalysis(message.data);
        setAnalyzing(false);
        setLoading(false);
      } else if (message.type === 'ANALYSIS_ERROR') {
        setAnalyzing(false);
        setLoading(false);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const loadAnalysis = () => {
    setAnalyzing(true);
    chrome.runtime.sendMessage(
      { type: 'SIDEPANEL_REQUEST', action: 'GET_ANALYSIS' },
      (response) => {
        if (response?.analysis) {
          setAnalysis(response.analysis);
          setAnalyzing(false);
        }
        setLoading(false);
      }
    );
  };

  const handleRefresh = () => {
    setAnalyzing(true);
    chrome.runtime.sendMessage(
      { type: 'SIDEPANEL_REQUEST', action: 'REFRESH_ANALYSIS' },
      (response) => {
        if (!response?.success) {
          setAnalyzing(false);
        }
      }
    );
  };

  const handleSaveToWishlist = () => {
    if (!product) return;

    chrome.runtime.sendMessage(
      {
        type: 'SIDEPANEL_REQUEST',
        action: 'SAVE_TO_WISHLIST',
        data: product,
      },
      (response) => {
        if (response?.success) {
          // Show success notification
          console.log('Saved to wishlist');
        }
      }
    );
  };

  const handleTrackPrice = (targetPrice: number) => {
    if (!product?.productId) return;

    chrome.runtime.sendMessage(
      {
        type: 'SIDEPANEL_REQUEST',
        action: 'TRACK_PRICE',
        productId: product.productId,
        targetPrice,
      },
      (response) => {
        if (response?.success) {
          console.log('Price tracking enabled');
        }
      }
    );
  };

  // Handle sign out
  const handleSignOut = async () => {
    await chrome.storage.local.clear();
    setOnboarded(false);
    setNickname('');
    setUserEmail('');
  };

  if (loading) {
    return <LoadingState />;
  }

  // Show auth prompt if not authenticated
  if (!onboarded) {
    return <AuthPrompt />;
  }

  if (!product) {
    return <EmptyState />;
  }

  const bestDeal = analysis?.deals?.results?.[0];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50">
      
      {/* Header with User Profile */}
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-100 shadow-sm">
        <div className="px-4 py-3">
          {/* Top Row: Logo and User Profile */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-sm">
                <Bird className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-heading font-bold text-neutral-900">ShopScout</h1>
                <p className="text-xs text-neutral-500 font-body">AI Shopping Assistant</p>
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-neutral-900 font-heading">
                    {nickname}
                  </p>
                  <p className="text-xs text-neutral-500 font-body truncate max-w-[120px]">
                    {userEmail}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="p-2.5 hover:bg-danger/10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 group"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-neutral-600 group-hover:text-danger" />
              </button>
            </div>
          </div>

          {/* Bottom Row: Analyzing Status */}
          {analyzing && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/10 rounded-xl animate-pulse-glow">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary font-heading">Analyzing product...</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        <div className="p-4 space-y-4">
          {/* Product Snapshot */}
          <ProductSnapshot
            product={product}
            trustScore={analysis?.trustScore}
            onRefresh={handleRefresh}
          />

          {/* Trust Badge */}
          {analysis?.trustScore !== undefined && (
            <TrustBadge
              score={analysis.trustScore}
              product={product}
              aiAnalysis={analysis.aiAnalysis}
            />
          )}

          {/* Price Comparison */}
          {analysis?.deals?.results && (
            <PriceComparison
              currentPrice={product.price}
              deals={analysis.deals.results}
              currentSite={product.site}
            />
          )}

          {/* Price History */}
          {analysis?.priceHistory && (
            <PriceHistory
              data={analysis.priceHistory}
              currentPrice={product.price}
              onTrackPrice={handleTrackPrice}
            />
          )}

          {/* Review Summary */}
          {product.reviews && (
            <ReviewSummary
              reviews={product.reviews}
              rating={product.rating}
            />
          )}
        </div>
      </main>

      {/* Action Bar */}
      <ActionBar
        bestDeal={bestDeal}
        onSave={handleSaveToWishlist}
        onShare={() => {
          if (navigator.share) {
            navigator.share({
              title: product.title,
              text: `Check out this deal: ${product.title}`,
              url: product.url,
            });
          }
        }}
      />
    </div>
  );
}

export default App;
