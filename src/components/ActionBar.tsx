import { ExternalLink, Heart, Share2 } from 'lucide-react';
import { DealResult } from '../types';
import { formatPrice } from '../utils/format';

interface ActionBarProps {
  bestDeal?: DealResult;
  onSave: () => void;
  onShare: () => void;
}

export default function ActionBar({ bestDeal, onSave, onShare }: ActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg">
      <div className="p-4">
        {/* Best Deal CTA */}
        {bestDeal && (
          <a
            href={bestDeal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mb-3 px-4 py-3 bg-gradient-to-r from-success to-success-dark text-white rounded-lg font-semibold text-center shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-center gap-2">
              <span>Get Best Deal - {formatPrice(bestDeal.price)}</span>
              <ExternalLink className="w-4 h-4" />
            </div>
            <div className="text-xs opacity-90 mt-0.5">
              at {bestDeal.source}
            </div>
          </a>
        )}

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onSave}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4" />
            <span>Save</span>
          </button>
          <button
            onClick={onShare}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
