import { ExternalLink, RefreshCw, Store } from 'lucide-react';
import { ProductData } from '../types';
import { formatPrice } from '../utils/format';
import { cn } from '../utils/cn';

interface ProductSnapshotProps {
  product: ProductData;
  trustScore?: number;
  onRefresh: () => void;
}

export default function ProductSnapshot({ product, trustScore, onRefresh }: ProductSnapshotProps) {
  const getTrustBadgeColor = (score?: number) => {
    if (!score) return 'bg-neutral-100 text-neutral-600';
    if (score >= 80) return 'bg-accent/10 text-accent-dark border-accent/20';
    if (score >= 60) return 'bg-primary/10 text-primary-dark border-primary/20';
    if (score >= 40) return 'bg-alert/10 text-alert-dark border-alert/20';
    return 'bg-danger/10 text-danger-dark border-danger/20';
  };

  const getTrustLabel = (score?: number) => {
    if (!score) return 'ANALYZING...';
    if (score >= 80) return '✓ VERIFIED';
    if (score >= 60) return 'TRUSTED';
    if (score >= 40) return 'MODERATE';
    return '⚠ CAUTION';
  };

  return (
    <div className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 border border-neutral-100 card-lift">
      <div className="flex gap-4">
        {/* Product Image */}
        {product.image && (
          <div className="flex-shrink-0">
            <img
              src={product.image}
              alt={product.title}
              className="w-20 h-20 object-cover rounded-2xl border-2 border-neutral-100 shadow-sm"
            />
          </div>
        )}

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h2 className="text-base font-heading font-bold text-neutral-900 line-clamp-2 leading-snug">
              {product.title}
            </h2>
            <button
              onClick={onRefresh}
              className="flex-shrink-0 p-2 hover:bg-primary/10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
              title="Refresh analysis"
            >
              <RefreshCw className="w-4 h-4 text-primary" />
            </button>
          </div>

          {/* Price */}
          <div className="mb-3">
            <div className="text-3xl font-heading font-bold text-accent animate-scale-in">
              {formatPrice(product.price)}
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Site Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-full hover:border-neutral-300 transition-colors">
              <Store className="w-3.5 h-3.5 text-neutral-500" />
              <span className="font-semibold text-neutral-700 capitalize">
                {product.site}
              </span>
            </div>

            {/* Trust Badge */}
            {trustScore !== undefined && (
              <div className={cn('px-3 py-1.5 rounded-full font-bold uppercase tracking-wide border-2 animate-fade-in', getTrustBadgeColor(trustScore))}>
                {getTrustLabel(trustScore)}
              </div>
            )}

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                <span className="text-amber-500 text-sm">★</span>
                <span className="font-semibold text-amber-700">{product.rating}</span>
              </div>
            )}
          </div>

          {/* Seller */}
          {product.seller && (
            <div className="mt-3 text-xs text-neutral-500 font-body">
              Sold by <span className="font-semibold text-neutral-900">{product.seller}</span>
            </div>
          )}

          {/* View on Site Link */}
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:text-primary-dark font-semibold transition-all duration-200 hover:gap-2 group"
          >
            View on {product.site}
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}
