import { ThumbsUp, ThumbsDown, Sparkles, Loader2 } from 'lucide-react';

interface ReviewSummaryProps {
  reviews: string;
  rating: string | null;
  aiSummary?: string | null;
  prosAndCons?: string | null;
  summaryComplete?: boolean;
}

export default function ReviewSummary({ reviews, rating, aiSummary, prosAndCons, summaryComplete = true }: ReviewSummaryProps) {
  // Parse AI-generated pros and cons from markdown
  const parseProsAndCons = (markdown: string | null | undefined) => {
    if (!markdown) return { pros: [], cons: [] };
    
    const lines = markdown.split('\n').filter(line => line.trim());
    const pros: string[] = [];
    const cons: string[] = [];
    let currentSection: 'pros' | 'cons' | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect section headers
      if (trimmed.toLowerCase().includes('pro') && (trimmed.includes('#') || trimmed.includes(':'))) {
        currentSection = 'pros';
        continue;
      }
      if (trimmed.toLowerCase().includes('con') && (trimmed.includes('#') || trimmed.includes(':'))) {
        currentSection = 'cons';
        continue;
      }
      
      // Extract bullet points
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
        const text = trimmed.substring(1).trim();
        if (text && currentSection === 'pros') {
          pros.push(text);
        } else if (text && currentSection === 'cons') {
          cons.push(text);
        }
      }
    }
    
    return { pros, cons };
  };

  const { pros, cons } = parseProsAndCons(prosAndCons);
  
  // Fallback to default if AI didn't generate any
  const displayPros = pros.length > 0 ? pros : [
    'Product information available',
    'Multiple alternatives found',
    'Price comparison enabled',
  ];
  
  const displayCons = cons.length > 0 ? cons : [
    'Limited review data available',
  ];

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
      {aiSummary && (
        <div className="mb-4 p-3 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            {summaryComplete ? (
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0 animate-spin" />
            )}
            <div className="flex-1">
              <div className="text-xs font-semibold text-primary-dark mb-1 flex items-center gap-1">
                AI Summary
                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 rounded-full">
                  {summaryComplete ? 'Chrome AI' : 'Streaming...'}
                </span>
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                {aiSummary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pros */}
      {displayPros.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="w-4 h-4 text-success-dark" />
            <h4 className="text-sm font-semibold text-neutral-900">Pros</h4>
            {pros.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-success/10 text-success-dark rounded-full">AI Generated</span>
            )}
          </div>
          <ul className="space-y-1.5">
            {displayPros.map((pro, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                <span className="text-success-dark mt-1">•</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cons */}
      {displayCons.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsDown className="w-4 h-4 text-danger-dark" />
            <h4 className="text-sm font-semibold text-neutral-900">Cons</h4>
            {cons.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-danger/10 text-danger-dark rounded-full">AI Generated</span>
            )}
          </div>
          <ul className="space-y-1.5">
            {displayCons.map((con, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                <span className="text-danger-dark mt-1">•</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
