import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, FileText } from 'lucide-react';
import AgentStepper from '../components/AgentStepper';
import LiveOutput from '../components/LiveOutput';
import PlanApproval from '../components/PlanApproval';
import ReportView from '../components/ReportView';
import MetricsDashboard from '../components/MetricsDashboard';
import { useResearchSocket } from '../api/useResearchSocket';
import { getRun, getRunMetrics, approvePlan } from '../api/client';
import type { Run, RunMetrics } from '../types';

export default function Research() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [run, setRun] = useState<Run | null>(null);
  const [metrics, setMetrics] = useState<RunMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'report' | 'metrics'>('live');
  const [loadError, setLoadError] = useState<string | null>(null);

  const socket = useResearchSocket(runId || null);

  useEffect(() => {
    if (!runId) return;
    getRun(runId)
      .then(setRun)
      .catch((err) => setLoadError(err.response?.data?.detail || 'Failed to load research run'));
  }, [runId]);

  useEffect(() => {
    if (socket.completed && runId) {
      getRun(runId).then(setRun).catch(() => {});
      getRunMetrics(runId).then(setMetrics).catch(() => {});
      setActiveTab('report');
    }
  }, [socket.completed, runId]);

  const handleApprove = async (editedPlan?: Record<string, unknown>) => {
    if (!runId) return;
    await approvePlan(runId, editedPlan);
    socket.sendApproval(editedPlan);
  };

  if (!runId) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <p className="text-gray-400">Invalid research run. <a href="/" className="text-indigo-400 hover:underline">Start a new research</a></p>
      </div>
    );
  }

  const isCompleted = run?.status === 'completed' || socket.completed;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>

        {isCompleted && (
          <div className="flex items-center bg-gray-800/50 border border-gray-700/30 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                activeTab === 'report' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Report
            </button>
            <button
              onClick={() => {
                setActiveTab('metrics');
                if (!metrics && runId) getRunMetrics(runId).then(setMetrics).catch(() => {});
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                activeTab === 'metrics' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Metrics
            </button>
          </div>
        )}
      </div>

      {loadError && (
        <div className="flex items-center gap-2 p-4 bg-red-500/5 border border-red-500/20 rounded-xl mb-6">
          <span className="text-sm text-red-400">{loadError}</span>
        </div>
      )}

      {run && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{run.query}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded capitalize">{run.mode}</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{run.llm_provider}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
              run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
              run.status === 'failed' ? 'bg-red-500/10 text-red-400' :
              'bg-indigo-500/10 text-indigo-400'
            }`}>{run.status}</span>
          </div>
        </div>
      )}

      {activeTab === 'metrics' && metrics ? (
        <MetricsDashboard metrics={metrics} />
      ) : activeTab === 'report' && isCompleted && run?.report ? (
        <ReportView report={run.report} markdown={run.report_markdown || ''} runId={runId} />
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <AgentStepper steps={socket.steps} />
          </div>

          <div className="col-span-6 space-y-4">
            <LiveOutput lines={socket.liveOutput} />
            {socket.plan && !socket.steps.find(s => s.agent === 'plan_approval' && s.status === 'completed') && (
              <PlanApproval plan={socket.plan} onApprove={handleApprove} />
            )}
          </div>

          <div className="col-span-3 space-y-4">
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Live Metrics</h3>
              <div className="space-y-4">
                {[
                  { label: 'Tokens', value: socket.metrics.total_tokens.toLocaleString(), color: 'text-indigo-400' },
                  { label: 'Cost', value: `$${socket.metrics.total_cost_usd.toFixed(4)}`, color: 'text-emerald-400' },
                  { label: 'Duration', value: socket.metrics.total_duration_ms < 1000 ? `${socket.metrics.total_duration_ms}ms` : `${(socket.metrics.total_duration_ms / 1000).toFixed(1)}s`, color: 'text-amber-400' },
                  { label: 'Tool Calls', value: String(socket.metrics.total_tool_calls), color: 'text-cyan-400' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                    <div className={`text-xl font-bold ${color}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {socket.error && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-red-400">{socket.error}</p>
              </div>
            )}

            {socket.connected && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400/80">Connected</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
