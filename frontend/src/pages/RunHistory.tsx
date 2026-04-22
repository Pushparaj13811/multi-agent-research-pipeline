import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, History, Search } from 'lucide-react';
import { getRuns } from '../api/client';
import type { Run } from '../types';

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

export default function RunHistory() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<Run[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getRuns().then(data => setRuns(data.runs)).catch(() => {});
  }, []);

  const filtered = search
    ? runs.filter(r => r.query.toLowerCase().includes(search.toLowerCase()))
    : runs;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-800 rounded-xl">
            <History className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Run History</h1>
            <p className="text-sm text-gray-500">{runs.length} total runs</p>
          </div>
        </div>
      </div>

      {runs.length > 3 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search runs..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/30 border border-gray-700/30 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <History className="h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">{search ? 'No matching runs found.' : 'No runs yet. Start your first research!'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((run) => (
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
                  <span className="text-xs text-gray-500">{new Date(run.created_at).toLocaleString()}</span>
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
      )}
    </div>
  );
}
