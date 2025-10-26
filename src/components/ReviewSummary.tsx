import { Sparkles, ThumbsUp, Clock, Zap } from 'lucide-react';

interface ReviewSummaryProps {
  reviews: string;
  rating: string | null;
  aiSummary?: string | null;
  summaryComplete?: boolean;
}

export default function ReviewSummary({ reviews, rating, aiSummary, summaryComplete = true }: ReviewSummaryProps) {
  
  // Silicon Valley-grade AI summary parsing with enhanced context
  const parseAIInsights = (summary: string | null | undefined) => {
    if (!summary) return { 
      summary: '', 
      keyInsights: [], 
      recommendation: '', 
      savings: null 
    };
    
    const lines = summary.split('\n').filter(line => line.trim());
    const keyInsights: string[] = [];
    let recommendation = '';
    let savings: number | null = null;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Extract key insights
      if (trimmed.toLowerCase().includes('key insight') || trimmed.toLowerCase().includes('important')) {
        keyInsights.push(trimmed.replace(/^[-*•]\s*/, ''));
      }
      
      // Extract recommendation
      if (trimmed.toLowerCase().includes('recommend') || trimmed.toLowerCase().includes('suggest')) {
        recommendation = trimmed;
      }
      
      // Extract savings
      const savingsMatch = trimmed.match(/\$?(\d+(?:\.\d{2})?)\s*(?:savings?|save)/i);
      if (savingsMatch) {
        savings = parseFloat(savingsMatch[1]);
      }
    });
    
    return { summary, keyInsights, recommendation, savings };
  };

  const { summary, keyInsights, recommendation, savings } = parseAIInsights(aiSummary);
  
  // World-class loading states
  const LoadingStates = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 w-8 h-8 border-2 border-primary/30 rounded-full animate-ping" />
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">Analyzing with Chrome AI</p>
          <p className="text-xs text-neutral-600">Gemini Nano processing product data...</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full animate-pulse" />
        <div className="h-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full animate-pulse" />
        <div className="h-2 bg-gradient-to-r from-primary/5 to-transparent rounded-full animate-pulse" />
      </div>
    </div>
  );

  return (
    <div className="card border-0 shadow-xl bg-gradient-to-br from-white via-white to-primary/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-8 bg-gradient-to-b from-primary to-primary-dark rounded-full" />
          <h3 className="text-xl font-bold text-neutral-900">AI Product Insights</h3>
        </div>
        
        <div className="flex items-center gap-3">
          {rating && (
            <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-full">
              <span className="text-yellow-500 text-sm">★</span>
              <span className="font-bold text-sm text-neutral-900">{rating}</span>
            </div>
          )}
          <div className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
            {reviews}
          </div>
        </div>
      </div>

      {/* Instant AI Summary Card */}
      <div className="space-y-4">
        {!aiSummary && !summaryComplete && (
          <LoadingStates />
        )}
        
        {aiSummary && (
          <div className="space-y-4">
            {/* Main AI Summary */}
            <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/10 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="relative">
                  {summaryComplete ? (
                    <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-primary rounded-full flex items-center justify-center animate-spin">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-primary-dark">Chrome AI Analysis</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      summaryComplete 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700 animate-pulse'
                    }`}>
                      {summaryComplete ? 'Complete' : 'Analyzing...'}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-800 leading-relaxed font-medium">
                    {summary}
                  </p>
                </div>
              </div>
              
              {/* Key Insights */}
              {keyInsights.length > 0 && (
                <div className="mt-4 pt-3 border-t border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-neutral-800">Key Insights</span>
                  </div>
                  <ul className="space-y-1.5">
                    {keyInsights.slice(0, 3).map((insight, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-neutral-700">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Recommendation */}
              {recommendation && (
                <div className="mt-3 pt-3 border-t border-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-success-dark" />
                    <span className="text-xs font-semibold text-success-dark">Recommendation</span>
                  </div>
                  <p className="text-xs text-neutral-700">{recommendation}</p>
                </div>
              )}
              
              {/* Savings Alert */}
              {savings !== null && (
                <div className="mt-3 p-2 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-success-dark" />
                    <span className="text-xs font-bold text-success-dark">
                      Save ${String(savings)} with better deals!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Instant Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold py-2 px-3 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            View Best Deal
          </button>
          <button className="flex-1 bg-neutral-100 text-neutral-700 text-sm font-semibold py-2 px-3 rounded-lg hover:bg-neutral-200 transition-all duration-200">
            Compare All
          </button>
        </div>
      </div>
    </div>
  );
}
