import { ShoppingBag, Search } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <ShoppingBag className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-neutral-900 mb-3">
          Welcome to ShopScout
        </h2>
        
        <p className="text-neutral-600 mb-6 leading-relaxed">
          Your AI-powered shopping assistant is ready to help you find the best deals, 
          compare prices, and make smarter purchasing decisions.
        </p>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-neutral-200 text-left">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Search className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 mb-1">How to get started</h3>
              <p className="text-sm text-neutral-600">
                Navigate to any product page on Amazon, eBay, Walmart, Temu, or other supported stores.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>Automatic product detection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>Cross-retailer price comparison</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>AI-powered review summaries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>Trust & safety analysis</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-500 mt-6">
          ShopScout v1.0 • Privacy-first AI Shopping Assistant
        </p>
      </div>
    </div>
  );
}
