import { CheckCircle2, Circle, Loader2, XCircle, Brain, Search, BookOpen, PenTool, UserCheck } from 'lucide-react';

interface AgentStep {
  agent: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  duration_ms?: number;
  tokens?: number;
}

interface Props {
  steps: AgentStep[];
}

const AGENT_CONFIG: Record<string, { label: string; icon: typeof Brain; description: string; color: string }> = {
  planner: { label: 'Planner', icon: Brain, description: 'Generating research plan...', color: 'text-purple-400' },
  plan_approval: { label: 'Approval', icon: UserCheck, description: 'Waiting for your review...', color: 'text-yellow-400' },
  searcher: { label: 'Searcher', icon: Search, description: 'Searching the web...', color: 'text-cyan-400' },
  reader: { label: 'Reader', icon: BookOpen, description: 'Extracting content...', color: 'text-orange-400' },
  writer: { label: 'Writer', icon: PenTool, description: 'Writing report...', color: 'text-emerald-400' },
};

function StatusIcon({ status }: { status: AgentStep['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
    case 'active':
      return <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-400" />;
    default:
      return <Circle className="h-5 w-5 text-gray-700" />;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AgentStepper({ steps }: Props) {
  return (
    <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Agent Pipeline</h3>
      <div className="space-y-1">
        {steps.map((step, i) => {
          const config = AGENT_CONFIG[step.agent] || { label: step.agent, icon: Circle, description: '', color: 'text-gray-400' };
          const AgentIcon = config.icon;

          return (
            <div key={step.agent}>
              <div className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                step.status === 'active' ? 'bg-indigo-500/5 border border-indigo-500/20' : ''
              }`}>
                <StatusIcon status={step.status} />
                <AgentIcon className={`h-4 w-4 ${
                  step.status === 'active' ? config.color :
                  step.status === 'completed' ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      step.status === 'active' ? 'text-white' :
                      step.status === 'completed' ? 'text-gray-300' :
                      'text-gray-500'
                    }`}>
                      {config.label}
                    </span>
                    {step.duration_ms !== undefined && (
                      <span className="text-xs text-gray-500">{formatDuration(step.duration_ms)}</span>
                    )}
                  </div>
                  {step.status === 'active' && (
                    <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                  )}
                  {step.tokens !== undefined && step.tokens > 0 && (
                    <p className="text-xs text-gray-600 mt-0.5">{step.tokens.toLocaleString()} tokens</p>
                  )}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-start pl-5 py-0.5">
                  <div className={`w-px h-3 ${step.status === 'completed' ? 'bg-emerald-400/20' : 'bg-gray-800'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
