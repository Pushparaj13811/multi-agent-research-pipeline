import { useState } from 'react';
import { Search, Sparkles, FileText, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import type { ResearchMode, LLMProvider } from '../types';

interface Props {
  onSubmit: (query: string, mode: ResearchMode, provider: LLMProvider, maxTokens?: number, maxCost?: number) => void;
  loading: boolean;
}

const MODE_OPTIONS: { value: ResearchMode; label: string; description: string; icon: typeof FileText }[] = [
  { value: 'topic', label: 'Topic Report', description: 'General research with findings & analysis', icon: FileText },
  { value: 'paper', label: 'Paper Analysis', description: 'Academic paper comparison & synthesis', icon: GraduationCap },
  { value: 'competitive', label: 'Competitive Analysis', description: 'Company/product SWOT comparison', icon: TrendingUp },
];

const PROVIDER_OPTIONS: { value: LLMProvider; label: string; sub: string; icon: string }[] = [
  { value: 'openai', label: 'OpenAI', sub: 'GPT-4o', icon: '🟢' },
  { value: 'anthropic', label: 'Anthropic', sub: 'Claude', icon: '🟠' },
  { value: 'bedrock', label: 'AWS Bedrock', sub: 'Claude via AWS', icon: '🔶' },
];

export default function QueryForm({ onSubmit, loading }: Props) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<ResearchMode>('topic');
  const { defaultProvider, hasKeyForProvider } = useSettingsStore();
  const [provider, setProvider] = useState<LLMProvider>(defaultProvider);
  const [maxTokens, setMaxTokens] = useState<string>('');
  const [maxCost, setMaxCost] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(
        query.trim(),
        mode,
        provider,
        maxTokens ? parseInt(maxTokens) : undefined,
        maxCost ? parseFloat(maxCost) : undefined,
      );
    }
  };

  const providerConfigured = hasKeyForProvider(provider);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What do you want to research?</label>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Compare transformer architectures for large language models..."
              className="w-full pl-12 pr-4 py-4 bg-gray-900/80 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none transition-all"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Research Mode</label>
        <div className="grid grid-cols-3 gap-3">
          {MODE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                className={`group relative p-4 rounded-xl border text-left transition-all duration-200 ${
                  mode === opt.value
                    ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/5'
                    : 'border-gray-700/50 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800/50'
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${mode === opt.value ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-400'}`} />
                <div className={`font-medium text-sm ${mode === opt.value ? 'text-indigo-300' : 'text-gray-300'}`}>{opt.label}</div>
                <div className={`text-xs mt-1 ${mode === opt.value ? 'text-indigo-400/60' : 'text-gray-500'}`}>{opt.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">LLM Provider</label>
        <div className="flex gap-3">
          {PROVIDER_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setProvider(p.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all flex-1 ${
                provider === p.value
                  ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/5'
                  : 'border-gray-700/50 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800/50'
              }`}
            >
              <span className="text-lg">{p.icon}</span>
              <div className="text-left">
                <div className={provider === p.value ? 'text-indigo-300' : 'text-gray-300'}>{p.label}</div>
                <div className={`text-xs ${provider === p.value ? 'text-indigo-400/60' : 'text-gray-500'}`}>{p.sub}</div>
              </div>
              {hasKeyForProvider(p.value) && (
                <span className="ml-auto text-xs text-green-400/70">●</span>
              )}
            </button>
          ))}
        </div>
        {!providerConfigured && (
          <div className="flex items-center gap-2 mt-2 text-xs text-amber-400/80">
            <AlertCircle className="h-3.5 w-3.5" />
            No API key configured. <a href="/settings" className="underline hover:text-amber-300">Add one in Settings</a>, or the server default will be used.
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Budget Limits <span className="text-gray-500 font-normal">(optional)</span></label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Max Tokens</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              placeholder="100,000"
              className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Max Cost (USD)</label>
            <input
              type="number"
              step="0.01"
              value={maxCost}
              onChange={(e) => setMaxCost(e.target.value)}
              placeholder="1.00"
              className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!query.trim() || loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:shadow-none"
      >
        <Sparkles className="h-5 w-5" />
        {loading ? 'Starting Research...' : 'Start Research'}
      </button>
    </form>
  );
}
