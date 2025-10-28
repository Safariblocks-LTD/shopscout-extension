import { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { generateAISummary } from '../utils/aiSummary';
import { ProductData } from '../types';

interface AISummaryProps {
  product: ProductData;
}

const AISummary = ({ product }: AISummaryProps) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [apiUsed, setApiUsed] = useState<string>('');
  const [timeToGenerate, setTimeToGenerate] = useState<number>(0);

  useEffect(() => {
    generateSummary();
  }, [product]);

  const generateSummary = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await generateAISummary(product);
      
      if (result.success && result.summary) {
        setSummary(result.summary);
        setApiUsed(result.apiUsed || '');
        setTimeToGenerate(result.timeToGenerate || 0);
      } else {
        setError(result.error || 'Failed to generate summary');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          <span className="text-sm text-neutral-700 font-body">Generating AI summary...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-900 mb-1">AI Summary Unavailable</p>
            <p className="text-xs text-yellow-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-heading font-bold text-neutral-900">AI Summary</h3>
        </div>
        <span className="text-xs text-purple-600 font-semibold px-2 py-1 bg-purple-100 rounded-lg">
          {apiUsed === 'summarizer' ? 'Summarizer' : 'Prompt API'}
        </span>
      </div>

      <div className="text-sm text-neutral-700 font-body leading-relaxed whitespace-pre-wrap">
        {summary}
      </div>

      {timeToGenerate > 0 && (
        <div className="mt-3 pt-3 border-t border-purple-200">
          <p className="text-xs text-neutral-500">
            Generated in {timeToGenerate.toFixed(0)}ms • On-device AI
          </p>
        </div>
      )}
    </div>
  );
};

export default AISummary;
