import { Sparkles } from 'lucide-react';

export default function LoadingState() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark rounded-2xl animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          Analyzing Product
        </h2>
        
        <p className="text-neutral-600 mb-6">
          Finding the best deals for you...
        </p>

        <div className="space-y-3 max-w-xs mx-auto">
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full animate-pulse-subtle" style={{ width: '60%' }}></div>
          </div>
          
          <div className="space-y-2 text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
              <span>Scraping product data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <span>Searching for deals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span>Analyzing reviews</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
