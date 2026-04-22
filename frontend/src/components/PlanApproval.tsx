import { useState } from 'react';
import { CheckCircle, Edit3, X, ListChecks, Search as SearchIcon, Target } from 'lucide-react';
import type { ResearchPlan } from '../types';

interface Props {
  plan: ResearchPlan;
  onApprove: (editedPlan?: Record<string, unknown>) => void;
}

export default function PlanApproval({ plan, onApprove }: Props) {
  const [editing, setEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(JSON.stringify(plan, null, 2));

  const handleApprove = () => {
    if (editing) {
      try {
        const parsed = JSON.parse(editedPlan);
        onApprove(parsed);
      } catch {
        alert('Invalid JSON in edited plan');
        return;
      }
    } else {
      onApprove();
    }
  };

  return (
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-2xl blur" />
      <div className="relative bg-gray-800/80 border border-yellow-500/20 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-500/10 rounded-lg">
              <ListChecks className="h-4 w-4 text-yellow-400" />
            </div>
            <h3 className="text-sm font-semibold text-yellow-400">Plan Ready for Review</h3>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
          >
            {editing ? <X className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            {editing ? 'Cancel' : 'Edit JSON'}
          </button>
        </div>

        {editing ? (
          <textarea
            value={editedPlan}
            onChange={(e) => setEditedPlan(e.target.value)}
            className="w-full h-64 bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-sm text-gray-300 font-mono resize-y focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/30 transition-all"
          />
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-semibold text-lg">{plan.title}</h4>
              <p className="text-sm text-gray-400 mt-1">{plan.objective}</p>
            </div>

            <div className="bg-gray-900/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4 text-gray-500" />
                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sections</h5>
              </div>
              <div className="space-y-2">
                {plan.sections.map((section, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02]">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <div>
                      <span className="text-sm font-medium text-gray-200">{section.name}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <SearchIcon className="h-4 w-4 text-gray-500" />
                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Search Queries</h5>
              </div>
              <div className="flex flex-wrap gap-2">
                {plan.search_queries.map((q, i) => (
                  <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-lg border border-gray-700/50">
                    {q}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Scope</span>
                <p className="text-sm text-gray-400 mt-1">{plan.scope}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleApprove}
          className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20"
        >
          <CheckCircle className="h-4 w-4" />
          {editing ? 'Approve Edited Plan' : 'Approve & Continue'}
        </button>
      </div>
    </div>
  );
}
