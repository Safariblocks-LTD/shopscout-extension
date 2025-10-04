import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

interface ReviewSummaryProps {
  reviews: string;
  rating: string | null;
}

export default function ReviewSummary({ reviews, rating }: ReviewSummaryProps) {
  // Mock data - in production, this would come from AI summarization
  const pros = [
    'Excellent build quality and materials',
    'Fast shipping and great packaging',
    'Works exactly as described',
  ];

  const cons = [
    'Slightly higher price than competitors',
    'Instructions could be clearer',
  ];

  const topQuote = "This product exceeded my expectations. Highly recommend!";

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-neutral-900">Review Summary</h3>
        <div className="flex items-center gap-2 text-sm">
          {rating && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 text-lg">★</span>
              <span className="font-bold text-neutral-900">{rating}</span>
            </div>
          )}
          <span className="text-neutral-600">({reviews})</span>
        </div>
      </div>

      {/* AI-Generated Summary */}
      <div className="mb-4 p-3 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold text-primary-dark mb-1">
              AI Summary
            </div>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Based on customer reviews, this product is highly rated for quality and performance. 
              Most buyers appreciate the value for money, though some mention minor concerns about pricing.
            </p>
          </div>
        </div>
      </div>

      {/* Pros */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <ThumbsUp className="w-4 h-4 text-success-dark" />
          <h4 className="text-sm font-semibold text-neutral-900">Pros</h4>
        </div>
        <ul className="space-y-1.5">
          {pros.map((pro, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
              <span className="text-success-dark mt-1">•</span>
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cons */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <ThumbsDown className="w-4 h-4 text-danger-dark" />
          <h4 className="text-sm font-semibold text-neutral-900">Cons</h4>
        </div>
        <ul className="space-y-1.5">
          {cons.map((con, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
              <span className="text-danger-dark mt-1">•</span>
              <span>{con}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Top Quote */}
      <div className="p-3 bg-neutral-50 border-l-4 border-primary rounded">
        <p className="text-sm italic text-neutral-700">"{topQuote}"</p>
        <p className="text-xs text-neutral-500 mt-1">- Verified Buyer</p>
      </div>
    </div>
  );
}
