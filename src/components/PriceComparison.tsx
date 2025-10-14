import { TrendingDown, ExternalLink, Package, Zap } from 'lucide-react';
import { DealResult } from '../types';
import { formatPrice, calculateSavings } from '../utils/format';
import { cn } from '../utils/cn';

interface PriceComparisonProps {
  currentPrice: number;
  deals: DealResult[];
  currentSite: string;
}

export default function PriceComparison({ currentPrice, deals, currentSite }: PriceComparisonProps) {
  // Sort deals by price
  const sortedDeals = [...deals].sort((a, b) => a.price - b.price);
  const bestDeal = sortedDeals[0];
  const savings = bestDeal ? calculateSavings(currentPrice, bestDeal.price) : null;

  return (
    <div className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 border border-neutral-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-heading font-bold text-neutral-900">Price Comparison</h3>
        {savings && savings.amount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border-2 border-accent/20 rounded-full animate-bounce-subtle">
            <TrendingDown className="w-5 h-5 text-accent" />
            <span className="text-sm font-heading font-bold text-accent-dark">
              Save {formatPrice(savings.amount)}
            </span>
          </div>
        )}
      </div>

      {/* Horizontal Card Row */}
      <div className="grid grid-cols-1 gap-4">
        {sortedDeals.slice(0, 4).map((deal, index) => {
          const isBestDeal = index === 0;
          const isCurrentSite = deal.source.toLowerCase() === currentSite.toLowerCase();
          const dealSavings = calculateSavings(currentPrice, deal.price);

          return (
            <div
              key={index}
              className={cn(
                'relative group rounded-2xl border-2 transition-all duration-300',
                isBestDeal
                  ? 'border-accent bg-gradient-to-br from-accent/5 to-accent/10 shadow-glow-green hover:shadow-glow-green'
                  : 'border-neutral-200 bg-white hover:border-primary/30 hover:shadow-card-hover card-lift'
              )}
            >
              {/* Best Deal Badge */}
              {isBestDeal && (
                <div className="absolute -top-1 -right-1 z-[5]">
                  <div className="px-3 py-1 bg-gradient-to-r from-accent to-accent-dark text-white text-xs font-bold uppercase tracking-wide rounded-bl-xl rounded-tr-xl shadow-lg animate-shine">
                    ✓ Best Deal
                  </div>
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Deal Image */}
                  {deal.image && (
                    <img
                      src={deal.image}
                      alt={deal.title}
                      className="w-20 h-20 object-cover rounded-xl border-2 border-neutral-100 flex-shrink-0 shadow-sm"
                    />
                  )}

                  {/* Deal Info */}
                  <div className="flex-1 min-w-0">
                    {/* Source & Current Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-heading font-bold text-neutral-700 uppercase tracking-wide">
                        {deal.source}
                      </span>
                      {isCurrentSite && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary-dark text-xs font-bold uppercase rounded-full border border-primary/20">
                          Current
                        </span>
                      )}
                    </div>

                    {/* Price & Savings */}
                    <div className="flex items-baseline gap-3 mb-3">
                      <div className={cn(
                        'text-2xl font-heading font-bold',
                        isBestDeal ? 'text-accent' : 'text-neutral-900'
                      )}>
                        {formatPrice(deal.price)}
                      </div>
                      {dealSavings.amount > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-lg">
                          <TrendingDown className="w-3.5 h-3.5 text-accent" />
                          <span className="text-sm font-bold text-accent-dark">
                            -{dealSavings.percentage.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Shipping Info */}
                    {deal.shipping && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 mb-3">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium">{deal.shipping}</span>
                      </div>
                    )}

                    {/* Trust Score Bar */}
                    {deal.trustScore !== undefined && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              deal.trustScore >= 80 ? 'bg-gradient-to-r from-accent to-accent-dark' :
                              deal.trustScore >= 60 ? 'bg-gradient-to-r from-primary to-primary-dark' :
                              deal.trustScore >= 40 ? 'bg-gradient-to-r from-alert to-alert-dark' : 
                              'bg-gradient-to-r from-danger to-danger-dark'
                            )}
                            style={{ width: `${deal.trustScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-neutral-600 min-w-[60px]">
                          {deal.trustScore}% trust
                        </span>
                      </div>
                    )}

                    {/* CTA Button */}
                    <a
                      href={deal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 group',
                        isBestDeal
                          ? 'bg-gradient-to-r from-accent to-accent-dark text-white shadow-md hover:shadow-glow-green'
                          : 'bg-primary/10 text-primary-dark hover:bg-primary hover:text-white'
                      )}
                    >
                      View Deal
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedDeals.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-sm font-body text-neutral-600 mb-1">Searching for deals...</p>
          <p className="text-xs font-body text-neutral-400">Finding the best prices across stores</p>
        </div>
      )}
    </div>
  );
}
