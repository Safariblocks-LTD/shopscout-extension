import { useState, useEffect } from 'react';
import { Sparkles, LogOut, User as UserIcon, Loader2, RefreshCw } from 'lucide-react';
import PriceHistory from './components/PriceHistory';
import TrustBadge from './components/TrustBadge';
import ActionBar from './components/ActionBar';
import EmptyState from './components/EmptyState';
import AuthPrompt from './components/AuthPrompt';
import PriceComparison from './components/PriceComparison';
import ReviewSummary from './components/ReviewSummary';
import AIAssistant from './components/AIAssistant';
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
        console.log('[ShopScout Sidebar] Auth check result:', result);
        
        if (result.authenticated && result.userId) {
          console.log('[ShopScout Sidebar] User authenticated:', result.userEmail);
          setOnboarded(true);
          setNickname(result.displayName || result.userEmail?.split('@')[0] || 'User');
          setUserEmail(result.userEmail || '');
          setLoading(false);
        } else {
          // Check legacy onboarding
          chrome.storage.local.get(['onboarded', 'nickname', 'email'], (legacyResult) => {
            if (legacyResult.onboarded) {
              console.log('[ShopScout Sidebar] Using legacy auth');
              setOnboarded(true);
              setNickname(legacyResult.nickname || '');
              setUserEmail(legacyResult.email || '');
            } else {
              console.log('[ShopScout Sidebar] No authentication found');
            }
            setLoading(false);
          });
        }
      });
    };

    // Check immediately
    console.log('[ShopScout Sidebar] Starting authentication check...');
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
      console.log('[ShopScout UI] Message received:', message.type, message);
      
      if (message.type === 'PRODUCT_UPDATED') {
        console.log('[ShopScout UI] Setting product:', message.data);
        setProduct(message.data);
        setAnalyzing(true);
        setLoading(false); // Stop loading when product is set
      } else if (message.type === 'ANALYSIS_COMPLETE') {
        console.log('[ShopScout UI] Setting analysis:', message.data);
        setAnalysis(message.data);
        setAnalyzing(false);
        setLoading(false);
      } else if (message.type === 'SUMMARY_STREAMING') {
        // Handle streaming AI summary chunks in real-time (Phase 3)
        if (message.data?.chunk) {
          setAnalysis(prev => {
            if (!prev) return prev;
            return { 
              ...prev, 
              summary: message.data.chunk,
              summaryComplete: message.data.complete || false
            };
          });
          if (message.data.complete) {
            console.log('[ShopScout UI] ✅ Streaming summary complete');
          } else {
            console.log('[ShopScout UI] 📝 Streaming chunk received');
          }
        }
      } else if (message.type === 'SUMMARY_COMPLETE') {
        // Update analysis with product summary when it arrives (legacy support)
        if (message.data?.summary) {
          setAnalysis(prev => {
            if (!prev) return prev;
            return { ...prev, summary: message.data.summary, summaryComplete: true };
          });
          console.log('[ShopScout UI] Product summary received');
        }
      } else if (message.type === 'ANALYSIS_ERROR') {
        console.error('[ShopScout UI] Analysis error:', message.data);
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

  // Show empty state if no product
  if (!product) {
    return <EmptyState />;
  }

  // Safety check for product data
  if (!product.title || !product.price) {
    console.error('[ShopScout UI] Invalid product data:', product);
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-neutral-600 font-body mb-4">Invalid product data received</p>
          <button
            onClick={() => setProduct(null)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Go Back
          </button>
        </div>
      </div>
    );
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
                <img 
                  src="/assets/icons/shopscoutlogo128.png" 
                  alt="ShopScout" 
                  className="w-6 h-6 object-contain"
                />
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
          
          {/* Product Title Bar with Refresh */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-heading font-bold text-neutral-700">Current Product</h2>
            <button
              onClick={() => {
                console.log('[ShopScout UI] Refresh button clicked');
                chrome.runtime.sendMessage({ type: 'SIDEPANEL_REQUEST', action: 'REFRESH_ANALYSIS' }, (response) => {
                  if (response?.success) {
                    console.log('[ShopScout UI] Analysis refresh triggered');
                    setAnalyzing(true);
                  }
                });
              }}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Refresh analysis"
            >
              <RefreshCw className={`w-4 h-4 text-neutral-600 ${analyzing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Product Header */}
          <div className="card">
            <div className="flex gap-4">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.title || 'Product'}
                  className="w-24 h-24 object-cover rounded-xl border-2 border-neutral-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-2">
                  {product.title || 'Product'}
                </h2>
                <div className="text-3xl font-heading font-bold text-primary">
                  ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                </div>
                {product.rating && (
                  <div className="text-sm text-neutral-600 mt-1">
                    ⭐ {product.rating}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Summary - Streaming from Gemini Nano */}
          {analysis?.summary && (
            <ReviewSummary
              reviews={product.reviews || '0 reviews'}
              rating={product.rating}
              aiSummary={analysis.summary}
              summaryComplete={analysis.summaryComplete !== false}
            />
          )}

          {/* Trust Badge */}
          {analysis?.trustScore !== undefined && (
            <TrustBadge
              score={analysis.trustScore}
              product={product}
              aiAnalysis={null}
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

          {/* Price History - Only show if data exists */}
          {analysis?.priceHistory && analysis.priceHistory.prices && analysis.priceHistory.prices.length > 0 && (
            <PriceHistory
              data={analysis.priceHistory}
              currentPrice={product.price}
              onTrackPrice={handleTrackPrice}
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

      {/* AI Assistant (Floating Chat) */}
      {product && (
        <AIAssistant
          productTitle={product.title}
          productPrice={product.price}
          productRating={product.rating}
          bestDealPrice={bestDeal?.price}
          dealsCount={analysis?.deals?.results?.length}
        />
      )}
    </div>
  );
}

export default App;
