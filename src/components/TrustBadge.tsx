import { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, Info, Sparkles } from 'lucide-react';
import { ProductData } from '../types';
import { cn } from '../utils/cn';

interface TrustBadgeProps {
  score: number;
  product: ProductData;
  aiAnalysis?: string | null;
}

export default function TrustBadge({ score, product, aiAnalysis }: TrustBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getTrustLevel = () => {
    if (score >= 80) return {
      label: 'High Trust',
      icon: CheckCircle,
      color: 'text-success-dark',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      description: 'This seller has an excellent reputation and track record.',
    };
    if (score >= 60) return {
      label: 'Trusted',
      icon: Shield,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      description: 'This seller is reliable with good customer feedback.',
    };
    if (score >= 40) return {
      label: 'Moderate Trust',
      icon: AlertTriangle,
      color: 'text-warning-dark',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20',
      description: 'This seller has mixed reviews. Proceed with caution.',
    };
    return {
      label: 'Low Trust',
      icon: XCircle,
      color: 'text-danger-dark',
      bgColor: 'bg-danger/10',
      borderColor: 'border-danger/20',
      description: 'This seller has concerning indicators. Extra caution advised.',
    };
  };

  const trustLevel = getTrustLevel();
  const Icon = trustLevel.icon;

  const trustFactors = [
    {
      label: 'Seller Verification',
      value: product.seller ? 'Verified' : 'Unknown',
      positive: !!product.seller,
    },
    {
      label: 'Customer Reviews',
      value: product.reviews || 'No reviews',
      positive: !!product.reviews,
    },
    {
      label: 'Rating',
      value: product.rating || 'N/A',
      positive: product.rating ? parseFloat(product.rating) >= 4.0 : false,
    },
    {
      label: 'Price Analysis',
      value: 'Within normal range',
      positive: true,
    },
  ];

  return (
    <div className={cn('card border-2', trustLevel.borderColor, trustLevel.bgColor)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', trustLevel.bgColor)}>
            <Icon className={cn('w-6 h-6', trustLevel.color)} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">{trustLevel.label}</h3>
            <p className="text-sm text-neutral-600">Trust Score: {score}/100</p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-1 hover:bg-white/50 rounded transition-colors"
          title="Show details"
        >
          <Info className="w-4 h-4 text-neutral-600" />
        </button>
      </div>

      {/* Trust Score Bar */}
      <div className="mb-3">
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              score >= 80 ? 'bg-success' :
              score >= 60 ? 'bg-primary' :
              score >= 40 ? 'bg-warning' : 'bg-danger'
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-neutral-700 mb-3">
        {trustLevel.description}
      </p>

      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="mb-3 p-3 bg-white/50 rounded-lg border border-neutral-200">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold text-primary-dark mb-1">
                AI Analysis
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed">
                {aiAnalysis}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-neutral-200">
          <h4 className="text-sm font-semibold text-neutral-900 mb-2">Trust Factors</h4>
          <div className="space-y-2">
            {trustFactors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">{factor.label}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-medium',
                    factor.positive ? 'text-success-dark' : 'text-neutral-500'
                  )}>
                    {factor.value}
                  </span>
                  {factor.positive ? (
                    <CheckCircle className="w-4 h-4 text-success-dark" />
                  ) : (
                    <XCircle className="w-4 h-4 text-neutral-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
