import { useState, useEffect } from 'react';
import { Brain, Sparkles, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Zap } from 'lucide-react';

interface AIHealthCheck {
  timestamp: number;
  capabilities: {
    hasAi: boolean;
    hasSummarizer: boolean;
    hasLanguageDetector: boolean;
    hasPrompt: boolean;
    hasWriter: boolean;
    hasRewriter: boolean;
  };
  apis: {
    summarizer: { available: boolean; status: string };
    prompt: { available: boolean; status: string };
    languageDetector: { available: boolean; status: string };
  };
  browser: {
    userAgent: string;
    language: string;
  };
}

interface AISummaryStatus {
  enabled: boolean;
  lastGenerated?: number;
  apiUsed?: string;
  timeToRender?: number;
  languageDetected?: string;
  cached?: boolean;
}

const AIStatus = () => {
  const [healthCheck, setHealthCheck] = useState<AIHealthCheck | null>(null);
  const [summaryStatus, setSummaryStatus] = useState<AISummaryStatus>({ enabled: false });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthCheck = async () => {
    setRefreshing(true);
    try {
      // Check for Chrome AI APIs using correct globals
      const hasSummarizer = 'Summarizer' in self || 'Summarizer' in window;
      const hasLanguageModel = 'LanguageModel' in self || 'LanguageModel' in window;
      const hasLanguageDetector = 'LanguageDetector' in self || 'LanguageDetector' in window;
      const hasWriter = 'Writer' in self || 'Writer' in window;
      const hasRewriter = 'Rewriter' in self || 'Rewriter' in window;
      
      const healthCheck: AIHealthCheck = {
        timestamp: Date.now(),
        capabilities: {
          hasAi: hasSummarizer || hasLanguageModel,
          hasSummarizer,
          hasLanguageDetector,
          hasPrompt: hasLanguageModel,
          hasWriter,
          hasRewriter
        },
        apis: {
          summarizer: { available: hasSummarizer, status: 'unknown' },
          prompt: { available: hasLanguageModel, status: 'unknown' },
          languageDetector: { available: hasLanguageDetector, status: 'unknown' }
        },
        browser: {
          userAgent: navigator.userAgent,
          language: navigator.language
        }
      };

      // Test Summarizer availability
      if (hasSummarizer) {
        try {
          const Summarizer = (self as any).Summarizer || (window as any).Summarizer;
          const availability = await Summarizer.availability();
          healthCheck.apis.summarizer.status = availability;
        } catch (err: any) {
          healthCheck.apis.summarizer.status = 'error: ' + err.message;
        }
      }

      // Test Prompt API availability
      if (hasLanguageModel) {
        try {
          const LanguageModel = (self as any).LanguageModel || (window as any).LanguageModel;
          const capabilities = await LanguageModel.capabilities();
          healthCheck.apis.prompt.status = capabilities.available;
          healthCheck.capabilities.hasPrompt = capabilities.available !== 'no';
        } catch (err: any) {
          healthCheck.apis.prompt.status = 'error: ' + err.message;
        }
      }

      // Test Language Detector availability
      if (hasLanguageDetector) {
        try {
          const LanguageDetector = (self as any).LanguageDetector || (window as any).LanguageDetector;
          const availability = await LanguageDetector.availability?.();
          healthCheck.apis.languageDetector.status = availability || 'ready';
        } catch (err: any) {
          healthCheck.apis.languageDetector.status = 'error: ' + err.message;
        }
      }

      console.log('[AIStatus] Health check completed:', healthCheck);
      
      setHealthCheck(healthCheck);
      setSummaryStatus({
        enabled: healthCheck.capabilities.hasAi,
        apiUsed: healthCheck.capabilities.hasSummarizer ? 'summarizer' : 
                 healthCheck.capabilities.hasPrompt ? 'prompt' : 'none'
      });
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('[AIStatus] Health check failed:', err);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthCheck();

    // Listen for AI summary events
    const messageListener = (message: any) => {
      if (message.type === 'AI_SUMMARY_GENERATED') {
        setSummaryStatus({
          enabled: true,
          lastGenerated: Date.now(),
          apiUsed: message.data?.apiUsed,
          timeToRender: message.data?.timeToFirstRender,
          languageDetected: message.data?.languageDetected,
          cached: message.data?.cached || false
        });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-sm text-neutral-600 font-body">Checking AI status...</span>
        </div>
      </div>
    );
  }

  const isAIAvailable = healthCheck?.capabilities.hasAi;
  const hasSummarizer = healthCheck?.capabilities.hasSummarizer;
  const hasPrompt = healthCheck?.capabilities.hasPrompt;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
      {/* Header - Always Visible */}
      <div 
        className="p-4 cursor-pointer hover:bg-white/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isAIAvailable ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-neutral-300'
            }`}>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-neutral-900 flex items-center gap-2">
                Chrome AI
                {isAIAvailable ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </h3>
              <p className="text-xs text-neutral-600 font-body">
                {isAIAvailable ? 'On-device AI active' : 'AI not available'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchHealthCheck();
              }}
              disabled={refreshing}
              className="p-2 hover:bg-white/80 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 text-neutral-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Status Indicators */}
        {isAIAvailable && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {hasSummarizer && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-lg">
                <Zap className="w-3 h-3 text-green-600" />
                <span className="text-xs font-semibold text-green-700">Summarizer</span>
              </div>
            )}
            {hasPrompt && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-lg">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">Prompt API</span>
              </div>
            )}
            {healthCheck?.capabilities.hasLanguageDetector && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-lg">
                <span className="text-xs font-semibold text-purple-700">🌐 Lang Detect</span>
              </div>
            )}
          </div>
        )}

        {/* Last Summary Info */}
        {summaryStatus.lastGenerated && (
          <div className="mt-3 p-2 bg-white/60 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-600 font-body">Last summary:</span>
              <span className="font-semibold text-neutral-900">
                {summaryStatus.cached ? '⚡ Cached' : `${summaryStatus.timeToRender?.toFixed(0)}ms`}
              </span>
            </div>
            {summaryStatus.apiUsed && (
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-neutral-600 font-body">API used:</span>
                <span className="font-semibold text-neutral-900 capitalize">
                  {summaryStatus.apiUsed}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && healthCheck && (
        <div className="border-t border-purple-200 bg-white/80 p-4 space-y-3">
          <div>
            <h4 className="text-xs font-heading font-bold text-neutral-700 mb-2">API Capabilities</h4>
            <div className="space-y-2">
              <APIStatusRow 
                name="Summarizer API"
                available={healthCheck.capabilities.hasSummarizer}
                status={healthCheck.apis.summarizer.status}
              />
              <APIStatusRow 
                name="Prompt API"
                available={healthCheck.capabilities.hasPrompt}
                status={healthCheck.apis.prompt.status}
              />
              <APIStatusRow 
                name="Language Detector"
                available={healthCheck.capabilities.hasLanguageDetector}
                status={healthCheck.apis.languageDetector.status}
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-heading font-bold text-neutral-700 mb-2">Browser Info</h4>
            <div className="space-y-1 text-xs text-neutral-600 font-body">
              <div className="flex justify-between">
                <span>Language:</span>
                <span className="font-semibold text-neutral-900">{healthCheck.browser.language}</span>
              </div>
              <div className="flex justify-between">
                <span>Chrome Version:</span>
                <span className="font-semibold text-neutral-900">
                  {healthCheck.browser.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {!isAIAvailable && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-800 font-body">
                  <p className="font-semibold mb-1">Chrome AI not available</p>
                  <p className="mb-2">To enable on-device AI summaries:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Use Chrome 138+ (Stable/Dev/Canary)</li>
                    <li>Enable flags: <code className="bg-yellow-100 px-1 rounded">chrome://flags/#optimization-guide-on-device-model</code></li>
                    <li>Enable: <code className="bg-yellow-100 px-1 rounded">chrome://flags/#prompt-api-for-gemini-nano</code></li>
                    <li>Download Gemini Nano at <code className="bg-yellow-100 px-1 rounded">chrome://components</code></li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-neutral-200">
            <a
              href="chrome://optimization-guide-internals"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1"
            >
              <span>View AI Diagnostics</span>
              <span>→</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const APIStatusRow = ({ name, available, status }: { name: string; available: boolean; status: string }) => {
  const getStatusColor = () => {
    if (!available) return 'text-red-600';
    if (status === 'ready' || status === 'readily') return 'text-green-600';
    if (status.includes('error')) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = () => {
    if (!available) return <XCircle className="w-3 h-3" />;
    if (status === 'ready' || status === 'readily') return <CheckCircle className="w-3 h-3" />;
    if (status.includes('error')) return <XCircle className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-neutral-700 font-body">{name}</span>
      <div className={`flex items-center gap-1 font-semibold ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="capitalize">{available ? status : 'Not available'}</span>
      </div>
    </div>
  );
};

export default AIStatus;
