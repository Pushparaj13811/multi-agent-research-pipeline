import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, Bot, Zap, BarChart3, Shield } from 'lucide-react';
import QueryForm from '../components/QueryForm';
import { startResearch, getRuns } from '../api/client';
import type { Run, ResearchMode, LLMProvider } from '../types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-500/20 text-gray-400',
  planning: 'bg-purple-500/20 text-purple-400',
  awaiting_approval: 'bg-yellow-500/20 text-yellow-400',
  searching: 'bg-cyan-500/20 text-cyan-400',
  reading: 'bg-orange-500/20 text-orange-400',
  writing: 'bg-green-500/20 text-green-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/20 text-red-400',
};

const FEATURES = [
  { icon: Bot, title: 'Multi-Agent Pipeline', desc: '4 specialized AI agents' },
  { icon: Zap, title: 'Real-Time Streaming', desc: 'WebSocket-powered updates' },
  { icon: BarChart3, title: '3-Tier Observability', desc: 'LangSmith + OTel + Custom' },
  { icon: Shield, title: 'Cost Guardrails', desc: 'Token & cost budgets' },
];

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);

  useEffect(() => {
    getRuns().then(data => setRuns(data.runs)).catch(() => {});
  }, []);

  const handleSubmit = async (query: string, mode: ResearchMode, provider: LLMProvider, maxTokens?: number, maxCost?: number) => {
    setLoading(true);
    setError(null);
    try {
      const runId = await startResearch(query, mode, provider, undefined, maxTokens, maxCost);
      navigate(`/research/${runId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start research. Check your API keys in Settings.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
          <Zap className="h-3.5 w-3.5" />
          Powered by LangGraph + LangSmith
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
          AI Research
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Pipeline</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Multi-agent system that plans, searches, reads, and writes structured research reports with full observability.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-3 bg-gray-800/30 border border-gray-700/30 rounded-xl text-center">
            <Icon className="h-5 w-5 text-indigo-400 mx-auto mb-2" />
            <div className="text-xs font-medium text-gray-300">{title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl" />
        <div className="relative bg-gray-800/30 border border-gray-700/30 rounded-2xl p-8 backdrop-blur-sm">
          <QueryForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {runs.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            Recent Runs
          </h2>
          <div className="space-y-2">
            {runs.slice(0, 5).map((run) => (
              <button
                key={run.id}
                onClick={() => navigate(`/research/${run.id}`)}
                className="w-full flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700/30 rounded-xl hover:bg-gray-800/50 hover:border-gray-600/50 transition-all text-left group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate group-hover:text-indigo-300 transition-colors">{run.query}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-500 capitalize">{run.mode}</span>
                    <span className="text-xs text-gray-700">|</span>
                    <span className="text-xs text-gray-500">{run.llm_provider}</span>
                    <span className="text-xs text-gray-700">|</span>
                    <span className="text-xs text-gray-500">
                      {new Date(run.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[run.status] || 'bg-gray-600/20 text-gray-400'}`}>
                    {run.status}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
